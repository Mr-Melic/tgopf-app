import { HttpAgent } from "@icp-sdk/core/agent";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import type { FileReference } from "../backend";
import { loadConfig } from "../config";
import { useActor } from "../hooks/useActor";
import { StorageClient, buildGatewayBlobUrl } from "./StorageClient";

const getHttpAgent = async () => {
  const config = await loadConfig();

  const agent = new HttpAgent({
    host: config.backend_host,
  });
  if (config.backend_host?.includes("localhost")) {
    await agent.fetchRootKey().catch((err) => {
      console.warn(
        "Unable to fetch root key. Check to ensure that your local replica is running",
      );
      console.error(err);
    });
  }
  return agent;
};

// Module-level in-flight request deduplication map
// Prevents duplicate backend calls when multiple components request the same image path simultaneously
const inFlightRequests = new Map<string, Promise<string>>();

// Hook to fetch the list of files
export const useFileList = () => {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  const fileListQuery = useQuery({
    queryKey: ["fileList"],
    queryFn: async () => {
      if (!actor) return [];
      try {
        return await actor.listFileReferences();
      } catch (err) {
        console.warn("useFileList error:", err);
        return [];
      }
    },
    enabled: !!actor,
    staleTime: 5 * 60 * 1000, // 30 minutes
    gcTime: 60 * 60 * 1000, // 1 hour
  });

  // React Query v5 removed per-query onSuccess. Watch the fileList query
  // status transition instead: when fileList transitions to success, the
  // ['fileList'] cache is now populated with the complete path→hash list.
  // Any ['fileUrl', path] queries that errored out earlier (because the cache
  // was empty when they ran and the per-path fallback also returned empty)
  // should re-resolve against the now-populated cache. Invalidate only those
  // in an error state to avoid disturbing queries that already resolved.
  const isSuccess = fileListQuery.isSuccess;
  useEffect(() => {
    if (!isSuccess) return;
    const cache = queryClient.getQueryCache();
    cache.getAll().forEach((query) => {
      if (query.queryKey[0] === "fileUrl" && query.state.status === "error") {
        queryClient.invalidateQueries({ queryKey: query.queryKey });
      }
    });
  }, [isSuccess, queryClient]);

  return fileListQuery;
};

