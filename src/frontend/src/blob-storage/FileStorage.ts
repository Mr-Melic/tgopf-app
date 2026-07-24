import { HttpAgent } from "@icp-sdk/core/agent";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { FileReference } from "../backend";
import { loadConfig } from "../config";
import { useActor } from "../hooks/useActor";
import { StorageClient } from "./StorageClient";

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

  return useQuery({
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
};

// Unified hook for getting file URLs
export const useFileUrl = (path: string) => {
  const { actor } = useActor();

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
      try {
        return await getFileReference(path!);
      } catch (err) {
        console.warn("FileStorage: could not resolve URL for path:", path, err);
        return null;
      }
    },
    enabled: !!path,
    staleTime: 5 * 60 * 1000, // 30 minutes (was POSITIVE_INFINITY but let's refresh stale content)
    gcTime: 60 * 60 * 1000, // 1 hour (extended from 30 min)
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
