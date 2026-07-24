import { Loader2 } from "lucide-react";
import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  type HomepageTextBlocks,
  useGetHomepageTextBlocks,
  useGetHomepageTextBlocksAnnaEn,
  useGetHomepageTextBlocksAnnaNl,
  useGetHomepageTextBlocksEmilieEn,
  useGetHomepageTextBlocksEmilieNl,
  useUpdateHomepageTextBlocks,
  useUpdateHomepageTextBlocksAnnaEn,
  useUpdateHomepageTextBlocksAnnaNl,
  useUpdateHomepageTextBlocksEmilieEn,
  useUpdateHomepageTextBlocksEmilieNl,
} from "../hooks/useQueries";

type BookTab = "topf" | "emilie" | "anna";
type LangSubTab = "en" | "nl";

const TABS: { id: BookTab; label: string }[] = [
  { id: "topf", label: "TGOPF" },
  { id: "emilie", label: "Emilie" },
  { id: "anna", label: "Anna" },
];

const LANG_SUBTABS: { id: LangSubTab; label: string }[] = [
  { id: "en", label: "EN" },
  { id: "nl", label: "NL" },
];

const COMING_SOON_FALLBACK: HomepageTextBlocks = {
  block1: { title: "", content: "Coming soon..." },
  block2: { title: "", content: "" },
  block3: { title: "", content: "" },
};