// Unified hook for getting file URLs.
//
// Resolves from the cached fileList data first (the complete path→hash list is
// already fetched in one query by useFileList, queryKey ['fileList']). Only when
// the requested path is absent from the cached list does it fall back to a
// per-path actor.getFileReference(path) call via StorageClient.getDirectURL.
//
// Throws when the resolved URL is empty or missing so React Query treats it as
// an error and retries (retry: 2 with exponential backoff, fileUrl queries only).
export const useFileUrl = (path: string) => {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  // Fallback path: resolve a single file reference via the backend actor using
  // the existing StorageClient.getDirectURL behavior. Used ONLY when the path is
  // absent from the cached fileList.
  const getFileReference = async (filePath: string): Promise<string> => {
    if (!actor) return "";

    // Deduplicate in-flight requests for the same path
    const existing = inFlightRequests.get(filePath);
    if (existing) {
      return existing;
    }

    const promise = (async () => {
      try {
        const envConfig = await loadConfig();
        const storageClient = new StorageClient(
          actor,
          envConfig.bucket_name,
          envConfig.storage_gateway_url,
          envConfig.backend_canister_id,
          envConfig.project_id,
          await getHttpAgent(),
        );
        return await storageClient.getDirectURL(filePath);
      } catch (err) {
        console.warn(
          "FileStorage: error resolving URL for path:",
          filePath,
          err,
        );
        return "";
      } finally {
        // Always clean up the in-flight entry when done
        inFlightRequests.delete(filePath);
      }
    })();

    inFlightRequests.set(filePath, promise);
    return promise;
  };

  return useQuery({
    queryKey: ["fileUrl", path],
    queryFn: async () => {
      const filePath = path!;

      // (1) Read the cached fileList data and look for a matching path.
      const fileList = queryClient.getQueryData<FileReference[]>(["fileList"]);
      const match = fileList?.find((ref) => ref.path === filePath);

      if (match?.hash) {
        // (3) Construct the gateway URL locally using the SAME format
        // StorageClient.getDirectURL builds, reading the envConfig values from
        // the same source StorageClient uses.
        const envConfig = await loadConfig();
        const url = buildGatewayBlobUrl(
          envConfig.storage_gateway_url,
          match.hash,
          envConfig.backend_canister_id,
          envConfig.project_id,
        );
        // (FIX 5) Throw on empty/missing so React Query retries.
        if (!url) {
          throw new Error(
            `FileStorage: resolved empty URL for path '${filePath}' from fileList`,
          );
        }
        return url;
      }

      // (4) Fallback: path absent from fileList — resolve per-path via the
      // existing StorageClient.getDirectURL path.
      const fallbackUrl = await getFileReference(filePath);
      // (FIX 5) Throw when the fallback also returns empty/null so React Query
      // treats it as an error and retries.
      if (!fallbackUrl) {
        throw new Error(
          `FileStorage: could not resolve URL for path '${filePath}' (not in fileList and fallback returned empty)`,
        );
      }
      return fallbackUrl;
    },
    enabled: !!path && !!actor,
    staleTime: 5 * 60 * 1000, // 30 minutes (was POSITIVE_INFINITY but let's refresh stale content)
    gcTime: 60 * 60 * 1000, // 1 hour (extended from 30 min)
    // (FIX 5) Per-query retry override: 2 retries with exponential backoff.
    // Does not change the global retry setting.
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
};

export const useFileUpload = () => {
  const { actor, isFetching } = useActor();
  const [isUploading, setIsUploading] = useState(false);
  const { invalidateFileList } = useInvalidateQueries();

  // True only when actor is fully initialised and not still loading
  const isStorageReady = !!actor && !isFetching;

  const uploadFile = async (
    path: string,
    data: File,
    onProgress?: (percentage: number) => void,
  ): Promise<{
    path: string;
    hash: string;
    url: string;
  }> => {
    if (!actor || isFetching) {
      throw new Error("Backend is not available");
    }

    const envConfig = await loadConfig();
    const storageClient = new StorageClient(
      actor,
      envConfig.bucket_name,
      envConfig.storage_gateway_url,
      envConfig.backend_canister_id,
      envConfig.project_id,
      await getHttpAgent(),
    );

    setIsUploading(true);

    try {
      const res = await storageClient.putFile(path, data, onProgress);
      await invalidateFileList();
      return res;
    } finally {
      setIsUploading(false);
    }
  };

  return { uploadFile, isUploading, isStorageReady };
};

export const useFileDelete = () => {
  const { actor } = useActor();
  const [isDeleting, setIsDeleting] = useState(false);
  const { invalidateFileList, invalidateFileUrl } = useInvalidateQueries();

  const deleteFile = async (path: string): Promise<void> => {
    if (!actor) {
      throw new Error("Backend is not available");
    }

    setIsDeleting(true);

    try {
      await actor.dropFileReference(path);
      await invalidateFileList();
      invalidateFileUrl(path);
    } finally {
      setIsDeleting(false);
    }
  };

  return { deleteFile, isDeleting };
};

// Utility to invalidate queries
export const useInvalidateQueries = () => {
  const queryClient = useQueryClient();

  return {
    invalidateFileList: () =>
      queryClient.invalidateQueries({ queryKey: ["fileList"] }),
    invalidateFileUrl: (path: string) =>
      queryClient.invalidateQueries({ queryKey: ["fileUrl", path] }),
    invalidateAll: () => {
      queryClient.invalidateQueries({ queryKey: ["fileList"] });
      queryClient.invalidateQueries({ queryKey: ["fileUrl"] });
    },
  };
};
