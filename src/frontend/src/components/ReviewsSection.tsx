import { ChevronLeft, ChevronRight } from "lucide-react";
import React, { useState } from "react";
import type { Review } from "../backend";
import { BOOK_TITLES } from "../constants/books";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useGetEmojiSystemEnabled,
  useGetReviewEmojiV2,
  useGetUserReviewReactionV2,
  useReactToReviewV2,
} from "../hooks/useQueries";
import type { ReviewReactionType } from "../hooks/useQueries";
import { shuffle } from "../utils/shuffle";
import AnimatedPlaceholder from "./AnimatedPlaceholder";
import LazyBlobImage from "./LazyBlobImage";
import SpiralFlowerBackground from "./SpiralFlowerBackground";
import StarRatingBadge from "./StarRatingBadge";
import VideoReviewCard from "./VideoReviewCard";

// "All" sentinel value used by the book-title filter bar. Kept distinct from
// any real book title so the filter never accidentally matches a review.
const ALL_FILTER = "__all__";

// Extended Review type with optional fields
type ExtendedReview = Review & {
  companyBlogSite?: string;
  sourceLink?: string;
};

interface ReviewsSectionProps {
  reviews: Review[];
  onReviewClick: (reviewId: string) => void;
  disableAnimations?: boolean;
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

const PAGE_SIZE = 4;

const ReviewsSection = React.memo(function ReviewsSection({
  reviews,
  onReviewClick,
  disableAnimations,
}: ReviewsSectionProps) {
  const { data: emojiEnabled } = useGetEmojiSystemEnabled();
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [activeBookFilter, setActiveBookFilter] = useState<string>(ALL_FILTER);

  // Remove duplicates based on review ID, filter by selected book title, then
  // shuffle once on mount. "All" shows every review; a specific title shows
  // only reviews whose bookTitle matches exactly.
  const displayReviews = React.useMemo(() => {
    const seen = new Set<string>();
    const uniqueReviews = reviews.filter((review) => {
      if (seen.has(review.id)) return false;
      seen.add(review.id);
      return true;
    });
    const filtered =
      activeBookFilter === ALL_FILTER
        ? uniqueReviews
        : uniqueReviews.filter(
            (review) => review.bookTitle === activeBookFilter,
          );
    return shuffle(filtered);
  }, [reviews, activeBookFilter]);

  // Reset to the first page whenever the active filter changes so the user
  // never lands on an out-of-range page index after switching titles.
  React.useEffect(() => {
    setCurrentPageIndex(0);
  }, [activeBookFilter]);

  const usePagination = displayReviews.length > PAGE_SIZE;
  const totalPages = usePagination
    ? Math.ceil(displayReviews.length / PAGE_SIZE)
    : 1;

  const pageReviews = usePagination
    ? displayReviews.slice(
        currentPageIndex * PAGE_SIZE,
        currentPageIndex * PAGE_SIZE + PAGE_SIZE,
      )
    : displayReviews;

  const canPrev = currentPageIndex > 0;
  const canNext = currentPageIndex < totalPages - 1;

  return (
    <div className="py-12 px-4 bg-gray-50 relative overflow-hidden">
      {!disableAnimations && <SpiralFlowerBackground />}

      <div className="max-w-7xl mx-auto relative z-10">
        <h3 className="text-2xl md:text-3xl font-bold text-center text-black mb-8">
          What Readers Say
        </h3>

        {/* Book-title filter bar — one compact bar-style button per title,
            plus an "All" option as the first button. Wraps on mobile. */}
        <fieldset
          className="flex flex-wrap justify-center gap-2 mb-8"
          aria-label="Filter reviews by book"
          data-ocid="reviews.filter_bar"
        >
          <FilterButton
            label="All"
            isActive={activeBookFilter === ALL_FILTER}
            onClick={() => setActiveBookFilter(ALL_FILTER)}
          />
          {/* "Amazon TGOPF Editions" is intentionally excluded from the public
              review filter bar — it is a packaging variant, not a reviewable
              title. The shared BOOK_TITLES constant is NOT mutated so other
              surfaces (admin review dropdown, products manager) still see all
              6 titles. */}
          {BOOK_TITLES.filter((title) => title !== "Amazon TGOPF Editions").map(
            (title) => (
              <FilterButton
                key={title}
                label={title}
                isActive={activeBookFilter === title}
                onClick={() => setActiveBookFilter(title)}
              />
            ),
          )}
        </fieldset>

        {displayReviews.length === 0 ? (
          <div
            className="text-center py-12 text-gray-500"
            data-ocid="reviews.empty_state"
          >
            No reviews for this book yet.
          </div>
        ) : (
          <div
            className="grid grid-cols-1 md:grid-cols-2 gap-6 transition-opacity duration-300"
            data-ocid="reviews.list"
          >
            {pageReviews.map((review, idx) => {
              const extReview = review as ExtendedReview & {
                videoUrl?: string;
              };
              if (extReview.videoUrl && extReview.videoUrl.trim() !== "") {
                return (
                  <VideoReviewCard
                    key={review.id}
                    id={review.id}
                    reviewerName={review.reviewerName}
                    bookTitle={review.bookTitle}
                    poemTitle={review.poemTitle || undefined}
                    poemSubTitle={review.poemSubTitle || undefined}
                    pageNumbers={review.pageNumbers || undefined}
                    snippet={review.snippet || undefined}
                    fullText={review.fullText || undefined}
                    companyBlogSite={extReview.companyBlogSite || undefined}
                    sourceLink={extReview.sourceLink || undefined}
                    videoUrl={extReview.videoUrl}
                    emojiEnabled={emojiEnabled !== false}
                    starRating={review.starRating}
                  />
                );
              }
              return (
                <ReviewCard
                  key={review.id}
                  review={extReview}
                  onClick={() => onReviewClick(review.id)}
                  index={idx + 1}
                  emojiEnabled={emojiEnabled !== false}
                />
              );
            })}
          </div>
        )}

        {/* Pagination controls — only when more than 4 reviews */}
        {usePagination && (
          <div
            className="flex items-center justify-center gap-4 mt-8"
            data-ocid="reviews.pagination"
          >
            <button
              type="button"
              onClick={() => setCurrentPageIndex((p) => Math.max(0, p - 1))}
              disabled={!canPrev}
              aria-label="Previous reviews"
              data-ocid="reviews.pagination_prev"
              className={`w-10 h-10 flex items-center justify-center rounded-full border transition-all duration-200 ${
                canPrev
                  ? "border-black bg-black text-white hover:bg-gray-800"
                  : "border-gray-300 bg-white text-gray-300 cursor-not-allowed"
              }`}
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <span
              className="text-sm font-medium text-gray-700 min-w-[4rem] text-center"
              data-ocid="reviews.page_indicator"
            >
              {currentPageIndex + 1} / {totalPages}
            </span>

            <button
              type="button"
              onClick={() =>
                setCurrentPageIndex((p) => Math.min(totalPages - 1, p + 1))
              }
              disabled={!canNext}
              aria-label="Next reviews"
              data-ocid="reviews.pagination_next"
              className={`w-10 h-10 flex items-center justify-center rounded-full border transition-all duration-200 ${
                canNext
                  ? "border-black bg-black text-white hover:bg-gray-800"
                  : "border-gray-300 bg-white text-gray-300 cursor-not-allowed"
              }`}
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
});

export default ReviewsSection;

interface ReviewCardProps {
  review: ExtendedReview;
  onClick: () => void;
  index: number;
  emojiEnabled: boolean;
}

function ReviewCard({ review, onClick, index, emojiEnabled }: ReviewCardProps) {
  const { identity } = useInternetIdentity();
  const isLoggedIn = !!identity;

  const { data: counts = { love: 0, like: 0, dislike: 0, laugh: 0 } } =
    useGetReviewEmojiV2(review.id);
  const { data: userVote } = useGetUserReviewReactionV2(review.id);
  const reactMutation = useReactToReviewV2();

  const handleReact = (e: React.MouseEvent, reaction: ReviewReactionType) => {
    e.stopPropagation();
    if (!isLoggedIn || reactMutation.isPending) return;
    reactMutation.mutate({ reviewId: review.id, reaction });
  };

  return (
    <div
      onClick={onClick}
      data-ocid={`review-card.item.${index}`}
      className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:-translate-y-1 p-6 flex flex-col relative z-20"
    >
      {/* Star rating badge — top-left corner; reviewer photo is centered so no overlap */}
      <StarRatingBadge starRating={review.starRating} />

      {/* Reviewer Photo */}
      <div className="w-20 h-20 mb-4 mx-auto rounded-full overflow-hidden border-4 border-gray-100 flex-shrink-0">
        {review.photoPath ? (
          <LazyBlobImage
            path={review.photoPath}
            alt={review.reviewerName}
            className="w-full h-full object-cover"
            placeholder={
              <div className="w-full h-full">
                <AnimatedPlaceholder
                  className="w-full h-full rounded-full"
                  width={80}
                  height={80}
                />
              </div>
            }
          />
        ) : (
          <div className="w-full h-full">
            <AnimatedPlaceholder
              className="w-full h-full rounded-full"
              width={80}
              height={80}
            />
          </div>
        )}
      </div>

      {/* Structured Information */}
      <div className="space-y-2 mb-4">
        <div className="text-center">
          <p className="text-sm font-semibold text-gray-900">
            {review.reviewerName}
          </p>
          {review.companyBlogSite && (
            <p className="text-xs text-gray-600 mt-1">
              {review.companyBlogSite}
            </p>
          )}
        </div>

        <div className="text-center">
          <p className="text-xs text-gray-500 font-medium">Book</p>
          <p className="text-sm text-gray-800 italic">{review.bookTitle}</p>
        </div>

        {review.poemTitle && (
          <div className="text-center">
            <p className="text-xs text-gray-500 font-medium">Poem</p>
            <p className="text-sm text-gray-800 font-medium">
              {review.poemTitle}
            </p>
          </div>
        )}

        {review.poemSubTitle && (
          <div className="text-center">
            <p className="text-xs text-gray-500 font-medium">Subtitle</p>
            <p className="text-sm text-gray-700">{review.poemSubTitle}</p>
          </div>
        )}

        <div className="text-center">
          <p className="text-xs text-gray-500 font-medium">Page(s)</p>
          <p className="text-sm text-gray-700">{review.pageNumbers}</p>
        </div>
      </div>

      {/* Review Snippet */}
      <div className="flex-1 flex items-center">
        <p className="text-sm text-gray-600 text-center line-clamp-3">
          {review.snippet}
        </p>
      </div>

      {/* Read More */}
      <div className="mt-4 text-xs text-gray-400 font-medium text-center">
        Click to read full review →
      </div>

      {/* Reaction buttons — only when emoji system is enabled */}
      {emojiEnabled && (
        <div
          className="flex gap-2 border-t border-gray-100 pt-4 mt-4 justify-center flex-wrap"
          onClick={(e) => e.stopPropagation()}
        >
          {!isLoggedIn && (
            <p className="text-[10px] text-gray-400 w-full text-center mb-1">
              Login to react
            </p>
          )}
          {REACTION_EMOJIS.map(({ key, emoji, label }) => (
            <button
              key={key}
              type="button"
              data-ocid={`review-reaction-${key}`}
              onClick={(e) => handleReact(e, key)}
              aria-label={`${label}: ${counts[key]}`}
              title={!isLoggedIn ? "Login to react" : undefined}
              disabled={!isLoggedIn || reactMutation.isPending}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-all duration-200 border ${
                !isLoggedIn
                  ? "opacity-40 cursor-not-allowed pointer-events-none bg-white text-gray-600 border-gray-200"
                  : userVote === key
                    ? "bg-black text-white border-black"
                    : "bg-white text-gray-600 border-gray-200 hover:border-gray-400 hover:bg-gray-50"
              }`}
            >
              <span className="text-sm leading-none">{emoji}</span>
              <span>{counts[key]}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

interface FilterButtonProps {
  label: string;
  isActive: boolean;
  onClick: () => void;
}

// Compact bar-style filter button. Active state is filled/highlighted;
// inactive state is outlined/muted. Pill shape, wraps responsively.
function FilterButton({ label, isActive, onClick }: FilterButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={isActive}
      data-ocid="reviews.filter_button"
      className={`px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all duration-200 border focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-1 ${
        isActive
          ? "bg-black text-white border-black shadow-sm"
          : "bg-white text-gray-700 border-gray-300 hover:border-gray-500 hover:bg-gray-50"
      }`}
    >
      {label}
    </button>
  );
}
