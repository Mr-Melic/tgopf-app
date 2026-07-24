import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Download, Star } from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";
import type { ExperienceHubTexts } from "../backend";
import GameCard from "../components/GameCard";
import { useActor } from "../hooks/useActor";
import { useGetGames } from "../hooks/useGameQueries";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useAddFavourite,
  useGetUserFavourites,
  useRemoveFavourite,
} from "../hooks/useQueries";
import { exportAsPdf } from "../utils/exportPdf";
import { shuffle } from "../utils/shuffle";

interface GamesPageProps {
  onNavigateHome: () => void;
  onNavigateToAmbassadorHub: () => void;
  onNavigateToLogin?: () => void;
}

type TabType = "all" | "favourites";

export default function GamesPage({
  onNavigateHome,
  onNavigateToAmbassadorHub,
  onNavigateToLogin,
}: GamesPageProps) {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const { identity } = useInternetIdentity();
  const isLoggedIn = !!identity;

  const { actor, isFetching } = useActor();

  const { data: gamesRaw, isLoading } = useGetGames();
  const { data: favouritesData } = useGetUserFavourites();
  const addFavourite = useAddFavourite();
  const removeFavourite = useRemoveFavourite();

  const { data: hubTexts } = useQuery<ExperienceHubTexts>({
    queryKey: ["experienceHubTexts"],
    queryFn: async () => {
      if (!actor) throw new Error("No actor");
      return actor.getExperienceHubTexts();
    },
    enabled: !!actor && !isFetching,
  });

  const [activeTab, setActiveTab] = useState<TabType>("all");

  const favouriteIds = useMemo(
    () => new Set(favouritesData?.games ?? []),
    [favouritesData],
  );

  // True random shuffle on every page load (stable only when data changes)
  const allGames = useMemo(
    () => shuffle(gamesRaw ?? []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [gamesRaw?.length],
  );

  const displayedGames = useMemo(() => {
    if (activeTab === "favourites") {
      return shuffle(allGames.filter((g) => favouriteIds.has(g.id)));
    }
    return allGames;
  }, [activeTab, allGames, favouriteIds]);

  const handleToggleFavourite = (id: string) => {
    if (!isLoggedIn) return;
    if (favouriteIds.has(id)) {
      removeFavourite.mutate({ itemType: "game", itemId: id });
    } else {
      addFavourite.mutate({ itemType: "game", itemId: id });
    }
  };

  const handleExportFavourites = () => {
    const favourited = (gamesRaw ?? []).filter((g) => favouriteIds.has(g.id));
    const sections = favourited.map((g) => ({
      title: g.title,
      lines: [
        `Type: ${g.gameType}`,
        `Players: ${g.playerCount}`,
        `Materials: ${g.materialsRequired}`,
      ],
    }));
    exportAsPdf("My Favourite Games", sections);
  };

  return (
    <div className="min-h-screen py-12 px-4 bg-white">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-wrap justify-between items-start gap-4 mb-8">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold text-black mb-3 adobe-jenson">
              Games
            </h1>
            <p className="text-lg text-gray-600">
              {hubTexts?.gamesPageSubtitle ??
                "Discover and explore games — shuffled fresh every visit."}
            </p>
          </div>

          <div className="flex gap-3 flex-wrap">
            <button
              type="button"
              onClick={onNavigateToAmbassadorHub}
              className="flex items-center gap-2 text-black hover:text-gray-700 transition-colors font-medium backdrop-blur-sm bg-white/80 border border-gray-200 px-4 py-2 rounded-xl shadow-md hover:shadow-lg"
              data-ocid="games-back-hub-btn"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Hub
            </button>
            <button
              type="button"
              onClick={onNavigateHome}
              className="flex items-center gap-2 text-gray-600 hover:text-black transition-colors font-medium backdrop-blur-sm bg-white/80 border border-gray-200 px-4 py-2 rounded-xl shadow-md hover:shadow-lg"
              data-ocid="games-back-home-btn"
            >
              Home
            </button>
          </div>
        </div>

        {/* Tab bar */}
        <div
          className="flex items-center gap-1 mb-8 border-b border-gray-200"
          data-ocid="games-tabs"
        >
          <button
            type="button"
            data-ocid="games-tab-all"
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
            data-ocid="games-tab-favourites"
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
            displayedGames.length > 0 && (
              <button
                type="button"
                data-ocid="games-export-favourites-btn"
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
            data-ocid="games-favourites-login-prompt"
          >
            <Star className="w-10 h-10 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">Log in to save favourites.</p>
          </div>
        )}

        {/* Loading state */}
        {isLoading && activeTab === "all" && (
          <div className="grid md:grid-cols-2 gap-8">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="bg-white/80 border border-gray-100 rounded-2xl h-80 animate-pulse"
              />
            ))}
          </div>
        )}

        {/* Games grid */}
        {!isLoading &&
          (activeTab === "all" || isLoggedIn) &&
          displayedGames.length > 0 && (
            <div className="grid md:grid-cols-2 gap-8">
              {displayedGames.map((game) => (
                <GameCard
                  key={game.id}
                  game={game}
                  onLoginClick={onNavigateToLogin}
                  isFavourited={favouriteIds.has(game.id)}
                  isLoggedIn={isLoggedIn}
                  onToggleFavourite={handleToggleFavourite}
                />
              ))}
            </div>
          )}

        {/* Empty state — favourites */}
        {!isLoading &&
          activeTab === "favourites" &&
          isLoggedIn &&
          displayedGames.length === 0 && (
            <div
              className="backdrop-blur-sm bg-white/80 border border-gray-100 rounded-2xl shadow-xl p-16 text-center"
              data-ocid="games-favourites-empty"
            >
              <Star className="w-10 h-10 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 max-w-sm mx-auto">
                No favourites yet — click the star on any item to save it here.
              </p>
            </div>
          )}

        {/* Empty state — all */}
        {!isLoading && activeTab === "all" && displayedGames.length === 0 && (
          <div
            className="backdrop-blur-sm bg-white/80 border border-gray-100 rounded-2xl shadow-xl p-16 text-center"
            data-ocid="games-empty-state"
          >
            <div className="text-7xl mb-6">🎮</div>
            <h3 className="text-2xl font-bold text-black mb-3 adobe-jenson">
              No Games Yet
            </h3>
            <p className="text-gray-500 max-w-sm mx-auto">
              The admin hasn't added any games yet. Check back soon!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
