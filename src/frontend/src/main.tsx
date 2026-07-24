import { registerSW } from "virtual:pwa-register";
import { InternetIdentityProvider } from "@caffeineai/core-infrastructure";
import { QueryClient } from "@tanstack/react-query";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { idbPersister } from "./utils/queryPersister";

// Register the service worker via the virtual:pwa-register module.
// vite.config.js keeps injectRegister:false, so we register explicitly here.
registerSW({ immediate: true });

BigInt.prototype.toJSON = function () {
  return this.toString();
};

declare global {
  interface BigInt {
    toJSON(): string;
  }
}

// Global QueryClient defaults — CRITICAL for preventing refetch storms.
// All queries use these defaults unless they explicitly override.
// refetchOnWindowFocus:false prevents the loading screen dismiss (which
// triggers a focus event) from firing a refetch storm across all queries.
// staleTime:30000 ensures queries don't re-fetch every time a component re-mounts.
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      retry: 1,
      retryDelay: 1000,
    },
  },
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <PersistQueryClientProvider
    client={queryClient}
    persistOptions={{
      persister: idbPersister,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      buster:
        typeof __BUILD_TIME__ !== "undefined"
          ? __BUILD_TIME__
          : Date.now().toString(),
      dehydrateOptions: {
        shouldDehydrateQuery: (query) => {
          if (query.state.status !== "success") return false;
          // FIX 5: do not persist fileUrl queries whose data is empty
          // (failed lookups cached as success with empty data). This prevents
          // stale empty results from being written to IndexedDB.
          const firstKey = query.queryKey[0];
          if (firstKey === "fileUrl") {
            const data = query.state.data;
            if (data === "" || data === null || data === undefined) {
              return false;
            }
          }
          return true;
        },
      },
    }}
  >
    <InternetIdentityProvider>
      <App />
    </InternetIdentityProvider>
  </PersistQueryClientProvider>,
);
