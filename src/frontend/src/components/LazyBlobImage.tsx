import type React from "react";
import { useEffect, useState } from "react";
import { useFileUrl } from "../blob-storage/FileStorage";
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

  useEffect(() => {
    if (imageUrl) {
      setImageLoaded(false);
    }
  }, [imageUrl]);

  const handleImageLoad = () => {
    setImageLoaded(true);
    if (onLoad) {
      onLoad();
    }
  };

  // For priority images, skip the observer-ref wrapper to avoid any observer overhead
  if (priority) {
    return (
      <div className={`relative ${className}`}>
        {(!imageUrl || isLoading || !imageLoaded) &&
          (placeholder || (
            <div className="absolute inset-0 bg-muted animate-pulse flex items-center justify-center">
              <span className="text-muted-foreground text-sm">Loading...</span>
            </div>
          ))}
        {imageUrl && (
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
            onDragStart={(e) => e.preventDefault()}
            onContextMenu={(e) => e.preventDefault()}
          />
        )}
      </div>
    );
  }

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {(!imageUrl || isLoading || !imageLoaded) &&
        (placeholder || (
          <div className="absolute inset-0 bg-muted animate-pulse flex items-center justify-center">
            <span className="text-muted-foreground text-sm">Loading...</span>
          </div>
        ))}
      {imageUrl && (
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
          onDragStart={(e) => e.preventDefault()}
          onContextMenu={(e) => e.preventDefault()}
        />
      )}
    </div>
  );
}