function TextBlockEditor({
  textBlocks,
  isLoading,
  isSaving,
  onSave,
}: {
  textBlocks: HomepageTextBlocks | undefined;
  isLoading: boolean;
  isSaving: boolean;
  onSave: (blocks: HomepageTextBlocks) => Promise<void>;
}) {
  const [block1Content, setBlock1Content] = useState("");
  const [block2Title, setBlock2Title] = useState("");
  const [block2Content, setBlock2Content] = useState("");
  const [block3Title, setBlock3Title] = useState("");
  const [block3Content, setBlock3Content] = useState("");

  useEffect(() => {
    if (textBlocks) {
      setBlock1Content(textBlocks.block1.content);
      setBlock2Title(textBlocks.block2.title);
      setBlock2Content(textBlocks.block2.content);
      setBlock3Title(textBlocks.block3.title);
      setBlock3Content(textBlocks.block3.content);
    } else {
      setBlock1Content("Coming soon...");
      setBlock2Title("");
      setBlock2Content("");
      setBlock3Title("");
      setBlock3Content("");
    }
  }, [textBlocks]);

  const handleSave = async () => {
    try {
      await onSave({
        block1: { title: "", content: block1Content },
        block2: { title: block2Title, content: block2Content },
        block3: { title: block3Title, content: block3Content },
      });
      toast.success("Text blocks updated successfully!");
    } catch (error) {
      console.error("Failed to update text blocks:", error);
      toast.error("Failed to update text blocks");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Block 1 */}
      <div className="border border-gray-200 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Text Block 1 (No Title)
        </h3>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Content
          </label>
          <textarea
            value={block1Content}
            onChange={(e) => setBlock1Content(e.target.value)}
            rows={6}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent resize-none"
            placeholder="Enter the first text block content..."
          />
        </div>
      </div>

      {/* Block 2 */}
      <div className="border border-gray-200 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Text Block 2 (With Bold Title)
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Title
            </label>
            <input
              type="text"
              value={block2Title}
              onChange={(e) => setBlock2Title(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent"
              placeholder="Enter the title for block 2..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Content
            </label>
            <textarea
              value={block2Content}
              onChange={(e) => setBlock2Content(e.target.value)}
              rows={6}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent resize-none"
              placeholder="Enter the second text block content..."
            />
          </div>
        </div>
      </div>

      {/* Block 3 */}
      <div className="border border-gray-200 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Text Block 3 (With Bold Title)
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Title
            </label>
            <input
              type="text"
              value={block3Title}
              onChange={(e) => setBlock3Title(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent"
              placeholder="Enter the title for block 3..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Content
            </label>
            <textarea
              value={block3Content}
              onChange={(e) => setBlock3Content(e.target.value)}
              rows={6}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent resize-none"
              placeholder="Enter the third text block content..."
            />
          </div>
        </div>
      </div>

      {/* Save */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="bg-black text-white px-8 py-3 rounded-xl font-semibold hover:bg-gray-800 transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
        >
          {isSaving ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Saving...</span>
            </>
          ) : (
            <span>Save Changes</span>
          )}
        </button>
      </div>
    </div>
  );
}

export default function AdminHomepageTextManager() {
  const [activeTab, setActiveTab] = useState<BookTab>("topf");
  // Per-book language sub-tab for the bilingual Emilie/Anna editors.
  // Independent so admins can edit EN on Emilie and NL on Anna simultaneously.
  const [emilieLang, setEmilieLang] = useState<LangSubTab>("en");
  const [annaLang, setAnnaLang] = useState<LangSubTab>("en");

  const { data: topfBlocks, isLoading: topfLoading } =
    useGetHomepageTextBlocks();
  const updateTopf = useUpdateHomepageTextBlocks();

  // Emilie — bilingual
  const { data: emilieEnBlocks, isLoading: emilieEnLoading } =
    useGetHomepageTextBlocksEmilieEn();
  const { data: emilieNlBlocks, isLoading: emilieNlLoading } =
    useGetHomepageTextBlocksEmilieNl();
  const updateEmilieEn = useUpdateHomepageTextBlocksEmilieEn();
  const updateEmilieNl = useUpdateHomepageTextBlocksEmilieNl();

  // Anna — bilingual
  const { data: annaEnBlocks, isLoading: annaEnLoading } =
    useGetHomepageTextBlocksAnnaEn();
  const { data: annaNlBlocks, isLoading: annaNlLoading } =
    useGetHomepageTextBlocksAnnaNl();
  const updateAnnaEn = useUpdateHomepageTextBlocksAnnaEn();
  const updateAnnaNl = useUpdateHomepageTextBlocksAnnaNl();

  const tabBtnClass = (tab: BookTab) =>
    `px-6 py-2.5 rounded-full text-sm font-semibold transition-all duration-200 ${
      activeTab === tab
        ? "bg-black text-white shadow"
        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
    }`;

  const langSubtabBtnClass = (tab: BookTab, lang: LangSubTab) => {
    const active =
      (tab === "emilie" && emilieLang === lang) ||
      (tab === "anna" && annaLang === lang);
    return `px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 ${
      active
        ? "bg-gray-900 text-white shadow"
        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
    }`;
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
      <div className="flex items-center mb-8">
        <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mr-4">
          <span className="text-gray-900 text-xl">📝</span>
        </div>
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">
            Homepage Text Management
          </h2>
          <p className="text-gray-600">
            Edit the About This Book text for each title
          </p>
        </div>
      </div>

      {/* Book selector tabs */}
      <div className="flex gap-3 mb-8 pb-6 border-b border-gray-100">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={tabBtnClass(tab.id)}
            data-ocid={`admin-text-tab-${tab.id}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "topf" && (
        <TextBlockEditor
          textBlocks={topfBlocks}
          isLoading={topfLoading}
          isSaving={updateTopf.isPending}
          onSave={(blocks) => updateTopf.mutateAsync(blocks)}
        />
      )}

      {activeTab === "emilie" && (
        <div>
          {/* EN/NL sub-tabs */}
          <div className="flex gap-2 mb-6">
            {LANG_SUBTABS.map((sub) => (
              <button
                key={sub.id}
                type="button"
                onClick={() => setEmilieLang(sub.id)}
                className={langSubtabBtnClass("emilie", sub.id)}
                data-ocid={`admin-text-tab-emilie-lang-${sub.id}`}
              >
                {sub.label}
              </button>
            ))}
          </div>
          {emilieLang === "en" && (
            <TextBlockEditor
              textBlocks={emilieEnBlocks ?? COMING_SOON_FALLBACK}
              isLoading={emilieEnLoading}
              isSaving={updateEmilieEn.isPending}
              onSave={(blocks) => updateEmilieEn.mutateAsync(blocks)}
            />
          )}
          {emilieLang === "nl" && (
            <TextBlockEditor
              textBlocks={emilieNlBlocks ?? COMING_SOON_FALLBACK}
              isLoading={emilieNlLoading}
              isSaving={updateEmilieNl.isPending}
              onSave={(blocks) => updateEmilieNl.mutateAsync(blocks)}
            />
          )}
        </div>
      )}

      {activeTab === "anna" && (
        <div>
          {/* EN/NL sub-tabs */}
          <div className="flex gap-2 mb-6">
            {LANG_SUBTABS.map((sub) => (
              <button
                key={sub.id}
                type="button"
                onClick={() => setAnnaLang(sub.id)}
                className={langSubtabBtnClass("anna", sub.id)}
                data-ocid={`admin-text-tab-anna-lang-${sub.id}`}
              >
                {sub.label}
              </button>
            ))}
          </div>
          {annaLang === "en" && (
            <TextBlockEditor
              textBlocks={annaEnBlocks ?? COMING_SOON_FALLBACK}
              isLoading={annaEnLoading}
              isSaving={updateAnnaEn.isPending}
              onSave={(blocks) => updateAnnaEn.mutateAsync(blocks)}
            />
          )}
          {annaLang === "nl" && (
            <TextBlockEditor
              textBlocks={annaNlBlocks ?? COMING_SOON_FALLBACK}
              isLoading={annaNlLoading}
              isSaving={updateAnnaNl.isPending}
              onSave={(blocks) => updateAnnaNl.mutateAsync(blocks)}
            />
          )}
        </div>
      )}
    </div>
  );
}
