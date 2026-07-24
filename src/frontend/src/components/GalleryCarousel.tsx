import React, { useEffect, useRef, useState } from "react";
import { useFileUrl } from "../blob-storage/FileStorage";

interface GalleryCarouselPhoto {
  id: string;
  path: string;
  linkUrl: string;
  sortOrder: bigint | number;
}

interface GalleryCarouselProps {
  photos: GalleryCarouselPhoto[];
  side: "left" | "right";
  intervalMs?: number;
  fadeStartY?: number;
}

const VISIBLE_COUNT = 3;
const GAP_PX = 12;
const PHOTO_WIDTH = 150; // inner width after padding
const PHOTO_HEIGHT = Math.round(PHOTO_WIDTH * 1.5); // 225px for 2:3 aspect
const SLOT_HEIGHT = PHOTO_HEIGHT + GAP_PX; // 237px
const CONTAINER_HEIGHT =
  PHOTO_HEIGHT * VISIBLE_COUNT + GAP_PX * (VISIBLE_COUNT - 1); // 699px

// Per-photo sub-component so useFileUrl can be called as a hook (not in a loop)
function CarouselPhotoItem({
  photo,
  isLoaded,
  side,
  onLoad,
}: {
  photo: GalleryCarouselPhoto;
  isLoaded: boolean;
  side: string;
  onLoad: () => void;
}) {
  const { data: resolvedUrl } = useFileUrl(photo.path);
  const url = resolvedUrl || "";

  // Don't render at all until the URL is resolved — avoids broken-image icons
  // and ensures onLoad fires correctly once the real URL arrives
  if (!url) {
    return (
      <div
        className="w-full aspect-[2/3] rounded-lg overflow-hidden shadow-md relative"
        style={{ opacity: 0 }}
      />
    );
  }

  const img = (
    <img
      src={url}
      alt=""
      className="w-full h-full object-cover"
      onLoad={onLoad}
      onContextMenu={(e) => e.preventDefault()}
      draggable={false}
      style={{ userSelect: "none" }}
    />
  );

  return (
    <div
      className="w-full aspect-[2/3] rounded-lg overflow-hidden shadow-md relative"
      style={{
        opacity: isLoaded ? 1 : 0,
        transition: "opacity 0.5s ease",
      }}
    >
      {photo.linkUrl ? (
        <a
          href={photo.linkUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full h-full"
          data-ocid={`gallery-carousel-${side}.link.${photo.id}`}
        >
          {img}
        </a>
      ) : (
        img
      )}
      {/* Frosted glass hover overlay */}
      <div className="absolute inset-0 bg-white/0 hover:bg-white/10 transition-colors duration-300 pointer-events-none" />
    </div>
  );
}

const GalleryCarousel = React.memo(function GalleryCarousel({
  photos,
  side,
  intervalMs = 4000,
  fadeStartY,
}: GalleryCarouselProps) {
  return (
    <GalleryCarouselInner
      photos={photos}
      side={side}
      intervalMs={intervalMs}
      fadeStartY={fadeStartY}
    />
  );
});

export default GalleryCarousel;

function GalleryCarouselInner({
  photos,
  side,
  intervalMs,
  fadeStartY,
}: GalleryCarouselProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const opacityRef = useRef(1);
  const offsetRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);
  const loadedIdsRef = useRef<Set<string>>(new Set());
  const [loadedIds, setLoadedIds] = useState<Set<string>>(new Set());
  const photosRef = useRef(photos);
  photosRef.current = photos;

  const [, forceUpdate] = useState(0);

  // Sync loadedIds state to ref for the rotation loop
  useEffect(() => {
    loadedIdsRef.current = loadedIds;
  }, [loadedIds]);

  // Scroll-based fade-out near the About This Book section
  useEffect(() => {
    if (fadeStartY === undefined) return;

    const handleScroll = () => {
      if (!containerRef.current) return;
      const scrollY = window.scrollY;
      const fadeDistance = 400;
      const startFade = Math.max(0, fadeStartY - fadeDistance);

      let newOpacity = 1;
      if (scrollY >= fadeStartY) {
        newOpacity = 0;
      } else if (scrollY > startFade) {
        newOpacity = 1 - (scrollY - startFade) / fadeDistance;
      }
      newOpacity = Math.max(0, Math.min(1, newOpacity));

      opacityRef.current = newOpacity;
      containerRef.current.style.opacity = String(newOpacity);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [fadeStartY]);

  // Restart the rotation timer when photos first become available (or change length)
  const photosLength = photos.length;

  // Recursive rotation with single setTimeout
  useEffect(() => {
    mountedRef.current = true;

    // Clear any existing timer before starting a new one
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    const rotate = () => {
      if (!mountedRef.current || photosRef.current.length <= VISIBLE_COUNT)
        return;

      const nextOffset = (offsetRef.current + 1) % photosRef.current.length;
      const incomingId = photosRef.current[nextOffset].id;

      if (loadedIdsRef.current.has(incomingId)) {
        offsetRef.current = nextOffset;
        forceUpdate((v) => v + 1);
        timerRef.current = setTimeout(rotate, intervalMs);
      } else {
        // Wait for the incoming photo to load (max 6 seconds)
        const waitStart = Date.now();
        const checkLoaded = () => {
          if (!mountedRef.current) return;
          if (loadedIdsRef.current.has(incomingId)) {
            offsetRef.current = nextOffset;
            forceUpdate((v) => v + 1);
            timerRef.current = setTimeout(rotate, intervalMs);
          } else if (Date.now() - waitStart < 6000) {
            timerRef.current = setTimeout(checkLoaded, 200);
          } else {
            // Timeout — advance anyway
            offsetRef.current = nextOffset;
            forceUpdate((v) => v + 1);
            timerRef.current = setTimeout(rotate, intervalMs);
          }
        };
        timerRef.current = setTimeout(checkLoaded, 200);
      }
    };

    if (photosRef.current.length > VISIBLE_COUNT) {
      timerRef.current = setTimeout(rotate, intervalMs);
    }

    return () => {
      mountedRef.current = false;
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [intervalMs, photosLength]);

  const handleImageLoad = (id: string) => {
    setLoadedIds((prev) => {
      if (prev.has(id)) return prev;
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  };

  if (photos.length === 0) return null;

  const positionClass = side === "left" ? "left-6" : "right-6";

  return (
    <div
      ref={containerRef}
      className={`fixed top-[18vh] ${positionClass} z-20 hidden xl:flex flex-col w-[170px] p-2.5 rounded-xl backdrop-blur-md bg-white/10 border border-white/20 shadow-xl`}
      style={{ opacity: opacityRef.current }}
      data-ocid={`gallery-carousel-${side}`}
    >
      <div className="overflow-hidden" style={{ height: CONTAINER_HEIGHT }}>
        <div
          className="flex flex-col gap-3 transition-transform duration-700 ease-in-out"
          style={{
            transform: `translateY(-${offsetRef.current * SLOT_HEIGHT}px)`,
          }}
        >
          {photos.map((photo) => {
            const isLoaded = loadedIds.has(photo.id);
            return (
              <CarouselPhotoItem
                key={photo.id}
                photo={photo}
                isLoaded={isLoaded}
                side={side}
                onLoad={() => handleImageLoad(photo.id)}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
