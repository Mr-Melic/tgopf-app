import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { X } from "lucide-react";
import { useEffect, useState } from "react";
import { useGetMaintenanceNoticeEnabled } from "../hooks/useQueries";

// ─── Props ────────────────────────────────────────────────────────────────────

interface MaintenanceNoticePopupProps {
  /**
   * Override the enabled state. When omitted, the component reads
   * useGetMaintenanceNoticeEnabled() itself. Provided so tests/parents can
   * force the popup open without the backend.
   */
  enabledOverride?: boolean;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const SESSION_STORAGE_KEY = "maintenanceNoticeDismissed";

const HEADING = "Big update in progress";

const BODY_EN =
  "We are performing a major website update. Some texts and images may be temporarily unavailable or slow to load. Thank you for your patience — everything will be back shortly.";

const BODY_NL =
  "We voeren een grote website-update uit. Sommige teksten en afbeeldingen kunnen tijdelijk niet beschikbaar of traag zijn. Bedankt voor je geduld — alles is snel weer terug.";

// ─── Component ────────────────────────────────────────────────────────────────

export default function MaintenanceNoticePopup({
  enabledOverride,
}: MaintenanceNoticePopupProps) {
  const { data: noticeEnabled } = useGetMaintenanceNoticeEnabled();
  const [dismissed, setDismissed] = useState<boolean>(false);

  // Read the session-storage dismissal flag once on mount. sessionStorage is
  // scoped to the current tab/session — a new tab/window starts fresh, so the
  // popup reappears there while the notice is ON.
  useEffect(() => {
    try {
      setDismissed(sessionStorage.getItem(SESSION_STORAGE_KEY) === "true");
    } catch {
      // sessionStorage may be unavailable (private mode / disabled) — treat as
      // not dismissed so the notice still surfaces.
      setDismissed(false);
    }
  }, []);

  const isEnabled =
    enabledOverride !== undefined ? enabledOverride : noticeEnabled === true;
  const isOpen = isEnabled && !dismissed;

  const handleClose = () => {
    setDismissed(true);
    try {
      sessionStorage.setItem(SESSION_STORAGE_KEY, "true");
    } catch {
      // Ignore write failures — in-memory dismissal still hides for this mount.
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent
        className="max-w-lg w-full overflow-y-auto rounded-2xl p-0 border-0 shadow-2xl"
        style={{ maxHeight: "92vh", fontFamily: "'Adobe Jenson Pro', serif" }}
        data-ocid="maintenance-notice.dialog"
        showCloseButton={false}
      >
        {/* Header strip — site black, matching the footer aesthetic */}
        <div className="flex items-center justify-between px-6 py-4 rounded-t-2xl bg-black">
          <DialogTitle
            className="text-lg font-bold leading-tight adobe-jenson"
            style={{ color: "#fff" }}
          >
            {HEADING}
          </DialogTitle>
          <button
            type="button"
            onClick={handleClose}
            aria-label="Close maintenance notice"
            className="rounded-full p-1 hover:bg-white/20 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            data-ocid="maintenance-notice.close_button"
          >
            <X size={18} color="#fff" />
          </button>
          <DialogDescription className="sr-only">
            Maintenance notice — the site is undergoing a major update. Some
            content may be temporarily unavailable or slow to load.
          </DialogDescription>
        </div>

        <DialogHeader className="sr-only">
          <DialogTitle>{HEADING}</DialogTitle>
          <DialogDescription>
            Maintenance notice — the site is undergoing a major update.
          </DialogDescription>
        </DialogHeader>

        <div
          className="px-6 pb-6 pt-5 space-y-4"
          style={{ background: "#fff" }}
        >
          {/* English body */}
          <p
            className="text-sm leading-relaxed"
            style={{ color: "#333" }}
            data-ocid="maintenance-notice.body_en"
          >
            {BODY_EN}
          </p>

          {/* Divider */}
          <div
            className="h-px w-full"
            style={{ background: "#eee" }}
            aria-hidden="true"
          />

          {/* Dutch body */}
          <p
            className="text-sm leading-relaxed"
            style={{ color: "#333" }}
            data-ocid="maintenance-notice.body_nl"
          >
            {BODY_NL}
          </p>

          {/* Dismiss button */}
          <button
            type="button"
            onClick={handleClose}
            data-ocid="maintenance-notice.dismiss_button"
            className="w-full py-3 rounded-full font-bold text-sm transition-all duration-200 hover:opacity-90 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{ background: "#111", color: "#fff" }}
          >
            Got it
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
