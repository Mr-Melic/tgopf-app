import type React from "react";
import { useEffect, useRef, useState } from "react";
import { useInViewport } from "../hooks/useInViewport";

interface ProgressiveSectionProps {
  children: React.ReactNode;
  className?: string;
  priority?: boolean;
  placeholder?: React.ReactNode;
  onVisible?: () => void;
}

/**
 * Progressive section that renders content immediately on mount.
 * Once shouldRender is true it NEVER goes back to false — a section that has
 * rendered once always stays rendered regardless of re-mounts or re-renders.
 *
 * This prevents the "blank page after loading screen" bug where ProgressiveSection
 * components would re-mount after the loading overlay removed itself and, because
 * isFirstMountRef was already false, would initialize shouldRender=false and show
 * placeholder spinners instead of content until IntersectionObserver fired.
 */
export default function ProgressiveSection({
  children,
  className = "",
  priority = false,
  placeholder,
  onVisible,
}: ProgressiveSectionProps) {
  const [containerRef, isInViewport] = useInViewport<HTMLDivElement>({
    rootMargin: "400px", // Start loading 400px before entering viewport
    enabled: !priority,
  });

  // Always initialize to true — content renders immediately on mount.
  // Once true, this value is NEVER set back to false.
  const [shouldRender, setShouldRender] = useState(true);
  const hasNotifiedRef = useRef(false);

  useEffect(() => {
    if (priority || isInViewport) {
      setShouldRender(true); // idempotent once already true

      if (!hasNotifiedRef.current && onVisible) {
        hasNotifiedRef.current = true;
        onVisible();
      }
    }
  }, [priority, isInViewport, onVisible]);

  return (
    <div ref={containerRef} className={className}>
      {shouldRender
        ? children
        : placeholder || (
            <div className="w-full min-h-[200px] bg-gray-50 animate-pulse flex items-center justify-center">
              <span className="text-gray-400">Loading section...</span>
            </div>
          )}
    </div>
  );
}
