import type React from "react";
import { useEffect, useRef, useState } from "react";
import { useFileUrl, useInvalidateQueries } from "../blob-storage/FileStorage";
import { useInViewport } from "../hooks/useInViewport";

interface LazyBlobImageProps {
  path: string;
  alt: string;
  className?: string;
  priority?: boolean;
  placeholder?: React.ReactNode;
  onLoad?: () => void;
}

/**
 * Image component with optional lazy-loading via IntersectionObserver.
 * - priority=true: loads immediately, skips viewport detection entirely
 * - priority=false: defers URL resolution until 200px before entering viewport
 *
 * On image load error, triggers ONE URL re-resolution (invalidates the
 * ['fileUrl', path] query so React Query refetches). If the re-resolution
 * also fails, a neutral placeholder is shown instead of the loading shimmer.
 */
export default function LazyBlobImage({
  path,
  alt,
  className = "",
  priority = false,
  placeholder,
  onLoad,
}: LazyBlobImageProps) {
  // Only wire up IntersectionObserver for non-priority images
  const [containerRef, isInViewport] = useInViewport<HTMLDivElement>({
    enabled: !priority,
    rootMargin: "200px", // Start loading 200px before entering viewport
  });

  // Priority images load immediately; others wait for viewport proximity
  const shouldLoad = priority || isInViewport;

  const { data: imageUrl, isLoading } = useFileUrl(shouldLoad ? path : "");
  const [imageLoaded, setImageLoaded] = useState(false);
  // True after the <img> fired onError and we've invalidated the query once
  const [reResolveAttempted, setReResolveAttempted] = useState(false);
  // True while we are waiting for the one-shot re-resolution to settle
  const [reResolving, setReResolving] = useState(false);
  // True once the re-resolution has also failed — show neutral placeholder
  const [permanentlyFailed, setPermanentlyFailed] = useState(false);

  const { invalidateFileUrl } = useInvalidateQueries();
  // Track the path the re-resolution attempt was made for, so a path change
  // resets the error state and allows a fresh attempt.
  const attemptedPathRef = useRef<string | null>(null);

  useEffect(() => {
    if (imageUrl) {
      setImageLoaded(false);
      // A successful (re-)resolution arrived — clear error bookkeeping
      setReResolving(false);
      setPermanentlyFailed(false);
    } else if (reResolveAttempted) {
      // Re-resolution completed but yielded no usable URL — give up and
      // show the neutral placeholder instead of looping or shimmering.
      setReResolving(false);
      setPermanentlyFailed(true);
    }
  }, [imageUrl, reResolveAttempted]);

  // Reset error state if the path itself changes
  useEffect(() => {
    if (attemptedPathRef.current !== path) {
      setReResolveAttempted(false);
      setReResolving(false);
      setPermanentlyFailed(false);
      attemptedPathRef.current = null;
    }
  }, [path]);

  const handleImageLoad = () => {
    setImageLoaded(true);
    if (onLoad) {
      onLoad();
    }
  };

  const handleImageError = () => {
    // Only attempt one re-resolution per path to avoid infinite loops
    if (reResolveAttempted) {
      setPermanentlyFailed(true);
      setReResolving(false);
      return;
    }
    setReResolveAttempted(true);
    attemptedPathRef.current = path;
    setReResolving(true);
    setImageLoaded(false);
    // Invalidate the fileUrl query for this path so React Query refetches
    void invalidateFileUrl(path);
  };

  // Neutral placeholder shown after a failed re-resolution (no shimmer)
  const neutralPlaceholder = (
    <div className="absolute inset-0 bg-muted flex items-center justify-center">
      <span className="text-muted-foreground text-sm" aria-hidden="true">
        —
      </span>
    </div>
  );

  // Loading shimmer — shown while initially loading or during the one-shot
  // re-resolution. Suppressed once the image has permanently failed.
  const loadingPlaceholder = placeholder || (
    <div className="absolute inset-0 bg-muted animate-pulse flex items-center justify-center">
      <span className="text-muted-foreground text-sm">Loading...</span>
    </div>
  );

  // Show the shimmer while we don't yet have a usable URL or the image
  // hasn't finished loading — unless the re-resolution already failed.
  const showLoadingPlaceholder =
    !permanentlyFailed &&
    ((!imageUrl && !reResolving) || isLoading || !imageLoaded);

  // For priority images, skip the observer-ref wrapper to avoid any observer overhead
  if (priority) {
    return (
      <div className={`relative ${className}`}>
        {showLoadingPlaceholder && loadingPlaceholder}
        {permanentlyFailed && neutralPlaceholder}
        {imageUrl && !permanentlyFailed && (
          <img
            src={imageUrl}
            alt={alt}
            className={`w-full h-full object-cover transition-opacity duration-300 ${
              imageLoaded ? "opacity-100" : "opacity-0"
            }`}
            loading="eager"
            fetchPriority="high"
            draggable={false}
            onLoad={handleImageLoad}
            onError={handleImageError}
            onDragStart={(e) => e.preventDefault()}
            onContextMenu={(e) => e.preventDefault()}
          />
        )}
      </div>
    );
  }

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {showLoadingPlaceholder && loadingPlaceholder}
      {permanentlyFailed && neutralPlaceholder}
      {imageUrl && !permanentlyFailed && (
        <img
          src={imageUrl}
          alt={alt}
          className={`w-full h-full object-cover transition-opacity duration-300 ${
            imageLoaded ? "opacity-100" : "opacity-0"
          }`}
          loading="lazy"
          fetchPriority="auto"
          draggable={false}
          onLoad={handleImageLoad}
          onError={handleImageError}
          onDragStart={(e) => e.preventDefault()}
          onContextMenu={(e) => e.preventDefault()}
        />
      )}
    </div>
  );
}
