import { Edit, Plus, Trash2, X } from "lucide-react";
import React, { useState } from "react";
import { toast } from "sonner";
import type { ReflectionBlock } from "../backend";
import {
  useAddReflectionBlock,
  useDeleteReflectionBlock,
  useGetReflectionBlocks,
  useUpdateReflectionBlock,
} from "../hooks/useQueries";
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

export default function AdminReflectionBlocksManager() {
  const { data: blocks, isLoading } = useGetReflectionBlocks();
  const addBlock = useAddReflectionBlock();
  const updateBlock = useUpdateReflectionBlock();
  const deleteBlock = useDeleteReflectionBlock();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBlock, setEditingBlock] = useState<ReflectionBlock | null>(
    null,
  );
  const [formData, setFormData] = useState({
    poemTitle: "",
    reflectionChallenges: [""],
  });

  const handleOpenDialog = (block?: ReflectionBlock) => {
    if (block) {
      setEditingBlock(block);
      setFormData({
        poemTitle: block.poemTitle,
        reflectionChallenges: [...block.reflectionChallenges],
      });
    } else {
      setEditingBlock(null);
      setFormData({
        poemTitle: "",
        reflectionChallenges: [""],
      });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingBlock(null);
    setFormData({
      poemTitle: "",
      reflectionChallenges: [""],
    });
  };

  const handleAddChallenge = () => {
    setFormData((prev) => ({
      ...prev,
      reflectionChallenges: [...prev.reflectionChallenges, ""],
    }));
  };

  const handleRemoveChallenge = (index: number) => {
    if (formData.reflectionChallenges.length <= 1) {
      toast.error("At least one reflection challenge is required");
      return;
    }
    setFormData((prev) => ({
      ...prev,
      reflectionChallenges: prev.reflectionChallenges.filter(
        (_, i) => i !== index,
      ),
    }));
  };

  const handleChallengeChange = (index: number, value: string) => {
    setFormData((prev) => ({
      ...prev,
      reflectionChallenges: prev.reflectionChallenges.map((challenge, i) =>
        i === index ? value : challenge,
      ),
    }));
  };

  const handleSave = async () => {
    if (!formData.poemTitle.trim()) {
      toast.error("Poem title is required");
      return;
    }

    const nonEmptyChallenges = formData.reflectionChallenges.filter(
      (c) => c.trim() !== "",
    );
    if (nonEmptyChallenges.length === 0) {
      toast.error("At least one reflection challenge is required");
      return;
    }

    try {
      const blockData: ReflectionBlock = {
        id: editingBlock?.id || `block-${Date.now()}`,
        poemTitle: formData.poemTitle.trim(),
        reflectionChallenges: nonEmptyChallenges,
      };

      if (editingBlock) {
        await updateBlock.mutateAsync(blockData);
        toast.success("Reflection block updated successfully");
      } else {
        await addBlock.mutateAsync(blockData);
        toast.success("Reflection block added successfully");
      }

      handleCloseDialog();
    } catch (error) {
      toast.error(
        editingBlock
          ? "Failed to update reflection block"
          : "Failed to add reflection block",
      );
      console.error("Error saving reflection block:", error);
    }
  };

  const handleDelete = async (blockId: string) => {
    if (!confirm("Are you sure you want to delete this reflection block?")) {
      return;
    }

    try {
      await deleteBlock.mutateAsync(blockId);
      toast.success("Reflection block deleted successfully");
    } catch (error) {
      toast.error("Failed to delete reflection block");
      console.error("Error deleting reflection block:", error);
    }
  };

  if (isLoading) {
    return <div className="text-center py-8">Loading reflection blocks...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Reflection Blocks</h3>
        <Button
          onClick={() => handleOpenDialog()}
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Block
        </Button>
      </div>

      {blocks && blocks.length > 0 ? (
        <div className="grid gap-4">
          {blocks.map((block) => (
            <div
              key={block.id}
              className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm"
            >
              <div className="flex justify-between items-start mb-3">
                <h4 className="text-lg font-semibold">{block.poemTitle}</h4>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenDialog(block)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(block.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                {block.reflectionChallenges.map((challenge, index) => (
                  <div key={index} className="flex gap-2 text-sm text-gray-600">
                    <span className="font-medium">{index + 1}.</span>
                    <span>{challenge}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          No reflection blocks yet. Click "Add Block" to create one.
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto bg-white">
          <DialogHeader>
            <DialogTitle>
              {editingBlock ? "Edit Reflection Block" : "Add Reflection Block"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label htmlFor="poemTitle">Poem Title</Label>
              <Input
                id="poemTitle"
                value={formData.poemTitle}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    poemTitle: e.target.value,
                  }))
                }
                placeholder="Enter poem title"
              />
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Label>Reflection Challenges</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddChallenge}
                  className="flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add Challenge
                </Button>
              </div>

              <div className="space-y-3">
                {formData.reflectionChallenges.map((challenge, index) => (
                  <div key={index} className="flex gap-2 items-start">
                    <span className="text-sm font-medium text-gray-500 mt-2">
                      {index + 1}.
                    </span>
                    <Input
                      value={challenge}
                      onChange={(e) =>
                        handleChallengeChange(index, e.target.value)
                      }
                      placeholder="Enter reflection challenge"
                      className="flex-1"
                    />
                    {formData.reflectionChallenges.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveChallenge(index)}
                        className="mt-1"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={addBlock.isPending || updateBlock.isPending}
            >
              {addBlock.isPending || updateBlock.isPending
                ? "Saving..."
                : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
