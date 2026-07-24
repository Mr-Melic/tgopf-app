import { useState } from "react";
import {
  useGetAnnaAmazonEnabled,
  useGetAnnaSongAmazonEnabled,
  useGetCryptoSystemEnabled,
  useGetEmilieAmazonEnabled,
  useGetEmilieNlAmazonEnabled,
  useGetEmojiSystemEnabled,
  useGetMaintenanceNoticeEnabled,
  useSetAnnaAmazonEnabled,
  useSetAnnaSongAmazonEnabled,
  useSetCryptoSystemEnabled,
  useSetEmilieAmazonEnabled,
  useSetEmilieNlAmazonEnabled,
  useSetEmojiSystemEnabled,
  useSetMaintenanceNoticeEnabled,
} from "../hooks/useQueries";

interface ToggleRowProps {
  label: string;
  description: string;
  enabled: boolean | undefined;
  loading: boolean;
  isPending: boolean;
  onToggle: (next: boolean) => void;
  ocid: string;
}

function ToggleRow({
  label,
  description,
  enabled,
  loading,
  isPending,
  onToggle,
  ocid,
}: ToggleRowProps) {
  const isOn = enabled !== false; // safe default = on (except for Emilie/Anna which default off)
  const [feedback, setFeedback] = useState<"ok" | "err" | null>(null);

  const handleChange = async () => {
    try {
      await onToggle(!isOn);
      setFeedback("ok");
      setTimeout(() => setFeedback(null), 2500);
    } catch {
      setFeedback("err");
      setTimeout(() => setFeedback(null), 3000);
    }
  };

  return (
    <div
      className="flex items-start justify-between gap-6 py-4 border-b border-gray-100 last:border-0"
      data-ocid={ocid}
    >
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900 mb-0.5">{label}</p>
        <p className="text-xs text-gray-500 leading-snug">{description}</p>
        {feedback === "ok" && (
          <p
            className="text-xs text-green-600 font-medium mt-1"
            data-ocid={`${ocid}.success_state`}
          >
            ✓ Saved
          </p>
        )}
        {feedback === "err" && (
          <p
            className="text-xs text-red-600 font-medium mt-1"
            data-ocid={`${ocid}.error_state`}
          >
            Failed to save. Please try again.
          </p>
        )}
      </div>

      <div className="flex-shrink-0 pt-0.5">
        {loading ? (
          <div className="w-12 h-6 rounded-full bg-gray-200 animate-pulse" />
        ) : (
          <button
            type="button"
            role="switch"
            aria-checked={isOn}
            aria-label={label}
            disabled={isPending}
            onClick={handleChange}
            data-ocid={`${ocid}.toggle`}
            className={`relative inline-flex h-6 w-12 flex-shrink-0 cursor-pointer rounded-full border-2 transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 ${
              isOn ? "border-black bg-black" : "border-gray-300 bg-gray-300"
            } ${isPending ? "opacity-60 cursor-not-allowed" : ""}`}
          >
            <span
              className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition-transform duration-200 my-auto ${
                isOn ? "translate-x-7" : "translate-x-0.5"
              }`}
            />
          </button>
        )}
      </div>
    </div>
  );
}

export default function AdminSystemControls() {
  const { data: emojiEnabled, isLoading: emojiLoading } =
    useGetEmojiSystemEnabled();
  const { data: cryptoEnabled, isLoading: cryptoLoading } =
    useGetCryptoSystemEnabled();
  const { data: emilieEnabled, isLoading: emilieLoading } =
    useGetEmilieAmazonEnabled();
  const { data: annaEnabled, isLoading: annaLoading } =
    useGetAnnaAmazonEnabled();
  const { data: annaSongEnabled, isLoading: annaSongLoading } =
    useGetAnnaSongAmazonEnabled();
  const { data: emilieNlEnabled, isLoading: emilieNlLoading } =
    useGetEmilieNlAmazonEnabled();
  const {
    data: maintenanceNoticeEnabled,
    isLoading: maintenanceNoticeLoading,
  } = useGetMaintenanceNoticeEnabled();

  const setEmoji = useSetEmojiSystemEnabled();
  const setCrypto = useSetCryptoSystemEnabled();
  const setEmilie = useSetEmilieAmazonEnabled();
  const setAnna = useSetAnnaAmazonEnabled();
  const setAnnaSong = useSetAnnaSongAmazonEnabled();
  const setEmilieNl = useSetEmilieNlAmazonEnabled();
  const setMaintenanceNotice = useSetMaintenanceNoticeEnabled();

  return (
    <div className="space-y-1">
      <p className="text-xs text-gray-500 mb-4 leading-relaxed">
        Enable or disable site-wide systems to control costs and feature
        visibility. All changes are saved permanently and visible to all
        visitors immediately.
      </p>

      <div className="rounded-xl border border-gray-200 bg-white divide-y divide-gray-100 overflow-hidden">
        <ToggleRow
          ocid="system-controls.emoji-toggle"
          label="Emoji & Reaction Counter System"
          description="When OFF: stops all inflation computation and hides all reaction buttons. Saves significant cycles."
          enabled={emojiEnabled}
          loading={emojiLoading}
          isPending={setEmoji.isPending}
          onToggle={(v) => setEmoji.mutateAsync(v)}
        />
        <ToggleRow
          ocid="system-controls.crypto-toggle"
          label="Crypto Payment System (Bitcoin, Ethereum, ICP)"
          description="When OFF: no CoinGecko API calls are made, crypto options hidden from all visitors."
          enabled={cryptoEnabled}
          loading={cryptoLoading}
          isPending={setCrypto.isPending}
          onToggle={(v) => setCrypto.mutateAsync(v)}
        />
        <ToggleRow
          ocid="system-controls.emilie-toggle"
          label="Emilie — Amazon Region Payment System"
          description="Enable when Emilie and the Ruins of Azoth is live on Amazon."
          enabled={emilieEnabled}
          loading={emilieLoading}
          isPending={setEmilie.isPending}
          onToggle={(v) => setEmilie.mutateAsync(v)}
        />
        <ToggleRow
          ocid="system-controls.anna-toggle"
          label="Het Lied van Zeemeermin Anna — Amazon Region Payment System"
          description="Enable when Het Lied van Zeemeermin Anna is live on Amazon."
          enabled={annaEnabled}
          loading={annaLoading}
          isPending={setAnna.isPending}
          onToggle={(v) => setAnna.mutateAsync(v)}
        />
        <ToggleRow
          ocid="system-controls.anna-song-toggle"
          label="The Song of Anna the Mermaid — Amazon Region Payment System"
          description="Enable when The Song of Anna the Mermaid (1st edition) is live on Amazon."
          enabled={annaSongEnabled}
          loading={annaSongLoading}
          isPending={setAnnaSong.isPending}
          onToggle={(v) => setAnnaSong.mutateAsync(v)}
        />
        <ToggleRow
          ocid="system-controls.emilie-nl-toggle"
          label="Emilie en de Ruïne van Azoth — Amazon Region Payment System"
          description="Enable when Emilie en de Ruïne van Azoth (1st edition) is live on Amazon."
          enabled={emilieNlEnabled}
          loading={emilieNlLoading}
          isPending={setEmilieNl.isPending}
          onToggle={(v) => setEmilieNl.mutateAsync(v)}
        />
        <ToggleRow
          ocid="system-controls.maintenance-notice-toggle"
          label="Maintenance notice"
          description="When ON: a large site-styled popup appears on every page informing visitors of an ongoing major website update. Visitors can dismiss it for the current session; it reappears in new sessions while ON."
          enabled={maintenanceNoticeEnabled}
          loading={maintenanceNoticeLoading}
          isPending={setMaintenanceNotice.isPending}
          onToggle={(v) => setMaintenanceNotice.mutateAsync(v)}
        />
      </div>
    </div>
  );
}
