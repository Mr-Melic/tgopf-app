import { useEffect, useState } from "react";

/**
 * Hook to track whether the viewport is below a specified breakpoint
 * @param breakpoint - Width in pixels (default: 1024 for tablet/mobile)
 * @returns boolean indicating if viewport is below the breakpoint
 */
export function useViewportBreakpoint(breakpoint = 1024): boolean {
  const [isBelowBreakpoint, setIsBelowBreakpoint] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.innerWidth < breakpoint;
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia(`(max-width: ${breakpoint - 1}px)`);

    const handleChange = (e: MediaQueryListEvent | MediaQueryList) => {
      setIsBelowBreakpoint(e.matches);
    };

    // Initial check
    handleChange(mediaQuery);

    // Listen for changes
    mediaQuery.addEventListener("change", handleChange);

    return () => {
      mediaQuery.removeEventListener("change", handleChange);
    };
  }, [breakpoint]);

  return isBelowBreakpoint;
}
