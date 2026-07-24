import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus, Trash2, Upload } from "lucide-react";
import React, { useState } from "react";
import { toast } from "sonner";
import type { ReviewMilestone } from "../backend";
import {
  useFileDelete,
  useFileUpload,
  useFileUrl,
} from "../blob-storage/FileStorage";
import { useActor } from "../hooks/useActor";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

export default function AdminRoadmapManager() {
  const { actor, isFetching } = useActor();
  const queryClient = useQueryClient();
  const { uploadFile, isUploading } = useFileUpload();
  const { deleteFile } = useFileDelete();
  const [uploadingMilestone, setUploadingMilestone] = useState<number | null>(
    null,
  );
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newMilestoneNumber, setNewMilestoneNumber] = useState("");

  // Fetch review milestones
  const { data: milestones, isLoading } = useQuery<ReviewMilestone[]>({
    queryKey: ["roadmapMilestones"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getReviewMilestones();
    },
    enabled: !!actor && !isFetching,
  });

  // Update milestone mutation
  const updateMilestone = useMutation({
    mutationFn: async (milestone: ReviewMilestone) => {
      if (!actor) throw new Error("Actor not available");
      return actor.updateReviewMilestone(milestone);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roadmapMilestones"] });
    },
    onError: (error) => {
      console.error("Failed to update milestone:", error);
      toast.error("Failed to update milestone");
    },
  });

  // Add milestone mutation
  const addMilestone = useMutation({
    mutationFn: async (milestone: ReviewMilestone) => {
      if (!actor) throw new Error("Actor not available");
      return actor.addReviewMilestone(milestone);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roadmapMilestones"] });
    },
    onError: (error) => {
      console.error("Failed to add milestone:", error);
      toast.error("Failed to add milestone");
    },
  });

  // Delete milestone mutation
  const deleteMilestone = useMutation({
    mutationFn: async (milestoneNumber: number) => {
      if (!actor) throw new Error("Actor not available");
      return actor.deleteReviewMilestone(BigInt(milestoneNumber));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roadmapMilestones"] });
      toast.success("Milestone deleted successfully");
    },
    onError: (error) => {
      console.error("Failed to delete milestone:", error);
      toast.error("Failed to delete milestone");
    },
  });

  const handleAddMilestone = async () => {
    const milestoneNum = Number.parseInt(newMilestoneNumber);

    if (Number.isNaN(milestoneNum) || milestoneNum <= 0) {
      toast.error("Please enter a valid positive number");
      return;
    }

    if (milestoneNum > 250) {
      toast.error("Milestone number cannot exceed 250");
      return;
    }

    // Check if milestone already exists
    const exists = milestones?.some(
      (m) => Number(m.milestone) === milestoneNum,
    );
    if (exists) {
      toast.error("This milestone already exists");
      return;
    }

    try {
      await addMilestone.mutateAsync({
        milestone: BigInt(milestoneNum),
        prizeImagePath: undefined,
      });
      toast.success(`Milestone ${milestoneNum} added successfully`);
      setNewMilestoneNumber("");
      setIsAddDialogOpen(false);
    } catch (error) {
      console.error("Failed to add milestone:", error);
    }
  };

  const handleImageUpload = async (milestone: number, file: File) => {
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

    const toastId = toast.loading("Preparing upload...", {
      description: "Initializing...",
    });

    try {
      setUploadingMilestone(milestone);
      setUploadProgress(0);

      // Upload image to blob storage with progress tracking
      const timestamp = Date.now();
      const extension = file.name.split(".").pop();
      const imagePath = `roadmap/milestone-${milestone}-${timestamp}.${extension}`;

      toast.loading("Uploading prize image...", {
        id: toastId,
        description: "0%",
      });

      // Upload file with progress callback
      const uploadResult = await uploadFile(imagePath, file, (progress) => {
        setUploadProgress(progress);
        toast.loading("Uploading prize image...", {
          id: toastId,
          description: `${Math.round(progress)}%`,
        });
      });

      // Verify upload was successful - uploadResult has { path, hash, url }
      if (!uploadResult || !uploadResult.url) {
        throw new Error("Upload failed: No file URL returned");
      }

      toast.loading("Finalizing upload...", {
        id: toastId,
        description: "Updating milestone data...",
      });

      // Invalidate file list query to refresh cache
      await queryClient.invalidateQueries({ queryKey: ["fileList"] });

      // Small delay to ensure backend has processed the file
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Update or add milestone with new image path
      const existingMilestone = milestones?.find(
        (m) => Number(m.milestone) === milestone,
      );

      if (existingMilestone) {
        await updateMilestone.mutateAsync({
          milestone: BigInt(milestone),
          prizeImagePath: imagePath,
        });
      } else {
        await addMilestone.mutateAsync({
          milestone: BigInt(milestone),
          prizeImagePath: imagePath,
        });
      }

      // Force refetch of milestones
      await queryClient.refetchQueries({ queryKey: ["roadmapMilestones"] });

      toast.success("Prize image uploaded successfully", {
        id: toastId,
        description: `Milestone ${milestone} updated`,
      });
    } catch (error) {
      console.error("Failed to upload image:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to upload prize image";

      // Provide more helpful error messages
      let userMessage = errorMessage;
      let description = "";

      if (
        errorMessage.includes("403") ||
        errorMessage.includes("Unauthorized") ||
        errorMessage.includes("Only admins")
      ) {
        userMessage = "Authorization failed";
        description = "Please ensure you are logged in as admin and try again";
      } else if (
        errorMessage.includes("network") ||
        errorMessage.includes("timeout")
      ) {
        userMessage = "Network error";
        description = "Please check your connection and try again";
      } else if (errorMessage.includes("No file URL")) {
        userMessage = "Upload incomplete";
        description = "The file was not properly uploaded, please try again";
      }

      toast.error(userMessage, {
        id: toastId,
        description: description || errorMessage,
      });
    } finally {
      setUploadingMilestone(null);
      setUploadProgress(0);
    }
  };

  const handleImageDelete = async (milestone: number, imagePath: string) => {
    if (!confirm("Are you sure you want to delete this prize image?")) {
      return;
    }

    const toastId = toast.loading("Deleting prize image...");

    try {
      // Delete image from blob storage
      await deleteFile(imagePath);

      // Invalidate file list query
      await queryClient.invalidateQueries({ queryKey: ["fileList"] });

      // Update milestone to remove image path
      await updateMilestone.mutateAsync({
        milestone: BigInt(milestone),
        prizeImagePath: undefined,
      });

      toast.success("Prize image deleted", { id: toastId });
    } catch (error) {
      console.error("Failed to delete image:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to delete prize image";
      toast.error("Delete failed", {
        id: toastId,
        description: errorMessage,
      });
    }
  };

  const handleDeleteMilestone = async (milestone: number) => {
    if (
      !confirm(
        `Are you sure you want to delete the ${milestone} review milestone? This will also remove any associated prize image.`,
      )
    ) {
      return;
    }

    const milestoneData = milestones?.find(
      (m) => Number(m.milestone) === milestone,
    );

    try {
      // If there's an image, delete it first
      if (milestoneData?.prizeImagePath) {
        await deleteFile(milestoneData.prizeImagePath);
        await queryClient.invalidateQueries({ queryKey: ["fileList"] });
      }

      // Delete the milestone
      await deleteMilestone.mutateAsync(milestone);
    } catch (error) {
      console.error("Failed to delete milestone:", error);
    }
  };

  // Sort milestones by number
  const sortedMilestones = milestones
    ? [...milestones].sort((a, b) => Number(a.milestone) - Number(b.milestone))
    : [];

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center">
          <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mr-4">
            <span className="text-gray-900 text-xl">🎯</span>
          </div>
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">
              Review Milestone Manager
            </h2>
            <p className="text-gray-600">
              Manage review milestones and prize images
            </p>
          </div>
        </div>

        {/* Add Milestone Button */}
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-black hover:bg-gray-800 text-white">
              <Plus className="w-4 h-4 mr-2" />
              Add Milestone
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-white">
            <DialogHeader>
              <DialogTitle>Add New Review Milestone</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="milestone-number">Milestone Number</Label>
                <Input
                  id="milestone-number"
                  type="number"
                  placeholder="e.g., 10, 50, 100, 250"
                  value={newMilestoneNumber}
                  onChange={(e) => setNewMilestoneNumber(e.target.value)}
                  min="1"
                  max="250"
                  step="1"
                />
                <p className="text-sm text-gray-500">
                  Enter the number of reviews for this milestone (max 250)
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsAddDialogOpen(false);
                  setNewMilestoneNumber("");
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddMilestone}
                disabled={addMilestone.isPending}
                className="bg-black hover:bg-gray-800 text-white"
              >
                {addMilestone.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Adding...
                  </>
                ) : (
                  "Add Milestone"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {sortedMilestones.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">
            No milestones yet. Add your first milestone to get started!
          </p>
          <Button
            onClick={() => setIsAddDialogOpen(true)}
            className="bg-black hover:bg-gray-800 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add First Milestone
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedMilestones.map((milestone) => (
            <MilestoneUploadCard
              key={Number(milestone.milestone)}
              milestone={Number(milestone.milestone)}
              prizeImagePath={milestone.prizeImagePath}
              onUpload={handleImageUpload}
              onDelete={handleImageDelete}
              onDeleteMilestone={handleDeleteMilestone}
              isUploading={uploadingMilestone === Number(milestone.milestone)}
              uploadProgress={
                uploadingMilestone === Number(milestone.milestone)
                  ? uploadProgress
                  : 0
              }
            />
          ))}
        </div>
      )}

      <div className="mt-8 p-4 bg-gray-50 rounded-xl">
        <h4 className="font-semibold text-gray-800 mb-2">Guidelines:</h4>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>
            • Click "Add Milestone" to create a new review milestone (max 250)
          </li>
          <li>• Upload prize images for each milestone independently</li>
          <li>• Supported formats: JPEG, PNG, WebP (max 5MB per image)</li>
          <li>
            • Recommended dimensions: 300x300 pixels or larger (square format)
          </li>
          <li>
            • Images will be displayed on the roadmap section of the homepage
          </li>
          <li>
            • Delete a milestone to remove it completely along with its image
          </li>
          <li>• Ensure you are logged in as admin before uploading</li>
        </ul>
      </div>
    </div>
  );
}

