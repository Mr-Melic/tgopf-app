import { ArrowLeft, Download, Search, Star } from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";
import { AuthorNoteReaction as BackendAuthorNoteReaction } from "../backend";

import type { AuthorNote } from "../backend";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  type AuthorNoteReaction,
  useAddFavourite,
  useGetAuthorNotes,
  useGetUserFavourites,
  useReactToAuthorNote,
  useRemoveFavourite,
} from "../hooks/useQueries";
import { exportAsPdf } from "../utils/exportPdf";
import { shuffle } from "../utils/shuffle";

interface AuthorNotesPageProps {
  onNavigateHome: () => void;
}

const REACTION_EMOJIS: {
  key: AuthorNoteReaction;
  emoji: string;
  label: string;
}[] = [
  { key: BackendAuthorNoteReaction.love, emoji: "❤️", label: "Love" },
  { key: BackendAuthorNoteReaction.like, emoji: "👍", label: "Like" },
  { key: BackendAuthorNoteReaction.dislike, emoji: "👎", label: "Dislike" },
  { key: BackendAuthorNoteReaction.laugh, emoji: "😂", label: "Laugh" },
];

interface NoteCardProps {
  note: AuthorNote;
  isFavourited: boolean;
  isLoggedIn: boolean;
  onToggleFavourite: (id: string) => void;
}

