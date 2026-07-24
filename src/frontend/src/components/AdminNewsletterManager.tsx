import { Download, FileText } from "lucide-react";
import React, { useState } from "react";
import type { NewsletterSubscriber } from "../backend";
import {
  useListNewsletterSubscribers,
  useRemoveNewsletterSubscriber,
} from "../hooks/useQueries";

const EXPORT_LOG_KEY = "newsletter_export_log";

interface ExportLogEntry {
  timestamp: string; // ISO string
  count: number;
}

function loadExportLog(): ExportLogEntry[] {
  try {
    const raw = localStorage.getItem(EXPORT_LOG_KEY);
    return raw ? (JSON.parse(raw) as ExportLogEntry[]) : [];
  } catch {
    return [];
  }
}

function saveExportLog(entries: ExportLogEntry[]): void {
  try {
    localStorage.setItem(EXPORT_LOG_KEY, JSON.stringify(entries));
  } catch {
    // ignore storage errors
  }
}

export default function AdminNewsletterManager() {
  const { data: subscribers = [], isLoading } = useListNewsletterSubscribers();
  const removeMutation = useRemoveNewsletterSubscriber();
  const [exportLog, setExportLog] = useState<ExportLogEntry[]>(loadExportLog);

  const formatDate = (ts: bigint) => {
    try {
      return new Date(Number(ts) / 1_000_000).toLocaleDateString("en-GB", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return "Unknown date";
    }
  };

  const formatLogDateTime = (iso: string) => {
    try {
      return new Date(iso).toLocaleString("en-GB", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
    } catch {
      return iso;
    }
  };

  const handleExportCSV = () => {
    const today = new Date();
    const dateStr = today.toISOString().split("T")[0];
    const rows: string[] = ["Email,Sign-up Date"];

    for (const sub of subscribers) {
      const signupDate = (() => {
        try {
          return new Date(
            Number(sub.subscribedAt) / 1_000_000,
          ).toLocaleDateString("en-GB", {
            year: "numeric",
            month: "short",
            day: "numeric",
          });
        } catch {
          return "";
        }
      })();
      // Escape commas / quotes in email
      const email = `"${sub.email.replace(/"/g, '""')}"`;
      rows.push(`${email},${signupDate}`);
    }

    const csvContent = rows.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `newsletter-subscribers-${dateStr}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    // Record log entry
    const newEntry: ExportLogEntry = {
      timestamp: today.toISOString(),
      count: subscribers.length,
    };
    const updated = [newEntry, ...exportLog];
    setExportLog(updated);
    saveExportLog(updated);
  };

  return (
    <div className="admin-panel space-y-6">
      {/* Header row */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <p className="text-sm text-gray-600">
          {subscribers.length} subscriber{subscribers.length !== 1 ? "s" : ""}{" "}
          on your newsletter list.
        </p>
        <button
          type="button"
          onClick={handleExportCSV}
          disabled={isLoading || subscribers.length === 0}
          className="flex items-center gap-2 px-4 py-2 text-sm bg-black text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          data-ocid="newsletter-export-btn"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      {/* Subscriber list */}
      {isLoading ? (
        <p className="text-sm text-gray-400">Loading subscribers…</p>
      ) : subscribers.length === 0 ? (
        <div className="text-center py-8 text-gray-400 border border-dashed border-gray-200 rounded-xl">
          <p className="text-2xl mb-2">📧</p>
          <p className="text-sm">No subscribers yet.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {subscribers.map((sub: NewsletterSubscriber) => (
            <div
              key={sub.principalId}
              className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-xl px-4 py-3"
              data-ocid="newsletter-subscriber-row"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {sub.email}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Subscribed {formatDate(sub.subscribedAt)}
                </p>
                <p className="text-[10px] text-gray-400 font-mono truncate mt-0.5">
                  {sub.principalId.slice(0, 20)}…
                </p>
              </div>
              <button
                type="button"
                onClick={() => removeMutation.mutate(sub.principalId)}
                disabled={removeMutation.isPending}
                className="ml-4 text-xs px-3 py-1.5 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors flex-shrink-0"
                data-ocid="newsletter-remove-btn"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Export Log */}
      <div className="border-t border-gray-200 pt-5">
        <div className="flex items-center gap-2 mb-3">
          <FileText className="w-4 h-4 text-gray-500" />
          <h4 className="text-sm font-semibold text-gray-800">Export Log</h4>
        </div>
        <p className="text-xs text-gray-500 mb-3">
          Records every time the subscriber list was exported. Use this as
          compliance proof of when data was accessed.
        </p>
        {exportLog.length === 0 ? (
          <div className="text-center py-6 text-gray-400 border border-dashed border-gray-200 rounded-xl">
            <p className="text-sm">No exports recorded yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-gray-200">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-700 w-8">
                    #
                  </th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-700">
                    Date &amp; Time
                  </th>
                  <th className="text-right px-4 py-2.5 text-xs font-semibold text-gray-700">
                    Records Exported
                  </th>
                </tr>
              </thead>
              <tbody>
                {exportLog.map((entry, idx) => (
                  <tr
                    key={entry.timestamp}
                    className="border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors"
                    data-ocid="export-log-row"
                  >
                    <td className="px-4 py-2.5 text-xs text-gray-400 tabular-nums">
                      {idx + 1}
                    </td>
                    <td className="px-4 py-2.5 text-gray-900 tabular-nums">
                      {formatLogDateTime(entry.timestamp)}
                    </td>
                    <td className="px-4 py-2.5 text-right text-gray-900 tabular-nums font-medium">
                      {entry.count}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
