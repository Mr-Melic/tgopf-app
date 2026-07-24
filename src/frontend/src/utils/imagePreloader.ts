/**
 * Image preloader utility with URL de-duplication, concurrency limiting, and priority ordering
 */

interface PreloadItem {
  url: string;
  priority: "high" | "low";
}

interface PreloadResult {
  url: string;
  success: boolean;
  error?: Error;
}

const sessionLoadedUrls = new Set<string>();
const ITEM_TIMEOUT = 10000; // 10 seconds per item
const DEFAULT_CONCURRENCY = 10;

/**
 * Preload a single image with timeout
 */
function preloadImage(
  url: string,
  timeout: number = ITEM_TIMEOUT,
): Promise<PreloadResult> {
  return new Promise((resolve) => {
    // Skip if already loaded this session
    if (sessionLoadedUrls.has(url)) {
      resolve({ url, success: true });
      return;
    }

    const img = new Image();
    let timeoutId: number | undefined;
    let resolved = false;

    const cleanup = () => {
      if (timeoutId !== undefined) clearTimeout(timeoutId);
      img.onload = null;
      img.onerror = null;
    };

    const handleSuccess = () => {
      if (resolved) return;
      resolved = true;
      cleanup();
      sessionLoadedUrls.add(url);
      resolve({ url, success: true });
    };

    const handleError = (error?: Error) => {
      if (resolved) return;
      resolved = true;
      cleanup();
      resolve({ url, success: false, error });
    };

    img.onload = handleSuccess;
    img.onerror = () => handleError(new Error("Failed to load image"));

    // Set timeout
    timeoutId = window.setTimeout(() => {
      handleError(new Error("Image load timeout"));
    }, timeout);

    // Start loading
    try {
      img.src = url;

      // Use decode() if available for better performance, but don't block on it
      if ("decode" in img) {
        img.decode().catch(() => {
          // Ignore decode errors, onload/onerror will handle them
        });
      }
    } catch (err) {
      handleError(
        err instanceof Error ? err : new Error("Failed to set image source"),
      );
    }
  });
}

/**
 * Preload multiple images with concurrency control and priority
 */
export async function preloadImages(
  items: PreloadItem[],
  options: {
    concurrency?: number;
    onProgress?: (loaded: number, total: number) => void;
  } = {},
): Promise<PreloadResult[]> {
  const { concurrency = DEFAULT_CONCURRENCY, onProgress } = options;

  // De-duplicate URLs
  const uniqueItems = Array.from(
    new Map(items.map((item) => [item.url, item])).values(),
  );

  // Sort by priority (high first)
  const sortedItems = [...uniqueItems].sort((a, b) => {
    if (a.priority === "high" && b.priority === "low") return -1;
    if (a.priority === "low" && b.priority === "high") return 1;
    return 0;
  });

  const results: PreloadResult[] = [];
  let completed = 0;
  const total = sortedItems.length;

  // Process items with concurrency limit
  const queue = [...sortedItems];
  const inProgress = new Map<Promise<PreloadResult>, PreloadResult | null>();

  while (queue.length > 0 || inProgress.size > 0) {
    // Fill up to concurrency limit
    while (inProgress.size < concurrency && queue.length > 0) {
      const item = queue.shift()!;
      const promise = preloadImage(item.url)
        .then((result) => {
          completed++;
          if (onProgress) {
            try {
              onProgress(completed, total);
            } catch (err) {
              console.error("Progress callback error:", err);
            }
          }
          return result;
        })
        .catch((err) => {
          // Ensure all errors are caught and converted to PreloadResult
          completed++;
          if (onProgress) {
            try {
              onProgress(completed, total);
            } catch (progressErr) {
              console.error("Progress callback error:", progressErr);
            }
          }
          return {
            url: item.url,
            success: false,
            error:
              err instanceof Error ? err : new Error("Unknown preload error"),
          };
        });

      inProgress.set(promise, null);
    }

    // Wait for at least one to complete
    if (inProgress.size > 0) {
      try {
        const result = await Promise.race(Array.from(inProgress.keys()));
        results.push(result);

        // Remove the completed promise from inProgress
        for (const [promise] of inProgress) {
          // Check if this promise has resolved to our result
          promise
            .then((res) => {
              if (res === result) {
                inProgress.delete(promise);
              }
            })
            .catch(() => {
              // Already handled above
            });
        }

        // Fallback: if we can't identify which promise completed, remove the first one
        if (inProgress.size > 0) {
          const firstPromise = Array.from(inProgress.keys())[0];
          inProgress.delete(firstPromise);
        }
      } catch (err) {
        // This should never happen due to our error handling above, but just in case
        console.error("Unexpected race error:", err);
        // Clear one promise to ensure forward progress
        if (inProgress.size > 0) {
          const firstPromise = Array.from(inProgress.keys())[0];
          inProgress.delete(firstPromise);
        }
      }
    }
  }

  return results;
}

/**
 * Clear session cache (useful for testing or forced refresh)
 */
export function clearPreloadCache(): void {
  sessionLoadedUrls.clear();
}
