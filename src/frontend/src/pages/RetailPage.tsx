import { useQuery } from "@tanstack/react-query";
import { Award, Mail, Trophy } from "lucide-react";
import React, { useEffect, useMemo } from "react";
import {
  type ExperienceHubTexts,
  type LeaderboardEntry,
  type RewardFull,
  Variant_referral_other_points,
} from "../backend";
import type { ExperienceChallenge } from "../backend";
import { useFileUrl } from "../blob-storage/FileStorage";
import { useActor } from "../hooks/useActor";
import {
  useGetChallengesByCategory,
  useGetSubmitProofEmail,
} from "../hooks/useChallengeQueries";

interface RetailPageProps {
  onNavigateHome: () => void;
  onNavigateToAmbassadorHub: () => void;
}

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function RetailPage({
  onNavigateHome,
  onNavigateToAmbassadorHub,
}: RetailPageProps) {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const { actor, isFetching } = useActor();

  const { data: leaderboard } = useQuery<LeaderboardEntry[]>({
    queryKey: ["retailLeaderboard"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getRetailLeaderboard();
    },
    enabled: !!actor && !isFetching,
  });

  const { data: rewards } = useQuery<RewardFull[]>({
    queryKey: ["retailRewards"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getRetailRewards();
    },
    enabled: !!actor && !isFetching,
  });

  const { data: hubTexts } = useQuery<ExperienceHubTexts>({
    queryKey: ["experienceHubTexts"],
    queryFn: async () => {
      if (!actor) throw new Error("No actor");
      return actor.getExperienceHubTexts();
    },
    enabled: !!actor && !isFetching,
  });

  const { data: challengesRaw } = useGetChallengesByCategory("retail");
  const { data: submitEmail } = useGetSubmitProofEmail();

  const challenges = useMemo(
    () => shuffleArray(challengesRaw ?? []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [challengesRaw?.length],
  );

  const sortedLeaderboard =
    leaderboard?.sort((a, b) => Number(b.score) - Number(a.score)) || [];
  const hasLeaderboard = sortedLeaderboard.length > 0;
  const hasRewards = rewards && rewards.length > 0;
  const hasChallenges = challenges.length > 0;

  return (
    <div className="min-h-screen py-16 px-4 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-12">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold text-black mb-4">
              Retail Leaderboard
            </h1>
            <p className="text-lg text-gray-600">
              {hubTexts?.retailPageSubtitle ??
                "Top performers in retail sales and partnerships"}
            </p>
          </div>
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onNavigateToAmbassadorHub}
              className="flex items-center text-black hover:text-gray-700 transition-colors font-medium bg-white px-4 py-2 rounded-xl shadow-md hover:shadow-lg"
            >
              <svg
                className="w-4 h-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              Back to Hub
            </button>
            <button
              type="button"
              onClick={onNavigateHome}
              className="flex items-center text-gray-600 hover:text-black transition-colors font-medium bg-white px-4 py-2 rounded-xl shadow-md hover:shadow-lg"
            >
              Home
            </button>
          </div>
        </div>

        {/* Leaderboard Section */}
        {hasLeaderboard && (
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 mb-8">
            <div className="flex items-center mb-6">
              <Trophy className="w-8 h-8 text-black mr-3" />
              <h2 className="text-2xl font-bold text-black">Top Performers</h2>
            </div>
            <div className="space-y-4">
              {sortedLeaderboard.map((entry, index) => (
                <LeaderboardCard
                  key={entry.id}
                  entry={entry}
                  rank={index + 1}
                />
              ))}
            </div>
          </div>
        )}

        {/* Rewards Section */}
        {hasRewards && (
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 mb-8">
            <div className="flex items-center mb-6">
              <Award className="w-8 h-8 text-black mr-3" />
              <h2 className="text-2xl font-bold text-black">Rewards</h2>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              {rewards.map((reward) => (
                <RewardCard key={reward.id} reward={reward} />
              ))}
            </div>
          </div>
        )}

        {/* Challenges Section */}
        {hasChallenges && (
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-black mb-6">Challenges</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {challenges.map((challenge) => (
                <ChallengeCard
                  key={challenge.id}
                  challenge={challenge}
                  submitEmail={submitEmail ?? "tgopf@pm.me"}
                />
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {!hasLeaderboard && !hasRewards && !hasChallenges && (
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-12 text-center">
            <div className="text-6xl mb-6">🏆</div>
            <h3 className="text-2xl font-bold text-gray-700 mb-4">
              No Data Yet
            </h3>
            <p className="text-gray-500 max-w-md mx-auto">
              The retail leaderboard, rewards, and challenges will appear here
              once the admin adds entries.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

interface LeaderboardCardProps {
  entry: LeaderboardEntry;
  rank: number;
}

function LeaderboardCard({ entry, rank }: LeaderboardCardProps) {
  const { data: photoUrl } = useFileUrl(entry.photoPath || "");

  const getRankColor = (r: number) => {
    if (r === 1) return "bg-yellow-100 text-yellow-800 border-yellow-300";
    if (r === 2) return "bg-gray-100 text-gray-800 border-gray-300";
    if (r === 3) return "bg-orange-100 text-orange-800 border-orange-300";
    return "bg-white text-gray-800 border-gray-200";
  };

  return (
    <div
      className={`flex items-center justify-between p-4 rounded-xl border-2 ${getRankColor(rank)} transition-all duration-300 hover:shadow-md`}
    >
      <div className="flex items-center space-x-4">
        <div className="text-2xl font-bold w-8 text-center">
          {rank === 1
            ? "🥇"
            : rank === 2
              ? "🥈"
              : rank === 3
                ? "🥉"
                : `#${rank}`}
        </div>
        {entry.photoPath && photoUrl ? (
          <img
            src={photoUrl}
            alt={entry.name}
            className="w-12 h-12 rounded-full object-cover border-2 border-gray-300"
          />
        ) : (
          <div className="w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 font-bold">
            {entry.name.charAt(0).toUpperCase()}
          </div>
        )}
        <div className="font-semibold text-lg">{entry.name}</div>
      </div>
      <div className="text-right">
        <div className="text-2xl font-bold">
          {Number(entry.score).toLocaleString()}
        </div>
        <div className="text-sm text-gray-600">points</div>
      </div>
    </div>
  );
}

interface RewardCardProps {
  reward: RewardFull;
}

function RewardCard({ reward }: RewardCardProps) {
  const { data: photoUrl } = useFileUrl(reward.photoPath || "");

  const getRewardIcon = (type: Variant_referral_other_points) => {
    if (type === Variant_referral_other_points.points) return "💰";
    if (type === Variant_referral_other_points.referral) return "🤝";
    return "🎁";
  };

  const availableCount =
    reward.availableCount != null ? Number(reward.availableCount) : null;
  const isUnavailable = availableCount !== null && availableCount === 0;
  const claimEmail = reward.claimEmail || "tgopf@pm.me";

  const handleClaim = () => {
    if (isUnavailable) return;
    const subject = encodeURIComponent(
      `Reward Claim Request: ${Number(reward.amount).toLocaleString()} Points`,
    );
    const body = encodeURIComponent(
      `Hello,\n\nI would like to claim the following reward:\n\n${Number(reward.amount).toLocaleString()} Points - ${reward.description}\n\nThank you!`,
    );
    window.location.href = `mailto:${claimEmail}?subject=${subject}&body=${body}`;
  };

  return (
    <div className="bg-gray-50 rounded-xl p-6 border border-gray-200 hover:shadow-md transition-all duration-300 flex flex-col gap-3">
      <div className="flex items-start space-x-4">
        {reward.photoPath && photoUrl ? (
          <img
            src={photoUrl}
            alt="Reward"
            className="w-16 h-16 object-cover rounded-lg border-2 border-gray-300 flex-shrink-0"
          />
        ) : (
          <div className="text-4xl flex-shrink-0">
            {getRewardIcon(reward.rewardType)}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="text-xl font-bold text-black mb-1">
            {Number(reward.amount).toLocaleString()} Points
          </div>
          <p className="text-gray-600 text-sm leading-relaxed">
            {reward.description}
          </p>
        </div>
      </div>

      {availableCount !== null && (
        <p className="text-xs italic text-gray-500">
          {isUnavailable ? (
            <span className="text-red-500">Currently unavailable</span>
          ) : (
            <>🎁 {availableCount} available – replenished regularly</>
          )}
        </p>
      )}

      <button
        type="button"
        onClick={handleClaim}
        disabled={isUnavailable}
        data-ocid={`reward-claim-btn-${reward.id}`}
        className={`flex items-center justify-center gap-2 w-full px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 mt-1 ${
          isUnavailable
            ? "opacity-40 cursor-not-allowed bg-gray-200 text-gray-500"
            : "bg-black text-white hover:bg-gray-800 hover:shadow-md hover:-translate-y-0.5"
        }`}
        style={{ fontFamily: "'Adobe Jenson Pro', serif" }}
      >
        <Mail className="w-3.5 h-3.5 flex-shrink-0" />
        {isUnavailable ? "Currently Unavailable" : "Claim this reward"}
      </button>
    </div>
  );
}

interface ChallengeCardProps {
  challenge: ExperienceChallenge;
  submitEmail: string;
}

function ChallengeCard({ challenge, submitEmail }: ChallengeCardProps) {
  const handleSubmitProof = () => {
    const subject = encodeURIComponent(`Challenge Proof: ${challenge.title}`);
    const body = encodeURIComponent(
      `Hello,\n\nI would like to submit proof for the following challenge:\n\nChallenge: ${challenge.title}\n\nPlease find my proof attached/described below:\n\n`,
    );
    window.location.href = `mailto:${submitEmail}?subject=${subject}&body=${body}`;
  };

  return (
    <div className="backdrop-blur-sm bg-white/80 border border-gray-200 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 flex flex-col gap-4">
      <h3 className="text-xl font-bold text-black leading-tight">
        {challenge.title}
      </h3>
      <p className="text-gray-600 leading-relaxed flex-1">
        {challenge.description}
      </p>

      <div className="flex flex-wrap gap-2">
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black text-white text-sm font-medium">
          🏆 {Number(challenge.rewardPoints).toLocaleString()} points
        </span>
        {challenge.specialReward && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200 text-sm font-medium">
            ⭐ Special: {challenge.specialReward}
          </span>
        )}
      </div>

      <button
        type="button"
        onClick={handleSubmitProof}
        data-ocid="challenge-submit-proof-btn"
        className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-xl bg-black text-white font-medium hover:bg-gray-800 transition-all duration-300 hover:shadow-md hover:-translate-y-0.5"
      >
        <Mail className="w-4 h-4" />
        Submit Proof
      </button>
    </div>
  );
}
