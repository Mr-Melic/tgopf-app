import { useMemo } from "react";

export interface AdaptiveLoadingConfig {
  disableAnimations: boolean;
  saveDataMode: boolean;
  reducedSymbols: boolean;
  isSlowNetwork: boolean;
}

export function useAdaptiveLoading(): AdaptiveLoadingConfig {
  return useMemo(() => {
    const conn =
      (
        navigator as {
          connection?: {
            effectiveType?: string;
            downlink?: number;
            saveData?: boolean;
          };
        }
      ).connection ||
      (
        navigator as {
          mozConnection?: {
            effectiveType?: string;
            downlink?: number;
            saveData?: boolean;
          };
        }
      ).mozConnection ||
      (
        navigator as {
          webkitConnection?: {
            effectiveType?: string;
            downlink?: number;
            saveData?: boolean;
          };
        }
      ).webkitConnection;
    const effectiveType: string = conn?.effectiveType ?? "4g";
    const downlink: number | undefined = conn?.downlink;
    const saveData: boolean = conn?.saveData ?? false;
    const cores: number | undefined = navigator.hardwareConcurrency;
    const memory: number | undefined = (navigator as { deviceMemory?: number })
      .deviceMemory;

    const isSlowNetwork =
      effectiveType === "2g" ||
      effectiveType === "3g" ||
      (downlink !== undefined && downlink < 1.5);

    const disableAnimations =
      isSlowNetwork ||
      saveData ||
      (cores !== undefined && cores <= 2) ||
      (memory !== undefined && memory <= 2);

    const reducedSymbols = memory !== undefined && memory <= 2;

    const config: AdaptiveLoadingConfig = {
      disableAnimations,
      saveDataMode: saveData,
      reducedSymbols,
      isSlowNetwork,
    };

    console.debug("[AdaptiveLoading]", config, {
      effectiveType,
      downlink,
      saveData,
      cores,
      memory,
    });
    return config;
  }, []);
}
