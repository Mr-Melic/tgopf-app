import { normalizeStarRating } from "../hooks/useQueries";

interface StarRatingBadgeProps {
  /** Backend ?Nat starRating (bigint | undefined | null). When null/undefined,
   *  nothing is rendered — no broken or forced-zero star display. */
  starRating?: bigint | null;
  /** Extra classes to fine-tune positioning per surface. */
  className?: string;
}

/**
 * Small unobtrusive star-rating chip rendered in the top-left corner of review
 * cards (text, video, and placeholder surfaces). Shows 1–5 filled unicode stars
 * over a subtle dark rounded background so stars stay visible over any card
 * content. Renders nothing when no rating exists.
 *
 * Used uniformly across all review surfaces for a consistent look.
 */
export default function StarRatingBadge({
  starRating,
  className = "",
}: StarRatingBadgeProps) {
  const rating = normalizeStarRating(starRating);

  // No rating → render nothing (no broken / forced-zero star display).
  if (rating === null || rating < 1 || rating > 5) return null;

  const stars = "★".repeat(rating);

  return (
    <div
      aria-label={`Rated ${rating} out of 5 stars`}
      role="img"
      data-ocid="review.star-rating-badge"
      className={`absolute top-2 left-2 z-10 flex items-center bg-black/60 backdrop-blur-sm text-white text-[10px] leading-none font-medium px-1.5 py-1 rounded-full tracking-tight select-none ${className}`}
    >
      <span className="text-amber-300">{stars}</span>
    </div>
  );
}
