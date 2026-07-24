import { useEffect, useRef, useState } from "react";
import { generateRandomColor } from "../utils/randomColor";

interface BuzzState {
  id: string;
  color: string;
}

interface UseCollapsedIconBuzzOptions {
  iconIds: string[];
  isCollapsed: boolean;
}

export function useCollapsedIconBuzz({
  iconIds,
  isCollapsed,
}: UseCollapsedIconBuzzOptions) {
  const [buzzingIcons, setBuzzingIcons] = useState<BuzzState[]>([]);
  const buzzTimerRef = useRef<NodeJS.Timeout | null>(null);
  const buzzEndTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;

    // Clear any existing timers when collapsed state changes
    if (buzzTimerRef.current) {
      clearTimeout(buzzTimerRef.current);
      buzzTimerRef.current = null;
    }
    if (buzzEndTimerRef.current) {
      clearTimeout(buzzEndTimerRef.current);
      buzzEndTimerRef.current = null;
    }

    // Reset buzzing state when not collapsed
    if (!isCollapsed) {
      setBuzzingIcons([]);
      return;
    }

    // Schedule buzz cycles only when collapsed
    const scheduleBuzz = () => {
      if (!isMountedRef.current || !isCollapsed) return;

      // Random interval between 3 and 12 seconds
      const interval = 3000 + Math.random() * 9000;

      buzzTimerRef.current = setTimeout(() => {
        if (!isMountedRef.current || !isCollapsed) return;

        // Select 1 or 2 random distinct icons
        const numIconsToBuzz = Math.random() < 0.5 ? 1 : 2;
        const selectedIcons: string[] = [];

        // Randomly select distinct icons
        const availableIds = [...iconIds];
        for (let i = 0; i < numIconsToBuzz && availableIds.length > 0; i++) {
          const randomIndex = Math.floor(Math.random() * availableIds.length);
          selectedIcons.push(availableIds[randomIndex]);
          availableIds.splice(randomIndex, 1);
        }

        // Apply buzz and random color to selected icons
        const newBuzzStates: BuzzState[] = selectedIcons.map((id) => ({
          id,
          color: generateRandomColor(),
        }));

        setBuzzingIcons(newBuzzStates);

        // Remove buzz after animation duration (~600ms)
        buzzEndTimerRef.current = setTimeout(() => {
          if (!isMountedRef.current || !isCollapsed) return;
          setBuzzingIcons([]);
        }, 600);

        // Schedule next buzz
        scheduleBuzz();
      }, interval);
    };

    scheduleBuzz();

    return () => {
      isMountedRef.current = false;
      if (buzzTimerRef.current) {
        clearTimeout(buzzTimerRef.current);
      }
      if (buzzEndTimerRef.current) {
        clearTimeout(buzzEndTimerRef.current);
      }
    };
  }, [iconIds, isCollapsed]);

  const getIconBuzzState = (iconId: string) => {
    const buzzState = buzzingIcons.find((state) => state.id === iconId);
    return {
      isBuzzing: !!buzzState,
      color: buzzState?.color || "",
    };
  };

  return { getIconBuzzState };
}
