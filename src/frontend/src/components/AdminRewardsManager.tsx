import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Edit, Loader2, Plus, Trash2, Upload, X } from "lucide-react";
import type React from "react";
import { useState } from "react";
import { toast } from "sonner";
import {
  type RewardFull,
  type RewardInput,
  Variant_referral_other_points,
  Variant_retail_social,
} from "../backend";
import { useFileUpload, useFileUrl } from "../blob-storage/FileStorage";
import { useActor } from "../hooks/useActor";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Textarea } from "./ui/textarea";

interface AdminRewardsManagerProps {
  pageType: "retail" | "social";
}

export default function AdminRewardsManager({
  pageType,
}: AdminRewardsManagerProps) {
  const { actor, isFetching } = useActor();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingReward, setEditingReward] = useState<RewardFull | null>(null);
  const [formData, setFormData] = useState({
    amount: "",
    description: "",
    rewardType: "points" as "points" | "referral" | "other",
    photoPath: null as string | null,
    availableCount: "",
    claimEmail: "",
  });
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const { uploadFile, isUploading } = useFileUpload();

  const queryKey = pageType === "retail" ? "retailRewards" : "socialRewards";

  // Fetch rewards
  const { data: rewards, isLoading } = useQuery<RewardFull[]>({
    queryKey: [queryKey],
    queryFn: async () => {
      if (!actor) return [];
      return pageType === "retail"
        ? actor.getRetailRewards()
        : actor.getSocialRewards();
    },
    enabled: !!actor && !isFetching,
  });

  // Add reward mutation
  const addReward = useMutation({
    mutationFn: async (reward: RewardInput) => {
      if (!actor) throw new Error("Actor not available");
      return actor.addReward(reward);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKey] });
      toast.success("Reward added successfully");
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      console.error("Failed to add reward:", error);
      toast.error("Failed to add reward");
    },
  });

  // Update reward mutation
  const updateReward = useMutation({
    mutationFn: async (reward: RewardInput) => {
      if (!actor) throw new Error("Actor not available");
      return actor.updateReward(reward);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKey] });
      toast.success("Reward updated successfully");
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      console.error("Failed to update reward:", error);
      toast.error("Failed to update reward");
    },
  });

  // Delete reward mutation
  const deleteReward = useMutation({
    mutationFn: async (rewardId: string) => {
      if (!actor) throw new Error("Actor not available");
      return actor.deleteReward(rewardId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKey] });
      toast.success("Reward deleted successfully");
    },
    onError: (error) => {
      console.error("Failed to delete reward:", error);
      toast.error("Failed to delete reward");
    },
  });

  const resetForm = () => {
    setFormData({
      amount: "",
      description: "",
      rewardType: "points",
      photoPath: null,
      availableCount: "",
      claimEmail: "",
    });
    setEditingReward(null);
    setPhotoFile(null);
    setPhotoPreview(null);
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemovePhoto = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
    setFormData({ ...formData, photoPath: null });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.amount || !formData.description) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      let photoPath = formData.photoPath;

      // Upload photo if a new file is selected
      if (photoFile) {
        const rewardPhotoPath = `rewards/${pageType}/${Date.now()}-${photoFile.name}`;
        const uploadResult = await uploadFile(rewardPhotoPath, photoFile);
        photoPath = uploadResult.path;
      }

      const reward: RewardInput = {
        id: editingReward?.id || `${Date.now()}`,
        amount: BigInt(formData.amount),
        description: formData.description,
        rewardType: Variant_referral_other_points[formData.rewardType],
        pageType:
          pageType === "retail"
            ? Variant_retail_social.retail
            : Variant_retail_social.social,
        photoPath: photoPath || undefined,
        availableCount:
          formData.availableCount.trim() !== ""
            ? BigInt(formData.availableCount)
            : undefined,
        claimEmail:
          formData.claimEmail.trim() !== ""
            ? formData.claimEmail.trim()
            : undefined,
      };

      if (editingReward) {
        await updateReward.mutateAsync(reward);
      } else {
        await addReward.mutateAsync(reward);
      }
    } catch (error) {
      console.error("Failed to save reward:", error);
      toast.error("Failed to save reward");
    }
  };

  const handleEdit = (reward: RewardFull) => {
    setEditingReward(reward);
    // Convert enum value to string key
    let rewardTypeKey: "points" | "referral" | "other" = "points";
    if (reward.rewardType === Variant_referral_other_points.points) {
      rewardTypeKey = "points";
    } else if (reward.rewardType === Variant_referral_other_points.referral) {
      rewardTypeKey = "referral";
    } else if (reward.rewardType === Variant_referral_other_points.other) {
      rewardTypeKey = "other";
    }

    setFormData({
      amount: reward.amount.toString(),
      description: reward.description,
      rewardType: rewardTypeKey,
      photoPath: reward.photoPath || null,
      availableCount:
        reward.availableCount != null ? reward.availableCount.toString() : "",
      claimEmail: reward.claimEmail ?? "",
    });
    setPhotoFile(null);
    setPhotoPreview(null);
    setIsDialogOpen(true);
  };

  const handleDelete = async (reward: RewardFull) => {
    if (confirm("Are you sure you want to delete this reward?")) {
      await deleteReward.mutateAsync(reward.id);
    }
  };

  const sortedRewards =
    rewards?.sort((a, b) => Number(a.amount) - Number(b.amount)) || [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-semibold text-gray-900">
          {pageType === "retail" ? "Retail" : "Social"} Rewards
        </h3>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                resetForm();
                setIsDialogOpen(true);
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Reward
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-white">
            <DialogHeader>
              <DialogTitle>{editingReward ? "Edit" : "Add"} Reward</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="amount">Points Amount *</Label>
                <Input
                  id="amount"
                  type="number"
                  value={formData.amount}
                  onChange={(e) =>
                    setFormData({ ...formData, amount: e.target.value })
                  }
                  placeholder="Enter points amount"
                  required
                />
              </div>
              <div>
                <Label htmlFor="rewardType">Reward Type *</Label>
                <Select
                  value={formData.rewardType}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      rewardType: value as "points" | "referral" | "other",
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select reward type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="points">Points</SelectItem>
                    <SelectItem value="referral">Referral</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Enter reward description"
                  rows={3}
                  required
                />
              </div>
              <div>
                <Label htmlFor="availableCount">
                  Available gift cards (optional)
                </Label>
                <Input
                  id="availableCount"
                  type="number"
                  min="0"
                  value={formData.availableCount}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      availableCount: e.target.value,
                    })
                  }
                  placeholder="Leave empty for no limit shown"
                />
              </div>
              <div>
                <Label htmlFor="claimEmail">
                  Claim request email (optional)
                </Label>
                <Input
                  id="claimEmail"
                  type="email"
                  value={formData.claimEmail}
                  onChange={(e) =>
                    setFormData({ ...formData, claimEmail: e.target.value })
                  }
                  placeholder="tgopf@pm.me"
                />
              </div>
              <div>
                <Label htmlFor="photo">Reward Photo</Label>
                <div className="mt-2">
                  {photoPreview || formData.photoPath ? (
                    <div className="relative inline-block">
                      <PhotoPreview
                        photoPath={formData.photoPath}
                        photoPreview={photoPreview}
                      />
                      <button
                        type="button"
                        onClick={handleRemovePhoto}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <label
                      htmlFor="photo"
                      className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100"
                    >
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Upload className="w-8 h-8 mb-2 text-gray-400" />
                        <p className="text-sm text-gray-500">
                          Click to upload photo
                        </p>
                      </div>
                      <input
                        id="photo"
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={handlePhotoChange}
                      />
                    </label>
                  )}
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={
                    addReward.isPending || updateReward.isPending || isUploading
                  }
                >
                  {addReward.isPending ||
                  updateReward.isPending ||
                  isUploading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save"
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {sortedRewards.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-xl">
          <p className="text-gray-500">
            No rewards yet. Add your first reward!
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {sortedRewards.map((reward) => (
            <RewardCard
              key={reward.id}
              reward={reward}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface PhotoPreviewProps {
  photoPath: string | null;
  photoPreview: string | null;
}

function PhotoPreview({ photoPath, photoPreview }: PhotoPreviewProps) {
  const { data: photoUrl } = useFileUrl(photoPath || "");

  const displayUrl = photoPreview || photoUrl;

  if (!displayUrl) {
    return (
      <div className="w-24 h-24 bg-gray-200 rounded-lg flex items-center justify-center">
        <span className="text-gray-400 text-2xl">?</span>
      </div>
    );
  }

  return (
    <img
      src={displayUrl}
      alt="Reward preview"
      className="w-24 h-24 object-cover rounded-lg border-2 border-gray-300"
    />
  );
}

interface RewardCardProps {
  reward: RewardFull;
  onEdit: (reward: RewardFull) => void;
  onDelete: (reward: RewardFull) => void;
}

function RewardCard({ reward, onEdit, onDelete }: RewardCardProps) {
  const { data: photoUrl } = useFileUrl(reward.photoPath || "");

  const getRewardIcon = (type: Variant_referral_other_points) => {
    if (type === Variant_referral_other_points.points) return "💰";
    if (type === Variant_referral_other_points.referral) return "🤝";
    return "🎁";
  };

  return (
    <div className="flex items-start justify-between p-4 bg-gray-50 rounded-xl border border-gray-200">
      <div className="flex items-start space-x-4">
        {reward.photoPath && photoUrl ? (
          <img
            src={photoUrl}
            alt="Reward"
            className="w-16 h-16 object-cover rounded-lg border-2 border-gray-300"
          />
        ) : (
          <div className="text-3xl">{getRewardIcon(reward.rewardType)}</div>
        )}
        <div>
          <div className="font-semibold text-lg">
            {Number(reward.amount).toLocaleString()} Points
          </div>
          <div className="text-sm text-gray-600 mt-1">{reward.description}</div>
          {reward.availableCount != null && (
            <div className="text-xs text-gray-400 mt-1">
              🎁 {Number(reward.availableCount)} gift card
              {Number(reward.availableCount) !== 1 ? "s" : ""} available
            </div>
          )}
          {reward.claimEmail && (
            <div className="text-xs text-gray-400 mt-0.5">
              📧 {reward.claimEmail}
            </div>
          )}
        </div>
      </div>
      <div className="flex space-x-2">
        <Button variant="outline" size="sm" onClick={() => onEdit(reward)}>
          <Edit className="w-4 h-4" />
        </Button>
        <Button
          variant="destructive"
          size="sm"
          onClick={() => onDelete(reward)}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
