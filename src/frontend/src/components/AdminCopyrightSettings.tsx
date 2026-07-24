import { Loader2, Save, Settings2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  useGetCopyrightSettings,
  useUpdateCopyrightSettings,
} from "../hooks/useQueries";

export default function AdminCopyrightSettings() {
  const { data: settings, isLoading } = useGetCopyrightSettings();
  const updateSettings = useUpdateCopyrightSettings();

  const [copyrightLine, setCopyrightLine] = useState(
    "© {startYear} - {currentYear} The Gospel of Poetic Frolic / Le Royalties Sergio Melicio. All rights reserved.",
  );
  const [startYear, setStartYear] = useState(2025);
  const [yearColor, setYearColor] = useState("#ec4899");
  const [legalText, setLegalText] = useState(
    `All content contained within this publication, website, and associated web applications; including but not limited to text, imagery, design, layout, source code, and audiovisual material; is protected under the copyright laws of the Kingdom of the Netherlands (Auteurswet), applicable European Union directives, and international treaties including the Berne Convention and the WIPO Copyright Treaty.

No portion of this work may be reproduced, distributed, publicly communicated, adapted, or otherwise exploited in any form or by any means; whether electronic, mechanical, photographic, or digital; without the prior express written consent of the rights holder.

This work, in whole or in part, may not be used to train, develop, fine-tune, or otherwise inform any artificial intelligence system, machine learning model, large language model, generative algorithm, or data-mining technology; whether commercial or non-commercial in nature. Any such use constitutes an infringement of the rights holder's exclusive rights under applicable law, including Article 4 of Directive (EU) 2019/790 (DSM Directive), and is expressly opted out of pursuant to Article 4(3) thereof.

Unauthorized use, duplication, distribution, scraping, indexing, or exhibition of any protected material may result in civil liability and criminal prosecution under Dutch and international law.`,
  );

  useEffect(() => {
    if (settings) {
      setCopyrightLine(settings.copyrightLine || copyrightLine);
      setStartYear(settings.startYear || 2025);
      setYearColor(settings.yearColor || "#ec4899");
      setLegalText(settings.legalText || legalText);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings]);

  const handleSave = async () => {
    try {
      await updateSettings.mutateAsync({
        copyrightLine,
        startYear,
        yearColor,
        legalText,
      });
      toast.success("Copyright settings saved successfully!");
    } catch (error) {
      console.error("Failed to save copyright settings:", error);
      toast.error("Failed to save copyright settings");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-10">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  const currentYear = new Date().getFullYear();
  const previewLine = copyrightLine
    .replace("{startYear}", String(startYear))
    .replace("{currentYear}", String(currentYear));

  return (
    <div className="space-y-6 text-gray-900">
      {/* Preview */}
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
        <div className="flex items-center gap-2 mb-2">
          <Settings2 className="w-4 h-4 text-gray-500" />
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Live Preview
          </span>
        </div>
        <p className="text-sm text-gray-700 leading-relaxed">
          {previewLine.split(String(currentYear)).map((part, i, arr) =>
            i < arr.length - 1 ? (
              <span key={i}>
                {part}
                <span style={{ color: yearColor }} className="font-semibold">
                  {currentYear}
                </span>
              </span>
            ) : (
              <span key={i}>{part}</span>
            ),
          )}
        </p>
      </div>

      {/* Copyright line */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">
          Copyright line text
          <span className="ml-2 text-xs font-normal text-gray-400">
            Use{" "}
            <code className="bg-gray-100 px-1 rounded">{"{startYear}"}</code>{" "}
            and{" "}
            <code className="bg-gray-100 px-1 rounded">{"{currentYear}"}</code>{" "}
            as placeholders
          </span>
        </label>
        <textarea
          value={copyrightLine}
          onChange={(e) => setCopyrightLine(e.target.value)}
          rows={2}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-black resize-none"
          data-ocid="copyright-line-input"
        />
      </div>

      {/* Start year + Year color row */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            Start year
            <span className="ml-2 text-xs font-normal text-gray-400">
              e.g. 2025
            </span>
          </label>
          <input
            type="number"
            value={startYear}
            min={2000}
            max={2100}
            onChange={(e) => setStartYear(Number(e.target.value))}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-black"
            data-ocid="copyright-start-year-input"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            Dynamic year color
            <span className="ml-2 text-xs font-normal text-gray-400">
              applies to {"{currentYear}"}
            </span>
          </label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={yearColor}
              onChange={(e) => setYearColor(e.target.value)}
              className="h-9 w-14 cursor-pointer rounded border border-gray-300 p-0.5"
              data-ocid="copyright-year-color-picker"
            />
            <input
              type="text"
              value={yearColor}
              onChange={(e) => setYearColor(e.target.value)}
              placeholder="#ec4899"
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-black"
              data-ocid="copyright-year-color-input"
            />
          </div>
        </div>
      </div>

      {/* Legal text */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">
          Legal copyright notice
          <span className="ml-2 text-xs font-normal text-gray-400">
            displayed below the copyright line — separate paragraphs with blank
            lines
          </span>
        </label>
        <textarea
          value={legalText}
          onChange={(e) => setLegalText(e.target.value)}
          rows={12}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-black resize-y font-mono leading-relaxed"
          data-ocid="copyright-legal-text-input"
        />
      </div>

      {/* Save */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleSave}
          disabled={updateSettings.isPending}
          className="flex items-center gap-2 px-5 py-2 bg-black text-white rounded-full text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-50"
          data-ocid="copyright-settings-save-btn"
        >
          {updateSettings.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          Save copyright settings
        </button>
      </div>
    </div>
  );
}
