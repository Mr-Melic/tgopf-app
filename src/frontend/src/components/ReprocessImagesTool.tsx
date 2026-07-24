import {
  AlertTriangle,
  CheckCircle2,
  FileImage,
  Loader2,
  XCircle,
} from "lucide-react";
import { useCallback, useMemo, useRef, useState } from "react";
import {
  useFileList,
  useFileUpload,
  useInvalidateQueries,
} from "../blob-storage/FileStorage";
import { buildGatewayBlobUrl } from "../blob-storage/StorageClient";
import { loadConfig } from "../config";
import { useActor } from "../hooks/useActor";

// ─── Types ──────────────────────────────────────────────────────────────────

type Status = "pending" | "processing" | "done" | "skipped" | "failed";

interface ImageRow {
  path: string;
  oldHash: string;
  status: Status;
  beforeBytes: number | null;
  afterBytes: number | null;
  error: string | null;
}

interface VerifyRow {
  path: string;
  ok: boolean;
  hash: string | null;
  error: string | null;
}

// ─── Constants ──────────────────────────────────────────────────────────────

const MAX_LONG_SIDE = 1600;
const WEBP_QUALITY = 0.85;

// Image extensions that should be re-processed (NOT already WebP).
// We treat anything not ending in .webp as a candidate. The requirement
// explicitly says: only reprocess images that are NOT already WebP.
const isNonWebpImage = (path: string): boolean => {
  const lower = path.toLowerCase();
  if (lower.endsWith(".webp")) return false;
  return (
    lower.endsWith(".png") ||
    lower.endsWith(".jpg") ||
    lower.endsWith(".jpeg") ||
    lower.endsWith(".gif") ||
    lower.endsWith(".bmp")
  );
};

