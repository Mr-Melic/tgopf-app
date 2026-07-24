import { ChevronDown, ChevronUp, Pencil, Plus, Trash2 } from "lucide-react";
import { type FormEvent, useState } from "react";
import {
  type DonationEntry,
  useAddDonation,
  useDeleteDonation,
  useListDonations,
  useUpdateDonation,
} from "../hooks/useQueries";

const COLUMN_LABELS: Record<number, string> = {
  1: "Left (1)",
  2: "Middle (2)",
  3: "Right (3)",
};

interface EntryFormState {
  name: string;
  address: string;
  column: number;
  position: number;
}

const EMPTY_FORM: EntryFormState = {
  name: "",
  address: "",
  column: 1,
  position: 1,
};

interface EntryRowProps {
  entry: DonationEntry;
  onEdit: (entry: DonationEntry) => void;
  onDelete: (id: string) => void;
  isDeleting: boolean;
}

function EntryRow({ entry, onEdit, onDelete, isDeleting }: EntryRowProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <div className="flex items-start gap-3 py-2 border-b border-gray-100 last:border-0">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900 truncate">
          {entry.name}
        </p>
        <p className="text-xs text-gray-500 break-all">{entry.address}</p>
        <p className="text-xs text-gray-400 mt-0.5">
          Col: {COLUMN_LABELS[entry.column]} · Pos: {entry.position}
        </p>
      </div>
      <div className="flex items-center gap-1 flex-shrink-0 mt-0.5">
        <button
          type="button"
          onClick={() => onEdit(entry)}
          className="p-1.5 rounded hover:bg-gray-100 text-gray-600 hover:text-gray-900 transition-colors"
          title="Edit"
        >
          <Pencil className="w-3.5 h-3.5" />
        </button>
        {confirmDelete ? (
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => {
                onDelete(entry.id);
                setConfirmDelete(false);
              }}
              disabled={isDeleting}
              className="text-xs px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
            >
              {isDeleting ? "…" : "Yes"}
            </button>
            <button
              type="button"
              onClick={() => setConfirmDelete(false)}
              className="text-xs px-2 py-1 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors"
            >
              No
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            className="p-1.5 rounded hover:bg-red-50 text-gray-500 hover:text-red-600 transition-colors"
            title="Delete"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}

interface EntryFormProps {
  initial: EntryFormState;
  onSave: (form: EntryFormState) => void;
  onCancel: () => void;
  isSaving: boolean;
  title: string;
}

function EntryForm({
  initial,
  onSave,
  onCancel,
  isSaving,
  title,
}: EntryFormProps) {
  const [form, setForm] = useState<EntryFormState>(initial);
  const [error, setError] = useState("");

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setError("Name/Method is required.");
      return;
    }
    if (!form.address.trim()) {
      setError("Address/Link is required.");
      return;
    }
    setError("");
    onSave(form);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-3"
    >
      <h4 className="text-sm font-semibold text-gray-800">{title}</h4>
      {error && <p className="text-xs text-red-600">{error}</p>}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Name / Method
          </label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="e.g. Ethereum"
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-400"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Address / Link
          </label>
          <input
            type="text"
            value={form.address}
            onChange={(e) =>
              setForm((f) => ({ ...f, address: e.target.value }))
            }
            placeholder="0x... or https://..."
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-400"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Column
          </label>
          <select
            value={form.column}
            onChange={(e) =>
              setForm((f) => ({ ...f, column: Number(e.target.value) }))
            }
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-400"
          >
            <option value={1}>Left (1)</option>
            <option value={2}>Middle (2)</option>
            <option value={3}>Right (3)</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Position (1–6)
          </label>
          <select
            value={form.position}
            onChange={(e) =>
              setForm((f) => ({ ...f, position: Number(e.target.value) }))
            }
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-400"
          >
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="flex gap-2 pt-1">
        <button
          type="submit"
          disabled={isSaving}
          className="px-4 py-2 text-sm bg-black text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
        >
          {isSaving ? "Saving…" : "Save"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

export default function AdminDonationsManager() {
  const { data: donations = [], isLoading } = useListDonations();
  const addMutation = useAddDonation();
  const updateMutation = useUpdateDonation();
  const deleteMutation = useDeleteDonation();

  const [showAddForm, setShowAddForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState<DonationEntry | null>(null);
  const [expandedCols, setExpandedCols] = useState<Set<number>>(
    new Set([1, 2, 3]),
  );

  const toggleCol = (col: number) => {
    setExpandedCols((prev) => {
      const next = new Set(prev);
      if (next.has(col)) next.delete(col);
      else next.add(col);
      return next;
    });
  };

  const handleAdd = (form: EntryFormState) => {
    addMutation.mutate(form, {
      onSuccess: () => setShowAddForm(false),
    });
  };

  const handleUpdate = (form: EntryFormState) => {
    if (!editingEntry) return;
    updateMutation.mutate(
      { ...editingEntry, ...form },
      {
        onSuccess: () => {
          setEditingEntry(null);
          updateMutation.reset();
        },
        onError: () => {
          // error shown inline below
        },
      },
    );
  };

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id);
  };

  if (isLoading) {
    return <p className="text-sm text-gray-500 py-4">Loading donations…</p>;
  }

  return (
    <div className="space-y-4 bg-white text-gray-900">
      <p className="text-xs text-gray-500">
        Add donation entries that appear in the footer below the business
        details. Each column can have up to 6 entries. URLs are rendered as
        clickable links.
      </p>

      {/* Add button */}
      {!showAddForm && !editingEntry && (
        <button
          type="button"
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-2 px-4 py-2 text-sm bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
          data-ocid="donations-add-btn"
        >
          <Plus className="w-4 h-4" />
          Add Donation Entry
        </button>
      )}

      {/* Add form */}
      {showAddForm && (
        <EntryForm
          initial={EMPTY_FORM}
          onSave={handleAdd}
          onCancel={() => setShowAddForm(false)}
          isSaving={addMutation.isPending}
          title="New Donation Entry"
        />
      )}

      {/* Columns */}
      {([1, 2, 3] as const).map((col) => {
        const colEntries = donations
          .filter((d) => d.column === col)
          .sort((a, b) => a.position - b.position)
          .slice(0, 6);

        return (
          <div
            key={col}
            className="border border-gray-200 rounded-xl overflow-hidden"
          >
            <button
              type="button"
              onClick={() => toggleCol(col)}
              className="w-full px-4 py-3 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              <span className="text-sm font-semibold text-gray-800">
                {COLUMN_LABELS[col]}{" "}
                <span className="text-xs font-normal text-gray-500">
                  ({colEntries.length}/6 entries)
                </span>
              </span>
              {expandedCols.has(col) ? (
                <ChevronUp className="w-4 h-4 text-gray-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-gray-400" />
              )}
            </button>

            {expandedCols.has(col) && (
              <div className="px-4 py-3 bg-white">
                {colEntries.length === 0 ? (
                  <p className="text-xs text-gray-400 italic py-1">
                    No entries in this column yet.
                  </p>
                ) : (
                  <div>
                    {colEntries.map((entry) =>
                      editingEntry?.id === entry.id ? (
                        <div key={entry.id} className="mb-2">
                          {updateMutation.isError && (
                            <p className="text-xs text-red-600 mb-2 px-1">
                              Failed to save. Please try again.
                            </p>
                          )}
                          <EntryForm
                            initial={{
                              name: entry.name,
                              address: entry.address,
                              column: entry.column,
                              position: entry.position,
                            }}
                            onSave={handleUpdate}
                            onCancel={() => {
                              setEditingEntry(null);
                              updateMutation.reset();
                            }}
                            isSaving={updateMutation.isPending}
                            title="Edit Entry"
                          />
                        </div>
                      ) : (
                        <EntryRow
                          key={entry.id}
                          entry={entry}
                          onEdit={setEditingEntry}
                          onDelete={handleDelete}
                          isDeleting={deleteMutation.isPending}
                        />
                      ),
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}

      {donations.length === 0 && !showAddForm && (
        <p className="text-xs text-gray-400 italic">
          No donation entries yet. Click "Add Donation Entry" to get started.
        </p>
      )}
    </div>
  );
}
