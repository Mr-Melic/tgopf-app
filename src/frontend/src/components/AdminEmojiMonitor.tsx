import { useMutation, useQuery } from "@tanstack/react-query";
import { Activity, RefreshCw, Save, SmilePlus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { EmojiBreakdown } from "../backend";
import { useActor } from "../hooks/useActor";
import {
  useDistributeEmojiManually,
  useGetDistributionPreview,
} from "../hooks/useQueries";

// ─── Types ───────────────────────────────────────────────────────────────────

interface InflationSummary {
  totalAutomated: bigint;
  totalUser: bigint;
  bySection: Array<[string, EmojiBreakdown]>;
}

interface InflationStats {
  lastRunTime: bigint;
  automatedCounts: Array<[string, bigint]>;
  userCounts: Array<[string, bigint]>;
  launchTime: bigint;
  totalEntities: bigint;
}

const SECTION_LABELS: Record<string, string> = {
  review_v2: "Reviews",
  reflection: "Reflection Challenges",
  author_note: "Author Notes",
  game: "Games",
};

const ALL_SECTIONS = ["review_v2", "reflection", "author_note", "game"];

const EMPTY_BREAKDOWN: EmojiBreakdown = {
  userLove: 0n,
  userLike: 0n,
  userLaugh: 0n,
  userDislike: 0n,
  autoLove: 0n,
  autoLike: 0n,
  autoLaugh: 0n,
  autoDislike: 0n,
};

// ─── Hooks ───────────────────────────────────────────────────────────────────

function useInflationSummary() {
  const { actor, isFetching } = useActor();
  return useQuery<InflationSummary | null>({
    queryKey: ["inflationSummary"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getInflationSummary();
    },
    enabled: !!actor && !isFetching,
    staleTime: 30_000,
    retry: false,
  });
}

function useInflationStats() {
  const { actor, isFetching } = useActor();
  return useQuery<InflationStats | null>({
    queryKey: ["inflationStats"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getInflationStats() as Promise<InflationStats>;
    },
    enabled: !!actor && !isFetching,
    staleTime: 30_000,
    retry: false,
  });
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function n(v: bigint | undefined): number {
  return v !== undefined ? Number(v) : 0;
}

function emojiTotals(b: EmojiBreakdown) {
  const userTotal =
    n(b.userLove) + n(b.userLike) + n(b.userLaugh) + n(b.userDislike);
  const autoTotal =
    n(b.autoLove) + n(b.autoLike) + n(b.autoLaugh) + n(b.autoDislike);
  return { userTotal, autoTotal };
}

function pct(part: bigint, total: bigint): string {
  if (total === 0n) return "0.0";
  return ((Number(part) / Number(total)) * 100).toFixed(1);
}

function formatTimestamp(ns: bigint): string {
  if (ns === 0n) return "Never";
  const ms = Number(ns / 1_000_000n);
  return new Date(ms).toLocaleString();
}

// ─── Badges ──────────────────────────────────────────────────────────────────

function PctBadge({
  value,
  kind,
}: { value: string; kind: "automated" | "user" }) {
  const isAutomated = kind === "automated";
  const bg = isAutomated ? "#fef3c7" : "#dcfce7";
  const color = isAutomated ? "#92400e" : "#15803d";
  const border = isAutomated ? "#fcd34d" : "#86efac";
  return (
    <span
      className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold"
      style={{ background: bg, color, border: `1px solid ${border}` }}
    >
      {value}%
    </span>
  );
}

// ─── Per-section emoji breakdown panel ───────────────────────────────────────

interface SectionBreakdownProps {
  sectionKey: string;
  counts: EmojiBreakdown;
}

const EMOJI_ROW_CONFIG: {
  key: "love" | "like" | "laugh" | "dislike";
  icon: string;
  label: string;
  userField: keyof EmojiBreakdown;
  autoField: keyof EmojiBreakdown;
}[] = [
  {
    key: "love",
    icon: "❤️",
    label: "Love",
    userField: "userLove",
    autoField: "autoLove",
  },
  {
    key: "like",
    icon: "👍",
    label: "Like",
    userField: "userLike",
    autoField: "autoLike",
  },
  {
    key: "laugh",
    icon: "😂",
    label: "Laugh",
    userField: "userLaugh",
    autoField: "autoLaugh",
  },
  {
    key: "dislike",
    icon: "👎",
    label: "Dislike",
    userField: "userDislike",
    autoField: "autoDislike",
  },
];

function SectionBreakdown({ sectionKey, counts }: SectionBreakdownProps) {
  const { userTotal, autoTotal } = emojiTotals(counts);

  return (
    <div
      className="rounded-xl border border-gray-200 overflow-hidden"
      data-ocid={`emoji-monitor.section.${sectionKey}`}
    >
      {/* Section header */}
      <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
        <span className="text-sm font-semibold text-gray-800">
          {SECTION_LABELS[sectionKey] ?? sectionKey}
        </span>
        <div className="flex items-center gap-3 text-xs text-gray-500">
          <span className="text-amber-700 font-medium">
            Organic: {autoTotal.toLocaleString()}
          </span>
          <span className="text-green-700 font-medium">
            User: {userTotal.toLocaleString()}
          </span>
          <span className="font-semibold text-gray-800">
            Total: {(autoTotal + userTotal).toLocaleString()}
          </span>
        </div>
      </div>

      {/* Per-emoji breakdown table */}
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-white border-b border-gray-100">
            <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Emoji
            </th>
            <th className="px-4 py-2 text-right text-xs font-semibold text-green-700 uppercase tracking-wide">
              User Clicks
            </th>
            <th className="px-4 py-2 text-right text-xs font-semibold text-amber-700 uppercase tracking-wide">
              Organic Inflation
            </th>
            <th className="px-4 py-2 text-right text-xs font-semibold text-gray-600 uppercase tracking-wide">
              Total
            </th>
          </tr>
        </thead>
        <tbody>
          {EMOJI_ROW_CONFIG.map(
            ({ key, icon, label, userField, autoField }, i) => {
              const userVal = n(counts[userField] as bigint);
              const autoVal = n(counts[autoField] as bigint);
              const rowTotal = userVal + autoVal;
              return (
                <tr
                  key={key}
                  className={i % 2 === 0 ? "bg-white" : "bg-gray-50/60"}
                  data-ocid={`emoji-monitor.section.${sectionKey}.emoji.${key}`}
                >
                  <td className="px-4 py-2 text-gray-700 font-medium">
                    <span className="mr-1.5 text-base">{icon}</span>
                    <span className="text-xs text-gray-500">{label}</span>
                  </td>
                  <td className="px-4 py-2 tabular-nums text-right text-green-700 font-medium">
                    {userVal.toLocaleString()}
                  </td>
                  <td className="px-4 py-2 tabular-nums text-right text-amber-700 font-medium">
                    {autoVal.toLocaleString()}
                  </td>
                  <td className="px-4 py-2 tabular-nums text-right text-gray-800 font-semibold">
                    {rowTotal.toLocaleString()}
                  </td>
                </tr>
              );
            },
          )}
        </tbody>
      </table>
    </div>
  );
}

// ─── Inflation Rate Settings ─────────────────────────────────────────────────

const SCALE = 1_000_000_000;

const RATIO_DEFAULTS = {
  loveMin: 1.0,
  loveMax: 2.0,
  likeMin: 0.45,
  likeMax: 0.9,
  laughMin: 0.006,
  laughMax: 0.012,
  dislikeMin: 0.001,
  dislikeMax: 0.003,
};

type RatioField = keyof typeof RATIO_DEFAULTS;

const RATIO_ROWS: {
  label: string;
  icon: string;
  minKey: RatioField;
  maxKey: RatioField;
}[] = [
  { label: "Love", icon: "❤️", minKey: "loveMin", maxKey: "loveMax" },
  { label: "Like", icon: "👍", minKey: "likeMin", maxKey: "likeMax" },
  { label: "Laugh", icon: "😂", minKey: "laughMin", maxKey: "laughMax" },
  { label: "Dislike", icon: "👎", minKey: "dislikeMin", maxKey: "dislikeMax" },
];

function toDisplay(val: bigint): string {
  return (Number(val) / SCALE).toFixed(4).replace(/\.?0+$/, "") || "0";
}

function toBigInt(val: string): bigint {
  const n = Number.parseFloat(val);
  if (Number.isNaN(n)) return 0n;
  return BigInt(Math.round(n * SCALE));
}

function InflationRateSettings() {
  const { actor, isFetching } = useActor();

  const [ratios, setRatios] = useState<Record<RatioField, string>>(
    () =>
      Object.fromEntries(
        Object.entries(RATIO_DEFAULTS).map(([k, v]) => [k, String(v)]),
      ) as Record<RatioField, string>,
  );

  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">(
    "idle",
  );

  const { data: loadedRatios } = useQuery({
    queryKey: ["inflationRatios"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getInflationRatios();
    },
    enabled: !!actor && !isFetching,
    staleTime: 60_000,
    retry: false,
  });

  useEffect(() => {
    if (!loadedRatios) return;
    const r = loadedRatios as unknown as Record<string, bigint>;
    setRatios((prev) => {
      const next = { ...prev };
      for (const key of Object.keys(RATIO_DEFAULTS) as RatioField[]) {
        if (r[key] !== undefined) {
          next[key] = toDisplay(r[key]);
        }
      }
      return next;
    });
  }, [loadedRatios]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("No actor");
      const config = Object.fromEntries(
        Object.keys(RATIO_DEFAULTS).map((k) => [
          k,
          toBigInt(ratios[k as RatioField]),
        ]),
      ) as Record<RatioField, bigint>;
      await actor.setInflationRatios(config);
    },
    onSuccess: () => {
      setSaveStatus("success");
      toast.success("Ratio settings saved!");
      setTimeout(() => setSaveStatus("idle"), 3000);
    },
    onError: (err) => {
      setSaveStatus("error");
      toast.error("Failed to save ratio settings.");
      console.error(err);
      setTimeout(() => setSaveStatus("idle"), 4000);
    },
  });

  return (
    <div
      className="rounded-xl border border-gray-200 bg-white p-4 space-y-3"
      data-ocid="emoji-monitor.ratio-settings.panel"
    >
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-800">
          Inflation Rate Settings
        </h3>
        <div className="flex items-center gap-2">
          {saveStatus === "success" && (
            <span
              className="text-xs font-medium text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full"
              data-ocid="emoji-monitor.ratio-settings.success_state"
            >
              ✓ Saved!
            </span>
          )}
          {saveStatus === "error" && (
            <span
              className="text-xs font-medium text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full"
              data-ocid="emoji-monitor.ratio-settings.error_state"
            >
              Save failed
            </span>
          )}
          <button
            type="button"
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending || !actor}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full border border-gray-300 bg-gray-900 text-white hover:bg-gray-700 transition-colors disabled:opacity-50"
            data-ocid="emoji-monitor.ratio-settings.save_button"
          >
            <Save className="w-3.5 h-3.5" />
            {saveMutation.isPending ? "Saving…" : "Save Ratio Settings"}
          </button>
        </div>
      </div>

      {/* Column headers */}
      <div className="grid grid-cols-[1fr_auto_auto] gap-x-4 gap-y-0 items-center">
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          Emoji Type
        </span>
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide w-20 text-center">
          Min
        </span>
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide w-20 text-center">
          Max
        </span>
      </div>

      {/* Ratio rows */}
      <div className="space-y-2">
        {RATIO_ROWS.map(({ label, icon, minKey, maxKey }) => (
          <div
            key={label}
            className="grid grid-cols-[1fr_auto_auto] gap-x-4 items-center py-1.5 px-2 rounded-lg hover:bg-gray-50 transition-colors"
            data-ocid={`emoji-monitor.ratio-settings.row.${label.toLowerCase()}`}
          >
            <span className="text-sm text-gray-800 font-medium">
              <span className="mr-1.5">{icon}</span>
              {label}
            </span>
            <div className="flex items-center gap-1.5 w-20">
              <label className="text-xs text-gray-400 w-6 shrink-0">Min</label>
              <input
                type="number"
                step="0.001"
                min="0"
                value={ratios[minKey]}
                onChange={(e) =>
                  setRatios((prev) => ({ ...prev, [minKey]: e.target.value }))
                }
                className="w-full text-xs border border-gray-300 rounded px-2 py-1 text-gray-900 bg-white focus:outline-none focus:ring-1 focus:ring-gray-400 tabular-nums"
                data-ocid={`emoji-monitor.ratio-settings.${label.toLowerCase()}_min.input`}
              />
            </div>
            <div className="flex items-center gap-1.5 w-20">
              <label className="text-xs text-gray-400 w-6 shrink-0">Max</label>
              <input
                type="number"
                step="0.001"
                min="0"
                value={ratios[maxKey]}
                onChange={(e) =>
                  setRatios((prev) => ({ ...prev, [maxKey]: e.target.value }))
                }
                className="w-full text-xs border border-gray-300 rounded px-2 py-1 text-gray-900 bg-white focus:outline-none focus:ring-1 focus:ring-gray-400 tabular-nums"
                data-ocid={`emoji-monitor.ratio-settings.${label.toLowerCase()}_max.input`}
              />
            </div>
          </div>
        ))}
      </div>

      <p className="text-xs text-gray-400 leading-relaxed border-l-2 border-gray-200 pl-3">
        Each content block draws a{" "}
        <strong className="text-gray-600">true-random value</strong> within the
        min–max range per emoji type, so growth varies naturally across items.
        Changes take effect from the next session.
      </p>
    </div>
  );
}

