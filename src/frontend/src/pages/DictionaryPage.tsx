import { ArrowLeft, Download, Search, Star } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { DictionaryEntry } from "../backend";
import DictionaryEntryModal from "../components/DictionaryEntryModal";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useAddFavourite,
  useGetDictionaryEntries,
  useGetUserFavourites,
  useRemoveFavourite,
} from "../hooks/useQueries";
import { exportAsPdf } from "../utils/exportPdf";

interface DictionaryPageProps {
  onNavigateHome: () => void;
}

type TabType = "all" | "favourites";

function exportFavourites(entries: DictionaryEntry[]) {
  const sections = entries.map((e) => ({
    title: e.word,
    lines: [
      `Meaning: ${e.meaning}`,
      ...(e.etymology ? [`Etymology: ${e.etymology}`] : []),
      ...(e.examples ? [`Examples: ${e.examples}`] : []),
    ],
  }));
  exportAsPdf("My Favourite Vocabulary", sections);
}

export default function DictionaryPage({
  onNavigateHome,
}: DictionaryPageProps) {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const { identity } = useInternetIdentity();
  const isLoggedIn = !!identity;

  const { data: entries, isLoading } = useGetDictionaryEntries();
  const { data: favouritesData } = useGetUserFavourites();
  const addFavourite = useAddFavourite();
  const removeFavourite = useRemoveFavourite();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEntry, setSelectedEntry] = useState<DictionaryEntry | null>(
    null,
  );
  const [activeTab, setActiveTab] = useState<TabType>("all");

  const favouriteIds = useMemo(
    () => new Set(favouritesData?.vocabulary ?? []),
    [favouritesData],
  );

  const filteredEntries = useMemo(() => {
    const all = entries ?? [];
    const searched = searchQuery
      ? all.filter((e) =>
          e.word.toLowerCase().includes(searchQuery.toLowerCase()),
        )
      : all;
    if (activeTab === "favourites") {
      return searched.filter((e) => favouriteIds.has(e.word));
    }
    return searched;
  }, [entries, searchQuery, activeTab, favouriteIds]);

  const favouriteEntries = useMemo(
    () => (entries ?? []).filter((e) => favouriteIds.has(e.word)),
    [entries, favouriteIds],
  );

  const handleToggleFavourite = (e: React.MouseEvent, word: string) => {
    e.stopPropagation();
    if (!isLoggedIn) return;
    if (favouriteIds.has(word)) {
      removeFavourite.mutate({ itemType: "vocabulary", itemId: word });
    } else {
      addFavourite.mutate({ itemType: "vocabulary", itemId: word });
    }
  };

  const backButton = (
    <button
      type="button"
      onClick={onNavigateHome}
      className="mb-8 flex items-center gap-2 text-gray-600 hover:text-black transition-colors"
    >
      <ArrowLeft className="w-5 h-5" />
      <span>Back to Home</span>
    </button>
  );

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 py-12">
        {backButton}

        <h1 className="text-4xl font-bold mb-6 text-center adobe-jenson">
          Words you can come across in this book
        </h1>

        {/* Tab bar */}
        <div
          className="flex gap-1 mb-6 border-b border-gray-200"
          data-ocid="vocabulary-tabs"
        >
          <button
            type="button"
            data-ocid="vocabulary-tab-all"
            onClick={() => setActiveTab("all")}
            className={`px-5 py-2.5 text-sm font-medium rounded-t-lg transition-colors ${
              activeTab === "all"
                ? "bg-black text-white"
                : "text-gray-500 hover:text-black"
            }`}
          >
            All
          </button>
          <button
            type="button"
            data-ocid="vocabulary-tab-favourites"
            onClick={() => setActiveTab("favourites")}
            className={`flex items-center gap-1.5 px-5 py-2.5 text-sm font-medium rounded-t-lg transition-colors ${
              activeTab === "favourites"
                ? "bg-black text-white"
                : "text-gray-500 hover:text-black"
            }`}
          >
            <Star className="w-4 h-4" />
            Favourites
          </button>
        </div>

        {/* Search bar */}
        <div className="mb-8 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            type="text"
            placeholder="Search a word or phrase"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            data-ocid="vocabulary-search"
            className="pl-10 py-6 text-lg border-2 border-gray-200 rounded-full focus:border-black transition-colors"
          />
        </div>

        {/* Export button in Favourites tab */}
        {activeTab === "favourites" && isLoggedIn && (
          <div className="mb-6 flex justify-end">
            <Button
              type="button"
              data-ocid="vocabulary-export-btn"
              variant="outline"
              disabled={favouriteEntries.length === 0}
              onClick={() => exportFavourites(favouriteEntries)}
              className="flex items-center gap-2 border-black text-black hover:bg-black hover:text-white disabled:opacity-40"
            >
              <Download className="w-4 h-4" />
              Export Favourites
            </Button>
          </div>
        )}

        {/* Not logged in + favourites tab */}
        {activeTab === "favourites" && !isLoggedIn && (
          <div
            className="text-center py-20"
            data-ocid="vocabulary-favourites-login-prompt"
          >
            <Star className="w-10 h-10 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">Log in to save favourites.</p>
          </div>
        )}

        {/* Loading */}
        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Loading dictionary...</p>
          </div>
        ) : (activeTab !== "favourites" || isLoggedIn) &&
          filteredEntries.length === 0 ? (
          <div className="text-center py-12" data-ocid="vocabulary-empty-state">
            {activeTab === "favourites" ? (
              <>
                <Star className="w-10 h-10 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">
                  No favourites yet — click the star on any word to save it
                  here.
                </p>
              </>
            ) : (
              <p className="text-gray-500">
                {searchQuery
                  ? "No words found matching your search."
                  : "No dictionary entries available yet."}
              </p>
            )}
          </div>
        ) : (
          (activeTab !== "favourites" || isLoggedIn) && (
            <div className="grid gap-4">
              {filteredEntries.map((entry) => (
                <Card
                  key={entry.word}
                  data-ocid="vocabulary-entry-card"
                  className="relative cursor-pointer hover:shadow-lg transition-shadow border-2 border-gray-100 hover:border-black"
                  onClick={() => setSelectedEntry(entry)}
                >
                  <CardContent className="p-6 pr-14">
                    <h2 className="text-2xl font-bold mb-2 adobe-jenson">
                      {entry.word}
                    </h2>
                    <p className="text-gray-600 line-clamp-2">
                      {entry.meaning}
                    </p>
                  </CardContent>

                  {/* Star favourite button */}
                  {isLoggedIn && (
                    <button
                      type="button"
                      data-ocid="vocabulary-favourite-btn"
                      aria-label={
                        favouriteIds.has(entry.word)
                          ? "Remove from favourites"
                          : "Add to favourites"
                      }
                      onClick={(e) => handleToggleFavourite(e, entry.word)}
                      className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-gray-100 transition-colors z-10"
                    >
                      <Star
                        className={`w-5 h-5 transition-colors ${
                          favouriteIds.has(entry.word)
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-gray-300 hover:text-yellow-400"
                        }`}
                      />
                    </button>
                  )}
                </Card>
              ))}
            </div>
          )
        )}
      </div>

      {selectedEntry && (
        <DictionaryEntryModal
          entry={selectedEntry}
          isOpen={!!selectedEntry}
          onClose={() => setSelectedEntry(null)}
        />
      )}
    </div>
  );
}
