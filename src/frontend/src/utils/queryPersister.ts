import type {
  PersistedClient,
  Persister,
} from "@tanstack/react-query-persist-client";
import { del, get, set } from "idb-keyval";

const CACHE_KEY = "tgopfQueryCache";

export function createIdbPersister(): Persister {
  return {
    persistClient: async (client: PersistedClient) => {
      try {
        await set(CACHE_KEY, client);
      } catch (e) {
        // Ignore storage errors (e.g. private browsing quota)
      }
    },
    restoreClient: async (): Promise<PersistedClient | undefined> => {
      try {
        // Race with 50ms timeout so IndexedDB never blocks React Query init
        const timeoutPromise = new Promise<undefined>((resolve) =>
          setTimeout(() => resolve(undefined), 200),
        );
        return await Promise.race([
          get<PersistedClient>(CACHE_KEY),
          timeoutPromise,
        ]);
      } catch (e) {
        return undefined;
      }
    },
    removeClient: async () => {
      try {
        await del(CACHE_KEY);
      } catch (e) {
        // Ignore
      }
    },
  };
}

export const idbPersister = createIdbPersister();

/** Check synchronously-ish if there is any cached data available.
 *  Returns a Promise<boolean>.
 *
 *  FIX 2: also verifies the persisted client's buster matches the current
 *  __BUILD_TIME__. On buster mismatch (e.g. after a new deploy) the app must
 *  behave as a first visit — loading screen + preloader shown — so we return
 *  false and let the cache be replaced. The buster value is the same
 *  __BUILD_TIME__ injected in main.tsx via vite.config.js `define`. */
export async function hasCachedQueryData(): Promise<boolean> {
  try {
    const cached = await get<PersistedClient>(CACHE_KEY);
    if (!cached) return false;

    // Verify the persisted buster matches the current build. A mismatch means
    // the cache was written by a previous build and should be treated as empty
    // so the loading screen + preloader run as on a first visit.
    const currentBuster =
      typeof __BUILD_TIME__ !== "undefined"
        ? __BUILD_TIME__
        : Date.now().toString();
    if (cached.buster !== currentBuster) return false;

    const queries = cached?.clientState?.queries;
    return Array.isArray(queries) && queries.length > 0;
  } catch {
    return false;
  }
}
