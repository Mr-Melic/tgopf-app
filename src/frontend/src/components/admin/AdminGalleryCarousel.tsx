import { ArrowDown, ArrowUp, ImageIcon, Trash2, Upload } from "lucide-react";
import type React from "react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import {
  useFileDelete,
  useFileUpload,
  useFileUrl,
  useInvalidateQueries,
} from "../../blob-storage/FileStorage";
import {
  type GalleryCarouselPhoto,
  useDeleteGalleryCarouselPhoto,
  useGetGalleryCarouselPhotos,
  useReorderGalleryCarouselPhotos,
  useSaveGalleryCarouselPhoto,
} from "../../hooks/useQueries";
import { convertToWebP } from "../../utils/imageConverter";

// ─── Thumbnail ───────────────────────────────────────────────────────────────

function PhotoThumbnail({ photo }: { photo: GalleryCarouselPhoto }) {
  const { data: url } = useFileUrl(photo.path);

  if (!url) {
    return (
      <div className="w-[60px] h-[80px] bg-gray-100 rounded flex items-center justify-center flex-shrink-0">
        <ImageIcon className="w-4 h-4 text-gray-400" />
      </div>
    );
  }

  return (
    <img
      src={url}
      alt="Carousel"
      className="w-[60px] h-[80px] object-cover rounded border border-gray-200 flex-shrink-0"
    />
  );
}

// ─── Main component ──────────────────────────────────────────────────────────

