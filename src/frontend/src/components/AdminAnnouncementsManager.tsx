import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Trash2, X } from "lucide-react";
import { useState } from "react";
import { useActor } from "../hooks/useActor";

interface Announcement {
  id: bigint;
  title: string;
  message: string;
  url?: string | null;
  createdAt: bigint;
}

export default function AdminAnnouncementsManager() {
  const { actor, isFetching } = useActor();
  const queryClient = useQueryClient();

  // ── Queries ─────────────────────────────────────────────────────────────
  const { data: announcements = [], isLoading } = useQuery<Announcement[]>({
    queryKey: ["announcements"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAnnouncements();
    },
    enabled: !!actor && !isFetching,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });

  const { data: intervalRaw } = useQuery<bigint>({
    queryKey: ["announcementRotationInterval"],
    queryFn: async () => {
      if (!actor) return BigInt(8);
      return actor.getAnnouncementRotationInterval();
    },
    enabled: !!actor && !isFetching,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["announcements"] });
    queryClient.invalidateQueries({
      queryKey: ["announcementRotationInterval"],
    });
  };

  // ── Mutations ────────────────────────────────────────────────────────────
  const addMutation = useMutation({
    mutationFn: async ({
      title,
      message,
      url,
    }: { title: string; message: string; url: string | null }) => {
      if (!actor) throw new Error("Actor not available");
      return await actor.addAnnouncement(title, message, url ?? null);
    },
    onSuccess: invalidate,
  });

  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      title,
      message,
      url,
    }: { id: bigint; title: string; message: string; url: string | null }) => {
      if (!actor) throw new Error("Actor not available");
      return await actor.updateAnnouncement(id, title, message, url ?? null);
    },
    onSuccess: invalidate,
  });

  const removeMutation = useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("Actor not available");
      return actor.removeAnnouncement(id);
    },
    onSuccess: invalidate,
  });

  const intervalMutation = useMutation({
    mutationFn: async (seconds: number) => {
      if (!actor) throw new Error("Actor not available");
      return actor.setAnnouncementRotationInterval(BigInt(seconds));
    },
    onSuccess: invalidate,
  });

  // ── Local UI state ────────────────────────────────────────────────────────
  const [newTitle, setNewTitle] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [addError, setAddError] = useState("");

  const [editingId, setEditingId] = useState<bigint | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editMessage, setEditMessage] = useState("");
  const [editUrl, setEditUrl] = useState("");

  const currentInterval = intervalRaw ? Number(intervalRaw) : 8;
  const [intervalInput, setIntervalInput] = useState<string>(
    String(currentInterval),
  );
  const [intervalSaved, setIntervalSaved] = useState(false);

  // Sync interval input when data loads
  const prevIntervalRef = { current: currentInterval };
  if (
    prevIntervalRef.current !== currentInterval &&
    !intervalMutation.isPending
  ) {
    setIntervalInput(String(currentInterval));
  }

  const handleAdd = () => {
    if (!newTitle.trim()) {
      setAddError("Title is required.");
      return;
    }
    if (!newMessage.trim()) {
      setAddError("Message is required.");
      return;
    }
    setAddError("");
    addMutation.mutate(
      {
        title: newTitle.trim(),
        message: newMessage.trim(),
        url: newUrl.trim() || null,
      },
      {
        onSuccess: () => {
          setNewTitle("");
          setNewMessage("");
          setNewUrl("");
        },
      },
    );
  };

  const handleEditStart = (ann: Announcement) => {
    setEditingId(ann.id);
    setEditTitle(ann.title);
    setEditMessage(ann.message);
    setEditUrl(ann.url ?? "");
  };

  const handleEditSave = (id: bigint) => {
    if (!editTitle.trim() || !editMessage.trim()) return;
    updateMutation.mutate(
      {
        id,
        title: editTitle.trim(),
        message: editMessage.trim(),
        url: editUrl.trim() || null,
      },
      { onSuccess: () => setEditingId(null) },
    );
  };

  const handleSaveInterval = () => {
    const val = Number.parseInt(intervalInput, 10);
    if (Number.isNaN(val) || val < 1) return;
    intervalMutation.mutate(val, {
      onSuccess: () => {
        setIntervalSaved(true);
        setTimeout(() => setIntervalSaved(false), 3000);
      },
    });
  };

  return (
    <div className="space-y-6 text-gray-900">
      {/* Rotation interval */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <label className="block text-xs font-semibold uppercase tracking-wide text-gray-600 mb-2">
          Auto-rotate every
        </label>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={1}
            value={intervalInput}
            onChange={(e) => setIntervalInput(e.target.value)}
            className="w-24 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-black"
            data-ocid="announcements.interval_input"
          />
          <span className="text-sm text-gray-600">seconds</span>
          <button
            type="button"
            onClick={handleSaveInterval}
            disabled={intervalMutation.isPending}
            className="px-4 py-2 bg-black text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
            data-ocid="announcements.interval_save_button"
          >
            {intervalMutation.isPending ? "Saving…" : "Save"}
          </button>
          {intervalSaved && (
            <span
              className="text-sm text-green-600 font-medium"
              data-ocid="announcements.interval_success_state"
            >
              ✓ Saved
            </span>
          )}
          {intervalMutation.isError && (
            <span
              className="text-sm text-red-600 font-medium"
              data-ocid="announcements.interval_error_state"
            >
              Failed to save
            </span>
          )}
        </div>
      </div>

      {/* Add new announcement */}
      <div className="border border-gray-200 rounded-lg p-4 space-y-3">
        <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
          <Plus className="w-4 h-4" /> New Announcement
        </h3>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Title
          </label>
          <input
            type="text"
            value={newTitle}
            onChange={(e) => {
              setNewTitle(e.target.value);
              setAddError("");
            }}
            placeholder="Announcement title"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-black"
            data-ocid="announcements.title_input"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Message
          </label>
          <textarea
            value={newMessage}
            onChange={(e) => {
              setNewMessage(e.target.value);
              setAddError("");
            }}
            placeholder="Announcement message"
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-black resize-vertical"
            data-ocid="announcements.message_textarea"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Link URL{" "}
            <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <input
            type="url"
            value={newUrl}
            onChange={(e) => setNewUrl(e.target.value)}
            placeholder="https://..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-black"
            data-ocid="announcements.url_input"
          />
        </div>
        {addError && (
          <p
            className="text-xs text-red-600"
            data-ocid="announcements.add_error_state"
          >
            {addError}
          </p>
        )}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleAdd}
            disabled={addMutation.isPending}
            className="px-5 py-2 bg-black text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
            data-ocid="announcements.add_button"
          >
            {addMutation.isPending ? "Adding…" : "Add Announcement"}
          </button>
          {addMutation.isError && (
            <span
              className="text-sm text-red-600"
              data-ocid="announcements.add_error_state"
            >
              Failed to add
            </span>
          )}
        </div>
      </div>

      {/* List of existing announcements */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-gray-800">
          Existing Announcements ({announcements.length})
        </h3>
        {isLoading && <p className="text-sm text-gray-500">Loading…</p>}
        {!isLoading && announcements.length === 0 && (
          <p
            className="text-sm text-gray-500 italic"
            data-ocid="announcements.empty_state"
          >
            No announcements yet.
          </p>
        )}
        {[...announcements]
          .sort((a, b) => (a.createdAt < b.createdAt ? -1 : 1))
          .map((ann, idx) => (
            <div
              key={String(ann.id)}
              className="border border-gray-200 rounded-lg bg-white overflow-hidden"
              data-ocid={`announcements.item.${idx + 1}`}
            >
              {editingId === ann.id ? (
                /* Inline edit form */
                <div className="p-4 space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Title
                    </label>
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-black"
                      data-ocid={`announcements.edit_title.${idx + 1}`}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Message
                    </label>
                    <textarea
                      value={editMessage}
                      onChange={(e) => setEditMessage(e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-black resize-vertical"
                      data-ocid={`announcements.edit_message.${idx + 1}`}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Link URL{" "}
                      <span className="text-gray-400 font-normal">
                        (optional)
                      </span>
                    </label>
                    <input
                      type="url"
                      value={editUrl}
                      onChange={(e) => setEditUrl(e.target.value)}
                      placeholder="https://..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-black"
                      data-ocid={`announcements.edit_url.${idx + 1}`}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleEditSave(ann.id)}
                      disabled={updateMutation.isPending}
                      className="px-4 py-1.5 bg-black text-white text-xs font-medium rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
                      data-ocid={`announcements.save_button.${idx + 1}`}
                    >
                      {updateMutation.isPending ? "Saving…" : "Save"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingId(null)}
                      className="px-4 py-1.5 border border-gray-300 text-xs font-medium rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-1"
                      data-ocid={`announcements.cancel_button.${idx + 1}`}
                    >
                      <X className="w-3 h-3" /> Cancel
                    </button>
                    {updateMutation.isError && (
                      <span
                        className="text-xs text-red-600"
                        data-ocid={`announcements.edit_error_state.${idx + 1}`}
                      >
                        Failed
                      </span>
                    )}
                  </div>
                </div>
              ) : (
                /* Row view */
                <div className="flex items-start justify-between gap-3 px-4 py-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {ann.title}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                      {ann.message}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => handleEditStart(ann)}
                      className="p-1.5 text-gray-500 hover:text-black transition-colors rounded"
                      aria-label="Edit announcement"
                      data-ocid={`announcements.edit_button.${idx + 1}`}
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeMutation.mutate(ann.id)}
                      disabled={removeMutation.isPending}
                      className="p-1.5 text-gray-500 hover:text-red-600 transition-colors rounded disabled:opacity-50"
                      aria-label="Delete announcement"
                      data-ocid={`announcements.delete_button.${idx + 1}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
      </div>
    </div>
  );
}
