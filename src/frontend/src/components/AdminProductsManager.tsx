import { useQueryClient } from "@tanstack/react-query";
import React, { useState, useRef } from "react";
import { toast } from "sonner";
import type { Product } from "../backend";
import { useFileUpload, useFileUrl } from "../blob-storage/FileStorage";
import { useActor } from "../hooks/useActor";
import {
  useAddAmazonRegion,
  useDeleteAmazonRegion,
  useGetAmazonRegions,
  useGetAmazonRegionsByBook,
  useGetProducts,
  useRemoveAmazonRegionFromBook,
  useSaveAmazonRegionForBook,
  useUpdateAmazonRegion,
  useUpdateProductByKey,
} from "../hooks/useQueries";
import { convertToWebP } from "../utils/imageConverter";
import {
  type AmazonRegion,
  DEFAULT_AMAZON_REGIONS,
} from "./AmazonRegionSelector";

const VALID_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
];
const MAX_FILE_SIZE = 5 * 1024 * 1024;

export default function AdminProductsManager() {
  const { data: products = [], isLoading: productsLoading } = useGetProducts();
  const updateProductByKey = useUpdateProductByKey();
  const { uploadFile, isUploading } = useFileUpload();
  const { actor } = useActor();
  const queryClient = useQueryClient();

  const [uploadingProductId, setUploadingProductId] = useState<string | null>(
    null,
  );
  const [uploadProgress, setUploadProgress] = useState(0);
  const [saveStatus, setSaveStatus] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");
  const [lastSaveTime, setLastSaveTime] = useState<Date | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const handleCoverUpload = async (product: Product, file: File) => {
    if (!file) return;

    if (!VALID_IMAGE_TYPES.includes(file.type)) {
      setValidationErrors([
        "Please select a valid image file (JPEG, PNG, or WebP)",
      ]);
      toast.error(
        "Invalid file type. Please select a JPEG, PNG, or WebP image.",
      );
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setValidationErrors(["File size must be less than 5MB"]);
      toast.error("File size must be less than 5MB");
      return;
    }

    setSaveStatus("saving");
    setValidationErrors([]);
    const toastId = toast.loading(
      `Uploading front cover for ${product.title}…`,
      {
        description: "0%",
      },
    );

    try {
      setUploadingProductId(product.id);
      // convertToWebP (called at the input onChange before onCoverUpload)
      // always converts the file to WebP, so the stored path must use .webp
      // regardless of the original filename's extension. This applies to new
      // uploads only — existing stored paths are not renamed or migrated.
      const coverPath = `covers/${product.id}_front.webp`;

      await uploadFile(coverPath, file, (progress) => {
        setUploadProgress(progress);
        toast.loading(`Uploading front cover for ${product.title}…`, {
          id: toastId,
          description: `${Math.round(progress)}%`,
        });
      });

      const updatedProduct: Product = {
        ...product,
        frontCoverImagePath: coverPath,
        hasCustomImage: true,
      };
      await updateProductByKey.mutateAsync({
        textKey: product.id,
        product: updatedProduct,
      });

      await queryClient.invalidateQueries({ queryKey: ["fileList"] });
      await queryClient.invalidateQueries({ queryKey: ["products"] });

      setUploadingProductId(null);
      setUploadProgress(0);
      setSaveStatus("saved");
      setLastSaveTime(new Date());
      toast.success(`Front cover uploaded for ${product.title}`, {
        id: toastId,
      });

      setTimeout(() => setSaveStatus("idle"), 3000);
    } catch (error) {
      console.error("Failed to upload front cover:", error);
      setSaveStatus("error");
      const errorMessage =
        error instanceof Error ? error.message : "Failed to upload front cover";
      setValidationErrors([errorMessage]);
      toast.error("Failed to upload front cover", {
        id: toastId,
        description: errorMessage,
      });
      setUploadingProductId(null);
      setUploadProgress(0);

      setTimeout(() => setSaveStatus("idle"), 5000);
    }
  };

  const handleDeleteCover = async (product: Product) => {
    if (!actor || !product.frontCoverImagePath) return;

    if (!confirm("Are you sure you want to delete the front cover image?")) {
      return;
    }

    setSaveStatus("saving");
    toast.loading("Deleting front cover…", { id: "delete-cover" });

    try {
      await actor.dropFileReference(product.frontCoverImagePath);

      const updatedProduct: Product = {
        ...product,
        frontCoverImagePath: undefined,
        hasCustomImage: false,
      };
      await updateProductByKey.mutateAsync({
        textKey: product.id,
        product: updatedProduct,
      });

      await queryClient.invalidateQueries({ queryKey: ["fileList"] });
      await queryClient.invalidateQueries({ queryKey: ["products"] });

      setSaveStatus("saved");
      setLastSaveTime(new Date());
      toast.success("Front cover deleted", { id: "delete-cover" });

      setTimeout(() => setSaveStatus("idle"), 3000);
    } catch (error) {
      console.error("Failed to delete front cover:", error);
      setSaveStatus("error");
      setValidationErrors([
        error instanceof Error ? error.message : "Failed to delete front cover",
      ]);
      toast.error("Failed to delete front cover", { id: "delete-cover" });

      setTimeout(() => setSaveStatus("idle"), 5000);
    }
  };

  // Sync cover flag: repairs a stale hasCustomImage flag without re-uploading
  // the cover. Sets it to true when a frontCoverImagePath exists but the flag
  // is false, and to false when no path exists but the flag is true. No-op
  // (with a toast) when the flag is already consistent with the path state.
  const handleSyncCoverFlag = async (product: Product) => {
    const hasPath = Boolean(product.frontCoverImagePath);
    const flagMatches = hasPath === product.hasCustomImage;

    if (flagMatches) {
      toast.info(`Cover flag already in sync for ${product.title}`, {
        description: "No repair needed.",
      });
      return;
    }

    const correctedFlag = hasPath;
    setSaveStatus("saving");
    const toastId = toast.loading(`Syncing cover flag for ${product.title}…`, {
      description: `Setting hasCustomImage → ${correctedFlag}`,
    });

    try {
      const updatedProduct: Product = {
        ...product,
        hasCustomImage: correctedFlag,
      };
      await updateProductByKey.mutateAsync({
        textKey: product.id,
        product: updatedProduct,
      });

      await queryClient.invalidateQueries({ queryKey: ["products"] });

      setSaveStatus("saved");
      setLastSaveTime(new Date());
      toast.success(`Cover flag synced for ${product.title}`, {
        id: toastId,
        description: `hasCustomImage is now ${correctedFlag}.`,
      });

      setTimeout(() => setSaveStatus("idle"), 3000);
    } catch (error) {
      console.error("Failed to sync cover flag:", error);
      setSaveStatus("error");
      const errorMessage =
        error instanceof Error ? error.message : "Failed to sync cover flag";
      setValidationErrors([errorMessage]);
      toast.error(`Failed to sync cover flag for ${product.title}`, {
        id: toastId,
        description: errorMessage,
      });

      setTimeout(() => setSaveStatus("idle"), 5000);
    }
  };

  if (productsLoading) {
    return (
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-black" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center">
          <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mr-4">
            <span className="text-gray-900 text-xl">📝</span>
          </div>
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">
              Products Management
            </h2>
            <p className="text-gray-600">
              Edit all {products.length} book editions and their front covers
            </p>
          </div>
        </div>
      </div>

      {/* Save Status Indicator */}
      {(saveStatus !== "idle" || lastSaveTime) && (
        <div className="mb-6">
          <div
            className={`flex items-center space-x-2 p-3 rounded-lg ${
              saveStatus === "saving"
                ? "bg-blue-50 text-blue-700"
                : saveStatus === "saved"
                  ? "bg-green-50 text-green-700"
                  : saveStatus === "error"
                    ? "bg-red-50 text-red-700"
                    : "bg-gray-50 text-gray-700"
            }`}
          >
            {saveStatus === "saving" && (
              <svg
                className="animate-spin h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            )}
            {saveStatus === "saved" && (
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            )}
            {saveStatus === "error" && (
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            )}
            <span className="text-sm font-medium">
              {saveStatus === "saving" && "Saving changes..."}
              {saveStatus === "saved" && "All changes saved successfully"}
              {saveStatus === "error" && "Error saving changes"}
              {saveStatus === "idle" &&
                lastSaveTime &&
                `Last saved: ${lastSaveTime.toLocaleTimeString()}`}
            </span>
          </div>
        </div>
      )}

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center mb-2">
            <svg
              className="w-5 h-5 text-red-600 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <h4 className="text-sm font-medium text-red-800">
              Please fix the following errors:
            </h4>
          </div>
          <ul className="text-sm text-red-700 list-disc list-inside space-y-1">
            {validationErrors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Product Cards Grid */}
      {products.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <p className="text-4xl mb-4">📚</p>
          <p className="font-medium text-gray-600">No products available</p>
          <p className="text-sm mt-1">
            Products are pre-seeded from the backend.
          </p>
        </div>
      ) : (
        <div
          data-ocid="product.list"
          className="grid grid-cols-1 lg:grid-cols-2 gap-6"
        >
          {products.map((product, index) => (
            <ProductCard
              key={product.id}
              product={product}
              index={index}
              isUploading={isUploading && uploadingProductId === product.id}
              uploadProgress={
                uploadingProductId === product.id ? uploadProgress : 0
              }
              onCoverUpload={(file) => handleCoverUpload(product, file)}
              onDeleteCover={() => handleDeleteCover(product)}
              onSyncCoverFlag={() => handleSyncCoverFlag(product)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Product Card ──────────────────────────────────────────────────────────────

function ProductCard({
  product,
  index,
  isUploading,
  uploadProgress,
  onCoverUpload,
  onDeleteCover,
  onSyncCoverFlag,
}: {
  product: Product;
  index: number;
  isUploading: boolean;
  uploadProgress: number;
  onCoverUpload: (file: File) => void;
  onDeleteCover: () => void;
  onSyncCoverFlag: () => void;
}) {
  const coverInputRef = useRef<HTMLInputElement>(null);

  // The hasCustomImage flag is "stale" when it disagrees with whether a
  // frontCoverImagePath is set. The Sync button is only enabled when a repair
  // is actually needed; when the flag is already consistent it is disabled
  // and labelled to communicate that no action is required.
  const hasPath = Boolean(product.frontCoverImagePath);
  const flagStale = hasPath !== product.hasCustomImage;

  return (
    <div
      data-ocid={`product.card.${index + 1}`}
      className="border border-gray-200 rounded-xl p-6 flex flex-col"
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="w-9 h-9 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
          <span className="text-gray-600 font-semibold text-sm">
            {index + 1}
          </span>
        </div>
        <h3
          data-ocid={`product.title.${index + 1}`}
          className="text-lg font-semibold text-gray-900 min-w-0 truncate"
          title={product.title}
        >
          {product.title}
        </h3>
      </div>

      {/* Front Cover Management */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-3">
          <div>
            <h4 className="text-sm font-semibold text-gray-900">
              Front Cover Image
            </h4>
            <p className="text-xs text-gray-600">
              Used on the landing page for this product
            </p>
          </div>
          <button
            type="button"
            data-ocid={`product.upload_cover_button.${index + 1}`}
            onClick={() => coverInputRef.current?.click()}
            disabled={isUploading}
            className="bg-black text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isUploading ? "Uploading…" : "Upload Cover"}
          </button>
        </div>

        {/* Cover flag status + Sync cover flag action */}
        <div className="flex items-center justify-between gap-3 mb-3 p-3 rounded-lg bg-gray-50 border border-gray-100">
          <div className="min-w-0">
            <p className="text-xs font-medium text-gray-700">
              Cover flag status
            </p>
            <p className="text-xs text-gray-500 mt-0.5">
              {flagStale ? (
                <span className="text-amber-700 font-medium">
                  Stale — hasCustomImage is {String(product.hasCustomImage)} but
                  cover path {hasPath ? "is set" : "is missing"}
                </span>
              ) : (
                <span className="text-green-700">
                  In sync — hasCustomImage is {String(product.hasCustomImage)}
                </span>
              )}
            </p>
          </div>
          <button
            type="button"
            data-ocid={`product.sync_cover_flag_button.${index + 1}`}
            onClick={onSyncCoverFlag}
            disabled={isUploading || !flagStale}
            className="flex-shrink-0 px-3 py-2 rounded-lg text-sm font-medium border transition-colors disabled:opacity-50 disabled:cursor-not-allowed enabled:border-amber-300 enabled:text-amber-800 enabled:bg-amber-50 enabled:hover:bg-amber-100 border-gray-200 text-gray-500"
            title={
              flagStale
                ? "Repair the hasCustomImage flag to match the cover path state"
                : "Cover flag is already in sync"
            }
            aria-label={`Sync cover flag for ${product.title}`}
          >
            Sync cover flag
          </button>
        </div>

        <input
          ref={coverInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (file) {
              const convertedFile = await convertToWebP(file);
              onCoverUpload(convertedFile);
              if (coverInputRef.current) coverInputRef.current.value = "";
            }
          }}
          className="hidden"
        />

        {isUploading && uploadProgress > 0 && (
          <div className="mb-3">
            <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-black transition-all"
                style={{ width: `${Math.round(uploadProgress)}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {Math.round(uploadProgress)}%
            </p>
          </div>
        )}

        <CoverImageDisplay
          coverPath={product.frontCoverImagePath}
          onDelete={onDeleteCover}
        />
      </div>

      {/* Editable Fields */}
      <div className="space-y-3 mt-auto">
        <div>
          <label
            className="block text-xs font-medium text-gray-700 mb-1"
            htmlFor={`product-${index}-title`}
          >
            Title
          </label>
          <input
            id={`product-${index}-title`}
            type="text"
            value={product.title}
            readOnly
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 bg-gray-50 cursor-not-allowed"
          />
          <p className="text-xs text-gray-400 mt-1">
            Title is set by the backend book list
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label
              className="block text-xs font-medium text-gray-700 mb-1"
              htmlFor={`product-${index}-edition`}
            >
              Edition Type
            </label>
            <input
              id={`product-${index}-edition`}
              type="text"
              value={product.editionType}
              readOnly
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 bg-gray-50 cursor-not-allowed"
            />
          </div>
          <div>
            <label
              className="block text-xs font-medium text-gray-700 mb-1"
              htmlFor={`product-${index}-price`}
            >
              Price (€)
            </label>
            <input
              id={`product-${index}-price`}
              type="text"
              value={(Number(product.price) / 100).toFixed(2)}
              readOnly
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 bg-gray-50 cursor-not-allowed"
            />
          </div>
        </div>

        <div>
          <label
            className="block text-xs font-medium text-gray-700 mb-1"
            htmlFor={`product-${index}-description`}
          >
            Description
          </label>
          <textarea
            id={`product-${index}-description`}
            value={product.description}
            readOnly
            rows={3}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 bg-gray-50 cursor-not-allowed resize-none"
          />
        </div>
      </div>
    </div>
  );
}

// Cover Image Display Component
function CoverImageDisplay({
  coverPath,
  onDelete,
}: { coverPath: string | undefined; onDelete: () => void }) {
  const { data: coverUrl } = useFileUrl(coverPath || "");

  if (!coverPath) {
    return (
      <div
        data-ocid="product.cover_placeholder"
        className="w-full aspect-[3/4] max-w-sm bg-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300"
      >
        <div className="text-center text-gray-400 px-4">
          <svg
            className="w-16 h-16 mx-auto mb-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <p className="text-sm font-medium">No cover image yet</p>
          <p className="text-xs mt-1">
            Click “Upload Cover” to add a front cover for this product
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full aspect-[3/4] max-w-sm group">
      {coverUrl ? (
        <>
          <img
            src={coverUrl}
            alt="Front Cover"
            className="w-full h-full object-cover rounded-lg"
          />
          <button
            type="button"
            data-ocid="product.delete_cover_button"
            onClick={onDelete}
            className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
            title="Delete cover image"
            aria-label="Delete cover image"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </button>
        </>
      ) : (
        <div className="w-full h-full bg-gray-100 rounded-lg flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-black" />
        </div>
      )}
    </div>
  );
}

// ─── AdminAmazonRegionsManager ────────────────────────────────────────────────

const EMPTY_REGION: Omit<AmazonRegion, "id"> = {
  country: "",
  domain: "",
  kindleLink: "",
  paperbackLink: "",
  hardcoverLink: "",
  kindleButtonText: "Kindle e-Book",
  paperbackButtonText: "AMZ Paperback",
  hardcoverButtonText: "Special Ilustr. Hardcover",
  kindleButtonColor: "#FF9900",
  paperbackButtonColor: "#FF9900",
  hardcoverButtonColor: "#1a1a1a",
  kindleFontColor: "#000000",
  paperbackFontColor: "#000000",
  hardcoverFontColor: "#C9A84C",
  showKindleUnlimited: true,
  currencySymbol: "€",
  kindlePrice: "",
  paperbackPrice: "",
  hardcoverPrice: "",
  enabled: true,
};

export function AdminAmazonRegionsManager() {
  const queryClient = useQueryClient();
  const { data: regions = [], isLoading: regionsLoading } =
    useGetAmazonRegions();
  const updateRegion = useUpdateAmazonRegion();
  const addRegion = useAddAmazonRegion();
  const deleteRegion = useDeleteAmazonRegion();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<AmazonRegion | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [newDraft, setNewDraft] = useState<Omit<AmazonRegion, "id">>({
    ...EMPTY_REGION,
  });
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleToggleEnabled = async (id: string) => {
    const region = regions.find((r) => r.id === id);
    if (!region) return;
    try {
      setIsSaving(true);
      await updateRegion.mutateAsync({ ...region, enabled: !region.enabled });
      toast.success("Region updated");
    } catch {
      toast.error("Failed to save — please try again");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this region?")) return;
    try {
      setIsSaving(true);
      await deleteRegion.mutateAsync(id);
      toast.success("Region deleted");
    } catch {
      toast.error("Failed to delete — please try again");
    } finally {
      setIsSaving(false);
    }
  };

  const handleStartEdit = (region: AmazonRegion) => {
    setEditingId(region.id);
    setEditDraft({ ...region });
    setExpandedId(region.id);
  };

  const handleSaveEdit = async () => {
    if (!editDraft) return;
    try {
      setIsSaving(true);
      await updateRegion.mutateAsync(editDraft);
      toast.success("Region saved");
      setEditingId(null);
      setEditDraft(null);
    } catch {
      toast.error("Failed to save — please try again");
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddRegion = async () => {
    if (!newDraft.country.trim() || !newDraft.domain.trim()) {
      toast.error("Country and Domain are required");
      return;
    }
    const newRegion: AmazonRegion = {
      ...newDraft,
      id: `custom-${Date.now()}`,
    };
    try {
      setIsSaving(true);
      await addRegion.mutateAsync(newRegion);
      toast.success("Region added");
      setIsAdding(false);
      setNewDraft({ ...EMPTY_REGION });
    } catch {
      toast.error("Failed to add region — please try again");
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetToDefaults = async () => {
    if (
      !confirm(
        "Reset all regions to default? This will overwrite your customizations.",
      )
    )
      return;
    try {
      setIsSaving(true);
      // Delete all current regions then add defaults
      for (const r of regions) {
        await deleteRegion.mutateAsync(r.id);
      }
      for (const r of DEFAULT_AMAZON_REGIONS) {
        await addRegion.mutateAsync(r);
      }
      queryClient.invalidateQueries({ queryKey: ["amazonRegions"] });
      queryClient.refetchQueries({ queryKey: ["amazonRegions"] });
      toast.success("Reset to default regions");
    } catch {
      toast.error("Reset failed — please try again");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-yellow-50 rounded-xl flex items-center justify-center">
            <span className="text-2xl">🛒</span>
          </div>
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">
              Amazon Regions
            </h2>
            <p className="text-gray-600 text-sm">
              Configure purchase links per region/country
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleResetToDefaults}
            disabled={isSaving || regionsLoading}
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Reset Defaults
          </button>
          <button
            type="button"
            onClick={() => setIsAdding(true)}
            disabled={isSaving}
            className="px-4 py-2 bg-black text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-50"
          >
            + Add Region
          </button>
        </div>
      </div>

      {isSaving && (
        <div className="mb-4 flex items-center gap-2 text-sm text-gray-500">
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-300 border-t-black" />
          Saving to backend…
        </div>
      )}

      {regionsLoading && regions.length === 0 && (
        <div className="text-center py-8 text-gray-400 text-sm">
          Loading regions…
        </div>
      )}

      {isAdding && (
        <div className="mb-6 p-6 border-2 border-dashed border-black rounded-xl bg-gray-50">
          <h3 className="font-semibold text-gray-900 mb-4">New Region</h3>
          <RegionForm
            data={newDraft}
            onChange={(d) => setNewDraft(d as Omit<AmazonRegion, "id">)}
          />
          <div className="flex gap-2 mt-4">
            <button
              type="button"
              onClick={handleAddRegion}
              disabled={isSaving}
              className="px-4 py-2 bg-black text-white rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-50"
            >
              {isSaving ? "Saving…" : "Save Region"}
            </button>
            <button
              type="button"
              onClick={() => {
                setIsAdding(false);
                setNewDraft({ ...EMPTY_REGION });
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {regions.map((region) => (
          <div
            key={region.id}
            className={`border rounded-xl overflow-hidden ${region.enabled ? "border-gray-200" : "border-gray-100 opacity-60"}`}
          >
            <div className="flex items-center gap-3 p-4 bg-white">
              <button
                type="button"
                onClick={() =>
                  setExpandedId(expandedId === region.id ? null : region.id)
                }
                className="flex-1 text-left flex items-center gap-3 min-w-0"
              >
                <span
                  className={`w-2 h-2 rounded-full flex-shrink-0 ${region.enabled ? "bg-green-400" : "bg-gray-300"}`}
                />
                <div className="min-w-0">
                  <p className="font-medium text-gray-900 text-sm truncate">
                    {region.country || "—"}
                  </p>
                  <p className="text-xs text-gray-400 truncate">
                    {region.domain}
                  </p>
                </div>
                <svg
                  className={`w-4 h-4 ml-auto flex-shrink-0 text-gray-400 transition-transform ${expandedId === region.id ? "rotate-180" : ""}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => handleToggleEnabled(region.id)}
                  disabled={isSaving}
                  className={`px-2 py-1 rounded text-xs font-medium transition-colors disabled:opacity-50 ${region.enabled ? "bg-green-100 text-green-700 hover:bg-green-200" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}
                >
                  {region.enabled ? "On" : "Off"}
                </button>
                <button
                  type="button"
                  onClick={() => handleStartEdit(region)}
                  className="px-3 py-1 text-xs border border-gray-200 rounded text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(region.id)}
                  disabled={isSaving}
                  className="px-3 py-1 text-xs border border-red-200 rounded text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                >
                  Delete
                </button>
              </div>
            </div>

            {expandedId === region.id &&
              editingId === region.id &&
              editDraft && (
                <div className="border-t border-gray-100 p-6 bg-gray-50">
                  <RegionForm
                    data={editDraft}
                    onChange={(d) => setEditDraft(d as AmazonRegion)}
                  />
                  <div className="flex gap-2 mt-4">
                    <button
                      type="button"
                      onClick={handleSaveEdit}
                      disabled={isSaving}
                      className="px-4 py-2 bg-black text-white rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-50"
                    >
                      {isSaving ? "Saving…" : "Save Changes"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingId(null);
                        setEditDraft(null);
                      }}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

            {expandedId === region.id && editingId !== region.id && (
              <div className="border-t border-gray-100 p-4 bg-gray-50 grid grid-cols-2 md:grid-cols-3 gap-3 text-xs text-gray-700">
                <div>
                  <span className="font-medium text-gray-500">Kindle:</span>{" "}
                  {region.kindleLink || "—"}
                </div>
                <div>
                  <span className="font-medium text-gray-500">Paperback:</span>{" "}
                  {region.paperbackLink || "—"}
                </div>
                <div>
                  <span className="font-medium text-gray-500">Hardcover:</span>{" "}
                  {region.hardcoverLink || "—"}
                </div>
                <div>
                  <span className="font-medium text-gray-500">Currency:</span>{" "}
                  {region.currencySymbol}
                </div>
                <div>
                  <span className="font-medium text-gray-500">Prices:</span>{" "}
                  {region.kindlePrice} / {region.paperbackPrice} /{" "}
                  {region.hardcoverPrice}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function RegionForm({
  data,
  onChange,
}: {
  data: Partial<AmazonRegion>;
  onChange: (d: Partial<AmazonRegion>) => void;
}) {
  const field = (
    key: keyof AmazonRegion,
    label: string,
    type = "text",
    placeholder = "",
  ) => (
    <div key={key}>
      <label className="block text-xs font-medium text-gray-700 mb-1">
        {label}
      </label>
      <input
        type={type}
        value={String(data[key] ?? "")}
        onChange={(e) => onChange({ ...data, [key]: e.target.value })}
        placeholder={placeholder}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-black"
      />
    </div>
  );

  const colorField = (key: keyof AmazonRegion, label: string, def: string) => (
    <div key={key}>
      <label className="block text-xs font-medium text-gray-700 mb-1">
        {label}
      </label>
      <div className="flex gap-2 items-center">
        <input
          type="color"
          value={String(data[key] ?? def)}
          onChange={(e) => onChange({ ...data, [key]: e.target.value })}
          className="w-10 h-9 rounded border border-gray-300 cursor-pointer"
        />
        <input
          type="text"
          value={String(data[key] ?? def)}
          onChange={(e) => onChange({ ...data, [key]: e.target.value })}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-black"
        />
      </div>
    </div>
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {field("country", "Country Name *", "text", "e.g. Netherlands")}
      {field("domain", "Domain *", "text", "e.g. www.amazon.nl")}
      {field("kindleLink", "Kindle Link", "url")}
      {field("paperbackLink", "Paperback Link", "url")}
      {field("hardcoverLink", "Hardcover Link", "url")}
      {field("kindleButtonText", "Kindle Button Text")}
      {field("paperbackButtonText", "Paperback Button Text")}
      {field("hardcoverButtonText", "Hardcover Button Text")}
      {colorField(
        "kindleButtonColor",
        "Kindle Button Background Color",
        "#FF9900",
      )}
      {colorField("kindleFontColor", "Kindle Font Color", "#000000")}
      {colorField(
        "paperbackButtonColor",
        "Paperback Button Background Color",
        "#FF9900",
      )}
      {colorField("paperbackFontColor", "Paperback Font Color", "#000000")}
      {colorField(
        "hardcoverButtonColor",
        "Hardcover Button Background Color",
        "#1a1a1a",
      )}
      {colorField("hardcoverFontColor", "Hardcover Font Color", "#C9A84C")}
      {field("currencySymbol", "Currency Symbol", "text", "€")}
      {field("kindlePrice", "Kindle Price", "text", "4.99")}
      {field("paperbackPrice", "Paperback Price", "text", "10.99")}
      {field("hardcoverPrice", "Hardcover Price", "text", "69.99")}
      {/* Show Kindle Unlimited toggle */}
      <div className="md:col-span-2">
        <label className="flex items-center gap-3 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={Boolean(data.showKindleUnlimited)}
            onChange={(e) =>
              onChange({ ...data, showKindleUnlimited: e.target.checked })
            }
            className="w-4 h-4 rounded border-gray-300"
          />
          <span className="text-sm text-gray-700">
            Show "Free with KindleUnlimited!" text on Kindle button
          </span>
        </label>
      </div>
    </div>
  );
}

export function AdminAmazonRegionsByBook({
  bookKey,
  bookTitle,
}: {
  bookKey: string;
  bookTitle: string;
}) {
  const { data: regions = [], isLoading: regionsLoading } =
    useGetAmazonRegionsByBook(bookKey);
  const saveRegion = useSaveAmazonRegionForBook();
  const removeRegion = useRemoveAmazonRegionFromBook();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<AmazonRegion | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [newDraft, setNewDraft] = useState<Omit<AmazonRegion, "id">>({
    ...EMPTY_REGION,
  });
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleToggleEnabled = async (id: string) => {
    const region = regions.find((r) => r.id === id);
    if (!region) return;
    try {
      setIsSaving(true);
      await saveRegion.mutateAsync({
        bookKey,
        region: { ...region, enabled: !region.enabled },
      });
      toast.success("Region updated");
    } catch {
      toast.error("Failed to save — please try again");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this region?")) return;
    try {
      setIsSaving(true);
      await removeRegion.mutateAsync({ bookKey, regionId: id });
      toast.success("Region deleted");
    } catch {
      toast.error("Failed to delete — please try again");
    } finally {
      setIsSaving(false);
    }
  };

  const handleStartEdit = (region: AmazonRegion) => {
    setEditingId(region.id);
    setEditDraft({ ...region });
    setExpandedId(region.id);
  };

  const handleSaveEdit = async () => {
    if (!editDraft) return;
    try {
      setIsSaving(true);
      await saveRegion.mutateAsync({ bookKey, region: editDraft });
      toast.success("Region saved");
      setEditingId(null);
      setEditDraft(null);
    } catch {
      toast.error("Failed to save — please try again");
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddRegion = async () => {
    if (!newDraft.country.trim() || !newDraft.domain.trim()) {
      toast.error("Country and Domain are required");
      return;
    }
    const newRegion: AmazonRegion = {
      ...newDraft,
      id: `${bookKey}-${Date.now()}`,
    };
    try {
      setIsSaving(true);
      await saveRegion.mutateAsync({ bookKey, region: newRegion });
      toast.success("Region added");
      setIsAdding(false);
      setNewDraft({ ...EMPTY_REGION });
    } catch {
      toast.error("Failed to add region — please try again");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-yellow-50 rounded-xl flex items-center justify-center">
            <span className="text-2xl">🛒</span>
          </div>
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">
              Amazon Regions — {bookTitle}
            </h2>
            <p className="text-gray-600 text-sm">
              Configure purchase links per region/country for {bookTitle}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setIsAdding(true)}
          disabled={isSaving}
          className="px-4 py-2 bg-black text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-50"
        >
          + Add Region
        </button>
      </div>

      {isSaving && (
        <div className="mb-4 flex items-center gap-2 text-sm text-gray-500">
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-300 border-t-black" />
          Saving to backend…
        </div>
      )}

      {regionsLoading && regions.length === 0 && (
        <div className="text-center py-8 text-gray-400 text-sm">
          Loading regions…
        </div>
      )}

      {isAdding && (
        <div className="mb-6 p-6 border-2 border-dashed border-black rounded-xl bg-gray-50">
          <h3 className="font-semibold text-gray-900 mb-4">New Region</h3>
          <RegionForm
            data={newDraft}
            onChange={(d) => setNewDraft(d as Omit<AmazonRegion, "id">)}
          />
          <div className="flex gap-2 mt-4">
            <button
              type="button"
              onClick={handleAddRegion}
              disabled={isSaving}
              className="px-4 py-2 bg-black text-white rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-50"
            >
              {isSaving ? "Saving…" : "Save Region"}
            </button>
            <button
              type="button"
              onClick={() => {
                setIsAdding(false);
                setNewDraft({ ...EMPTY_REGION });
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {regions.length === 0 && !regionsLoading && !isAdding && (
        <div className="text-center py-12 text-gray-400">
          <p className="text-4xl mb-4">🌍</p>
          <p className="font-medium text-gray-600">No regions yet</p>
          <p className="text-sm mt-1">
            Add regions for {bookTitle} Amazon links
          </p>
        </div>
      )}

      <div className="space-y-3">
        {regions.map((region) => (
          <div
            key={region.id}
            className="border border-gray-200 rounded-xl overflow-hidden"
          >
            <div className="flex items-center p-4 hover:bg-gray-50 transition-colors">
              <button
                type="button"
                onClick={() =>
                  setExpandedId(expandedId === region.id ? null : region.id)
                }
                className="flex-1 flex items-center gap-3 text-left min-w-0"
              >
                <span
                  className={`w-2 h-2 rounded-full flex-shrink-0 ${region.enabled ? "bg-green-400" : "bg-gray-300"}`}
                />
                <span className="font-medium text-gray-900 truncate">
                  {region.country}
                </span>
                <span className="text-sm text-gray-500 flex-shrink-0">
                  {region.domain}
                </span>
                <svg
                  className="w-4 h-4 text-gray-400 ml-auto flex-shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => handleToggleEnabled(region.id)}
                  disabled={isSaving}
                  className={`px-2 py-1 rounded text-xs font-medium transition-colors disabled:opacity-50 ${
                    region.enabled
                      ? "bg-green-100 text-green-700 hover:bg-green-200"
                      : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                  }`}
                >
                  {region.enabled ? "On" : "Off"}
                </button>
                <button
                  type="button"
                  onClick={() => handleStartEdit(region)}
                  className="px-3 py-1 text-xs border border-gray-200 rounded text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(region.id)}
                  disabled={isSaving}
                  className="px-3 py-1 text-xs border border-red-200 rounded text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                >
                  Delete
                </button>
              </div>
            </div>

            {expandedId === region.id &&
              editingId === region.id &&
              editDraft && (
                <div className="border-t border-gray-100 p-6 bg-gray-50">
                  <RegionForm
                    data={editDraft}
                    onChange={(d) => setEditDraft(d as AmazonRegion)}
                  />
                  <div className="flex gap-2 mt-4">
                    <button
                      type="button"
                      onClick={handleSaveEdit}
                      disabled={isSaving}
                      className="px-4 py-2 bg-black text-white rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-50"
                    >
                      {isSaving ? "Saving…" : "Save Changes"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingId(null);
                        setEditDraft(null);
                      }}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

            {expandedId === region.id && editingId !== region.id && (
              <div className="border-t border-gray-100 p-4 bg-gray-50 grid grid-cols-2 md:grid-cols-3 gap-3 text-xs text-gray-700">
                <div>
                  <span className="font-medium text-gray-500">Kindle:</span>{" "}
                  {region.kindleLink || "—"}
                </div>
                <div>
                  <span className="font-medium text-gray-500">Paperback:</span>{" "}
                  {region.paperbackLink || "—"}
                </div>
                <div>
                  <span className="font-medium text-gray-500">Hardcover:</span>{" "}
                  {region.hardcoverLink || "—"}
                </div>
                <div>
                  <span className="font-medium text-gray-500">Currency:</span>{" "}
                  {region.currencySymbol}
                </div>
                <div>
                  <span className="font-medium text-gray-500">Prices:</span>{" "}
                  {region.kindlePrice} / {region.paperbackPrice} /{" "}
                  {region.hardcoverPrice}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
