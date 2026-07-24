import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import type { GalleryCarouselPhoto } from "../hooks/useQueries";
import { useGetGalleryCarouselPhotos } from "../hooks/useQueries";

export type { GalleryCarouselPhoto };

export interface GalleryCarouselPhotoWithPath extends GalleryCarouselPhoto {
  // path is the storage path; URL resolution happens per-photo in GalleryCarousel
}

export function useGalleryCarousel() {
  const query = useGetGalleryCarouselPhotos();

  const leftPhotos = useMemo(
    () =>
      (query.data ?? [])
        .filter((p) => p.side === "left")
        .sort((a, b) => Number(a.sortOrder) - Number(b.sortOrder)),
    [query.data],
  );

  const rightPhotos = useMemo(
    () =>
      (query.data ?? [])
        .filter((p) => p.side === "right")
        .sort((a, b) => Number(a.sortOrder) - Number(b.sortOrder)),
    [query.data],
  );

  return {
    leftPhotos,
    rightPhotos,
    isLoading: query.isLoading,
  };
}
