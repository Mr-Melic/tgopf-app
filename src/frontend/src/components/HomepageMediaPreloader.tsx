import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import type { ArtProduct } from "../backend";
import { useFileList } from "../blob-storage/FileStorage";
import { useActor } from "../hooks/useActor";
import { useGetFeaturedProducts, useGetReviews } from "../hooks/useQueries";
import { clearExpiredCache } from "../utils/blobCache";
import { preloadImages } from "../utils/imagePreloader";

interface HomepageMediaPreloaderProps {
  onComplete: () => void;
  onProgressUpdate?: (percent: number) => void;
}

const MAX_LOW_PRIORITY_ITEMS = 50;
// Safety timeout: always fire onComplete after this many ms, no matter what.
// 12s gives actor enough time to initialize and queries to settle before the
// safety timeout fires. App.tsx hard fallback (20s) is longer so this always
// fires first, allowing HomePage queries time to populate the cache first.
const MAX_PRELOAD_DURATION = 12000;
const BACKGROUND_PRELOAD_DELAY = 1500;

/**
 * Non-visual component that preloads critical homepage media.
 * Phase 1 (immediate): above-the-fold images only — completes quickly.
 * Phase 2 (delayed): all remaining images loaded silently in background.
 *
 * Robustness guarantees:
 * - If no images are found, calls onComplete() immediately (no stall at 0%).
 * - If any image fetch fails, counts it as "done" so progress still advances.
 * - Safety timeout always fires onComplete() after MAX_PRELOAD_DURATION ms.
 * - onComplete() is guarded by a ref so it fires exactly once.
 */