const formatBytes = (bytes: number | null): string => {
  if (bytes === null || bytes === undefined) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

// ─── Canvas conversion helper ────────────────────────────────────────────────

/**
 * Fetches an image from a URL, draws it to a canvas scaled so the longest
 * side is at most MAX_LONG_SIDE, and returns a WebP Blob. If the image is
 * already smaller than MAX_LONG_SIDE, it is drawn at native size.
 */
async function convertToWebp(url: string): Promise<Blob> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Fetch failed: ${response.status} ${response.statusText}`);
  }
  const blob = await response.blob();
  if (blob.size === 0) {
    throw new Error("Fetched blob is empty");
  }

  const bitmap = await createImageBitmap(blob);

  const { width, height } = bitmap;
  const longest = Math.max(width, height);
  let targetW = width;
  let targetH = height;
  if (longest > MAX_LONG_SIDE) {
    const scale = MAX_LONG_SIDE / longest;
    targetW = Math.round(width * scale);
    targetH = Math.round(height * scale);
  }

  const canvas = document.createElement("canvas");
  canvas.width = targetW;
  canvas.height = targetH;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D context unavailable");
  ctx.drawImage(bitmap, 0, 0, targetW, targetH);
  bitmap.close();

  const webpBlob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/webp", WEBP_QUALITY),
  );
  if (!webpBlob) {
    throw new Error("canvas.toBlob returned null — WebP encoding failed");
  }
  return webpBlob;
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function ReprocessImagesTool() {
  const { data: fileList, isLoading: listLoading, refetch } = useFileList();
  const { uploadFile, isUploading } = useFileUpload();
  const { invalidateAll } = useInvalidateQueries();
  const { actor } = useActor();

  const [rows, setRows] = useState<ImageRow[]>([]);
  const [verifyRows, setVerifyRows] = useState<VerifyRow[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [progressLabel, setProgressLabel] = useState<string>("");
  const [summary, setSummary] = useState<string>("");
  const runIdRef = useRef(0);

  // Candidates: non-WebP image paths from the file list.
  const candidates = useMemo(() => {
    if (!fileList) return [];
    return fileList.filter((ref) => isNonWebpImage(ref.path));
  }, [fileList]);

  const totalCandidates = candidates.length;
  const doneCount = rows.filter((r) => r.status === "done").length;
  const failedCount = rows.filter((r) => r.status === "failed").length;
  const skippedCount = rows.filter((r) => r.status === "skipped").length;
  const processedCount = doneCount + failedCount + skippedCount;
  const progressPct =
    totalCandidates === 0
      ? 0
      : Math.round((processedCount / totalCandidates) * 100);

  // Build a fresh row state from the current candidate list.
  const resetRows = useCallback(() => {
    setRows(
      candidates.map((ref) => ({
        path: ref.path,
        oldHash: ref.hash,
        status: "pending" as Status,
        beforeBytes: null,
        afterBytes: null,
        error: null,
      })),
    );
    setVerifyRows([]);
    setSummary("");
  }, [candidates]);

  const updateRow = useCallback((path: string, patch: Partial<ImageRow>) => {
    setRows((prev) =>
      prev.map((r) => (r.path === path ? { ...r, ...patch } : r)),
    );
  }, []);

  // ─── Run the one-time reprocessing ─────────────────────────────────────────
  const handleRun = useCallback(async () => {
    if (isRunning || totalCandidates === 0) return;
    const myRunId = ++runIdRef.current;
    setIsRunning(true);
    setSummary("");
    setVerifyRows([]);
    resetRows();

    const envConfig = await loadConfig();

    let okCount = 0;
    let failCount = 0;

    for (let i = 0; i < candidates.length; i++) {
      if (runIdRef.current !== myRunId) return; // aborted
      const ref = candidates[i];
      const label = `[${i + 1}/${candidates.length}] ${ref.path}`;
      setProgressLabel(label);
      updateRow(ref.path, { status: "processing", error: null });

      try {
        // (1) Build the gateway URL for the OLD blob hash and fetch the original.
        const originalUrl = buildGatewayBlobUrl(
          envConfig.storage_gateway_url,
          ref.hash,
          envConfig.backend_canister_id,
          envConfig.project_id,
        );

        // (2) Fetch + measure original size.
        const headRes = await fetch(originalUrl, { method: "GET" });
        if (!headRes.ok) {
          throw new Error(
            `Download failed: ${headRes.status} ${headRes.statusText}`,
          );
        }
        const originalBlob = await headRes.blob();
        const beforeBytes = originalBlob.size;
        updateRow(ref.path, { beforeBytes });

        // (3) Convert to WebP at max 1600px via canvas.
        const webpBlob = await convertToWebp(originalUrl);
        const afterBytes = webpBlob.size;
        updateRow(ref.path, { afterBytes });

        // (4) Upload WebP under the SAME path. useFileUpload.uploadFile
        //     internally calls registerFileReference(path, newHash), which
        //     overwrites the old path→hash mapping. The old blob becomes
        //     orphaned (no path references it) and is effectively released.
        //     We deliberately do NOT call dropFileReference(path) afterward
        //     because that would remove the NEW mapping we just registered.
        const webpFile = new File([webpBlob], ref.path, {
          type: "image/webp",
        });
        await uploadFile(ref.path, webpFile);

        updateRow(ref.path, { status: "done" });
        okCount++;
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        updateRow(ref.path, { status: "failed", error: msg });
        failCount++;
      }
    }

    if (runIdRef.current !== myRunId) return;

    // (5) Invalidate caches so the rest of the app picks up the new hashes.
    await invalidateAll();
    await refetch();

    // (6) Verify EVERY path in listFileReferences resolves via getFileReference.
    setProgressLabel("Verifying all file references…");
    const latest = await (actor ? actor.listFileReferences() : []);
    const verify: VerifyRow[] = [];
    for (const vref of latest) {
      try {
        const resolved = actor ? await actor.getFileReference(vref.path) : null;
        const hash =
          resolved && typeof resolved === "object" && "hash" in resolved
            ? (resolved as { hash: string }).hash
            : null;
        verify.push({
          path: vref.path,
          ok: !!hash,
          hash,
          error: hash ? null : "getFileReference returned no hash",
        });
      } catch (err) {
        verify.push({
          path: vref.path,
          ok: false,
          hash: null,
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }
    setVerifyRows(verify);

    const unresolved = verify.filter((v) => !v.ok);
    const summaryText = `Reprocessed ${okCount} image(s) to WebP, ${failCount} failed.${unresolved.length > 0 ? ` Verification: ${unresolved.length} path(s) failed to resolve.` : " Verification: all paths resolve."}`;
    setSummary(summaryText);
    setProgressLabel("");
    setIsRunning(false);
  }, [
    actor,
    candidates,
    invalidateAll,
    isRunning,
    refetch,
    resetRows,
    totalCandidates,
    updateRow,
    uploadFile,
  ]);

  const handleAbort = useCallback(() => {
    runIdRef.current++;
    setIsRunning(false);
    setProgressLabel("Aborted by admin.");
  }, []);

  // ─── Render ─────────────────────────────────────────────────────────────────
  const hasRun = rows.length > 0;
  const verifyFailures = verifyRows.filter((v) => !v.ok);

  return (
    <div className="space-y-5" data-ocid="reprocess-images-tool">
      {/* Intro / warning */}
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-amber-900 leading-relaxed">
            <p className="font-semibold mb-1">One-time migration tool</p>
            <p>
              This reprocesses the 65 images migrated in Version 417 that
              bypassed WebP conversion. Each non-WebP original is downloaded,
              converted to WebP at max {MAX_LONG_SIDE}px on the longest side,
              and re-uploaded under its identical path. Already-WebP images are
              skipped. This is a one-time operation — run it once, then verify
              all paths resolve.
            </p>
          </div>
        </div>
      </div>

      {/* Status summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard
          label="Total references"
          value={fileList?.length ?? "—"}
          loading={listLoading}
        />
        <StatCard
          label="Non-WebP candidates"
          value={totalCandidates}
          accent="#b45309"
        />
        <StatCard label="Converted" value={doneCount} accent="#16a34a" />
        <StatCard label="Failed" value={failedCount} accent="#dc2626" />
      </div>

      {/* Action bar */}
      <div className="flex flex-wrap items-center gap-3">
        {!isRunning ? (
          <button
            type="button"
            onClick={handleRun}
            disabled={totalCandidates === 0 || isUploading || listLoading}
            data-ocid="reprocess-images.run-btn"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FileImage className="w-4 h-4" />
            {hasRun ? "Re-run conversion" : "Start conversion"}
          </button>
        ) : (
          <button
            type="button"
            onClick={handleAbort}
            data-ocid="reprocess-images.abort-btn"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors"
          >
            <XCircle className="w-4 h-4" />
            Abort
          </button>
        )}

        {isUploading && !isRunning && (
          <span className="inline-flex items-center gap-1.5 text-xs text-gray-500">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            Uploading…
          </span>
        )}

        {progressLabel && (
          <span
            className="text-xs text-gray-600 font-mono truncate max-w-full"
            data-ocid="reprocess-images.progress-label"
          >
            {progressLabel}
          </span>
        )}
      </div>

      {/* Progress bar */}
      {totalCandidates > 0 && (
        <div className="w-full">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>
              {processedCount} / {totalCandidates} processed
            </span>
            <span>{progressPct}%</span>
          </div>
          <div
            className="h-2 w-full rounded-full bg-gray-200 overflow-hidden"
            role="progressbar"
            tabIndex={-1}
            aria-valuenow={progressPct}
            aria-valuemin={0}
            aria-valuemax={100}
            data-ocid="reprocess-images.progress-bar"
          >
            <div
              className="h-full bg-gray-900 transition-all duration-300"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      )}

      {/* Summary line */}
      {summary && (
        <div
          className={`rounded-lg p-3 text-sm ${
            verifyFailures.length > 0
              ? "bg-red-50 border border-red-200 text-red-800"
              : "bg-green-50 border border-green-200 text-green-800"
          }`}
          data-ocid="reprocess-images.summary"
        >
          {summary}
        </div>
      )}

      {/* Empty state */}
      {!listLoading && totalCandidates === 0 && !hasRun && (
        <div
          className="rounded-xl border border-gray-200 bg-gray-50 p-8 text-center"
          data-ocid="reprocess-images.empty-state"
        >
          <CheckCircle2 className="w-8 h-8 text-green-500 mx-auto mb-2" />
          <p className="text-sm font-medium text-gray-700">
            No non-WebP images found to reprocess.
          </p>
          <p className="text-xs text-gray-500 mt-1">
            All file references are already WebP, or the file list is empty.
          </p>
        </div>
      )}

      {/* Before/after table */}
      {hasRun && (
        <div className="overflow-x-auto rounded-xl border border-gray-200">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 sticky top-0">
              <tr className="text-left text-xs uppercase tracking-wide text-gray-500">
                <th className="px-4 py-2.5 font-semibold">Path</th>
                <th className="px-4 py-2.5 font-semibold text-right">Before</th>
                <th className="px-4 py-2.5 font-semibold text-right">After</th>
                <th className="px-4 py-2.5 font-semibold text-right">Saved</th>
                <th className="px-4 py-2.5 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rows.map((row, idx) => {
                const saved =
                  row.beforeBytes !== null && row.afterBytes !== null
                    ? row.beforeBytes - row.afterBytes
                    : null;
                const savedPct =
                  saved !== null && row.beforeBytes && saved > 0
                    ? Math.round((saved / row.beforeBytes) * 100)
                    : null;
                return (
                  <tr
                    key={row.path}
                    className="hover:bg-gray-50"
                    data-ocid={`reprocess-images.row.${idx}`}
                  >
                    <td className="px-4 py-2.5 font-mono text-xs text-gray-700 break-all max-w-xs">
                      {row.path}
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-gray-600">
                      {formatBytes(row.beforeBytes)}
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-gray-600">
                      {formatBytes(row.afterBytes)}
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums">
                      {saved !== null && saved > 0 ? (
                        <span className="text-green-600 font-medium">
                          {formatBytes(saved)}
                          {savedPct !== null ? ` (${savedPct}%)` : ""}
                        </span>
                      ) : saved !== null && saved <= 0 ? (
                        <span className="text-amber-600">
                          +{formatBytes(Math.abs(saved))}
                        </span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5">
                      <StatusBadge status={row.status} error={row.error} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Verification table */}
      {verifyRows.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-bold uppercase tracking-widest text-gray-500">
            Verification — getFileReference for every path
          </h4>
          <div className="overflow-x-auto rounded-xl border border-gray-200">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 sticky top-0">
                <tr className="text-left text-xs uppercase tracking-wide text-gray-500">
                  <th className="px-4 py-2.5 font-semibold">Path</th>
                  <th className="px-4 py-2.5 font-semibold">Resolved</th>
                  <th className="px-4 py-2.5 font-semibold">Hash</th>
                  <th className="px-4 py-2.5 font-semibold">Error</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {verifyRows.map((v, idx) => (
                  <tr
                    key={v.path}
                    className="hover:bg-gray-50"
                    data-ocid={`reprocess-images.verify-row.${idx}`}
                  >
                    <td className="px-4 py-2.5 font-mono text-xs text-gray-700 break-all max-w-xs">
                      {v.path}
                    </td>
                    <td className="px-4 py-2.5">
                      {v.ok ? (
                        <span className="inline-flex items-center gap-1 text-green-600 text-xs font-medium">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Yes
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-red-600 text-xs font-medium">
                          <XCircle className="w-3.5 h-3.5" /> No
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 font-mono text-xs text-gray-500 break-all max-w-xs">
                      {v.hash ?? "—"}
                    </td>
                    <td className="px-4 py-2.5 text-xs text-red-600 break-all max-w-xs">
                      {v.error ?? ""}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: number | string;
  loading?: boolean;
  accent?: string;
}

function StatCard({
  label,
  value,
  loading,
  accent = "#111827",
}: StatCardProps) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-3">
      <p className="text-xs text-gray-500 uppercase tracking-wide">{label}</p>
      {loading ? (
        <div className="h-6 w-10 bg-gray-100 animate-pulse rounded mt-1" />
      ) : (
        <p className="text-xl font-bold mt-0.5" style={{ color: accent }}>
          {value}
        </p>
      )}
    </div>
  );
}

interface StatusBadgeProps {
  status: Status;
  error: string | null;
}

function StatusBadge({ status, error }: StatusBadgeProps) {
  switch (status) {
    case "done":
      return (
        <span className="inline-flex items-center gap-1 text-xs font-medium text-green-600">
          <CheckCircle2 className="w-3.5 h-3.5" /> Done
        </span>
      );
    case "processing":
      return (
        <span className="inline-flex items-center gap-1 text-xs font-medium text-blue-600">
          <Loader2 className="w-3.5 h-3.5 animate-spin" /> Processing
        </span>
      );
    case "failed":
      return (
        <span
          className="inline-flex items-center gap-1 text-xs font-medium text-red-600"
          title={error ?? undefined}
        >
          <XCircle className="w-3.5 h-3.5" /> Failed
        </span>
      );
    case "skipped":
      return (
        <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-500">
          Skipped
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-400">
          Pending
        </span>
      );
  }
}
