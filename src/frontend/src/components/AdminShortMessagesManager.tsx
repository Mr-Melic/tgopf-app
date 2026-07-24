import {
  Check,
  ChevronDown,
  ChevronUp,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  useAddShortMessage,
  useDeleteShortMessage,
  useListShortMessages,
  useUpdateShortMessage,
} from "../hooks/useQueries";

const MAX_CHARS = 280;
const PREVIEW_LEN = 80;

export default function AdminShortMessagesManager() {
  const { data: messages, isLoading } = useListShortMessages();
  const addMsg = useAddShortMessage();
  const updateMsg = useUpdateShortMessage();
  const deleteMsg = useDeleteShortMessage();

  const [showAddForm, setShowAddForm] = useState(false);
  const [addText, setAddText] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");

  // Search / index / collapse state
  const [searchTerm, setSearchTerm] = useState("");
  const [listExpanded, setListExpanded] = useState(false);
  const [highlightedNum, setHighlightedNum] = useState<number | null>(null);

  const listRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Record<number, HTMLLIElement | null>>({});

  // Sort by createdAt ascending → stable sequential numbering
  const sorted = [...(messages ?? [])].sort((a, b) =>
    a.createdAt < b.createdAt ? -1 : a.createdAt > b.createdAt ? 1 : 0,
  );

  const totalCount = sorted.length;

  // Derive filtered list + whether search is active
  const searchLower = searchTerm.trim().toLowerCase();
  const searchNum = /^\d+$/.test(searchTerm.trim())
    ? Number.parseInt(searchTerm.trim(), 10)
    : null;

  const filtered = searchLower
    ? sorted.filter((msg, idx) => {
        const num = idx + 1;
        if (searchNum !== null && num === searchNum) return true;
        return msg.text.toLowerCase().includes(searchLower);
      })
    : sorted;

  // Show list when search active or explicitly toggled
  const showList = listExpanded || searchLower.length > 0;

  // When search is cleared, collapse back (unless user explicitly expanded)
  const prevSearchRef = useRef(searchLower);
  useEffect(() => {
    if (prevSearchRef.current.length > 0 && searchLower.length === 0) {
      setListExpanded(false);
      setHighlightedNum(null);
    }
    prevSearchRef.current = searchLower;
  }, [searchLower]);

  // When searching by number, set highlight
  useEffect(() => {
    if (searchNum !== null && searchNum >= 1 && searchNum <= totalCount) {
      setHighlightedNum(searchNum);
    } else {
      setHighlightedNum(null);
    }
  }, [searchNum, totalCount]);

  // Scroll to highlighted item
  const scrollToNum = useCallback((num: number) => {
    setHighlightedNum(num);
    setListExpanded(true);
    setSearchTerm(String(num));
    requestAnimationFrame(() => {
      itemRefs.current[num]?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    });
  }, []);

  // After list becomes visible, scroll if needed
  useEffect(() => {
    if (highlightedNum && showList) {
      requestAnimationFrame(() => {
        itemRefs.current[highlightedNum]?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      });
    }
  }, [highlightedNum, showList]);

  // ── handlers ──────────────────────────────────────────────────────────────

  const handleAdd = async () => {
    const trimmed = addText.trim();
    if (!trimmed) return;
    await addMsg.mutateAsync(trimmed);
    setAddText("");
    setShowAddForm(false);
  };

  const startEdit = (id: string, text: string) => {
    setEditingId(id);
    setEditText(text);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditText("");
  };

  const handleUpdate = async (id: string) => {
    const trimmed = editText.trim();
    if (!trimmed) return;
    await updateMsg.mutateAsync({ id, text: trimmed });
    setEditingId(null);
    setEditText("");
  };

  const handleDelete = (id: string) => {
    if (!window.confirm("Delete this short message?")) return;
    deleteMsg.mutate(id);
  };

  // ── render ─────────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <p className="text-sm" style={{ color: "#6b7280" }}>
        Loading messages…
      </p>
    );
  }

  return (
    <div className="space-y-4" style={{ color: "#111", background: "#fff" }}>
      {/* ── Search field ─────────────────────────────────────────────────── */}
      <div className="relative">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
          style={{ color: "#9ca3af" }}
        />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by text or number…"
          data-ocid="admin-short-messages-search"
          className="w-full pl-9 pr-9 py-2 text-sm rounded-lg border focus:outline-none focus:ring-2 focus:ring-amber-400"
          style={{ borderColor: "#d1d5db", background: "#fff", color: "#111" }}
        />
        {searchTerm && (
          <button
            type="button"
            onClick={() => setSearchTerm("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded hover:bg-gray-100 transition-colors"
            aria-label="Clear search"
          >
            <X className="w-3.5 h-3.5" style={{ color: "#6b7280" }} />
          </button>
        )}
      </div>

      {/* ── Matrix index — rows of 100, scroll both axes ─────────────────── */}
      {totalCount > 0 && (
        <div
          className="overflow-x-auto overflow-y-auto pb-1"
          style={{ maxHeight: 220, scrollbarWidth: "thin" }}
          aria-label="Message number index — rows of 100"
        >
          {/* One flex row per 100 items; each row scrolls horizontally */}
          {Array.from({ length: Math.ceil(totalCount / 100) }, (_, rowIdx) => {
            const rowStart = rowIdx * 100;
            const rowEnd = Math.min(rowStart + 100, totalCount);
            return (
              <div
                key={rowIdx}
                className="flex gap-1 mb-1 flex-nowrap"
                style={{ minWidth: "max-content" }}
              >
                {sorted.slice(rowStart, rowEnd).map((_, colIdx) => {
                  const num = rowStart + colIdx + 1;
                  const isActive = highlightedNum === num;
                  return (
                    <button
                      key={num}
                      type="button"
                      onClick={() => scrollToNum(num)}
                      data-ocid={`admin-short-message-index-${num}`}
                      className="flex-shrink-0 w-7 h-7 text-xs rounded font-mono font-semibold transition-colors"
                      style={{
                        background: isActive ? "#f59e0b" : "#f3f4f6",
                        color: isActive ? "#fff" : "#374151",
                        border: isActive
                          ? "1px solid #f59e0b"
                          : "1px solid #e5e7eb",
                      }}
                      title={`Go to message #${num}`}
                    >
                      {num}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Expand / collapse toggle ──────────────────────────────────────── */}
      {totalCount > 0 && (
        <button
          type="button"
          onClick={() => {
            setListExpanded((v) => !v);
            if (listExpanded) {
              setHighlightedNum(null);
              setSearchTerm("");
            }
          }}
          className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide px-3 py-1.5 rounded-full transition-colors"
          style={{
            background: "#f3f4f6",
            color: "#374151",
            border: "1px solid #e5e7eb",
          }}
          data-ocid="admin-short-messages-toggle"
        >
          {showList ? (
            <>
              <ChevronUp className="w-3.5 h-3.5" /> Hide messages
            </>
          ) : (
            <>
              <ChevronDown className="w-3.5 h-3.5" /> Show all {totalCount}{" "}
              message{totalCount !== 1 ? "s" : ""}
            </>
          )}
        </button>
      )}

      {/* ── Message list ──────────────────────────────────────────────────── */}
      {showList && (
        <div ref={listRef}>
          {filtered.length === 0 ? (
            <p className="text-sm italic py-2" style={{ color: "#9ca3af" }}>
              No messages match your search.
            </p>
          ) : (
            <ul className="divide-y divide-gray-100 rounded-lg overflow-hidden border border-gray-200">
              {filtered.map((msg) => {
                const num = sorted.findIndex((m) => m.id === msg.id) + 1;
                const isHighlighted = highlightedNum === num;
                const isEditing = editingId === msg.id;
                const date = new Date(
                  Number(msg.createdAt) / 1_000_000,
                ).toLocaleDateString("en-GB", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                });

                return (
                  <li
                    key={msg.id}
                    ref={(el) => {
                      itemRefs.current[num] = el;
                    }}
                    className="px-4 py-3 transition-colors"
                    style={{
                      background: isHighlighted ? "#fef9c3" : "#fff",
                      borderLeft: isHighlighted
                        ? "3px solid #f59e0b"
                        : "3px solid transparent",
                    }}
                    data-ocid={`admin-short-message-item-${num}`}
                  >
                    {isEditing ? (
                      /* ── Edit mode ── */
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className="text-xs font-bold font-mono px-1.5 py-0.5 rounded"
                            style={{ background: "#f3f4f6", color: "#6b7280" }}
                          >
                            #{num}
                          </span>
                        </div>
                        <textarea
                          ref={(el) => {
                            el?.focus();
                          }}
                          className="w-full text-sm rounded-lg p-2 resize-none focus:outline-none focus:ring-2 focus:ring-amber-400"
                          style={{
                            border: "1px solid #d1d5db",
                            background: "#fff",
                            color: "#111",
                          }}
                          rows={3}
                          maxLength={MAX_CHARS}
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                        />
                        <div className="flex items-center justify-between">
                          <span
                            className="text-xs"
                            style={{ color: "#9ca3af" }}
                          >
                            {editText.length}/{MAX_CHARS}
                          </span>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={cancelEdit}
                              className="flex items-center gap-1 px-3 py-1 text-xs rounded-full transition-colors"
                              style={{
                                border: "1px solid #d1d5db",
                                color: "#374151",
                                background: "#fff",
                              }}
                            >
                              <X className="w-3 h-3" /> Cancel
                            </button>
                            <button
                              type="button"
                              onClick={() => handleUpdate(msg.id)}
                              disabled={updateMsg.isPending}
                              className="flex items-center gap-1 px-3 py-1 text-xs rounded-full transition-colors disabled:opacity-50"
                              style={{ background: "#111", color: "#fff" }}
                            >
                              <Check className="w-3 h-3" /> Save
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* ── View mode ── */
                      <div className="flex items-start gap-3">
                        {/* Number badge */}
                        <span
                          className="flex-shrink-0 text-xs font-bold font-mono px-1.5 py-0.5 rounded mt-0.5"
                          style={{
                            background: isHighlighted ? "#f59e0b" : "#f3f4f6",
                            color: isHighlighted ? "#fff" : "#6b7280",
                          }}
                        >
                          #{num}
                        </span>

                        {/* Text + date */}
                        <div className="flex-1 min-w-0">
                          <p
                            className="text-sm leading-relaxed break-words"
                            style={{ color: "#111" }}
                          >
                            {msg.text.length > PREVIEW_LEN
                              ? `${msg.text.slice(0, PREVIEW_LEN)}…`
                              : msg.text}
                          </p>
                          <p
                            className="text-xs mt-0.5"
                            style={{ color: "#9ca3af" }}
                          >
                            {date}
                          </p>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-1 flex-shrink-0">
                          <button
                            type="button"
                            onClick={() => startEdit(msg.id, msg.text)}
                            className="p-1.5 rounded transition-colors hover:bg-amber-50"
                            style={{ color: "#9ca3af" }}
                            aria-label={`Edit message #${num}`}
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(msg.id)}
                            className="p-1.5 rounded transition-colors hover:bg-red-50"
                            style={{ color: "#9ca3af" }}
                            aria-label={`Delete message #${num}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}

      {/* ── Empty state ───────────────────────────────────────────────────── */}
      {totalCount === 0 && !isLoading && (
        <p className="text-sm italic" style={{ color: "#9ca3af" }}>
          No short messages yet. Add one below.
        </p>
      )}

      {/* ── Add new message ───────────────────────────────────────────────── */}
      {showAddForm ? (
        <div
          className="rounded-lg p-4 space-y-2"
          style={{ border: "1px solid #e5e7eb", background: "#f9fafb" }}
        >
          <label
            className="block text-xs font-semibold uppercase tracking-wide"
            style={{ color: "#374151" }}
          >
            New Message
          </label>
          <textarea
            ref={(el) => {
              el?.focus();
            }}
            className="w-full text-sm rounded-lg p-2 resize-none focus:outline-none focus:ring-2 focus:ring-amber-400"
            style={{
              border: "1px solid #d1d5db",
              background: "#fff",
              color: "#111",
            }}
            rows={4}
            maxLength={MAX_CHARS}
            placeholder="Write a short message (max 280 characters)…"
            value={addText}
            onChange={(e) => setAddText(e.target.value)}
            autoComplete="off"
          />
          <div className="flex items-center justify-between">
            <span className="text-xs" style={{ color: "#9ca3af" }}>
              {addText.length}/{MAX_CHARS}
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(false);
                  setAddText("");
                }}
                className="flex items-center gap-1 px-3 py-1.5 text-xs rounded-full transition-colors"
                style={{
                  border: "1px solid #d1d5db",
                  color: "#374151",
                  background: "#fff",
                }}
              >
                <X className="w-3 h-3" /> Cancel
              </button>
              <button
                type="button"
                onClick={handleAdd}
                disabled={addMsg.isPending || !addText.trim()}
                className="flex items-center gap-1 px-3 py-1.5 text-xs rounded-full transition-colors disabled:opacity-50"
                style={{ background: "#111", color: "#fff" }}
              >
                <Check className="w-3 h-3" /> Save Message
              </button>
            </div>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-2 px-4 py-2 text-sm rounded-full transition-colors hover:opacity-80"
          style={{ background: "#111", color: "#fff" }}
          data-ocid="admin-add-short-message-btn"
        >
          <Plus className="w-4 h-4" /> Add Message
        </button>
      )}
    </div>
  );
}
