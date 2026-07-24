import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Edit, Plus, Trash2 } from "lucide-react";
import React, { useState } from "react";
import { toast } from "sonner";
import type { ArtProduct } from "../backend";
import {
  useFileDelete,
  useFileUpload,
  useFileUrl,
} from "../blob-storage/FileStorage";
import { useActor } from "../hooks/useActor";
import { convertToWebP } from "../utils/imageConverter";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

export default function AdminArtProductsManager() {
  const { actor, isFetching } = useActor();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ArtProduct | null>(null);
  const [formData, setFormData] = useState<{
    title: string;
    purchaseLink: string;
    imageFile: File | null;
  }>({
    title: "",
    purchaseLink: "",
    imageFile: null,
  });

  const { data: artProducts, isLoading } = useQuery<ArtProduct[]>({
    queryKey: ["artProducts"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getArtProducts();
    },
    enabled: !!actor && !isFetching,
  });

  const { uploadFile, isUploading } = useFileUpload();
  const { deleteFile } = useFileDelete();

  const addArtProductMutation = useMutation({
    mutationFn: async (product: ArtProduct) => {
      if (!actor) throw new Error("Actor not available");
      return actor.addArtProduct(product);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["artProducts"] });
      toast.success("Art product added successfully");
    },
    onError: (error) => {
      toast.error(
        `Failed to add art product: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    },
  });

  const updateArtProductMutation = useMutation({
    mutationFn: async (product: ArtProduct) => {
      if (!actor) throw new Error("Actor not available");
      return actor.updateArtProduct(product);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["artProducts"] });
      toast.success("Art product updated successfully");
    },
    onError: (error) => {
      toast.error(
        `Failed to update art product: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    },
  });

  const deleteArtProductMutation = useMutation({
    mutationFn: async (productId: string) => {
      if (!actor) throw new Error("Actor not available");
      return actor.deleteArtProduct(productId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["artProducts"] });
      toast.success("Art product deleted successfully");
    },
    onError: (error) => {
      toast.error(
        `Failed to delete art product: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    },
  });

  const handleOpenDialog = (product?: ArtProduct) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        title: product.title,
        purchaseLink: product.purchaseLink,
        imageFile: null,
      });
    } else {
      setEditingProduct(null);
      setFormData({
        title: "",
        purchaseLink: "",
        imageFile: null,
      });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingProduct(null);
    setFormData({
      title: "",
      purchaseLink: "",
      imageFile: null,
    });
  };

  const handleSave = async () => {
    if (!formData.title.trim() || !formData.purchaseLink.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      let imagePath = editingProduct?.imagePath;

      if (formData.imageFile) {
        const fileName = `art-product-${Date.now()}-${formData.imageFile.name}`;
        const uploadResult = await uploadFile(fileName, formData.imageFile);
        imagePath = uploadResult.path;
      }

      const productData: ArtProduct = {
        id: editingProduct?.id || `art-${Date.now()}`,
        title: formData.title,
        purchaseLink: formData.purchaseLink,
        imagePath: imagePath || undefined,
      };

      if (editingProduct) {
        await updateArtProductMutation.mutateAsync(productData);
      } else {
        await addArtProductMutation.mutateAsync(productData);
      }

      handleCloseDialog();
    } catch (error) {
      console.error("Error saving art product:", error);
      toast.error("Failed to save art product");
    }
  };

  const handleDelete = async (product: ArtProduct) => {
    if (!confirm("Are you sure you want to delete this art product?")) {
      return;
    }

    try {
      if (product.imagePath) {
        await deleteFile(product.imagePath);
      }
      await deleteArtProductMutation.mutateAsync(product.id);
    } catch (error) {
      console.error("Error deleting art product:", error);
      toast.error("Failed to delete art product");
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-black" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Art Products Manager
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Manage art products displayed on the homepage
          </p>
        </div>
        <Button
          onClick={() => handleOpenDialog()}
          className="bg-black hover:bg-gray-800"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Art Product
        </Button>
      </div>

      {/* Art Products List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {artProducts?.map((product) => (
          <ArtProductItem
            key={product.id}
            product={product}
            onEdit={() => handleOpenDialog(product)}
            onDelete={() => handleDelete(product)}
          />
        ))}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-white max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingProduct ? "Edit Art Product" : "Add Art Product"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                placeholder="Art Piece from The Gospel of Poetic Frolic"
              />
            </div>

            <div>
              <Label htmlFor="purchaseLink">Purchase Link</Label>
              <Input
                id="purchaseLink"
                value={formData.purchaseLink}
                onChange={(e) =>
                  setFormData({ ...formData, purchaseLink: e.target.value })
                }
                placeholder="https://www.paypal.com/..."
              />
            </div>

            <div>
              <Label htmlFor="image">Product Image</Label>
              <Input
                id="image"
                type="file"
                accept="image/*"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const convertedFile = await convertToWebP(file);
                    setFormData({ ...formData, imageFile: convertedFile });
                  }
                }}
              />
              {editingProduct?.imagePath && !formData.imageFile && (
                <p className="text-xs text-gray-500 mt-1">
                  Current image will be kept if no new image is selected
                </p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={isUploading}
              className="bg-black hover:bg-gray-800"
            >
              {isUploading ? "Uploading..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface ArtProductItemProps {
  product: ArtProduct;
  onEdit: () => void;
  onDelete: () => void;
}

function ArtProductItem({ product, onEdit, onDelete }: ArtProductItemProps) {
  const shouldFetchImage = !!product.imagePath;
  const { data: imageUrl } = useFileUrl(
    shouldFetchImage ? product.imagePath || "" : "",
  );

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200">
      <div className="aspect-square bg-gray-100 relative">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={product.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-6xl text-gray-400">?</div>
          </div>
        )}
      </div>

      <div className="p-4">
        <h3 className="font-semibold text-gray-900 mb-2 truncate">
          {product.title}
        </h3>
        <p className="text-xs text-gray-500 mb-3 truncate">
          {product.purchaseLink}
        </p>

        <div className="flex gap-2">
          <Button
            onClick={onEdit}
            variant="outline"
            size="sm"
            className="flex-1"
          >
            <Edit className="w-4 h-4 mr-1" />
            Edit
          </Button>
          <Button
            onClick={onDelete}
            variant="outline"
            size="sm"
            className="text-red-600 hover:text-red-700"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
