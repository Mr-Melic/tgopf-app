import { Gamepad2, Image, Pencil, Plus, Save, Trash2, X } from "lucide-react";
import { useRef, useState } from "react";
import { useFileUpload, useFileUrl } from "../blob-storage/FileStorage";
import {
  type Game,
  useAddGame,
  useDeleteGame,
  useGetGameReactionCounts,
  useGetGames,
  useUpdateGame,
} from "../hooks/useGameQueries";

// ─── Types ────────────────────────────────────────────────────────────────────

interface GameFormState {
  title: string;
  gameType: string;
  playerCount: string;
  materialsRequired: string;
  imageUrl: string | null;
  rules: string[];
}

const emptyForm: GameFormState = {
  title: "",
  gameType: "",
  playerCount: "",
  materialsRequired: "",
  imageUrl: null,
  rules: ["", "", ""],
};

// ─── Shared styles ────────────────────────────────────────────────────────────

const inputClass =
  "w-full px-3 py-2 rounded-lg bg-white border border-gray-300 text-gray-900 text-sm placeholder-gray-400 focus:outline-none focus:border-gray-600 focus:ring-1 focus:ring-gray-400 transition-colors font-[AdobeJensonPro,serif]";

// ─── Rules editor ─────────────────────────────────────────────────────────────

interface RulesEditorProps {
  rules: string[];
  onChange: (rules: string[]) => void;
  showValidationError?: boolean;
}

