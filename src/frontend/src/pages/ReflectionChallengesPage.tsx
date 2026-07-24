import { ArrowLeft, Download, Star } from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";
import type { ReflectionBlock } from "../backend";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  type ReflectionBlockReactionType,
  useAddFavourite,
  useGetReflectionBlocks,
  useGetUserFavourites,
  useReactToReflectionBlock,
  useRemoveFavourite,
} from "../hooks/useQueries";
import { exportAsPdf } from "../utils/exportPdf";
import { shuffle } from "../utils/shuffle";

interface ReflectionChallengesPageProps {
  onNavigateHome: () => void;
}

const REACTION_EMOJIS: {
  key: ReflectionBlockReactionType;
  emoji: string;
  label: string;
}[] = [
  { key: "love", emoji: "❤️", label: "Love" },
  { key: "like", emoji: "👍", label: "Like" },
  { key: "dislike", emoji: "👎", label: "Dislike" },
  { key: "laugh", emoji: "😂", label: "Laugh" },
];

interface BlockCardProps {
  block: ReflectionBlock;
  isFavourited: boolean;
  isLoggedIn: boolean;
  onToggleFavourite: (id: string) => void;
}

function BlockCard({
  block,
  isFavourited,
  isLoggedIn,
  onToggleFavourite,
}: BlockCardProps) {
  const reactMutation = useReactToReflectionBlock();

  // Backend-driven counts, start at 0
  const backendReactions = (
    block as ReflectionBlock & {
      reactions?: {
        love: bigint;
        like: bigint;
        dislike: bigint;
        laugh: bigint;
      };
    }
  ).reactions;
  const [counts, setCounts] = useState<{
    love: number;
    like: number;
    dislike: number;
    laugh: number;
  }>({
    love: backendReactions ? Number(backendReactions.love) : 0,
    like: backendReactions ? Number(backendReactions.like) : 0,
    dislike: backendReactions ? Number(backendReactions.dislike) : 0,
    laugh: backendReactions ? Number(backendReactions.laugh) : 0,
  });
  const [userVote, setUserVote] = useState<ReflectionBlockReactionType | null>(
    null,
  );

  const handleReact = (reaction: ReflectionBlockReactionType) => {
    if (!isLoggedIn) return;
    const prevVote = userVote;

    setCounts((prev) => {
      const next = { ...prev };
      if (prevVote && prevVote !== reaction) {
        if (next[prevVote] > 0) next[prevVote] -= 1;
      }
      if (prevVote === reaction) {
        if (next[reaction] > 0) next[reaction] -= 1;
        return next;
      }
      next[reaction] += 1;
      return next;
    });

    if (prevVote === reaction) {
      setUserVote(null);
    } else {
      setUserVote(reaction);
      reactMutation.mutate({ blockId: block.id, reaction });
    }
  };

  return (
    <div
      data-ocid="reflection-block-card"
      className="relative bg-white border border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow"
    >
      {/* Star favourite button */}
      {isLoggedIn && (
        <button
          type="button"
          data-ocid="reflection-favourite-btn"
          aria-label={
            isFavourited ? "Remove from favourites" : "Add to favourites"
          }
          onClick={() => onToggleFavourite(block.id)}
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

      <h2 className="text-2xl font-semibold mb-4 adobe-jenson pr-10">
        {block.poemTitle}
      </h2>
      <div className="space-y-3 mb-5">
        {block.reflectionChallenges.map((challenge, index) => (
          <div key={index} className="flex gap-3">
            <span className="text-gray-400 font-medium flex-shrink-0">
              {index + 1}.
            </span>
            <p className="text-gray-700 leading-relaxed">{challenge}</p>
          </div>
        ))}
      </div>

      {/* Reaction row */}
      <div className="flex gap-2 border-t border-gray-100 pt-4 flex-wrap">
        {REACTION_EMOJIS.map(({ key, emoji, label }) => (
          <button
            key={key}
            type="button"
            data-ocid={`reflection-reaction-${key}`}
            onClick={() => handleReact(key)}
            aria-label={`${label}: ${counts[key]}`}
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
            <span>{counts[key]}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

type TabType = "all" | "favourites";

export default function ReflectionChallengesPage({
  onNavigateHome,
}: ReflectionChallengesPageProps) {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const { identity } = useInternetIdentity();
  const isLoggedIn = !!identity;

  const { data: blocks, isLoading, error } = useGetReflectionBlocks();
  const { data: favouritesData } = useGetUserFavourites();
  const addFavourite = useAddFavourite();
  const removeFavourite = useRemoveFavourite();

  const [activeTab, setActiveTab] = useState<TabType>("all");

  const favouriteIds = useMemo(
    () => new Set(favouritesData?.reflections ?? []),
    [favouritesData],
  );

  const randomizedBlocks = useMemo(() => {
    if (!blocks || blocks.length === 0) return [];
    return shuffle(blocks);
  }, [blocks]);

  const displayedBlocks = useMemo(() => {
    if (activeTab === "favourites") {
      return shuffle(randomizedBlocks.filter((b) => favouriteIds.has(b.id)));
    }
    return randomizedBlocks;
  }, [activeTab, randomizedBlocks, favouriteIds]);

  const handleToggleFavourite = (id: string) => {
    if (!isLoggedIn) return;
    if (favouriteIds.has(id)) {
      removeFavourite.mutate({ itemType: "reflection", itemId: id });
    } else {
      addFavourite.mutate({ itemType: "reflection", itemId: id });
    }
  };

  const handleExportFavourites = () => {
    const favourited = (blocks ?? []).filter((b) => favouriteIds.has(b.id));
    const sections = favourited.map((b) => ({
      title: b.poemTitle,
      lines: b.reflectionChallenges.map((q, i) => `${i + 1}. ${q}`),
    }));
    exportAsPdf("My Favourite Reflection Challenges", sections);
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-4xl mx-auto px-4 py-12">
          {backButton}
          <div className="flex items-center justify-center py-20">
            <p className="text-gray-500">Loading reflection challenges...</p>
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
            <p className="text-red-500">Error loading reflection challenges</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 py-12">
        {backButton}

        <h1 className="text-4xl font-bold mb-6 adobe-jenson">
          Reflection Challenges
        </h1>

        {/* Tab bar */}
        <div
          className="flex items-center gap-1 mb-8 border-b border-gray-200"
          data-ocid="reflection-tabs"
        >
          <button
            type="button"
            data-ocid="reflection-tab-all"
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
            data-ocid="reflection-tab-favourites"
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
            displayedBlocks.length > 0 && (
              <button
                type="button"
                data-ocid="reflection-export-favourites-btn"
                onClick={handleExportFavourites}
                className="ml-auto flex items-center gap-1.5 px-3 py-1.5 mb-0.5 text-xs font-medium adobe-jenson border border-gray-300 rounded-lg text-gray-600 hover:border-black hover:text-black transition-colors"
                aria-label="Export favourites as PDF"
              >
                <Download className="w-3.5 h-3.5" />
                Export
              </button>
            )}
        </div>

        {/* Not logged in + favourites tab */}
        {activeTab === "favourites" && !isLoggedIn && (
          <div
            className="text-center py-20"
            data-ocid="reflection-favourites-login-prompt"
          >
            <Star className="w-10 h-10 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">Log in to save favourites.</p>
          </div>
        )}

        {/* Empty favourites */}
        {activeTab === "favourites" &&
          isLoggedIn &&
          displayedBlocks.length === 0 && (
            <div
              className="text-center py-20"
              data-ocid="reflection-favourites-empty"
            >
              <Star className="w-10 h-10 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">
                No favourites yet — click the star on any item to save it here.
              </p>
            </div>
          )}

        {/* All tab empty */}
        {activeTab === "all" && displayedBlocks.length === 0 && (
          <div className="text-center py-20">
            <p className="text-gray-500 text-lg">
              No reflection challenges available yet.
            </p>
          </div>
        )}

        {/* Cards */}
        {(activeTab !== "favourites" || isLoggedIn) &&
          displayedBlocks.length > 0 && (
            <div className="space-y-8">
              {displayedBlocks.map((block) => (
                <BlockCard
                  key={block.id}
                  block={block}
                  isFavourited={favouriteIds.has(block.id)}
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
