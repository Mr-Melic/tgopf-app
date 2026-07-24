import { type RefObject, useEffect, useRef, useState } from "react";

interface UseInViewportOptions {
  rootMargin?: string;
  threshold?: number | number[];
  enabled?: boolean;
}

/**
 * Hook to detect when an element is in or near the viewport
 */
export function useInViewport<T extends HTMLElement = HTMLDivElement>(
  options: UseInViewportOptions = {},
): [RefObject<T>, boolean] {
  const {
    rootMargin = "200px", // Start loading 200px before entering viewport
    threshold = 0,
    enabled = true,
  } = options;

  const ref = useRef<T>(null);
  const [isInViewport, setIsInViewport] = useState(false);

  useEffect(() => {
    if (!enabled) {
      setIsInViewport(true); // If disabled, treat as always in viewport
      return;
    }

    const element = ref.current;
    if (!element) return;

    // Check if IntersectionObserver is supported
    if (!("IntersectionObserver" in window)) {
      setIsInViewport(true); // Fallback: treat as always visible
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInViewport(true);
            // Once in viewport, we can stop observing (one-time load)
            observer.disconnect();
          }
        });
      },
      {
        rootMargin,
        threshold,
      },
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [rootMargin, threshold, enabled]);

  return [ref as RefObject<T>, isInViewport];
}