function NoteCard({
  note,
  isFavourited,
  isLoggedIn,
  onToggleFavourite,
}: NoteCardProps) {
  const reactMutation = useReactToAuthorNote();
  const [localReactions, setLocalReactions] = useState<{
    love: bigint;
    like: bigint;
    dislike: bigint;
    laugh: bigint;
  }>(note.reactions);
  const [userVote, setUserVote] = useState<AuthorNoteReaction | null>(null);

  const handleReact = (reaction: AuthorNoteReaction) => {
    if (!isLoggedIn) return;
    const prevVote = userVote;

    // Optimistic update
    setLocalReactions((prev) => {
      const next = { ...prev };
      // Remove previous vote
      if (prevVote && prevVote !== reaction) {
        if (next[prevVote] > 0n) next[prevVote] -= 1n;
      }
      // Add new vote (toggle off if same)
      if (prevVote === reaction) {
        if (next[reaction] > 0n) next[reaction] -= 1n;
        setUserVote(null);
        return next;
      }
      next[reaction] += 1n;
      return next;
    });

    if (prevVote !== reaction) {
      setUserVote(reaction);
      reactMutation.mutate({ noteId: note.id, reaction });
    }
  };

  return (
    <div
      data-ocid="author-note-card"
      className="relative bg-white border border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow"
    >
      {/* Star favourite button */}
      {isLoggedIn && (
        <button
          type="button"
          data-ocid="author-note-favourite-btn"
          aria-label={
            isFavourited ? "Remove from favourites" : "Add to favourites"
          }
          onClick={() => onToggleFavourite(note.id)}
          className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-gray-100 transition-colors"
        >
          <Star
            className={`w-5 h-5 transition-colors ${
              isFavourited
                ? "fill-yellow-400 text-yellow-400"
                : "text-gray-300 hover:text-yellow-400"
            }`}
          />
        </button>
      )}

      <h2 className="text-2xl font-bold mb-1 adobe-jenson pr-10">
        {note.poemTitle}
      </h2>
      {note.poemSubtitle && (
        <p className="text-base italic text-gray-500 mb-3 adobe-jenson">
          {note.poemSubtitle}
        </p>
      )}
      <p className="text-gray-700 leading-relaxed whitespace-pre-wrap mb-5">
        {note.noteText}
      </p>

      {/* Reaction row */}
      <div className="flex gap-3 border-t border-gray-100 pt-4">
        {REACTION_EMOJIS.map(({ key, emoji, label }) => (
          <button
            key={key}
            type="button"
            data-ocid={`reaction-btn-${key}`}
            onClick={() => handleReact(key)}
            aria-label={`${label}: ${Number(localReactions[key])}`}
            title={!isLoggedIn ? "Login to react" : undefined}
            disabled={!isLoggedIn}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 border ${
              !isLoggedIn
                ? "opacity-40 cursor-not-allowed pointer-events-none bg-white text-gray-600 border-gray-200"
                : userVote === key
                  ? "bg-black text-white border-black"
                  : "bg-white text-gray-600 border-gray-200 hover:border-gray-400 hover:bg-gray-50"
            }`}
          >
            <span className="text-base leading-none">{emoji}</span>
            <span>{Number(localReactions[key])}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

type TabType = "all" | "favourites";

export default function AuthorNotesPage({
  onNavigateHome,
}: AuthorNotesPageProps) {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const { identity } = useInternetIdentity();
  const isLoggedIn = !!identity;

  const { data: notes, isLoading, error } = useGetAuthorNotes();
  const { data: favouritesData } = useGetUserFavourites();
  const addFavourite = useAddFavourite();
  const removeFavourite = useRemoveFavourite();

  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<TabType>("all");

  const favouriteIds = useMemo(
    () => new Set(favouritesData?.authorNotes ?? []),
    [favouritesData],
  );

  // Shuffle on page mount (stable across renders via useMemo with empty deps)
  const shuffledNotes = useMemo(() => {
    if (!notes || notes.length === 0) return [];
    return shuffle([...notes]);
  }, [notes]);

  // Filter by search keywords (any word in the query matches title or subtitle)
  const filteredNotes = useMemo(() => {
    const base =
      activeTab === "favourites"
        ? shuffle(shuffledNotes.filter((n) => favouriteIds.has(n.id)))
        : shuffledNotes;

    if (!searchQuery.trim()) return base;
    const words = searchQuery.trim().toLowerCase().split(/\s+/).filter(Boolean);
    return base.filter((note) => {
      const titleLower = note.poemTitle.toLowerCase();
      const subtitleLower = note.poemSubtitle.toLowerCase();
      return words.every(
        (word) => titleLower.includes(word) || subtitleLower.includes(word),
      );
    });
  }, [shuffledNotes, searchQuery, activeTab, favouriteIds]);

  // Suggestions based on partial match (for keyword hint UI)
  const suggestions = useMemo(() => {
    if (!searchQuery.trim() || !notes) return [];
    const q = searchQuery.trim().toLowerCase();
    return notes
      .filter(
        (note) =>
          note.poemTitle.toLowerCase().includes(q) ||
          note.poemSubtitle.toLowerCase().includes(q),
      )
      .map((note) => note.poemTitle)
      .filter((v, i, a) => a.indexOf(v) === i)
      .slice(0, 6);
  }, [notes, searchQuery]);

  const handleToggleFavourite = (id: string) => {
    if (!isLoggedIn) return;
    if (favouriteIds.has(id)) {
      removeFavourite.mutate({ itemType: "authorNote", itemId: id });
    } else {
      addFavourite.mutate({ itemType: "authorNote", itemId: id });
    }
  };

  const handleExportFavourites = () => {
    const favourited = (notes ?? []).filter((n) => favouriteIds.has(n.id));
    const sections = favourited.map((n) => ({
      title: n.poemSubtitle
        ? `${n.poemTitle} — ${n.poemSubtitle}`
        : n.poemTitle,
      lines: [n.noteText],
    }));
    exportAsPdf("My Favourite Author's Notes", sections);
  };

  const backButton = (
    <button
      type="button"
      onClick={onNavigateHome}
      className="mb-8 flex items-center gap-2 text-gray-600 hover:text-black transition-colors"
      data-ocid="author-notes-back-btn"
    >
      <ArrowLeft className="w-5 h-5" />
      <span>Back to Home</span>
    </button>
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-4xl mx-auto px-4 py-12">
          {backButton}
          <div className="flex items-center justify-center py-20">
            <p className="text-gray-500">Loading author's notes...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-4xl mx-auto px-4 py-12">
          {backButton}
          <div className="flex items-center justify-center py-20">
            <p className="text-red-500">Error loading author's notes</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 py-12">
        {backButton}

        <h1 className="text-4xl font-bold mb-2 adobe-jenson">Author's Notes</h1>
        <p className="text-gray-500 mb-6 italic adobe-jenson">
          Personal notes from the author — one poem at a time.
        </p>

        {/* Tab bar */}
        <div
          className="flex items-center gap-1 mb-6 border-b border-gray-200"
          data-ocid="author-notes-tabs"
        >
          <button
            type="button"
            data-ocid="author-notes-tab-all"
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
            data-ocid="author-notes-tab-favourites"
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

          {/* Export button — only in Favourites tab when items exist */}
          {activeTab === "favourites" &&
            isLoggedIn &&
            filteredNotes.length > 0 && (
              <button
                type="button"
                data-ocid="author-notes-export-favourites-btn"
                onClick={handleExportFavourites}
                className="ml-auto flex items-center gap-1.5 px-3 py-1.5 mb-0.5 text-xs font-medium adobe-jenson border border-gray-300 rounded-lg text-gray-600 hover:border-black hover:text-black transition-colors"
                aria-label="Export favourites as PDF"
              >
                <Download className="w-3.5 h-3.5" />
                Export
              </button>
            )}
        </div>

        {/* Search bar (shown in all tabs) */}
        {activeTab === "all" && (
          <div className="relative mb-8" data-ocid="author-notes-search">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by poem title or subtitle..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-black/20 focus:border-gray-400 transition-all"
            />
            {/* Suggestions dropdown */}
            {searchQuery.trim() && suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-10 overflow-hidden">
                {suggestions.map((title) => (
                  <button
                    key={title}
                    type="button"
                    onClick={() => setSearchQuery(title)}
                    className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0"
                  >
                    {title}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Not logged in + favourites tab */}
        {activeTab === "favourites" && !isLoggedIn && (
          <div
            className="text-center py-20"
            data-ocid="author-notes-favourites-login-prompt"
          >
            <Star className="w-10 h-10 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">Log in to save favourites.</p>
          </div>
        )}

        {/* Empty favourites */}
        {activeTab === "favourites" &&
          isLoggedIn &&
          filteredNotes.length === 0 && (
            <div
              className="text-center py-20"
              data-ocid="author-notes-favourites-empty"
            >
              <Star className="w-10 h-10 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">
                No favourites yet — click the star on any item to save it here.
              </p>
            </div>
          )}

        {/* All tab empty */}
        {activeTab === "all" && filteredNotes.length === 0 && (
          <div className="text-center py-20" data-ocid="author-notes-empty">
            <p className="text-gray-500 text-lg">
              {searchQuery.trim()
                ? "No notes match your search."
                : "No author's notes available yet."}
            </p>
          </div>
        )}

        {/* Cards */}
        {(activeTab === "all" || isLoggedIn) && filteredNotes.length > 0 && (
          <div className="space-y-8">
            {filteredNotes.map((note) => (
              <NoteCard
                key={note.id}
                note={note}
                isFavourited={favouriteIds.has(note.id)}
                isLoggedIn={isLoggedIn}
                onToggleFavourite={handleToggleFavourite}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