function RulesEditor({
  rules,
  onChange,
  showValidationError,
}: RulesEditorProps) {
  const handleChange = (index: number, value: string) => {
    const next = [...rules];
    next[index] = value;
    onChange(next);
  };

  const handleRemove = (index: number) => {
    const next = rules.filter((_, i) => i !== index);
    onChange(next);
  };

  const handleAdd = () => {
    onChange([...rules, ""]);
  };

  const filledCount = rules.filter((r) => r.trim().length > 0).length;
  const needsMore = filledCount < 3;

  return (
    <div className="space-y-2">
      <label className="text-xs font-semibold text-gray-700 font-[AdobeJensonPro,serif]">
        Rules{" "}
        <span className="text-gray-400 font-normal">(minimum 3 required)</span>
      </label>

      {rules.map((rule, idx) => (
        <div key={idx} className="flex items-center gap-2">
          <span className="text-xs text-gray-400 w-5 flex-shrink-0 text-right">
            {idx + 1}.
          </span>
          <input
            className={inputClass}
            placeholder={`Rule ${idx + 1}`}
            value={rule}
            onChange={(e) => handleChange(idx, e.target.value)}
            data-ocid={`admin-game-rule-input-${idx}`}
          />
          <button
            type="button"
            onClick={() => handleRemove(idx)}
            className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded text-red-500 hover:bg-red-50 hover:text-red-700 transition-colors"
            aria-label={`Remove rule ${idx + 1}`}
            data-ocid={`admin-game-rule-remove-${idx}`}
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}

      <button
        type="button"
        onClick={handleAdd}
        className="flex items-center gap-1.5 text-xs text-amber-700 hover:text-amber-900 transition-colors mt-1"
        data-ocid="admin-game-rule-add"
      >
        <Plus className="w-3.5 h-3.5" />
        Add Rule
      </button>

      {showValidationError && needsMore && (
        <p className="text-xs text-red-600 font-[AdobeJensonPro,serif]">
          Please fill in at least 3 rules before saving.
        </p>
      )}
    </div>
  );
}

// ─── Game image preview ───────────────────────────────────────────────────────

function GameImagePreview({ path }: { path: string }) {
  const { data: url, isLoading } = useFileUrl(path);
  if (isLoading) {
    return (
      <div className="w-12 h-12 rounded-lg bg-gray-200 animate-pulse flex-shrink-0" />
    );
  }
  if (!url) return null;
  return (
    <img
      src={url}
      alt="Game"
      className="w-12 h-12 object-cover rounded-lg flex-shrink-0 border border-gray-200"
      draggable={false}
    />
  );
}

// ─── Reaction summary for a single game ──────────────────────────────────────

function GameReactionSummary({ gameId }: { gameId: string }) {
  const { data } = useGetGameReactionCounts(gameId);
  if (!data) return <span className="text-gray-400 text-xs">—</span>;
  return (
    <span className="text-xs text-gray-500 space-x-2">
      <span>❤️ {Number(data.love)}</span>
      <span>👍 {Number(data.like)}</span>
      <span>😂 {Number(data.laugh)}</span>
      <span>👎 {Number(data.dislike)}</span>
    </span>
  );
}

// ─── Image upload field ───────────────────────────────────────────────────────

interface ImageUploadFieldProps {
  currentImageUrl: string | null;
  onImageUploaded: (path: string) => void;
  onImageRemoved: () => void;
  gameIdPrefix?: string;
}

function ImageUploadField({
  currentImageUrl,
  onImageUploaded,
  onImageRemoved,
  gameIdPrefix = "new",
}: ImageUploadFieldProps) {
  const { uploadFile, isUploading } = useFileUpload();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError(null);
    setUploadProgress(0);
    try {
      const path = `games/${gameIdPrefix}-${Date.now()}-${file.name.replace(/\s+/g, "_")}`;
      const result = await uploadFile(path, file, (pct) =>
        setUploadProgress(pct),
      );
      onImageUploaded(result.path);
    } catch {
      setUploadError("Upload failed. Please try again.");
    } finally {
      setUploadProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-2">
      <label className="text-xs text-gray-600 font-medium font-[AdobeJensonPro,serif]">
        Image (optional)
      </label>
      {currentImageUrl ? (
        <div className="flex items-center gap-3">
          <GameImagePreview path={currentImageUrl} />
          <div className="flex flex-col gap-1">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="text-xs text-amber-700 hover:underline"
            >
              Replace
            </button>
            <button
              type="button"
              onClick={onImageRemoved}
              className="text-xs text-red-600 hover:underline"
            >
              Remove
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="flex items-center gap-2 w-full px-3 py-2 rounded-lg border border-dashed border-gray-300 hover:border-gray-500 text-gray-500 text-xs transition-colors disabled:opacity-50 bg-white"
          data-ocid="admin-game-image-upload-btn"
        >
          <Image className="w-3.5 h-3.5 flex-shrink-0" />
          {isUploading ? `Uploading… ${uploadProgress}%` : "Upload image"}
        </button>
      )}
      {isUploading && (
        <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
          <div
            className="h-1.5 bg-amber-600 transition-all duration-200 rounded-full"
            style={{ width: `${uploadProgress}%` }}
          />
        </div>
      )}
      {uploadError && <p className="text-xs text-red-600">{uploadError}</p>}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
}

// ─── Add Game Form ────────────────────────────────────────────────────────────

interface AddGameFormProps {
  onClose: () => void;
}

function AddGameForm({ onClose }: AddGameFormProps) {
  const [form, setForm] = useState<GameFormState>(emptyForm);
  const [showRulesError, setShowRulesError] = useState(false);
  const addGame = useAddGame();

  const setField = (key: keyof GameFormState, value: string | null) =>
    setForm((f) => ({ ...f, [key]: value as string }));

  const filledRules = form.rules.filter((r) => r.trim().length > 0);
  const canSubmit =
    form.title.trim() &&
    form.gameType.trim() &&
    form.playerCount.trim() &&
    form.materialsRequired.trim() &&
    filledRules.length >= 3;

  const handleSubmit = async () => {
    setShowRulesError(true);
    if (!canSubmit) return;
    await addGame.mutateAsync({
      title: form.title.trim(),
      gameType: form.gameType.trim(),
      playerCount: form.playerCount.trim(),
      materialsRequired: form.materialsRequired.trim(),
      imageUrl: form.imageUrl,
      rules: filledRules,
    });
    onClose();
  };

  return (
    <div className="p-4 rounded-xl border border-amber-300 bg-amber-50 space-y-3">
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-semibold text-amber-800 font-[AdobeJensonPro,serif]">
          New Game
        </span>
        <button
          type="button"
          onClick={onClose}
          className="text-gray-500 hover:text-gray-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <input
        className={inputClass}
        placeholder="Game Title *"
        value={form.title}
        onChange={(e) => setField("title", e.target.value)}
        data-ocid="admin-game-add-title"
      />
      <input
        className={inputClass}
        placeholder="Game description * (e.g. Board Game, Card Game, Outdoor)"
        value={form.gameType}
        onChange={(e) => setField("gameType", e.target.value)}
        data-ocid="admin-game-add-type"
      />
      <input
        className={inputClass}
        placeholder="Player(s) Number * (e.g. 2–4 players)"
        value={form.playerCount}
        onChange={(e) => setField("playerCount", e.target.value)}
        data-ocid="admin-game-add-players"
      />
      <textarea
        className={`${inputClass} resize-none`}
        rows={3}
        placeholder="Materials Required *"
        value={form.materialsRequired}
        onChange={(e) => setField("materialsRequired", e.target.value)}
        data-ocid="admin-game-add-materials"
      />

      <RulesEditor
        rules={form.rules}
        onChange={(rules) => setForm((f) => ({ ...f, rules }))}
        showValidationError={showRulesError}
      />

      <ImageUploadField
        currentImageUrl={form.imageUrl}
        onImageUploaded={(path) => setField("imageUrl", path)}
        onImageRemoved={() => setField("imageUrl", null)}
        gameIdPrefix="new"
      />

      <button
        type="button"
        onClick={handleSubmit}
        disabled={addGame.isPending}
        className="w-full py-2 rounded-lg bg-gray-900 text-white text-sm font-semibold hover:bg-gray-700 transition-colors disabled:opacity-50 font-[AdobeJensonPro,serif]"
        data-ocid="admin-game-add-submit"
      >
        {addGame.isPending ? "Saving…" : "Add Game"}
      </button>
    </div>
  );
}

// ─── Game row (view + inline edit) ───────────────────────────────────────────

interface GameRowProps {
  game: Game;
  isEditing: boolean;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  confirmDeleteId: string | null;
  onRequestDelete: () => void;
  onCancelDelete: () => void;
  onConfirmDelete: () => void;
}

function GameRow({
  game,
  isEditing,
  onStartEdit,
  onCancelEdit,
  confirmDeleteId,
  onRequestDelete,
  onCancelDelete,
  onConfirmDelete,
}: GameRowProps) {
  const updateGame = useUpdateGame();
  const [showRulesError, setShowRulesError] = useState(false);
  const [editForm, setEditForm] = useState<GameFormState>({
    title: game.title,
    gameType: game.gameType,
    playerCount: game.playerCount,
    materialsRequired: game.materialsRequired,
    imageUrl: game.imageUrl ?? null,
    rules: game.rules && game.rules.length > 0 ? [...game.rules] : ["", "", ""],
  });

  const setField = (key: keyof GameFormState, value: string | null) =>
    setEditForm((f) => ({ ...f, [key]: value as string }));

  const filledRules = editForm.rules.filter((r) => r.trim().length > 0);
  const canSave =
    editForm.title.trim() &&
    editForm.gameType.trim() &&
    editForm.playerCount.trim() &&
    editForm.materialsRequired.trim() &&
    filledRules.length >= 3;

  const handleSave = async () => {
    setShowRulesError(true);
    if (!canSave) return;
    await updateGame.mutateAsync({
      id: game.id,
      title: editForm.title.trim(),
      gameType: editForm.gameType.trim(),
      playerCount: editForm.playerCount.trim(),
      materialsRequired: editForm.materialsRequired.trim(),
      imageUrl: editForm.imageUrl,
      rules: filledRules,
    });
    onCancelEdit();
  };

  const isConfirmingDelete = confirmDeleteId === game.id;

  return (
    <div
      className="rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm"
      data-ocid={`admin-game-row-${game.id}`}
    >
      {isEditing ? (
        /* ── Edit mode ── */
        <div className="p-4 space-y-3 bg-blue-50 border-l-4 border-blue-400">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-blue-700 font-semibold font-[AdobeJensonPro,serif]">
              Editing: {game.title}
            </span>
            <button
              type="button"
              onClick={onCancelEdit}
              className="text-gray-500 hover:text-gray-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <input
            className={inputClass}
            placeholder="Game Title *"
            value={editForm.title}
            onChange={(e) => setField("title", e.target.value)}
          />
          <input
            className={inputClass}
            placeholder="Game description *"
            value={editForm.gameType}
            onChange={(e) => setField("gameType", e.target.value)}
          />
          <input
            className={inputClass}
            placeholder="Player(s) Number *"
            value={editForm.playerCount}
            onChange={(e) => setField("playerCount", e.target.value)}
          />
          <textarea
            className={`${inputClass} resize-none`}
            rows={3}
            placeholder="Materials Required *"
            value={editForm.materialsRequired}
            onChange={(e) => setField("materialsRequired", e.target.value)}
          />

          <RulesEditor
            rules={editForm.rules}
            onChange={(rules) => setEditForm((f) => ({ ...f, rules }))}
            showValidationError={showRulesError}
          />

          <ImageUploadField
            currentImageUrl={editForm.imageUrl}
            onImageUploaded={(path) => setField("imageUrl", path)}
            onImageRemoved={() => setField("imageUrl", null)}
            gameIdPrefix={game.id}
          />

          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleSave}
              disabled={updateGame.isPending}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-gray-900 text-white text-xs font-semibold hover:bg-gray-700 transition-colors disabled:opacity-50"
              data-ocid={`admin-game-edit-save-${game.id}`}
            >
              <Save className="w-3.5 h-3.5" />
              {updateGame.isPending ? "Saving…" : "Save"}
            </button>
            <button
              type="button"
              onClick={onCancelEdit}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-gray-100 text-gray-700 text-xs font-semibold hover:bg-gray-200 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
              Cancel
            </button>
          </div>
        </div>
      ) : (
        /* ── View mode ── */
        <div className="px-4 py-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              {game.imageUrl && <GameImagePreview path={game.imageUrl} />}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate font-[AdobeJensonPro,serif]">
                  {game.title}
                </p>
                <div className="flex flex-wrap gap-2 mt-1">
                  <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full border border-gray-200">
                    🎮 {game.gameType}
                  </span>
                  <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full border border-gray-200">
                    👥 {game.playerCount}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1 line-clamp-1">
                  {game.materialsRequired}
                </p>
                {/* Rules chips — compact preview */}
                {game.rules && game.rules.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {game.rules.slice(0, 3).map((rule, i) => (
                      <span
                        key={i}
                        className="text-xs bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-full truncate max-w-[120px]"
                      >
                        {rule}
                      </span>
                    ))}
                    {game.rules.length > 3 && (
                      <span className="text-xs text-gray-400">
                        +{game.rules.length - 3} more
                      </span>
                    )}
                  </div>
                )}
                <div className="mt-1.5">
                  <GameReactionSummary gameId={game.id} />
                </div>
              </div>
            </div>

            <div className="flex gap-1.5 flex-shrink-0">
              <button
                type="button"
                onClick={onStartEdit}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-800 transition-colors"
                aria-label="Edit game"
                data-ocid={`admin-game-edit-btn-${game.id}`}
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>

              {isConfirmingDelete ? (
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={onConfirmDelete}
                    className="px-2 py-1 rounded text-xs bg-red-600 text-white hover:bg-red-700 transition-colors"
                    data-ocid={`admin-game-delete-confirm-${game.id}`}
                  >
                    Confirm
                  </button>
                  <button
                    type="button"
                    onClick={onCancelDelete}
                    className="px-2 py-1 rounded text-xs bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={onRequestDelete}
                  className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors"
                  aria-label="Delete game"
                  data-ocid={`admin-game-delete-btn-${game.id}`}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AdminGamesManager() {
  const { data: games, isLoading } = useGetGames();
  const deleteGame = useDeleteGame();

  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    await deleteGame.mutateAsync(id);
    setConfirmDeleteId(null);
  };

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Gamepad2 className="w-4 h-4 text-gray-600" />
          <p className="text-xs text-gray-500 font-[AdobeJensonPro,serif]">
            Manage games shown in the Experience Hub Games block. Each game
            appears in true random order.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setShowAddForm(true);
            setEditingId(null);
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-900 text-white text-xs font-semibold hover:bg-gray-700 transition-colors whitespace-nowrap font-[AdobeJensonPro,serif]"
          data-ocid="admin-games-add-btn"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Game
        </button>
      </div>

      {/* Add form */}
      {showAddForm && <AddGameForm onClose={() => setShowAddForm(false)} />}

      {/* Game list */}
      {isLoading ? (
        <div className="space-y-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-16 rounded-xl bg-gray-100 animate-pulse"
            />
          ))}
        </div>
      ) : !games || games.length === 0 ? (
        <div
          className="text-center py-10 text-gray-400"
          data-ocid="admin-games-empty"
        >
          <Gamepad2 className="w-8 h-8 mx-auto mb-3 opacity-30" />
          <p className="text-sm font-[AdobeJensonPro,serif] text-gray-500">
            No games yet.
          </p>
          <p className="text-xs mt-1 text-gray-400 font-[AdobeJensonPro,serif]">
            Click "Add Game" to create your first game block.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {games.map((game) => (
            <GameRow
              key={game.id}
              game={game}
              isEditing={editingId === game.id}
              onStartEdit={() => {
                setEditingId(game.id);
                setConfirmDeleteId(null);
              }}
              onCancelEdit={() => setEditingId(null)}
              confirmDeleteId={confirmDeleteId}
              onRequestDelete={() => {
                setConfirmDeleteId(game.id);
                setEditingId(null);
              }}
              onCancelDelete={() => setConfirmDeleteId(null)}
              onConfirmDelete={() => handleDelete(game.id)}
            />
          ))}
        </div>
      )}

      {/* Footer count */}
      {games && games.length > 0 && (
        <p className="text-xs text-gray-400 text-right font-[AdobeJensonPro,serif]">
          {games.length} game{games.length !== 1 ? "s" : ""} total
        </p>
      )}
    </div>
  );
}