interface MilestoneUploadCardProps {
  milestone: number;
  prizeImagePath?: string;
  onUpload: (milestone: number, file: File) => Promise<void>;
  onDelete: (milestone: number, imagePath: string) => Promise<void>;
  onDeleteMilestone: (milestone: number) => Promise<void>;
  isUploading: boolean;
  uploadProgress: number;
}

function MilestoneUploadCard({
  milestone,
  prizeImagePath,
  onUpload,
  onDelete,
  onDeleteMilestone,
  isUploading,
  uploadProgress,
}: MilestoneUploadCardProps) {
  const { data: imageUrl } = useFileUrl(prizeImagePath || "");
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await onUpload(milestone, file);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <div className="bg-gray-50 rounded-xl p-6 border border-gray-200 relative">
      {/* Delete Milestone Button */}
      <button
        onClick={() => onDeleteMilestone(milestone)}
        className="absolute top-2 right-2 p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        title="Delete this milestone"
        disabled={isUploading}
      >
        <Trash2 className="w-4 h-4" />
      </button>

      <div className="text-center mb-4 mt-2">
        <div className="text-2xl font-bold text-black mb-1">
          {milestone.toLocaleString()}
        </div>
        <div className="text-sm text-gray-600">Review Milestone</div>
      </div>

      {/* Image Preview */}
      <div className="w-full aspect-square bg-white rounded-lg overflow-hidden mb-4 border border-gray-200">
        {prizeImagePath && imageUrl ? (
          <img
            src={imageUrl}
            alt={`Prize for ${milestone} reviews`}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <Upload className="w-12 h-12" />
          </div>
        )}
      </div>

      {/* Upload Progress */}
      {isUploading && (
        <div className="mb-4">
          <div className="bg-gray-200 rounded-full h-2 mb-2">
            <div
              className="bg-black h-2 rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
          <p className="text-xs text-gray-600 text-center">
            Uploading... {Math.round(uploadProgress)}%
          </p>
        </div>
      )}

      {/* Upload/Delete Buttons */}
      <div className="space-y-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
          id={`milestone-${milestone}-upload`}
          disabled={isUploading}
        />
        <Label htmlFor={`milestone-${milestone}-upload`}>
          <Button
            type="button"
            variant="outline"
            className="w-full"
            disabled={isUploading}
            onClick={() => fileInputRef.current?.click()}
            asChild
          >
            <span>
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  {prizeImagePath ? "Replace Image" : "Upload Image"}
                </>
              )}
            </span>
          </Button>
        </Label>

        {prizeImagePath && !isUploading && (
          <Button
            type="button"
            variant="destructive"
            className="w-full"
            onClick={() => onDelete(milestone, prizeImagePath)}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete Image
          </Button>
        )}
      </div>
    </div>
  );
}
