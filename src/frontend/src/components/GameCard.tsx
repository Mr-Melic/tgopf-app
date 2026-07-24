import { Heart, Star, ThumbsDown, ThumbsUp } from "lucide-react";
import { useState } from "react";
import { useFileUrl } from "../blob-storage/FileStorage";
import type { Game, GameReaction } from "../hooks/useGameQueries";
import {
  useGetCallerGameReaction,
  useGetGameReactionCountsInflated,
  useReactToGame,
} from "../hooks/useGameQueries";
import { useGetEmojiSystemEnabled } from "../hooks/useQueries";
import GameComments from "./GameComments";

interface GameCardProps {
  game: Game;
  isFavourited: boolean;
  isLoggedIn: boolean;
  onToggleFavourite: (id: string) => void;
  onLoginClick?: () => void;
}

function GameImage({ path }: { path: string }) {
  const { data: url, isLoading } = useFileUrl(path);
  if (isLoading) {
    return (
      <div className="w-full h-44 bg-gray-100 animate-pulse rounded-xl mb-4" />
    );
  }
  if (!url) return null;
  return (
    <img
      src={url}
      alt="Game"
      className="w-full h-44 object-cover rounded-xl mb-4 border border-gray-100"
      draggable={false}
    />
  );
}

export default function GameCard({
  game,
  isFavourited,
  isLoggedIn,
  onToggleFavourite,
  onLoginClick,
}: GameCardProps) {
  const [showComments, setShowComments] = useState(false);

  const { data: reactionCounts } = useGetGameReactionCountsInflated(game.id);
  const { data: callerReaction } = useGetCallerGameReaction(game.id);
  const reactToGame = useReactToGame();
  const { data: emojiEnabled } = useGetEmojiSystemEnabled();

  const handleReact = (reaction: GameReaction) => {
    if (!isLoggedIn) {
      onLoginClick?.();
      return;
    }
    reactToGame.mutate({ gameId: game.id, reaction });
  };

  const reactionButton = (
    reaction: GameReaction,
    icon: React.ReactNode,
    count: bigint | undefined,
    label: string,
  ) => (
    <button
      type="button"
      aria-label={label}
      title={!isLoggedIn ? "Login to react" : undefined}
      disabled={!isLoggedIn}
      onClick={() => handleReact(reaction)}
      className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-all duration-150 ${
        !isLoggedIn
          ? "opacity-40 cursor-not-allowed pointer-events-none bg-gray-100 text-gray-700"
          : callerReaction === reaction
            ? "bg-black text-white"
            : "bg-gray-100 hover:bg-gray-200 text-gray-700"
      }`}
      data-ocid={`game-react-${reaction}-${game.id}`}
    >
      {icon}
      {count !== undefined ? Number(count) : 0}
    </button>
  );

  return (
    <article
      className="bg-white border border-gray-100 rounded-2xl shadow-md hover:shadow-lg transition-shadow duration-200 flex flex-col p-5 w-full"
      data-ocid={`game-card-${game.id}`}
    >
      {/* Optional image */}
      {game.imageUrl && <GameImage path={game.imageUrl} />}

      {/* Header row */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <h3 className="text-lg font-bold text-black leading-tight adobe-jenson flex-1">
          {game.title}
        </h3>
        <button
          type="button"
          aria-label={
            isFavourited ? "Remove from favourites" : "Add to favourites"
          }
          onClick={() => {
            if (!isLoggedIn) {
              onLoginClick?.();
              return;
            }
            onToggleFavourite(game.id);
          }}
          className={`flex-shrink-0 p-1.5 rounded-full transition-colors ${
            isFavourited
              ? "text-yellow-400 hover:text-yellow-500"
              : "text-gray-300 hover:text-gray-400"
          }`}
          data-ocid={`game-favourite-${game.id}`}
        >
          <Star
            className="w-5 h-5"
            fill={isFavourited ? "currentColor" : "none"}
          />
        </button>
      </div>

      {/* Meta */}
      <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm mb-4">
        <div>
          <dt className="text-xs text-gray-400 font-medium uppercase tracking-wide">
            Game description:
          </dt>
          <dd className="text-gray-800">{game.gameType}</dd>
        </div>
        <div>
          <dt className="text-xs text-gray-400 font-medium uppercase tracking-wide">
            Players
          </dt>
          <dd className="text-gray-800">{game.playerCount}</dd>
        </div>
        <div className="col-span-2">
          <dt className="text-xs text-gray-400 font-medium uppercase tracking-wide">
            Materials
          </dt>
          <dd className="text-gray-800">{game.materialsRequired}</dd>
        </div>
      </dl>

      {/* Rules — vertical stacked layout */}
      {game.rules && game.rules.length > 0 && (
        <div className="mb-4">
          <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-2">
            Rules
          </p>
          <ol className="space-y-1.5">
            {game.rules.map((rule, idx) => (
              <li
                key={idx}
                className="flex gap-2 text-sm text-gray-800 leading-snug"
              >
                <span className="flex-shrink-0 w-5 text-xs text-gray-400 font-medium pt-0.5 text-right">
                  {idx + 1}.
                </span>
                <span className="flex-1 bg-gray-50 border border-gray-100 rounded-lg px-3 py-1.5 text-gray-800 break-words">
                  {rule}
                </span>
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* Reactions */}
      {emojiEnabled !== false && (
        <div className="flex items-center gap-1.5 mb-3 flex-wrap">
          {reactionButton(
            "love",
            <Heart className="w-3.5 h-3.5" />,
            reactionCounts?.love,
            "Love",
          )}
          {reactionButton(
            "like",
            <ThumbsUp className="w-3.5 h-3.5" />,
            reactionCounts?.like,
            "Like",
          )}
          {reactionButton(
            "laugh",
            <span className="text-base leading-none">😂</span>,
            reactionCounts?.laugh,
            "Laugh",
          )}
          {reactionButton(
            "dislike",
            <ThumbsDown className="w-3.5 h-3.5" />,
            reactionCounts?.dislike,
            "Dislike",
          )}
        </div>
      )}

      {/* Comments toggle */}
      <button
        type="button"
        onClick={() => setShowComments((v) => !v)}
        className="text-xs text-gray-500 hover:text-black transition-colors text-left mt-auto"
        data-ocid={`game-toggle-comments-${game.id}`}
      >
        {showComments ? "Hide comments" : "Show comments"}
      </button>

      {showComments && (
        <GameComments gameId={game.id} onLoginClick={onLoginClick} />
      )}
    </article>
  );
}
