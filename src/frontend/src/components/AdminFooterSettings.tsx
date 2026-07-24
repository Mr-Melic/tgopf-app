import React, { useEffect, useState } from "react";
import type { FooterSettings } from "../backend";
import {
  DEFAULT_FOOTER_SETTINGS,
  useGetFooterSettings,
  useUpdateFooterSettings,
} from "../hooks/useQueries";

export default function AdminFooterSettings() {
  const { data: settings, isLoading } = useGetFooterSettings();
  const updateMutation = useUpdateFooterSettings();

  const [form, setForm] = useState<FooterSettings>(DEFAULT_FOOTER_SETTINGS);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (settings) setForm(settings);
  }, [settings]);

  const handleChange = (field: keyof FooterSettings, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setSaved(false);
  };

  const handleSave = () => {
    updateMutation.mutate(form, {
      onSuccess: () => setSaved(true),
    });
  };

  if (isLoading) {
    return <p className="text-sm text-gray-500">Loading footer settings…</p>;
  }

  const fields: {
    key: keyof FooterSettings;
    label: string;
    placeholder: string;
  }[] = [
    {
      key: "businessName",
      label: "Business Name",
      placeholder: "Le Royalties Sergio Melicio",
    },
    {
      key: "businessAddress",
      label: "Address",
      placeholder: "Rotterdam, The Netherlands",
    },
    { key: "businessTaxId", label: "Tax ID", placeholder: "NL005317123B43" },
    { key: "businessKvk", label: "KVK Number", placeholder: "98223216" },
    {
      key: "businessIban",
      label: "IBAN",
      placeholder: "NL08 RABO 0155 3288 24",
    },
    {
      key: "businessPhone",
      label: "Phone / WhatsApp",
      placeholder: "+31 6 48867766",
    },
    { key: "businessEmail", label: "Email", placeholder: "tgopf@pm.me" },
    {
      key: "footerCaption",
      label: "Footer Caption",
      placeholder: "Sergio Melicio's first published poetry bundle…",
    },
  ];

  return (
    <div className="space-y-4 admin-panel">
      <p className="text-sm text-gray-600 mb-4">
        Edit the business details and caption shown in the footer.
      </p>

      <div className="grid gap-3">
        {fields.map(({ key, label, placeholder }) => (
          <div key={key}>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              {label}
            </label>
            <input
              type="text"
              value={form[key] as string}
              onChange={(e) => handleChange(key, e.target.value)}
              placeholder={placeholder}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-black"
            />
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3 pt-2">
        <button
          type="button"
          onClick={handleSave}
          disabled={updateMutation.isPending}
          className="px-5 py-2 bg-black text-white text-sm font-semibold rounded-lg hover:bg-gray-800 transition-colors"
          data-ocid="footer-settings-save"
        >
          {updateMutation.isPending ? "Saving…" : "Save Footer Settings"}
        </button>
        {saved && (
          <span className="text-sm text-green-600 font-medium">✓ Saved!</span>
        )}
        {updateMutation.isError && (
          <span className="text-sm text-red-600">
            Error:{" "}
            {updateMutation.error instanceof Error
              ? updateMutation.error.message
              : "Failed to save"}
          </span>
        )}
      </div>
    </div>
  );
}
