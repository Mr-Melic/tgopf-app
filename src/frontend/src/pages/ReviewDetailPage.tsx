import { ExternalLink } from "lucide-react";
import { type MouseEvent, useEffect } from "react";
import type { Review } from "../backend";
import { useFileUrl } from "../blob-storage/FileStorage";
import AnimatedPlaceholder from "../components/AnimatedPlaceholder";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  type ReviewReactionType,
  useGetReviewEmojiV2,
  useGetUserReviewReactionV2,
  useReactToReviewV2,
} from "../hooks/useQueries";

// Extended Review type with optional fields
type ExtendedReview = Review & {
  companyBlogSite?: string;
  sourceLink?: string;
};

interface ReviewDetailPageProps {
  review: Review | null;
  onNavigateHome: () => void;
}

const REACTION_EMOJIS: {
  key: ReviewReactionType;
  emoji: string;
  label: string;
}[] = [
  { key: "love", emoji: "❤️", label: "Love" },
  { key: "like", emoji: "👍", label: "Like" },
  { key: "dislike", emoji: "👎", label: "Dislike" },
  { key: "laugh", emoji: "😂", label: "Laugh" },
];

export default function ReviewDetailPage({
  review,
  onNavigateHome,
}: ReviewDetailPageProps) {
  // Scroll to top whenever this page loads
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const { data: photoUrl } = useFileUrl(review?.photoPath || "");
  const extendedReview = review as ExtendedReview | null;

  const { identity } = useInternetIdentity();
  const isLoggedIn = !!identity;

  const reviewId = review?.id ?? "";
  const { data: counts = { love: 0, like: 0, dislike: 0, laugh: 0 } } =
    useGetReviewEmojiV2(reviewId);
  const { data: userVote } = useGetUserReviewReactionV2(reviewId);
  const reactMutation = useReactToReviewV2();

  const handleReact = (e: MouseEvent, reaction: ReviewReactionType) => {
    e.preventDefault();
    if (!isLoggedIn || reactMutation.isPending || !reviewId) return;
    reactMutation.mutate({ reviewId, reaction });
  };

  if (!review) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="text-center py-16">
            <div className="text-6xl mb-6">📝</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Review Not Found
            </h2>
            <p className="text-gray-600 mb-8">
              The review you're looking for doesn't exist.
            </p>
            <button
              type="button"
              onClick={onNavigateHome}
              className="bg-black text-white px-6 py-3 rounded-xl font-semibold hover:bg-gray-800 transition-all duration-300"
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Back Button */}
        <button
          type="button"
          onClick={onNavigateHome}
          className="flex items-center text-gray-600 hover:text-black transition-colors mb-8 font-medium"
        >
          <svg
            className="w-5 h-5 mr-2"
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
          Back to Home
        </button>

        {/* Review Content */}
        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12">
          {/* Reviewer Info */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-32 h-32 mb-4 rounded-full overflow-hidden border-4 border-gray-100">
              {review.photoPath && photoUrl ? (
                <img
                  src={photoUrl}
                  alt={review.reviewerName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full">
                  <AnimatedPlaceholder
                    className="w-full h-full rounded-full"
                    width={128}
                    height={128}
                  />
                </div>
              )}
            </div>
            <h1 className="text-3xl font-bold text-gray-900 text-center mb-2">
              {review.reviewerName}
            </h1>
            {extendedReview?.companyBlogSite && (
              <p className="text-lg text-gray-600 text-center mb-6">
                {extendedReview.companyBlogSite}
              </p>
            )}

            {/* Structured Information */}
            <div className="w-full max-w-md space-y-3 mb-8 bg-gray-50 rounded-xl p-6">
              <div className="text-center">
                <p className="text-sm text-gray-500 font-medium mb-1">Book</p>
                <p className="text-base text-gray-900 italic font-medium">
                  {review.bookTitle}
                </p>
              </div>

              {review.poemTitle && (
                <>
                  <div className="border-t border-gray-200 pt-3">
                    <p className="text-sm text-gray-500 font-medium mb-1 text-center">
                      Poem
                    </p>
                    <p className="text-base text-gray-900 font-semibold text-center">
                      {review.poemTitle}
                    </p>
                  </div>

                  {review.poemSubTitle && (
                    <div className="border-t border-gray-200 pt-3">
                      <p className="text-sm text-gray-500 font-medium mb-1 text-center">
                        Subtitle
                      </p>
                      <p className="text-base text-gray-800 text-center">
                        {review.poemSubTitle}
                      </p>
                    </div>
                  )}
                </>
              )}

              <div className="border-t border-gray-200 pt-3">
                <p className="text-sm text-gray-500 font-medium mb-1 text-center">
                  Page(s)
                </p>
                <p className="text-base text-gray-800 text-center">
                  {review.pageNumbers}
                </p>
              </div>
            </div>

            {/* Source Button — only shown when a non-empty sourceLink exists */}
            {extendedReview?.sourceLink &&
              extendedReview.sourceLink.trim() !== "" && (
                <a
                  href={extendedReview.sourceLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-black text-white px-6 py-3 rounded-xl font-semibold hover:bg-gray-800 transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-0.5 mb-6"
                >
                  <ExternalLink className="w-5 h-5" />
                  Source
                </a>
              )}
          </div>

          {/* Full Review Text */}
          <div className="prose prose-lg max-w-none">
            <div className="text-gray-700 leading-relaxed whitespace-pre-wrap">
              {review.fullText}
            </div>
          </div>

          {/* Emoji Reactions */}
          <div className="mt-8 pt-6 border-t border-gray-100">
            {!isLoggedIn && (
              <p className="text-xs text-gray-400 text-center mb-3">
                Login to react to this review
              </p>
            )}
            <div className="flex gap-3 justify-center flex-wrap">
              {REACTION_EMOJIS.map(({ key, emoji, label }) => (
                <button
                  key={key}
                  type="button"
                  data-ocid={`review-detail-reaction-${key}`}
                  onClick={(e) => handleReact(e, key)}
                  aria-label={`${label}: ${counts[key]}`}
                  title={!isLoggedIn ? "Login to react" : undefined}
                  disabled={!isLoggedIn || reactMutation.isPending}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 border ${
                    !isLoggedIn
                      ? "opacity-40 cursor-not-allowed bg-white text-gray-600 border-gray-200"
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
        </div>
      </div>
    </div>
  );
}
