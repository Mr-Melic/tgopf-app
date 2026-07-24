import { type RefObject, useCallback, useEffect, useState } from "react";

interface UseHeaderNavCollisionOptions {
  titleRef: RefObject<HTMLElement | null>;
  navRef: RefObject<HTMLElement | null>;
  safetyMargin?: number;
}

/**
 * Hook to detect collision between header title and navigation.
 * Collapses the nav into the 4-dot menu when the title right edge +
 * safetyMargin reaches (or exceeds) the nav left edge.
 * When there is ample space the nav buttons are shown inline.
 */
export function useHeaderNavCollision({
  titleRef,
  navRef,
  safetyMargin = 64,
}: UseHeaderNavCollisionOptions): boolean {
  const [shouldCollapse, setShouldCollapse] = useState(true);

  const checkCollision = useCallback(() => {
    const titleEl = titleRef.current;
    const navEl = navRef.current;

    if (!titleEl || !navEl) {
      setShouldCollapse(true);
      return;
    }

    const titleRect = titleEl.getBoundingClientRect();
    const navRect = navEl.getBoundingClientRect();

    // Collapse if title right edge + safetyMargin reaches the nav left edge
    const titleRight = titleRect.right + safetyMargin;
    const navLeft = navRect.left;

    setShouldCollapse(titleRight >= navLeft);
  }, [titleRef, navRef, safetyMargin]);

  useEffect(() => {
    checkCollision();
    window.addEventListener("resize", checkCollision);

    const resizeObserver = new ResizeObserver(checkCollision);
    if (titleRef.current) resizeObserver.observe(titleRef.current);
    if (navRef.current) resizeObserver.observe(navRef.current);

    return () => {
      window.removeEventListener("resize", checkCollision);
      resizeObserver.disconnect();
    };
  }, [checkCollision, titleRef, navRef]);

  return shouldCollapse;
}
