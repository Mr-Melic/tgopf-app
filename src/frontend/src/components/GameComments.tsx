import { MessageCircle, Trash2 } from "lucide-react";
import React, { useState } from "react";
import {
  useAddGameComment,
  useDeleteGameComment,
  useGetGameComments,
} from "../hooks/useGameQueries";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useIsCallerAdmin } from "../hooks/useQueries";

interface GameCommentsProps {
  gameId: string;
  onLoginClick?: () => void;
}

function timeAgo(timestamp: bigint): string {
  const seconds = Math.floor(
    (Date.now() - Number(timestamp) / 1_000_000) / 1000,
  );
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function truncatePrincipal(principal: string): string {
  if (principal.length <= 12) return principal;
  return `${principal.slice(0, 6)}…${principal.slice(-4)}`;
}

export default function GameComments({
  gameId,
  onLoginClick,
}: GameCommentsProps) {
  const { identity, isInitializing } = useInternetIdentity();
  const isAuthenticated = !!identity;
  const callerPrincipal = identity?.getPrincipal().toString() ?? null;
  const { data: isAdmin } = useIsCallerAdmin();

  const { data: comments = [], isLoading } = useGetGameComments(gameId);
  const addComment = useAddGameComment();
  const deleteComment = useDeleteGameComment();

  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handlePost = async () => {
    const trimmed = text.trim();
    if (!trimmed || submitting) return;
    setSubmitting(true);
    try {
      await addComment.mutateAsync({ gameId, commentText: trimmed });
      setText("");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (commentId: string) => {
    deleteComment.mutate({ commentId, gameId });
  };

  return (
    <div
      className="mt-4 border-t border-gray-100 pt-4"
      data-ocid="game-comments-section"
    >
      {/* Comment list */}
      {isLoading ? (
        <p className="text-xs text-gray-400 italic py-2">Loading comments…</p>
      ) : comments.length === 0 ? (
        <p className="text-xs text-gray-400 italic py-2 flex items-center gap-1.5">
          <MessageCircle className="w-3.5 h-3.5" />
          No comments yet. Be the first!
        </p>
      ) : (
        <div className="space-y-3 mb-4" data-ocid="game-comments-list">
          {comments.map((comment) => (
            <div
              key={comment.id}
              className="flex gap-2 group"
              data-ocid={`game-comment-${comment.id}`}
            >
              <div className="w-6 h-6 rounded-full bg-black/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-[10px] font-bold text-black/50">
                  {comment.authorName.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2 flex-wrap">
                  <span className="text-xs font-semibold text-black truncate">
                    {truncatePrincipal(
                      comment.authorName || comment.authorPrincipal,
                    )}
                  </span>
                  <span className="text-[10px] text-gray-400">
                    {timeAgo(comment.createdAt)}
                  </span>
                </div>
                <p className="text-sm text-gray-700 break-words">
                  {comment.commentText}
                </p>
              </div>
              {callerPrincipal &&
                (callerPrincipal === comment.authorPrincipal || isAdmin) && (
                  <button
                    type="button"
                    onClick={() => handleDelete(comment.id)}
                    aria-label="Delete comment"
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-red-50 text-red-400 hover:text-red-600 flex-shrink-0"
                    data-ocid="game-comment-delete-btn"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
            </div>
          ))}
        </div>
      )}

      {/* Post area */}
      {!isInitializing &&
        (isAuthenticated ? (
          <div
            className="flex gap-2 items-end"
            data-ocid="game-comment-input-area"
          >
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Write a comment…"
              rows={2}
              className="flex-1 min-w-0 text-sm border border-gray-200 rounded-xl px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-black/20 focus:border-gray-400 transition-all"
              data-ocid="game-comment-textarea"
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) handlePost();
              }}
            />
            <button
              type="button"
              onClick={handlePost}
              disabled={!text.trim() || submitting}
              className="px-4 py-2 text-sm font-medium bg-black text-white rounded-xl hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 flex-shrink-0"
              data-ocid="game-comment-post-btn"
            >
              {submitting ? "…" : "Post"}
            </button>
          </div>
        ) : (
          <p
            className="text-xs text-gray-500 italic"
            data-ocid="game-comments-login-cta"
          >
            <button
              type="button"
              onClick={onLoginClick}
              className="underline text-black font-medium hover:text-gray-700 transition-colors"
            >
              Log in
            </button>{" "}
            to post a comment.
          </p>
        ))}
    </div>
  );
}
