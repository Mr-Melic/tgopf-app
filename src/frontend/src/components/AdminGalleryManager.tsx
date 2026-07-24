import { useQueryClient } from "@tanstack/react-query";
import type React from "react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import {
  useFileList,
  useFileUpload,
  useFileUrl,
} from "../blob-storage/FileStorage";
import { useActor } from "../hooks/useActor";

export default function AdminGalleryManager() {
  const { data: files } = useFileList();
  const { uploadFile, isUploading } = useFileUpload();
  const { actor } = useActor();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Filter for gallery images
  const galleryImages =
    files?.filter(
      (file) =>
        file.path.startsWith("gallery/") &&
        (file.path.toLowerCase().endsWith(".jpg") ||
          file.path.toLowerCase().endsWith(".jpeg") ||
          file.path.toLowerCase().endsWith(".png") ||
          file.path.toLowerCase().endsWith(".webp")),
    ) || [];

  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) {
      toast.error(
        "Invalid file type. Please select a JPEG, PNG, or WebP image.",
      );
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be less than 5MB");
      return;
    }

    const toastId = toast.loading("Uploading image...", { description: "0%" });

    try {
      const timestamp = Date.now();
      const extension = file.name.split(".").pop();
      const galleryPath = `gallery/image_${timestamp}.${extension}`;

      await uploadFile(galleryPath, file, (progress) => {
        setUploadProgress(progress);
        toast.loading("Uploading image...", {
          id: toastId,
          description: `${Math.round(progress)}%`,
        });
      });

      // Invalidate file list query to refresh the gallery
      await queryClient.invalidateQueries({ queryKey: ["fileList"] });

      setUploadProgress(0);
      toast.success("Image uploaded successfully", { id: toastId });

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      console.error("Failed to upload image:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to upload image";
      toast.error("Failed to upload image", {
        id: toastId,
        description: errorMessage,
      });
      setUploadProgress(0);
    }
  };

  const handleDeleteImage = async (path: string) => {
    if (!actor) return;

    if (!confirm("Are you sure you want to delete this image?")) {
      return;
    }

    toast.loading("Deleting image...", { id: "delete-gallery-image" });

    try {
      await actor.dropFileReference(path);

      // Invalidate file list query
      await queryClient.invalidateQueries({ queryKey: ["fileList"] });

      toast.success("Image deleted successfully", {
        id: "delete-gallery-image",
      });
    } catch (error) {
      console.error("Failed to delete image:", error);
      toast.error("Failed to delete image", { id: "delete-gallery-image" });
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center">
          <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mr-4">
            <span className="text-gray-900 text-xl">🖼️</span>
          </div>
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">
              Gallery Management
            </h2>
            <p className="text-gray-600">
              Upload and manage homepage gallery images
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="bg-black text-white px-6 py-3 rounded-xl font-semibold hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-0.5 disabled:hover:-translate-y-0"
        >
          {isUploading ? "Uploading..." : "Upload Image"}
        </button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        onChange={handleFileSelect}
        className="hidden"
      />

      {isUploading && (
        <div className="mb-6">
          <div className="bg-gray-200 rounded-full h-2 mb-2">
            <div
              className="bg-black h-2 rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
          <p className="text-sm text-gray-600 text-center">
            Uploading... {uploadProgress}%
          </p>
        </div>
      )}

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            Gallery Images ({galleryImages.length})
          </h3>
          <div className="text-sm text-gray-500">
            Images will appear in the homepage slideshow
          </div>
        </div>

        {galleryImages.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-xl">
            <div className="text-4xl mb-4">📷</div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              No gallery images yet
            </h3>
            <p className="text-gray-500 mb-4">
              Upload your first image to get started
            </p>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="bg-black text-white px-4 py-2 rounded-lg font-medium hover:bg-gray-800 transition-colors"
            >
              Upload First Image
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {galleryImages.map((image) => (
              <GalleryImageCard
                key={image.path}
                image={image}
                onDelete={() => handleDeleteImage(image.path)}
              />
            ))}
          </div>
        )}
      </div>

      <div className="mt-8 p-4 bg-gray-50 rounded-xl">
        <h4 className="font-semibold text-gray-800 mb-2">Upload Guidelines:</h4>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• Supported formats: JPEG, PNG, WebP</li>
          <li>• Maximum file size: 5MB</li>
          <li>• Recommended dimensions: 1920x1080 or similar aspect ratio</li>
          <li>• Images will be automatically optimized for web display</li>
          <li>
            • Toast notifications provide real-time feedback for all operations
          </li>
        </ul>
      </div>
    </div>
  );
}

interface GalleryImageCardProps {
  image: { path: string; hash: string };
  onDelete: () => void;
}

function GalleryImageCard({ image, onDelete }: GalleryImageCardProps) {
  const { data: imageUrl } = useFileUrl(image.path);

  return (
    <div className="bg-gray-50 rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-all duration-300">
      <div className="aspect-video bg-gray-200 relative">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt="Selected artwork"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-gray-400 border-t-gray-600" />
          </div>
        )}
      </div>

      <div className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {image.path.split("/").pop()}
            </p>
            <p className="text-xs text-gray-500 truncate">
              {image.hash.substring(0, 8)}...
            </p>
          </div>

          <button
            type="button"
            onClick={onDelete}
            className="ml-3 p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
            title="Delete image"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
