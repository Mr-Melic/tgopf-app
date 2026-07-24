import { Mail, Pencil, Plus, Save, Trash2, X } from "lucide-react";
import React, { useState } from "react";
import type { ExperienceChallenge } from "../backend";
import {
  type ChallengeCategory,
  useAddChallenge,
  useDeleteChallenge,
  useGetChallenges,
  useGetSubmitProofEmail,
  useUpdateChallenge,
  useUpdateSubmitProofEmail,
} from "../hooks/useChallengeQueries";

type Tab = "retail" | "social";

interface ChallengeFormState {
  title: string;
  description: string;
  rewardPoints: string;
  specialReward: string;
}

const emptyForm: ChallengeFormState = {
  title: "",
  description: "",
  rewardPoints: "",
  specialReward: "",
};

export default function AdminExperienceChallengesManager() {
  const [activeTab, setActiveTab] = useState<Tab>("retail");
  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm] = useState<ChallengeFormState>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<ChallengeFormState>(emptyForm);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [emailInput, setEmailInput] = useState<string>("");
  const [emailSaved, setEmailSaved] = useState(false);

  const { data: allChallenges, isLoading } = useGetChallenges();
  const { data: submitEmail } = useGetSubmitProofEmail();

  const addChallenge = useAddChallenge();
  const updateChallenge = useUpdateChallenge();
  const deleteChallenge = useDeleteChallenge();
  const updateEmail = useUpdateSubmitProofEmail();

  const challenges = (allChallenges ?? []).filter(
    (c) => (c.category as unknown as string) === activeTab,
  );

  // Sync email input when data loads
  React.useEffect(() => {
    if (submitEmail && emailInput === "") {
      setEmailInput(submitEmail);
    }
  }, [submitEmail, emailInput]);

  const handleAdd = async () => {
    if (
      !addForm.title.trim() ||
      !addForm.description.trim() ||
      !addForm.rewardPoints
    )
      return;
    await addChallenge.mutateAsync({
      category: activeTab as ChallengeCategory,
      title: addForm.title.trim(),
      description: addForm.description.trim(),
      rewardPoints: BigInt(Number(addForm.rewardPoints) || 0),
      specialReward: addForm.specialReward.trim() || null,
    });
    setAddForm(emptyForm);
    setShowAddForm(false);
  };

  const startEdit = (c: ExperienceChallenge) => {
    setEditingId(c.id);
    setEditForm({
      title: c.title,
      description: c.description,
      rewardPoints: String(Number(c.rewardPoints)),
      specialReward: c.specialReward ?? "",
    });
  };

  const handleEdit = async (c: ExperienceChallenge) => {
    if (
      !editForm.title.trim() ||
      !editForm.description.trim() ||
      !editForm.rewardPoints
    )
      return;
    await updateChallenge.mutateAsync({
      id: c.id,
      category: activeTab as ChallengeCategory,
      title: editForm.title.trim(),
      description: editForm.description.trim(),
      rewardPoints: BigInt(Number(editForm.rewardPoints) || 0),
      specialReward: editForm.specialReward.trim() || null,
    });
    setEditingId(null);
  };

  const handleDelete = async (id: string) => {
    await deleteChallenge.mutateAsync(id);
    setConfirmDeleteId(null);
  };

  const handleSaveEmail = async () => {
    if (!emailInput.trim()) return;
    await updateEmail.mutateAsync(emailInput.trim());
    setEmailSaved(true);
    setTimeout(() => setEmailSaved(false), 2000);
  };

  const inputClass =
    "w-full px-3 py-2 rounded-lg bg-white border border-gray-300 text-gray-900 text-sm placeholder-gray-400 focus:outline-none focus:border-gray-600 focus:ring-1 focus:ring-gray-400 transition-colors";

  const tabClass = (t: Tab) =>
    `px-4 py-1.5 rounded-full text-xs font-semibold transition-colors ${
      activeTab === t
        ? "bg-gray-900 text-white"
        : "bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900"
    }`;

  return (
    <div className="space-y-6">
      {/* Submit Proof Email Setting */}
      <div className="p-4 rounded-xl bg-white border border-gray-200 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <Mail className="w-4 h-4 text-green-700" />
          <span className="text-sm font-semibold text-gray-900">
            Submit Proof Email
          </span>
        </div>
        <p className="text-xs text-gray-500 mb-3">
          This email will receive all challenge proof submissions via the Submit
          Proof button.
        </p>
        <div className="flex gap-2">
          <input
            type="email"
            value={emailInput}
            onChange={(e) => setEmailInput(e.target.value)}
            placeholder="tgopf@pm.me"
            className={inputClass}
            data-ocid="admin-submit-proof-email-input"
          />
          <button
            type="button"
            onClick={handleSaveEmail}
            disabled={updateEmail.isPending}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-green-700 text-white text-sm font-semibold hover:bg-green-800 transition-colors disabled:opacity-50 whitespace-nowrap"
            data-ocid="admin-submit-proof-email-save"
          >
            <Save className="w-3.5 h-3.5" />
            {emailSaved ? "Saved!" : "Save"}
          </button>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-3">
        <button
          className={tabClass("retail")}
          onClick={() => setActiveTab("retail")}
        >
          🛍️ Retail
        </button>
        <button
          className={tabClass("social")}
          onClick={() => setActiveTab("social")}
        >
          📱 Social
        </button>
        <div className="flex-1" />
        <button
          type="button"
          onClick={() => {
            setShowAddForm(true);
            setAddForm(emptyForm);
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-900 text-white text-xs font-semibold hover:bg-gray-700 transition-colors"
          data-ocid="admin-add-challenge-btn"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Challenge
        </button>
      </div>

      {/* Add Challenge Form */}
      {showAddForm && (
        <div className="p-4 rounded-xl border border-green-300 bg-green-50 space-y-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-semibold text-green-800">
              New Challenge · {activeTab}
            </span>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="text-gray-500 hover:text-gray-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <input
            className={inputClass}
            placeholder="Challenge Title *"
            value={addForm.title}
            onChange={(e) =>
              setAddForm((f) => ({ ...f, title: e.target.value }))
            }
          />
          <textarea
            className={`${inputClass} resize-none`}
            rows={3}
            placeholder="Description *"
            value={addForm.description}
            onChange={(e) =>
              setAddForm((f) => ({ ...f, description: e.target.value }))
            }
          />
          <input
            className={inputClass}
            type="number"
            min={0}
            placeholder="Reward Points *"
            value={addForm.rewardPoints}
            onChange={(e) =>
              setAddForm((f) => ({ ...f, rewardPoints: e.target.value }))
            }
          />
          <input
            className={inputClass}
            placeholder="Special Reward (optional)"
            value={addForm.specialReward}
            onChange={(e) =>
              setAddForm((f) => ({ ...f, specialReward: e.target.value }))
            }
          />
          <button
            type="button"
            onClick={handleAdd}
            disabled={
              addChallenge.isPending ||
              !addForm.title ||
              !addForm.description ||
              !addForm.rewardPoints
            }
            className="w-full py-2 rounded-lg bg-gray-900 text-white text-sm font-semibold hover:bg-gray-700 transition-colors disabled:opacity-50"
          >
            {addChallenge.isPending ? "Saving…" : "Add Challenge"}
          </button>
        </div>
      )}

      {/* Challenge List */}
      {isLoading ? (
        <p className="text-gray-500 text-sm py-4 text-center">
          Loading challenges…
        </p>
      ) : challenges.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          <p className="text-sm text-gray-500">
            No {activeTab} challenges yet.
          </p>
          <p className="text-xs mt-1 text-gray-400">
            Click "Add Challenge" to create your first one.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {challenges.map((c) => (
            <div
              key={c.id}
              className="rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm"
              data-ocid={`admin-challenge-${c.id}`}
            >
              {editingId === c.id ? (
                /* Edit Mode */
                <div className="p-4 space-y-3 bg-blue-50 border-l-4 border-blue-400">
                  <input
                    className={inputClass}
                    placeholder="Challenge Title *"
                    value={editForm.title}
                    onChange={(e) =>
                      setEditForm((f) => ({ ...f, title: e.target.value }))
                    }
                  />
                  <textarea
                    className={`${inputClass} resize-none`}
                    rows={3}
                    placeholder="Description *"
                    value={editForm.description}
                    onChange={(e) =>
                      setEditForm((f) => ({
                        ...f,
                        description: e.target.value,
                      }))
                    }
                  />
                  <input
                    className={inputClass}
                    type="number"
                    min={0}
                    placeholder="Reward Points *"
                    value={editForm.rewardPoints}
                    onChange={(e) =>
                      setEditForm((f) => ({
                        ...f,
                        rewardPoints: e.target.value,
                      }))
                    }
                  />
                  <input
                    className={inputClass}
                    placeholder="Special Reward (optional)"
                    value={editForm.specialReward}
                    onChange={(e) =>
                      setEditForm((f) => ({
                        ...f,
                        specialReward: e.target.value,
                      }))
                    }
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleEdit(c)}
                      disabled={updateChallenge.isPending}
                      className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-gray-900 text-white text-xs font-semibold hover:bg-gray-700 transition-colors disabled:opacity-50"
                    >
                      <Save className="w-3.5 h-3.5" />
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingId(null)}
                      className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-gray-100 text-gray-700 text-xs font-semibold hover:bg-gray-200 transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                /* View Mode */
                <div className="px-4 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {c.title}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                        {c.description}
                      </p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        <span className="text-xs bg-gray-100 text-gray-700 border border-gray-200 px-2 py-0.5 rounded-full">
                          🏆 {Number(c.rewardPoints).toLocaleString()} pts
                        </span>
                        {c.specialReward && (
                          <span className="text-xs bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-full">
                            ⭐ {c.specialReward}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1.5 flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => startEdit(c)}
                        className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-800 transition-colors"
                        aria-label="Edit challenge"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      {confirmDeleteId === c.id ? (
                        <div className="flex gap-1">
                          <button
                            type="button"
                            onClick={() => handleDelete(c.id)}
                            disabled={deleteChallenge.isPending}
                            className="px-2 py-1 rounded text-xs bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50"
                          >
                            Confirm
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(null)}
                            className="px-2 py-1 rounded text-xs bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(c.id)}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors"
                          aria-label="Delete challenge"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