// ─── Section label map for distribution ─────────────────────────────────────

const DIST_SECTIONS: { value: string; label: string }[] = [
  { value: "review_v2", label: "Reviews" },
  { value: "reflection", label: "Challenges" },
  { value: "author_note", label: "Author Notes" },
  { value: "game", label: "Games" },
];

interface PreviewRow {
  itemId: string;
  title: string;
  additions: Record<string, number>;
}

function ManualEmojiDistribution() {
  const [section, setSection] = useState("review_v2");
  const [amount, setAmount] = useState("");
  const [previewRows, setPreviewRows] = useState<PreviewRow[]>([]);
  const [confirming, setConfirming] = useState(false);

  const distributeMutation = useDistributeEmojiManually();
  const previewMutation = useGetDistributionPreview();

  const parsedAmount = Number.parseInt(amount, 10);
  const isValid = !Number.isNaN(parsedAmount) && parsedAmount > 0;

  const handlePreview = async () => {
    if (!isValid) return;
    try {
      const result = await previewMutation.mutateAsync({
        section,
        amount: parsedAmount,
      });
      // Result is an array of [itemId, title, additions] tuples from backend
      const rows = (
        result as Array<[string, string, Record<string, number>]>
      ).map(([itemId, title, additions]) => ({ itemId, title, additions }));
      setPreviewRows(rows);
    } catch {
      toast.error("Failed to load preview.");
    }
  };

  const handleDistribute = async () => {
    if (!isValid) return;
    setConfirming(true);
  };

  const handleConfirm = async () => {
    setConfirming(false);
    try {
      await distributeMutation.mutateAsync({ section, amount: parsedAmount });
      toast.success(
        `${parsedAmount} reactions distributed across ${DIST_SECTIONS.find((s) => s.value === section)?.label ?? section}!`,
      );
      setPreviewRows([]);
      setAmount("");
    } catch {
      toast.error("Distribution failed. Please try again.");
    }
  };

  const sectionLabel =
    DIST_SECTIONS.find((s) => s.value === section)?.label ?? section;

  return (
    <div
      className="rounded-xl border border-gray-200 bg-white p-4 space-y-4"
      data-ocid="emoji-monitor.manual-distribution.panel"
    >
      <div className="flex items-center gap-2">
        <SmilePlus className="w-4 h-4 text-gray-600" />
        <h3 className="text-sm font-semibold text-gray-800">
          Manual Emoji Distribution
        </h3>
        <span className="text-xs text-gray-400 font-normal">
          Adds to existing counts — nothing is wiped
        </span>
      </div>

      <div className="grid grid-cols-[1fr_auto] gap-3 items-end">
        {/* Section selector */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">
            Section
          </label>
          <select
            value={section}
            onChange={(e) => {
              setSection(e.target.value);
              setPreviewRows([]);
            }}
            className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-400"
            data-ocid="emoji-monitor.manual-distribution.select"
          >
            {DIST_SECTIONS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>

        {/* Amount input */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">
            Reactions to add
          </label>
          <input
            type="number"
            min="1"
            step="1"
            placeholder="e.g. 500"
            value={amount}
            onChange={(e) => {
              setAmount(e.target.value);
              setPreviewRows([]);
            }}
            className="w-40 text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-400 tabular-nums"
            data-ocid="emoji-monitor.manual-distribution.amount.input"
          />
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handlePreview}
          disabled={!isValid || previewMutation.isPending}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full border border-gray-300 bg-gray-50 hover:bg-gray-100 transition-colors disabled:opacity-50"
          data-ocid="emoji-monitor.manual-distribution.preview_button"
        >
          <Activity
            className={`w-3.5 h-3.5 ${previewMutation.isPending ? "animate-spin" : ""}`}
          />
          {previewMutation.isPending ? "Loading…" : "Preview"}
        </button>
        <button
          type="button"
          onClick={handleDistribute}
          disabled={!isValid || distributeMutation.isPending}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full border border-gray-900 bg-gray-900 text-white hover:bg-gray-700 transition-colors disabled:opacity-50"
          data-ocid="emoji-monitor.manual-distribution.distribute_button"
        >
          <SmilePlus
            className={`w-3.5 h-3.5 ${distributeMutation.isPending ? "animate-spin" : ""}`}
          />
          {distributeMutation.isPending ? "Distributing…" : "Distribute Now"}
        </button>
      </div>

      {/* Preview table */}
      {previewRows.length > 0 && (
        <div
          className="space-y-2"
          data-ocid="emoji-monitor.manual-distribution.preview.panel"
        >
          <p className="text-xs font-medium text-gray-600">
            Preview — additions per item ({previewRows.length} items)
          </p>
          <div className="rounded-lg border border-gray-200 overflow-hidden max-h-64 overflow-y-auto">
            <table className="w-full text-xs">
              <thead className="sticky top-0">
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-3 py-2 text-left font-semibold text-gray-500">
                    Item
                  </th>
                  <th className="px-3 py-2 text-right font-semibold text-rose-600">
                    ❤️
                  </th>
                  <th className="px-3 py-2 text-right font-semibold text-blue-600">
                    👍
                  </th>
                  <th className="px-3 py-2 text-right font-semibold text-yellow-600">
                    😂
                  </th>
                  <th className="px-3 py-2 text-right font-semibold text-gray-600">
                    👎
                  </th>
                </tr>
              </thead>
              <tbody>
                {previewRows.map((row, i) => (
                  <tr
                    key={row.itemId}
                    className={i % 2 === 0 ? "bg-white" : "bg-gray-50/60"}
                  >
                    <td
                      className="px-3 py-2 text-gray-700 truncate max-w-[140px]"
                      title={row.title}
                    >
                      {row.title}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums text-rose-600">
                      {row.additions?.love ?? 0}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums text-blue-600">
                      {row.additions?.like ?? 0}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums text-yellow-600">
                      {row.additions?.laugh ?? 0}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums text-gray-600">
                      {row.additions?.dislike ?? 0}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Confirm dialog */}
      {confirming && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          data-ocid="emoji-monitor.manual-distribution.dialog"
        >
          <div className="bg-white rounded-xl border border-gray-200 shadow-xl p-6 max-w-sm w-full mx-4 space-y-4">
            <h4 className="text-sm font-bold text-gray-900">
              Confirm Distribution
            </h4>
            <p className="text-sm text-gray-600">
              This will add{" "}
              <strong className="text-gray-900">
                {parsedAmount.toLocaleString()} reactions
              </strong>{" "}
              across <strong className="text-gray-900">{sectionLabel}</strong>.
              Reactions are added to existing counts and{" "}
              <span className="text-red-600 font-medium">cannot be undone</span>
              . Continue?
            </p>
            <div className="flex items-center gap-3 justify-end">
              <button
                type="button"
                onClick={() => setConfirming(false)}
                className="px-4 py-2 text-xs font-medium rounded-full border border-gray-300 bg-gray-50 hover:bg-gray-100 transition-colors"
                data-ocid="emoji-monitor.manual-distribution.cancel_button"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={distributeMutation.isPending}
                className="px-4 py-2 text-xs font-medium rounded-full border border-gray-900 bg-gray-900 text-white hover:bg-gray-700 transition-colors disabled:opacity-50"
                data-ocid="emoji-monitor.manual-distribution.confirm_button"
              >
                {distributeMutation.isPending
                  ? "Distributing…"
                  : "Yes, distribute"}
              </button>
            </div>
          </div>
        </div>
      )}

      <p className="text-xs text-gray-400 border-l-2 border-gray-200 pl-3 leading-relaxed">
        Reactions are distributed randomly within your configured ratio ranges.
        Existing saved counts are preserved — this only adds.
      </p>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function AdminEmojiMonitor() {
  const {
    data: summary,
    isLoading: summaryLoading,
    refetch: refetchSummary,
  } = useInflationSummary();
  const {
    data: stats,
    isLoading: statsLoading,
    refetch: refetchStats,
  } = useInflationStats();

  const isLoading = summaryLoading || statsLoading;
  const { actor } = useActor();
  const [isResetting, setIsResetting] = useState(false);

  const handleRefresh = () => {
    refetchSummary();
    refetchStats();
  };

  const handleReset = async () => {
    if (!actor) return;
    const confirmed = window.confirm(
      "Are you sure you want to reset all automated inflation counts? This will NOT affect real user reactions.",
    );
    if (!confirmed) return;

    setIsResetting(true);
    try {
      await actor.resetInflationCounts();
      toast.success("Automated inflation counts have been reset.");
      handleRefresh();
    } catch (err) {
      toast.error("Failed to reset inflation counts.");
      console.error(err);
    } finally {
      setIsResetting(false);
    }
  };

  const sectionMap = new Map<string, EmojiBreakdown>(summary?.bySection ?? []);

  // Compute grand totals by summing per-emoji fields across all sections
  let totalAutomatedNum = 0;
  let totalUserNum = 0;
  for (const bd of sectionMap.values()) {
    const { userTotal, autoTotal } = emojiTotals(bd);
    totalUserNum += userTotal;
    totalAutomatedNum += autoTotal;
  }
  // Fall back to backend-provided totals if sections are empty
  const totalAutomated = summary?.totalAutomated ?? BigInt(totalAutomatedNum);
  const totalUser = summary?.totalUser ?? BigInt(totalUserNum);
  const grandTotal = totalAutomated + totalUser;

  return (
    <div className="bg-white text-gray-900 rounded-lg space-y-5">
      {/* ── Inflation Rate Settings ── */}
      <InflationRateSettings />

      {/* ── Manual Emoji Distribution ── */}
      <ManualEmojiDistribution />

      {/* ── Header row ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <SmilePlus className="w-5 h-5 text-amber-500" />
          <h2 className="text-base font-bold text-gray-900">
            Emoji Reaction Monitor
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isLoading || isResetting}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full border border-gray-200 bg-gray-50 hover:bg-gray-100 transition-colors disabled:opacity-50"
            data-ocid="emoji-monitor.refresh-button"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`}
            />
            Refresh
          </button>
          <button
            type="button"
            onClick={handleReset}
            disabled={isResetting}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 transition-colors disabled:opacity-50"
            data-ocid="emoji-monitor.reset-inflation-button"
          >
            <Trash2
              className={`w-3.5 h-3.5 ${isResetting ? "animate-spin" : ""}`}
            />
            Reset Inflation
          </button>
        </div>
      </div>

      {/* ── Loading state — skeleton cards ── */}
      {isLoading && (
        <div data-ocid="emoji-monitor.loading_state" className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            {["Organic (Auto)", "Real Users", "Grand Total"].map((label) => (
              <div
                key={label}
                className="rounded-xl px-4 py-3 text-center border border-gray-200 animate-pulse"
              >
                <p className="text-xs font-medium mb-2 text-gray-400">
                  {label}
                </p>
                <div className="h-8 bg-gray-200 rounded mx-auto w-20" />
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-400 py-1">
            <Activity className="w-4 h-4 animate-pulse" />
            Loading inflation data…
          </div>
          {/* skeleton section rows */}
          {ALL_SECTIONS.map((key) => (
            <div
              key={key}
              className="rounded-xl border border-gray-200 overflow-hidden animate-pulse"
            >
              <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                <div className="h-4 bg-gray-200 rounded w-32" />
                <div className="h-4 bg-gray-200 rounded w-40" />
              </div>
              <div className="p-4 space-y-2">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="h-4 bg-gray-100 rounded" />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Loaded content ── */}
      {!isLoading && (
        <>
          {/* ── Summary cards ── */}
          <div className="grid grid-cols-3 gap-3">
            {[
              {
                label: "Organic (Auto)",
                value: totalAutomated.toString(),
                bg: "#fffbeb",
                border: "#fcd34d",
                color: "#92400e",
              },
              {
                label: "Real Users",
                value: totalUser.toString(),
                bg: "#f0fdf4",
                border: "#86efac",
                color: "#15803d",
              },
              {
                label: "Grand Total",
                value: grandTotal.toString(),
                bg: "#f8fafc",
                border: "#cbd5e1",
                color: "#1e293b",
              },
            ].map((card) => (
              <div
                key={card.label}
                className="rounded-xl px-4 py-3 text-center"
                style={{
                  background: card.bg,
                  border: `1px solid ${card.border}`,
                }}
              >
                <p
                  className="text-xs font-medium mb-1"
                  style={{ color: card.color }}
                >
                  {card.label}
                </p>
                <p
                  className="text-2xl font-bold tabular-nums"
                  style={{ color: card.color }}
                >
                  {card.value}
                </p>
              </div>
            ))}
          </div>

          {/* ── Overall % split ── */}
          <div className="flex items-center gap-3 px-4 py-2 bg-gray-50 rounded-xl border border-gray-200 text-xs">
            <span className="font-medium text-gray-600">Overall split:</span>
            <PctBadge
              value={pct(totalAutomated, grandTotal)}
              kind="automated"
            />
            <span className="text-gray-400">organic</span>
            <span className="text-gray-300">·</span>
            <PctBadge value={pct(totalUser, grandTotal)} kind="user" />
            <span className="text-gray-400">real users</span>
          </div>

          {/* ── Per-section emoji breakdown ── */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-700">
              Per-section breakdown
            </h3>
            {ALL_SECTIONS.map((key) => {
              const counts = sectionMap.get(key) ?? EMPTY_BREAKDOWN;
              return (
                <SectionBreakdown key={key} sectionKey={key} counts={counts} />
              );
            })}
          </div>

          {/* ── Footer info ── */}
          <div className="space-y-2">
            <p className="text-xs text-gray-500">
              <span className="font-medium text-gray-700">
                Last inflation run:
              </span>{" "}
              {stats ? formatTimestamp(stats.lastRunTime) : "—"}
            </p>
            <p className="text-xs text-gray-400 leading-relaxed border-l-2 border-amber-200 pl-3">
              <strong className="text-gray-600">Organic</strong> reactions
              simulate realistic growth based on time-of-day multipliers,
              Poisson jitter, and decay curves.{" "}
              <strong className="text-gray-600">User Clicks</strong> are real
              reactions from logged-in visitors. Both are stored permanently
              across sessions.
            </p>
          </div>
        </>
      )}
    </div>
  );
}