export default function AdminGalleryCarousel() {
  const { data: photos = [] } = useGetGalleryCarouselPhotos();
  const saveMutation = useSaveGalleryCarouselPhoto();
  const deleteMutation = useDeleteGalleryCarouselPhoto();
  const reorderMutation = useReorderGalleryCarouselPhotos();
  const { uploadFile, isStorageReady } = useFileUpload();
  const { deleteFile } = useFileDelete();
  const { invalidateFileUrl } = useInvalidateQueries();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingSide, setPendingSide] = useState<"left" | "right">("left");
  const [editingLinks, setEditingLinks] = useState<Record<string, string>>({});

  const leftPhotos = photos
    .filter((p) => p.side === "left")
    .sort((a, b) => Number(a.sortOrder) - Number(b.sortOrder));
  const rightPhotos = photos
    .filter((p) => p.side === "right")
    .sort((a, b) => Number(a.sortOrder) - Number(b.sortOrder));

  const handleAddPhoto = (side: "left" | "right") => {
    setPendingSide(side);
    fileInputRef.current?.click();
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
      "image/gif",
    ];
    if (!validTypes.includes(file.type)) {
      toast.error("Invalid file type. Please select an image.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be less than 5MB");
      return;
    }

    // Check if storage is ready before starting
    if (!isStorageReady) {
      toast.error("Still connecting to storage, please try again in a moment.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    const toastId = toast.loading("Uploading photo…");

    // Step 1: Convert to WebP
    let webpFile: File;
    try {
      webpFile = await convertToWebP(file);
    } catch (err) {
      console.error("convertToWebP failed:", err);
      toast.error("Image conversion failed. Please try another image.", {
        id: toastId,
      });
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    // Step 2: Upload file to storage
    const photoId = crypto.randomUUID();
    let uploadResult: { path: string; hash: string; url: string };
    try {
      uploadResult = await uploadFile(
        `gallery-carousel/${photoId}.webp`,
        webpFile,
      );
    } catch (err) {
      console.error("uploadFile failed:", err);
      const msg = err instanceof Error ? err.message : "Unknown upload error";
      if (
        msg === "Backend is not available" ||
        msg.includes("not available") ||
        msg.includes("null")
      ) {
        toast.error(
          "Storage not ready yet. Please wait a moment and try again.",
          { id: toastId },
        );
      } else {
        toast.error(`Upload failed: ${msg}`, { id: toastId });
      }
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    // Step 3: Save photo metadata to backend
    const sidePhotos = pendingSide === "left" ? leftPhotos : rightPhotos;
    try {
      await saveMutation.mutateAsync({
        id: photoId,
        path: uploadResult.path,
        linkUrl: "",
        sortOrder: sidePhotos.length,
        side: pendingSide,
      });
    } catch (err) {
      console.error("saveMutation failed:", err);
      const msg = err instanceof Error ? err.message : "Unknown save error";
      toast.error(`Photo uploaded but could not save metadata: ${msg}`, {
        id: toastId,
      });
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    // Invalidate the cached URL so GalleryCarousel re-fetches the newly registered file reference
    invalidateFileUrl(uploadResult.path);
    toast.success("Photo uploaded", { id: toastId });
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDelete = async (photo: GalleryCarouselPhoto) => {
    if (!confirm("Are you sure you want to delete this photo?")) return;
    const toastId = toast.loading("Deleting…");
    try {
      await deleteMutation.mutateAsync(photo.id);
      if (photo.path) {
        await deleteFile(photo.path).catch((err) =>
          console.warn("Could not delete file from storage:", err),
        );
      }
      toast.success("Photo deleted", { id: toastId });
    } catch {
      toast.error("Failed to delete photo", { id: toastId });
    }
  };

  const handleMove = async (
    list: GalleryCarouselPhoto[],
    index: number,
    direction: "up" | "down",
  ) => {
    if (direction === "up" && index === 0) return;
    if (direction === "down" && index === list.length - 1) return;
    const newIndex = direction === "up" ? index - 1 : index + 1;
    const reordered = [...list];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(newIndex, 0, moved);
    await reorderMutation.mutateAsync(reordered.map((p) => p.id));
  };

  const handleLinkChange = (id: string, value: string) => {
    setEditingLinks((prev) => ({ ...prev, [id]: value }));
  };

  const handleLinkSave = async (photo: GalleryCarouselPhoto) => {
    const newLink = editingLinks[photo.id];
    if (newLink === undefined) return;
    await saveMutation.mutateAsync({
      id: photo.id,
      path: photo.path,
      linkUrl: newLink,
      sortOrder: Number(photo.sortOrder),
      side: photo.side,
    });
    setEditingLinks((prev) => {
      const n = { ...prev };
      delete n[photo.id];
      return n;
    });
    toast.success("Link saved");
  };

  const handleSideChange = async (
    photo: GalleryCarouselPhoto,
    newSide: string,
  ) => {
    const sidePhotos = newSide === "left" ? leftPhotos : rightPhotos;
    await saveMutation.mutateAsync({
      id: photo.id,
      path: photo.path,
      linkUrl: photo.linkUrl,
      sortOrder: sidePhotos.length,
      side: newSide,
    });
    toast.success("Side updated");
  };

  const renderRow = (
    photo: GalleryCarouselPhoto,
    index: number,
    list: GalleryCarouselPhoto[],
  ) => (
    <div
      key={photo.id}
      className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100"
      data-ocid={`gallery-carousel-photo-${photo.id}`}
    >
      <PhotoThumbnail photo={photo} />

      <div className="flex-1 min-w-0 space-y-2">
        <input
          type="text"
          placeholder="Link URL (optional)"
          defaultValue={photo.linkUrl}
          onChange={(e) => handleLinkChange(photo.id, e.target.value)}
          onBlur={() => handleLinkSave(photo)}
          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded bg-white text-gray-900 focus:outline-none focus:ring-1 focus:ring-black"
          data-ocid={`gallery-carousel-link-input-${photo.id}`}
        />
        <div className="flex items-center gap-2">
          <select
            value={photo.side}
            onChange={(e) => handleSideChange(photo, e.target.value)}
            className="px-2 py-1 text-sm border border-gray-300 rounded bg-white text-gray-900 focus:outline-none focus:ring-1 focus:ring-black"
            data-ocid={`gallery-carousel-side-select-${photo.id}`}
          >
            <option value="left">Left</option>
            <option value="right">Right</option>
          </select>
          <span className="text-xs text-gray-500">
            Order: {Number(photo.sortOrder) + 1}
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <button
          type="button"
          onClick={() => handleMove(list, index, "up")}
          disabled={index === 0 || reorderMutation.isPending}
          className="p-1 text-gray-500 hover:text-gray-900 hover:bg-gray-200 rounded disabled:opacity-30 transition-colors"
          data-ocid={`gallery-carousel-move-up-${photo.id}`}
        >
          <ArrowUp className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => handleMove(list, index, "down")}
          disabled={index === list.length - 1 || reorderMutation.isPending}
          className="p-1 text-gray-500 hover:text-gray-900 hover:bg-gray-200 rounded disabled:opacity-30 transition-colors"
          data-ocid={`gallery-carousel-move-down-${photo.id}`}
        >
          <ArrowDown className="w-4 h-4" />
        </button>
      </div>

      <button
        type="button"
        onClick={() => handleDelete(photo)}
        disabled={deleteMutation.isPending}
        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        data-ocid={`gallery-carousel-delete-${photo.id}`}
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );

  const renderSection = (
    title: string,
    side: "left" | "right",
    sidePhotos: GalleryCarouselPhoto[],
  ) => (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold uppercase tracking-wide text-gray-700">
          {title}
        </h3>
        <span className="text-xs text-gray-500">
          {sidePhotos.length} photo{sidePhotos.length !== 1 ? "s" : ""}
        </span>
      </div>

      {sidePhotos.length === 0 ? (
        <div className="text-center py-6 bg-gray-50 rounded-lg border border-dashed border-gray-200">
          <ImageIcon className="w-6 h-6 text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-500">No photos yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {sidePhotos.map((p, i) => renderRow(p, i, sidePhotos))}
        </div>
      )}

      <button
        type="button"
        onClick={() => handleAddPhoto(side)}
        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-black text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
        data-ocid={`gallery-carousel-add-${side}-button`}
      >
        <Upload className="w-4 h-4" />
        Add Photo to {title}
      </button>
    </div>
  );

  return (
    <div className="space-y-6">
      <p className="text-sm text-gray-500">
        Photos show on desktop only. Add photos in multiples of 3 for best
        results (3, 9, 18, 24…).
      </p>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {renderSection("Left Side", "left", leftPhotos)}
        {renderSection("Right Side", "right", rightPhotos)}
      </div>

      <div className="flex items-center justify-between text-sm text-gray-600 pt-2 border-t border-gray-200">
        <span>
          Left: {leftPhotos.length} photos | Right: {rightPhotos.length} photos
        </span>
        <span>Total: {photos.length} photos</span>
      </div>
    </div>
  );
}
