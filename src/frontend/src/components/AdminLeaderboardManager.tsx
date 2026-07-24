import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Edit, Loader2, Plus, Trash2, Upload } from "lucide-react";
import type React from "react";
import { useState } from "react";
import { toast } from "sonner";
import type { LeaderboardEntry } from "../backend";
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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

interface AdminLeaderboardManagerProps {
  leaderboardType: "retail" | "social";
}

export default function AdminLeaderboardManager({
  leaderboardType,
}: AdminLeaderboardManagerProps) {
  const { actor, isFetching } = useActor();
  const queryClient = useQueryClient();
  const { uploadFile, isUploading } = useFileUpload();
  const { deleteFile } = useFileDelete();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<LeaderboardEntry | null>(
    null,
  );
  const [formData, setFormData] = useState({
    name: "",
    score: "",
    photoFile: null as File | null,
  });

  const queryKey =
    leaderboardType === "retail" ? "retailLeaderboard" : "socialLeaderboard";
  const addMutation =
    leaderboardType === "retail"
      ? "addRetailLeaderboardEntry"
      : "addSocialLeaderboardEntry";
  const updateMutation =
    leaderboardType === "retail"
      ? "updateRetailLeaderboardEntry"
      : "updateSocialLeaderboardEntry";
  const deleteMutation =
    leaderboardType === "retail"
      ? "deleteRetailLeaderboardEntry"
      : "deleteSocialLeaderboardEntry";

  // Fetch leaderboard
  const { data: leaderboard, isLoading } = useQuery<LeaderboardEntry[]>({
    queryKey: [queryKey],
    queryFn: async () => {
      if (!actor) return [];
      return leaderboardType === "retail"
        ? actor.getRetailLeaderboard()
        : actor.getSocialLeaderboard();
    },
    enabled: !!actor && !isFetching,
  });

  // Add entry mutation
  const addEntry = useMutation({
    mutationFn: async (entry: LeaderboardEntry) => {
      if (!actor) throw new Error("Actor not available");
      return (actor as any)[addMutation](entry);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKey] });
      toast.success("Leaderboard entry added successfully");
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      console.error("Failed to add entry:", error);
      toast.error("Failed to add leaderboard entry");
    },
  });

  // Update entry mutation
  const updateEntry = useMutation({
    mutationFn: async (entry: LeaderboardEntry) => {
      if (!actor) throw new Error("Actor not available");
      return (actor as any)[updateMutation](entry);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKey] });
      toast.success("Leaderboard entry updated successfully");
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      console.error("Failed to update entry:", error);
      toast.error("Failed to update leaderboard entry");
    },
  });

  // Delete entry mutation
  const deleteEntry = useMutation({
    mutationFn: async (entryId: string) => {
      if (!actor) throw new Error("Actor not available");
      return (actor as any)[deleteMutation](entryId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKey] });
      toast.success("Leaderboard entry deleted successfully");
    },
    onError: (error) => {
      console.error("Failed to delete entry:", error);
      toast.error("Failed to delete leaderboard entry");
    },
  });

  const resetForm = () => {
    setFormData({ name: "", score: "", photoFile: null });
    setEditingEntry(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.score) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      let photoPath: string | undefined = editingEntry?.photoPath;

      // Upload photo if provided
      if (formData.photoFile) {
        const path = `leaderboard/${leaderboardType}/${Date.now()}_${formData.photoFile.name}`;
        await uploadFile(path, formData.photoFile);
        photoPath = path;
      }

      const entry: LeaderboardEntry = {
        id: editingEntry?.id || `${Date.now()}`,
        name: formData.name,
        score: BigInt(formData.score),
        photoPath,
      };

      if (editingEntry) {
        await updateEntry.mutateAsync(entry);
      } else {
        await addEntry.mutateAsync(entry);
      }
    } catch (error) {
      console.error("Failed to save entry:", error);
      toast.error("Failed to save leaderboard entry");
    }
  };

  const handleEdit = (entry: LeaderboardEntry) => {
    setEditingEntry(entry);
    setFormData({
      name: entry.name,
      score: entry.score.toString(),
      photoFile: null,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (entry: LeaderboardEntry) => {
    if (confirm(`Are you sure you want to delete ${entry.name}?`)) {
      if (entry.photoPath) {
        await deleteFile(entry.photoPath);
      }
      await deleteEntry.mutateAsync(entry.id);
    }
  };

  const sortedLeaderboard =
    leaderboard?.sort((a, b) => Number(b.score) - Number(a.score)) || [];

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
          {leaderboardType === "retail" ? "Retail" : "Social"} Leaderboard
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
              Add Entry
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingEntry ? "Edit" : "Add"} Leaderboard Entry
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Enter name"
                  required
                />
              </div>
              <div>
                <Label htmlFor="score">Score *</Label>
                <Input
                  id="score"
                  type="number"
                  value={formData.score}
                  onChange={(e) =>
                    setFormData({ ...formData, score: e.target.value })
                  }
                  placeholder="Enter score"
                  required
                />
              </div>
              <div>
                <Label htmlFor="photo">Photo (optional)</Label>
                <Input
                  id="photo"
                  type="file"
                  accept="image/*"
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      photoFile: e.target.files?.[0] || null,
                    })
                  }
                />
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
                    isUploading || addEntry.isPending || updateEntry.isPending
                  }
                >
                  {isUploading ||
                  addEntry.isPending ||
                  updateEntry.isPending ? (
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

      {sortedLeaderboard.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-xl">
          <p className="text-gray-500">
            No leaderboard entries yet. Add your first entry!
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {sortedLeaderboard.map((entry, index) => (
            <LeaderboardEntryCard
              key={entry.id}
              entry={entry}
              rank={index + 1}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface LeaderboardEntryCardProps {
  entry: LeaderboardEntry;
  rank: number;
  onEdit: (entry: LeaderboardEntry) => void;
  onDelete: (entry: LeaderboardEntry) => void;
}

function LeaderboardEntryCard({
  entry,
  rank,
  onEdit,
  onDelete,
}: LeaderboardEntryCardProps) {
  const { data: photoUrl } = useFileUrl(entry.photoPath || "");

  return (
    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200">
      <div className="flex items-center space-x-4">
        <div className="text-xl font-bold w-8 text-center text-gray-600">
          #{rank}
        </div>
        {entry.photoPath && photoUrl ? (
          <img
            src={photoUrl}
            alt={entry.name}
            className="w-10 h-10 rounded-full object-cover border-2 border-gray-300"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 font-bold">
            {entry.name.charAt(0).toUpperCase()}
          </div>
        )}
        <div>
          <div className="font-semibold">{entry.name}</div>
          <div className="text-sm text-gray-600">
            {Number(entry.score).toLocaleString()} points
          </div>
        </div>
      </div>
      <div className="flex space-x-2">
        <Button variant="outline" size="sm" onClick={() => onEdit(entry)}>
          <Edit className="w-4 h-4" />
        </Button>
        <Button variant="destructive" size="sm" onClick={() => onDelete(entry)}>
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
