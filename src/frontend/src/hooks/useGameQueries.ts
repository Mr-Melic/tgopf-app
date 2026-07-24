import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useActor } from "./useActor";

// ─── Local Game Types (until bindgen reflects backend changes) ────────────────

export interface Game {
  id: string;
  title: string;
  gameType: string;
  playerCount: string;
  materialsRequired: string;
  imageUrl: string | null;
  rules: string[];
  createdAt: bigint;
}

export interface GameComment {
  id: string;
  gameId: string;
  authorPrincipal: string;
  authorName: string;
  commentText: string;
  createdAt: bigint;
}

export interface GameReactionCounts {
  love: bigint;
  like: bigint;
  dislike: bigint;
  laugh: bigint;
}

export type GameReaction = "love" | "like" | "dislike" | "laugh";

// ─── Query Hooks ──────────────────────────────────────────────────────────────

export function useGetGames() {
  const { actor, isFetching } = useActor();

  return useQuery<Game[]>({
    queryKey: ["games"],
    queryFn: async () => {
      if (!actor) return [];
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return await (actor as any).getGames();
      } catch (err) {
        console.error("useGetGames error:", err);
        return [];
      }
    },
    enabled: !!actor && !isFetching,
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });
}

export function useGetGameReactionCounts(gameId: string) {
  const { actor, isFetching } = useActor();

  return useQuery<GameReactionCounts>({
    queryKey: ["gameReactions", gameId],
    queryFn: async () => {
      if (!actor) return { love: 0n, like: 0n, dislike: 0n, laugh: 0n };
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return await (actor as any).getGameReactionCounts(gameId);
      } catch (err) {
        console.error("useGetGameReactionCounts error:", err);
        return { love: 0n, like: 0n, dislike: 0n, laugh: 0n };
      }
    },
    enabled: !!actor && !isFetching && !!gameId,
    staleTime: 0,
    refetchOnWindowFocus: true,
  });
}

export function useGetGameReactionCountsInflated(gameId: string) {
  const { actor, isFetching } = useActor();

  return useQuery<GameReactionCounts>({
    queryKey: ["gameReactionsInflated", gameId],
    queryFn: async () => {
      if (!actor) return { love: 0n, like: 0n, dislike: 0n, laugh: 0n };
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return await (actor as any).getGameReactionCountsInflated(gameId);
      } catch {
        // Fall back to non-inflated if inflated endpoint not yet available
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          return await (actor as any).getGameReactionCounts(gameId);
        } catch (err) {
          console.error(
            "useGetGameReactionCountsInflated fallback error:",
            err,
          );
          return { love: 0n, like: 0n, dislike: 0n, laugh: 0n };
        }
      }
    },
    enabled: !!actor && !isFetching && !!gameId,
    staleTime: 0,
    refetchOnWindowFocus: true,
  });
}

export function useGetCallerGameReaction(gameId: string) {
  const { actor, isFetching } = useActor();

  return useQuery<GameReaction | null>({
    queryKey: ["callerGameReaction", gameId],
    queryFn: async () => {
      if (!actor) return null;
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const result = await (actor as any).getCallerGameReaction(gameId);
        if (!result) return null;
        // Handle Option type: { __kind__: "Some", value: ... } | { __kind__: "None" }
        if (result.__kind__ === "Some") return result.value as GameReaction;
        return null;
      } catch (err) {
        console.error("useGetCallerGameReaction error:", err);
        return null;
      }
    },
    enabled: !!actor && !isFetching && !!gameId,
    staleTime: 0,
  });
}

export function useGetGameComments(gameId: string) {
  const { actor, isFetching } = useActor();

  return useQuery<GameComment[]>({
    queryKey: ["gameComments", gameId],
    queryFn: async () => {
      if (!actor) return [];
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return await (actor as any).getGameComments(gameId);
      } catch (err) {
        console.error("useGetGameComments error:", err);
        return [];
      }
    },
    enabled: !!actor && !isFetching && !!gameId,
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });
}

// ─── Mutation Hooks ───────────────────────────────────────────────────────────

export function useReactToGame() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      gameId,
      reaction,
    }: {
      gameId: string;
      reaction: GameReaction;
    }) => {
      if (!actor) throw new Error("Actor not available");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (actor as any).reactToGameAndTrack(gameId, reaction);
    },
    onSuccess: (_data, { gameId }) => {
      queryClient.invalidateQueries({ queryKey: ["gameReactions", gameId] });
      queryClient.invalidateQueries({
        queryKey: ["callerGameReaction", gameId],
      });
    },
  });
}

export function useAddGameComment() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      gameId,
      commentText,
    }: {
      gameId: string;
      commentText: string;
    }) => {
      if (!actor) throw new Error("Actor not available");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (actor as any).addGameComment(gameId, commentText);
    },
    onSuccess: (_data, { gameId }) => {
      queryClient.invalidateQueries({ queryKey: ["gameComments", gameId] });
    },
  });
}

export function useDeleteGameComment() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      commentId,
      gameId,
    }: {
      commentId: string;
      gameId: string;
    }) => {
      if (!actor) throw new Error("Actor not available");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (actor as any).deleteGameComment(commentId);
    },
    onSuccess: (_data, { gameId }) => {
      queryClient.invalidateQueries({ queryKey: ["gameComments", gameId] });
    },
  });
}

export function useAddGame() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      title: string;
      gameType: string;
      playerCount: string;
      materialsRequired: string;
      imageUrl: string | null;
      rules: string[];
    }) => {
      if (!actor) throw new Error("Actor not available");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (actor as any).addGame(
        params.title,
        params.gameType,
        params.playerCount,
        params.materialsRequired,
        params.imageUrl,
        params.rules,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["games"] });
      queryClient.refetchQueries({ queryKey: ["games"] });
    },
  });
}

export function useUpdateGame() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      id: string;
      title: string;
      gameType: string;
      playerCount: string;
      materialsRequired: string;
      imageUrl: string | null;
      rules: string[];
    }) => {
      if (!actor) throw new Error("Actor not available");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (actor as any).updateGame(
        params.id,
        params.title,
        params.gameType,
        params.playerCount,
        params.materialsRequired,
        params.imageUrl,
        params.rules,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["games"] });
      queryClient.refetchQueries({ queryKey: ["games"] });
    },
  });
}

export function useDeleteGame() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!actor) throw new Error("Actor not available");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (actor as any).deleteGame(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["games"] });
      queryClient.refetchQueries({ queryKey: ["games"] });
    },
  });
}