export default function HomepageMediaPreloader({
  onComplete,
  onProgressUpdate,
}: HomepageMediaPreloaderProps) {
  const [_progress, setProgress] = useState(0);
  const hasCompletedRef = useRef(false);
  const isMountedRef = useRef(true);
  const preloadSignatureRef = useRef<string>("");
  const backgroundPreloadDoneRef = useRef(false);
  const [isHighPriorityComplete, setIsHighPriorityComplete] = useState(false);

  const { data: files } = useFileList();
  const { data: featuredData } = useGetFeaturedProducts();
  const { data: reviews } = useGetReviews();
  const { actor, isFetching } = useActor();

  const { data: artProducts } = useQuery<ArtProduct[]>({
    queryKey: ["artProducts"],
    queryFn: async () => {
      if (!actor) return [];
      try {
        const products = await actor.getArtProducts();
        if (products.length === 0) return actor.getDefaultArtProducts();
        return products;
      } catch {
        return [];
      }
    },
    enabled: !!actor && !isFetching,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  useEffect(() => {
    isMountedRef.current = true;
    clearExpiredCache().catch((err) =>
      console.warn("Failed to clear expired cache:", err),
    );
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Helper: safely fire onComplete exactly once
  const fireComplete = () => {
    if (!hasCompletedRef.current && isMountedRef.current) {
      hasCompletedRef.current = true;
      setIsHighPriorityComplete(true);
      onComplete();
    }
  };

  // Safety timeout: always fire onComplete after MAX_PRELOAD_DURATION
  useEffect(() => {
    const safetyTimer = setTimeout(() => {
      fireComplete();
    }, MAX_PRELOAD_DURATION);
    return () => clearTimeout(safetyTimer);
  }, [onComplete]); // eslint-disable-line

  // Phase 1: Preload above-the-fold images, then call onComplete.
  // React re-runs this effect when actor/isFetching changes, so no polling needed:
  // • When actor=null: return early and wait for React to re-run on actor change.
  // • When actor is ready: run the preload immediately.
  useEffect(() => {
    if (hasCompletedRef.current) return;

    // Actor not ready yet — return early. React will re-run this effect when
    // actor or isFetching changes (both are in the dependency array below).
    if (!actor || isFetching) {
      onProgressUpdate?.(0);
      return;
    }

    const preloadHomepageMedia = async () => {
      try {
        const highPriorityUrls: string[] = [];
        const lowPriorityUrls: string[] = [];

        // HIGH PRIORITY: above-the-fold images

        // 1. Gallery images (first 2 slides only)
        const galleryImages =
          files?.filter(
            (file) =>
              file.path.startsWith("gallery/") &&
              (file.path.toLowerCase().endsWith(".jpg") ||
                file.path.toLowerCase().endsWith(".jpeg") ||
                file.path.toLowerCase().endsWith(".png") ||
                file.path.toLowerCase().endsWith(".webp")),
          ) || [];

        galleryImages.slice(0, 2).forEach((img) => {
          highPriorityUrls.push(`${window.location.origin}/file/${img.path}`);
        });

        // 2. Featured product covers
        if (
          featuredData?.firstProduct?.frontCoverImagePath &&
          !featuredData.useFirstPlaceholder
        ) {
          highPriorityUrls.push(
            `${window.location.origin}/file/${featuredData.firstProduct.frontCoverImagePath}`,
          );
        }
        if (
          featuredData?.secondProduct?.frontCoverImagePath &&
          !featuredData.useSecondPlaceholder
        ) {
          highPriorityUrls.push(
            `${window.location.origin}/file/${featuredData.secondProduct.frontCoverImagePath}`,
          );
        }

        // LOW PRIORITY: warming set
        galleryImages.slice(2, 5).forEach((img) => {
          lowPriorityUrls.push(`${window.location.origin}/file/${img.path}`);
        });

        const cappedLowPriorityUrls = lowPriorityUrls.slice(
          0,
          MAX_LOW_PRIORITY_ITEMS,
        );

        const preloadItems = [
          ...highPriorityUrls.map((url) => ({
            url,
            priority: "high" as const,
          })),
          ...cappedLowPriorityUrls.map((url) => ({
            url,
            priority: "low" as const,
          })),
        ];

        // Deduplicate: skip if we already ran this exact set
        const currentSignature = JSON.stringify({
          high: highPriorityUrls.length,
          low: cappedLowPriorityUrls.length,
          urls: preloadItems.slice(0, 5).map((i) => i.url),
        });

        if (preloadSignatureRef.current === currentSignature) {
          // Already ran — just complete
          fireComplete();
          return;
        }
        preloadSignatureRef.current = currentSignature;

        // If nothing to preload, immediately complete so we don't stall at 0%
        if (preloadItems.length === 0) {
          onProgressUpdate?.(60);
          fireComplete();
          return;
        }

        await preloadImages(preloadItems, {
          concurrency: 6,
          onProgress: (loaded, total) => {
            if (isMountedRef.current) {
              // Scale image load progress to 0–60% of total loading
              // (60–85% is post-preload interpolation, 85–95% is data-ready phase)
              const pct = Math.round((loaded / total) * 60);
              setProgress(pct);
              onProgressUpdate?.(pct);
            }
          },
        });

        // All images done (or failed — preloadImages counts failures as done)
        // Emit 60% to indicate image phase complete
        if (isMountedRef.current) {
          onProgressUpdate?.(60);
        }
        fireComplete();
      } catch (error) {
        console.error("Preload error:", error);
        fireComplete();
      }
    };

    preloadHomepageMedia();
  }, [
    files,
    featuredData,
    reviews,
    artProducts,
    onComplete,
    actor,
    isFetching,
    onProgressUpdate,
  ]); // eslint-disable-line

  // Phase 2: Full background preload — deferred until high-priority phase
  // completes and the browser is idle. Uses requestIdleCallback with a
  // 2000ms fallback for browsers that don't support it.
  useEffect(() => {
    if (!actor || isFetching || !isHighPriorityComplete) return;

    const runBackgroundPreload = () => {
      if (!isMountedRef.current) return;

      const backgroundUrls: string[] = [];

      const galleryImages =
        files?.filter(
          (file) =>
            file.path.startsWith("gallery/") &&
            (file.path.toLowerCase().endsWith(".jpg") ||
              file.path.toLowerCase().endsWith(".jpeg") ||
              file.path.toLowerCase().endsWith(".png") ||
              file.path.toLowerCase().endsWith(".webp")),
        ) || [];

      galleryImages.slice(2).forEach((img) => {
        backgroundUrls.push(`${window.location.origin}/file/${img.path}`);
      });

      artProducts?.forEach((product) => {
        if (product.imagePath) {
          backgroundUrls.push(
            `${window.location.origin}/file/${product.imagePath}`,
          );
        }
      });

      if (backgroundUrls.length === 0 || backgroundPreloadDoneRef.current) {
        return;
      }

      backgroundPreloadDoneRef.current = true;

      preloadImages(
        backgroundUrls.map((url) => ({ url, priority: "low" as const })),
        { concurrency: 4 },
      ).catch(() => {
        // Silently ignore background preload errors
      });
    };

    // Use requestIdleCallback when available, otherwise fallback to setTimeout
    let idleHandle: number | undefined;
    let timeoutHandle: ReturnType<typeof setTimeout> | undefined;
    if ("requestIdleCallback" in window) {
      idleHandle = window.requestIdleCallback(runBackgroundPreload, {
        timeout: 2000,
      });
    } else {
      timeoutHandle = setTimeout(runBackgroundPreload, 2000);
    }

    return () => {
      if (idleHandle !== undefined) {
        window.cancelIdleCallback(idleHandle);
      }
      if (timeoutHandle !== undefined) {
        clearTimeout(timeoutHandle);
      }
    };
  }, [files, artProducts, actor, isFetching, isHighPriorityComplete]);

  return null;
}
