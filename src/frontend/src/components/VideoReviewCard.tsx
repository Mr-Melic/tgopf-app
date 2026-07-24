import { ChevronDown, ChevronUp, Video } from "lucide-react";
import type React from "react";
import { useState } from "react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useGetEmojiSystemEnabled,
  useGetReviewEmojiV2,
  useGetUserReviewReactionV2,
  useReactToReviewV2,
} from "../hooks/useQueries";
import type { ReviewReactionType } from "../hooks/useQueries";
import StarRatingBadge from "./StarRatingBadge";

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

export interface VideoReviewCardProps {
  id: string;
  reviewerName: string;
  bookTitle: string;
  poemTitle?: string;
  poemSubTitle?: string;
  pageNumbers?: string;
  snippet?: string;
  fullText?: string;
  companyBlogSite?: string;
  sourceLink?: string;
  photoPath?: string;
  videoUrl: string;
  emojiEnabled?: boolean;
  starRating?: bigint | null;
}

function extractYoutubeId(url: string): string | null {
  const watchMatch = url.match(/[?&]v=([^&#]+)/);
  if (watchMatch) return watchMatch[1];
  const shortMatch = url.match(/youtu\.be\/([^?&#]+)/);
  if (shortMatch) return shortMatch[1];
  return null;
}

function extractVimeoId(url: string): string | null {
  const match = url.match(/vimeo\.com\/(?:video\/)?([0-9]+)/);
  return match ? match[1] : null;
}

function VideoEmbed({ url }: { url: string }) {
  if (url.includes("youtube.com/watch") || url.includes("youtu.be")) {
    const videoId = extractYoutubeId(url);
    if (videoId) {
      return (
        <iframe
          src={`https://www.youtube.com/embed/${videoId}?rel=0`}
          width="100%"
          height="200"
          style={{ borderRadius: "8px 8px 0 0" }}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          title="Video review"
        />
      );
    }
  }

  if (url.includes("vimeo.com")) {
    const videoId = extractVimeoId(url);
    if (videoId) {
      return (
        <iframe
          src={`https://player.vimeo.com/video/${videoId}`}
          width="100%"
          height="200"
          style={{ borderRadius: "8px 8px 0 0" }}
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
          title="Video review"
        />
      );
    }
  }

  return (
    // eslint-disable-next-line jsx-a11y/media-has-caption
    <video
      src={url}
      controls
      width="100%"
      height="200"
      style={{ borderRadius: "8px 8px 0 0", display: "block" }}
    />
  );
}

export default function VideoReviewCard({
  id,
  reviewerName,
  bookTitle,
  poemTitle,
  poemSubTitle,
  pageNumbers,
  snippet,
  fullText,
  companyBlogSite,
  sourceLink,
  videoUrl,
  emojiEnabled = true,
  starRating,
}: VideoReviewCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { identity } = useInternetIdentity();
  const isLoggedIn = !!identity;

  const { data: emojiSystemEnabled } = useGetEmojiSystemEnabled();
  const showEmoji = emojiEnabled && emojiSystemEnabled !== false;

  const { data: counts = { love: 0, like: 0, dislike: 0, laugh: 0 } } =
    useGetReviewEmojiV2(id);
  const { data: userVote } = useGetUserReviewReactionV2(id);
  const reactMutation = useReactToReviewV2();

  const handleReact = (e: React.MouseEvent, reaction: ReviewReactionType) => {
    e.stopPropagation();
    if (!isLoggedIn || reactMutation.isPending) return;
    reactMutation.mutate({ reviewId: id, reaction });
  };

  return (
    <div
      className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl overflow-hidden shadow-lg relative z-20"
      data-ocid="video-review-card.item"
    >
      {/* Star rating badge (top-left) */}
      <StarRatingBadge starRating={starRating} />

      {/* VIDEO REVIEW badge */}
      <div className="absolute top-2 right-2 z-10 flex items-center gap-1 bg-black/70 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider">
        <Video className="w-3 h-3" />
        Video Review
      </div>

      {/* Video embed */}
      <div className="w-full">
        <VideoEmbed url={videoUrl} />
      </div>

      {/* Always-visible info below video */}
      <div className="px-4 pt-3 pb-2">
        <p className="font-bold text-white text-sm text-center leading-tight">
          {reviewerName}
        </p>
        <p className="text-white/70 text-xs text-center mt-0.5 italic">
          {bookTitle}
        </p>
      </div>

      {/* Expand/collapse toggle */}
      <button
        type="button"
        onClick={() => setIsExpanded((v) => !v)}
        className="w-full flex items-center justify-center gap-1 text-white/60 hover:text-white text-xs py-2 transition-colors duration-200"
        aria-label={isExpanded ? "Show less" : "Read more"}
        data-ocid="video-review-card.toggle"
      >
        {isExpanded ? (
          <>
            <ChevronUp className="w-4 h-4" />
            Show less
          </>
        ) : (
          <>
            <ChevronDown className="w-4 h-4" />
            Read more
          </>
        )}
      </button>

      {/* Expanded content */}
      {isExpanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-white/10 pt-3">
          {companyBlogSite && (
            <p className="text-white/60 text-xs text-center">
              {companyBlogSite}
            </p>
          )}

          {poemTitle && (
            <div className="text-center">
              <p className="text-white/50 text-[10px] uppercase tracking-wide">
                Poem
              </p>
              <p className="text-white/80 text-sm font-medium">{poemTitle}</p>
            </div>
          )}

          {poemSubTitle && (
            <div className="text-center">
              <p className="text-white/50 text-[10px] uppercase tracking-wide">
                Subtitle
              </p>
              <p className="text-white/70 text-sm">{poemSubTitle}</p>
            </div>
          )}

          {pageNumbers && (
            <div className="text-center">
              <p className="text-white/50 text-[10px] uppercase tracking-wide">
                Page(s)
              </p>
              <p className="text-white/70 text-sm">{pageNumbers}</p>
            </div>
          )}

          {snippet && (
            <p className="text-white/80 text-sm text-center italic leading-relaxed">
              &ldquo;{snippet}&rdquo;
            </p>
          )}

          {fullText && (
            <p className="text-white/70 text-sm leading-relaxed whitespace-pre-line">
              {fullText}
            </p>
          )}

          {sourceLink && (
            <div className="text-center">
              <a
                href={sourceLink}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="text-white/60 hover:text-white text-xs underline transition-colors"
              >
                View source
              </a>
            </div>
          )}

          {/* Emoji reactions */}
          {showEmoji && (
            <div
              className="flex gap-2 border-t border-white/10 pt-3 justify-center flex-wrap"
              onClick={(e) => e.stopPropagation()}
            >
              {!isLoggedIn && (
                <p className="text-[10px] text-white/40 w-full text-center mb-1">
                  Login to react
                </p>
              )}
              {REACTION_EMOJIS.map(({ key, emoji, label }) => (
                <button
                  key={key}
                  type="button"
                  data-ocid={`video-review-reaction-${key}`}
                  onClick={(e) => handleReact(e, key)}
                  aria-label={`${label}: ${counts[key]}`}
                  title={!isLoggedIn ? "Login to react" : undefined}
                  disabled={!isLoggedIn || reactMutation.isPending}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-all duration-200 border ${
                    !isLoggedIn
                      ? "opacity-40 cursor-not-allowed pointer-events-none bg-white/10 text-white/60 border-white/10"
                      : userVote === key
                        ? "bg-white text-black border-white"
                        : "bg-white/10 text-white/70 border-white/20 hover:border-white/40 hover:bg-white/20"
                  }`}
                >
                  <span className="text-sm leading-none">{emoji}</span>
                  <span>{counts[key]}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
