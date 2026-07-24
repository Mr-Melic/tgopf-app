import { useQuery } from "@tanstack/react-query";
import { ArrowRight } from "lucide-react";
import React, { useEffect } from "react";
import type { ExperienceHubTexts } from "../backend";
import { useActor } from "../hooks/useActor";

interface AmbassadorHubPageProps {
  onNavigateToRetail: () => void;
  onNavigateToSocial: () => void;
  onNavigateToGames: () => void;
  onNavigateHome: () => void;
}

export default function AmbassadorHubPage({
  onNavigateToRetail,
  onNavigateToSocial,
  onNavigateToGames,
  onNavigateHome,
}: AmbassadorHubPageProps) {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const { actor, isFetching } = useActor();

  const { data: texts } = useQuery<ExperienceHubTexts>({
    queryKey: ["experienceHubTexts"],
    queryFn: async () => {
      if (!actor) throw new Error("No actor");
      return actor.getExperienceHubTexts();
    },
    enabled: !!actor && !isFetching,
  });

  return (
    <div className="min-h-screen py-16 px-4 bg-gray-50">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-12">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold text-black mb-4 adobe-jenson">
              Experience Hub
            </h1>
            <p className="text-lg text-gray-600">
              {texts?.mainSubtitle ??
                "Choose your path to earn rewards and climb the leaderboard"}
            </p>
          </div>
          <button
            onClick={onNavigateHome}
            className="flex items-center text-black hover:text-gray-700 transition-colors font-medium backdrop-blur-sm bg-white/80 border border-gray-200 px-4 py-2 rounded-xl shadow-md hover:shadow-lg"
          >
            <svg
              className="w-4 h-4 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back to Home
          </button>
        </div>

        {/* Three Path Cards */}
        <div className="grid md:grid-cols-3 gap-6">
          {/* Retail Path */}
          <button
            onClick={onNavigateToRetail}
            className="backdrop-blur-sm bg-white/80 border border-gray-200 rounded-2xl shadow-xl p-8 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 text-left group"
            data-ocid="hub-retail-btn"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="w-14 h-14 bg-black rounded-xl flex items-center justify-center">
                <span className="text-white text-2xl">🛍️</span>
              </div>
              <ArrowRight className="w-6 h-6 text-gray-400 group-hover:text-black group-hover:translate-x-1 transition-all duration-300" />
            </div>
            <h2 className="text-2xl font-bold text-black mb-3 adobe-jenson">
              Retail
            </h2>
            <p className="text-gray-600 leading-relaxed text-sm">
              {texts?.retailCardDescription ??
                "Earn rewards through direct sales, referrals, and retail partnerships. Track your performance and compete with other retail ambassadors."}
            </p>
          </button>

          {/* Social Path */}
          <button
            onClick={onNavigateToSocial}
            className="backdrop-blur-sm bg-white/80 border border-gray-200 rounded-2xl shadow-xl p-8 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 text-left group"
            data-ocid="hub-social-btn"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="w-14 h-14 bg-black rounded-xl flex items-center justify-center">
                <span className="text-white text-2xl">📱</span>
              </div>
              <ArrowRight className="w-6 h-6 text-gray-400 group-hover:text-black group-hover:translate-x-1 transition-all duration-300" />
            </div>
            <h2 className="text-2xl font-bold text-black mb-3 adobe-jenson">
              Social
            </h2>
            <p className="text-gray-600 leading-relaxed text-sm">
              {texts?.socialCardDescription ??
                "Grow your influence through social media engagement, content creation, and community building. Compete on the social leaderboard."}
            </p>
          </button>

          {/* Games Path */}
          <button
            onClick={onNavigateToGames}
            className="backdrop-blur-sm bg-white/80 border border-gray-200 rounded-2xl shadow-xl p-8 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 text-left group"
            data-ocid="hub-games-btn"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="w-14 h-14 bg-black rounded-xl flex items-center justify-center">
                <span className="text-white text-2xl">🎮</span>
              </div>
              <ArrowRight className="w-6 h-6 text-gray-400 group-hover:text-black group-hover:translate-x-1 transition-all duration-300" />
            </div>
            <h2 className="text-2xl font-bold text-black mb-3 adobe-jenson">
              Games
            </h2>
            <p className="text-gray-600 leading-relaxed text-sm">
              {texts?.gamesCardDescription ??
                "Explore a collection of games curated by the author. Discover new ways to play, react to your favourites, and join the conversation."}
            </p>
          </button>
        </div>
      </div>
    </div>
  );
}
