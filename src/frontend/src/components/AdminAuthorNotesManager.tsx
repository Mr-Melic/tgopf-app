import { Edit, Plus, Trash2, X } from "lucide-react";
import React, { useState } from "react";
import { toast } from "sonner";
import {
  useAddAuthorNote,
  useDeleteAuthorNote,
  useGetAuthorNotes,
  useUpdateAuthorNote,
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
import { Textarea } from "./ui/textarea";

interface NoteFormData {
  poemTitle: string;
  poemSubtitle: string;
  noteText: string;
}

const emptyForm: NoteFormData = {
  poemTitle: "",
  poemSubtitle: "",
  noteText: "",
};

export default function AdminAuthorNotesManager() {
  const { data: notes, isLoading } = useGetAuthorNotes();
  const addNote = useAddAuthorNote();
  const updateNote = useUpdateAuthorNote();
  const deleteNote = useDeleteAuthorNote();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<NoteFormData>(emptyForm);

  const handleOpenAdd = () => {
    setEditingId(null);
    setFormData(emptyForm);
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (note: {
    id: string;
    poemTitle: string;
    poemSubtitle: string;
    noteText: string;
  }) => {
    setEditingId(note.id);
    setFormData({
      poemTitle: note.poemTitle,
      poemSubtitle: note.poemSubtitle,
      noteText: note.noteText,
    });
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingId(null);
    setFormData(emptyForm);
  };

  const handleSave = async () => {
    if (!formData.poemTitle.trim()) {
      toast.error("Poem title is required");
      return;
    }
    if (!formData.noteText.trim()) {
      toast.error("Author notes text is required");
      return;
    }

    try {
      if (editingId) {
        await updateNote.mutateAsync({
          id: editingId,
          poemTitle: formData.poemTitle.trim(),
          poemSubtitle: formData.poemSubtitle.trim(),
          noteText: formData.noteText.trim(),
        });
        toast.success("Author note updated successfully");
      } else {
        await addNote.mutateAsync({
          poemTitle: formData.poemTitle.trim(),
          poemSubtitle: formData.poemSubtitle.trim(),
          noteText: formData.noteText.trim(),
        });
        toast.success("Author note added successfully");
      }
      handleCloseDialog();
    } catch {
      toast.error(
        editingId
          ? "Failed to update author note"
          : "Failed to add author note",
      );
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this author note?")) return;
    try {
      await deleteNote.mutateAsync(id);
      toast.success("Author note deleted successfully");
    } catch {
      toast.error("Failed to delete author note");
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-8 text-gray-500">
        Loading author notes...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">Author Notes</h3>
        <Button
          onClick={handleOpenAdd}
          className="flex items-center gap-2"
          data-ocid="add-author-note-btn"
        >
          <Plus className="w-4 h-4" />
          Add Note
        </Button>
      </div>

      {notes && notes.length > 0 ? (
        <div className="grid gap-4">
          {notes.map((note) => (
            <div
              key={note.id}
              className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm"
              data-ocid="author-note-admin-row"
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h4 className="text-base font-semibold text-gray-900">
                    {note.poemTitle}
                  </h4>
                  {note.poemSubtitle && (
                    <p className="text-sm italic text-gray-500">
                      {note.poemSubtitle}
                    </p>
                  )}
                </div>
                <div className="flex gap-2 flex-shrink-0 ml-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenEdit(note)}
                    data-ocid="edit-author-note-btn"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(note.id)}
                    data-ocid="delete-author-note-btn"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">
                {note.noteText}
              </p>
              <div className="flex gap-3 mt-2 text-xs text-gray-400">
                <span>❤️ {Number(note.reactions.love)}</span>
                <span>👍 {Number(note.reactions.like)}</span>
                <span>👎 {Number(note.reactions.dislike)}</span>
                <span>😂 {Number(note.reactions.laugh)}</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          No author notes yet. Click "Add Note" to create one.
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto bg-white">
          <DialogHeader>
            <DialogTitle className="text-gray-900">
              {editingId ? "Edit Author Note" : "Add Author Note"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-5 py-4">
            <div className="space-y-2">
              <Label htmlFor="note-poemTitle" className="text-gray-800">
                Poem Title <span className="text-red-500">*</span>
              </Label>
              <Input
                id="note-poemTitle"
                value={formData.poemTitle}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, poemTitle: e.target.value }))
                }
                placeholder="Enter poem title"
                className="bg-white border-gray-300 text-gray-900 placeholder-gray-400"
                data-ocid="note-poem-title-input"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="note-poemSubtitle" className="text-gray-800">
                Poem Subtitle{" "}
                <span className="text-gray-400 text-xs">(optional)</span>
              </Label>
              <Input
                id="note-poemSubtitle"
                value={formData.poemSubtitle}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, poemSubtitle: e.target.value }))
                }
                placeholder="Enter poem subtitle (optional)"
                className="bg-white border-gray-300 text-gray-900 placeholder-gray-400"
                data-ocid="note-poem-subtitle-input"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="note-noteText" className="text-gray-800">
                Author Notes <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="note-noteText"
                value={formData.noteText}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, noteText: e.target.value }))
                }
                placeholder="Write your notes about this poem..."
                rows={6}
                className="resize-y bg-white border-gray-300 text-gray-900 placeholder-gray-400"
                data-ocid="note-text-input"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>
              <X className="w-4 h-4 mr-1" />
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={addNote.isPending || updateNote.isPending}
              data-ocid="save-author-note-btn"
            >
              {addNote.isPending || updateNote.isPending ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
