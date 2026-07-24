/**
 * Browser-side blob URL cache using IndexedDB
 * Stores blob URLs with expiration to speed up subsequent loads
 */

const DB_NAME = "BlobCacheDB";
const STORE_NAME = "blobUrls";
const DB_VERSION = 2;
const CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days

interface CachedBlob {
  url: string;
  timestamp: number;
  path: string;
}

let dbPromise: Promise<IDBDatabase> | null = null;

function openDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: "path" });
        store.createIndex("timestamp", "timestamp", { unique: false });
      }
    };
  });

  return dbPromise;
}

/**
 * Eagerly warm the browser's HTTP cache by creating a hidden Image element.
 * This fires a GET request so the browser caches the resource for instant display later.
 */
function warmBrowserCache(url: string): void {
  try {
    const img = new Image();
    // Low-priority background fetch — does not block anything
    img.fetchPriority = "low" as never;
    img.src = url;
  } catch {
    // Silently ignore — cache warming is best-effort
  }
}

export async function getCachedBlobUrl(path: string): Promise<string | null> {
  try {
    const db = await openDB();
    const transaction = db.transaction(STORE_NAME, "readonly");
    const store = transaction.objectStore(STORE_NAME);

    return new Promise((resolve, reject) => {
      const request = store.get(path);

      request.onsuccess = () => {
        const cached = request.result as CachedBlob | undefined;

        if (!cached) {
          resolve(null);
          return;
        }

        // Check if expired
        const now = Date.now();
        if (now - cached.timestamp > CACHE_DURATION) {
          // Expired, remove it
          const deleteTransaction = db.transaction(STORE_NAME, "readwrite");
          const deleteStore = deleteTransaction.objectStore(STORE_NAME);
          deleteStore.delete(path);
          resolve(null);
          return;
        }

        resolve(cached.url);
      };

      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.warn("Failed to get cached blob URL:", error);
    return null;
  }
}

export async function setCachedBlobUrl(
  path: string,
  url: string,
): Promise<void> {
  try {
    const db = await openDB();
    const transaction = db.transaction(STORE_NAME, "readwrite");
    const store = transaction.objectStore(STORE_NAME);

    const cached: CachedBlob = {
      path,
      url,
      timestamp: Date.now(),
    };

    await new Promise<void>((resolve, reject) => {
      const request = store.put(cached);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });

    // After storing in IndexedDB, also warm the browser's HTTP cache
    // so the next <img src={url}> renders from disk/memory immediately
    warmBrowserCache(url);
  } catch (error) {
    console.warn("Failed to cache blob URL:", error);
  }
}

export async function clearExpiredCache(): Promise<void> {
  try {
    const db = await openDB();
    const transaction = db.transaction(STORE_NAME, "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const index = store.index("timestamp");

    const now = Date.now();
    const expiredTime = now - CACHE_DURATION;

    const range = IDBKeyRange.upperBound(expiredTime);
    const request = index.openCursor(range);

    request.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest).result;
      if (cursor) {
        cursor.delete();
        cursor.continue();
      }
    };
  } catch (error) {
    console.warn("Failed to clear expired cache:", error);
  }
}

export async function clearAllCache(): Promise<void> {
  try {
    const db = await openDB();
    const transaction = db.transaction(STORE_NAME, "readwrite");
    const store = transaction.objectStore(STORE_NAME);

    return new Promise((resolve, reject) => {
      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.warn("Failed to clear cache:", error);
  }
}
