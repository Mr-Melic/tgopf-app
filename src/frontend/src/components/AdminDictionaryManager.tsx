import { Edit, Plus, Trash2 } from "lucide-react";
import type React from "react";
import { useState } from "react";
import { toast } from "sonner";
import type { DictionaryEntry } from "../backend";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import {
  useAddDictionaryEntry,
  useDeleteDictionaryEntry,
  useGetDictionaryEntries,
  useUpdateDictionaryEntry,
} from "../hooks/useQueries";

export default function AdminDictionaryManager() {
  const { data: entries, isLoading } = useGetDictionaryEntries();
  const addEntry = useAddDictionaryEntry();
  const updateEntry = useUpdateDictionaryEntry();
  const deleteEntry = useDeleteDictionaryEntry();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<DictionaryEntry | null>(
    null,
  );
  const [formData, setFormData] = useState<DictionaryEntry>({
    word: "",
    meaning: "",
    etymology: "",
    examples: "",
  });

  const resetForm = () => {
    setFormData({
      word: "",
      meaning: "",
      etymology: "",
      examples: "",
    });
    setEditingEntry(null);
  };

  const handleOpenDialog = (entry?: DictionaryEntry) => {
    if (entry) {
      setEditingEntry(entry);
      setFormData(entry);
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    resetForm();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !formData.word.trim() ||
      !formData.meaning.trim() ||
      !formData.etymology.trim() ||
      !formData.examples.trim()
    ) {
      toast.error("All fields are required");
      return;
    }

    try {
      if (editingEntry) {
        await updateEntry.mutateAsync(formData);
        toast.success("Dictionary entry updated successfully");
      } else {
        await addEntry.mutateAsync(formData);
        toast.success("Dictionary entry added successfully");
      }
      handleCloseDialog();
    } catch (error) {
      toast.error(
        editingEntry ? "Failed to update entry" : "Failed to add entry",
      );
      console.error("Error saving dictionary entry:", error);
    }
  };

  const handleDelete = async (word: string) => {
    if (!confirm(`Are you sure you want to delete the entry for "${word}"?`)) {
      return;
    }

    try {
      await deleteEntry.mutateAsync(word);
      toast.success("Dictionary entry deleted successfully");
    } catch (error) {
      toast.error("Failed to delete entry");
      console.error("Error deleting dictionary entry:", error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Dictionary Management</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="w-4 h-4 mr-2" />
              Add Entry
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white p-6 rounded-lg shadow-lg">
            <DialogHeader>
              <DialogTitle>
                {editingEntry
                  ? "Edit Dictionary Entry"
                  : "Add Dictionary Entry"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="word">Word</Label>
                <Input
                  id="word"
                  value={formData.word}
                  onChange={(e) =>
                    setFormData({ ...formData, word: e.target.value })
                  }
                  placeholder="thy"
                  disabled={!!editingEntry}
                />
              </div>

              <div>
                <Label htmlFor="meaning">Meaning</Label>
                <Textarea
                  id="meaning"
                  value={formData.meaning}
                  onChange={(e) =>
                    setFormData({ ...formData, meaning: e.target.value })
                  }
                  placeholder="the possessive case of thou (used as an attributive adjective before a noun beginning with a consonant sound)."
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="etymology">Etymology</Label>
                <Textarea
                  id="etymology"
                  value={formData.etymology}
                  onChange={(e) =>
                    setFormData({ ...formData, etymology: e.target.value })
                  }
                  placeholder="1125–75; Middle English; variant of thine"
                  rows={2}
                />
              </div>

              <div>
                <Label htmlFor="examples">Examples</Label>
                <Textarea
                  id="examples"
                  value={formData.examples}
                  onChange={(e) =>
                    setFormData({ ...formData, examples: e.target.value })
                  }
                  placeholder="thy table."
                  rows={4}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCloseDialog}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={addEntry.isPending || updateEntry.isPending}
                >
                  {addEntry.isPending || updateEntry.isPending
                    ? "Saving..."
                    : "Save"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <p className="text-gray-500">Loading dictionary entries...</p>
      ) : entries && entries.length > 0 ? (
        <div className="grid gap-4">
          {entries.map((entry) => (
            <Card key={entry.word}>
              <CardHeader>
                <CardTitle className="flex justify-between items-center">
                  <span className="adobe-jenson text-2xl">{entry.word}</span>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenDialog(entry)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(entry.word)}
                      disabled={deleteEntry.isPending}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <p className="text-gray-700">
                    <strong>Meaning:</strong> {entry.meaning}
                  </p>
                  <p className="text-gray-700">
                    <strong>Etymology:</strong> {entry.etymology}
                  </p>
                  <p className="text-gray-700">
                    <strong>Examples:</strong> {entry.examples}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <p className="text-gray-500">
          No dictionary entries yet. Add your first entry above.
        </p>
      )}
    </div>
  );
}
