import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ExperienceChallenge } from "../backend";
import { useActor } from "./useActor";

export type ChallengeCategory = "retail" | "social";

// ─── Challenge Query Hooks ────────────────────────────────────────────────────

export function useGetChallenges() {
  const { actor, isFetching } = useActor();

  return useQuery<ExperienceChallenge[]>({
    queryKey: ["challenges"],
    queryFn: async () => {
      if (!actor) return [];
      try {
        return await actor.getChallenges();
      } catch (err) {
        console.error("useGetChallenges error:", err);
        return [];
      }
    },
    enabled: !!actor && !isFetching,
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });
}

export function useGetChallengesByCategory(category: ChallengeCategory) {
  const { actor, isFetching } = useActor();

  return useQuery<ExperienceChallenge[]>({
    queryKey: ["challenges", category],
    queryFn: async () => {
      if (!actor) return [];
      try {
        return await actor.getChallengesByCategory(
          category as Parameters<typeof actor.getChallengesByCategory>[0],
        );
      } catch (err) {
        console.error("useGetChallengesByCategory error:", err);
        return [];
      }
    },
    enabled: !!actor && !isFetching,
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });
}

export function useGetSubmitProofEmail() {
  const { actor, isFetching } = useActor();

  return useQuery<string>({
    queryKey: ["submitProofEmail"],
    queryFn: async () => {
      if (!actor) return "tgopf@pm.me";
      try {
        return await actor.getSubmitProofEmail();
      } catch (err) {
        console.error("useGetSubmitProofEmail error:", err);
        return "tgopf@pm.me";
      }
    },
    enabled: !!actor && !isFetching,
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });
}

// ─── Challenge Mutation Hooks ─────────────────────────────────────────────────

export function useAddChallenge() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      category,
      title,
      description,
      rewardPoints,
      specialReward,
    }: {
      category: ChallengeCategory;
      title: string;
      description: string;
      rewardPoints: bigint;
      specialReward: string | null;
    }) => {
      if (!actor) throw new Error("Actor not available");
      const result = await actor.addChallenge(
        category as Parameters<typeof actor.addChallenge>[0],
        title,
        description,
        rewardPoints,
        specialReward,
      );
      if (result.__kind__ === "err") throw new Error(result.err);
      return result.ok;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["challenges"] });
      queryClient.refetchQueries({ queryKey: ["challenges"] });
    },
  });
}

export function useUpdateChallenge() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      category,
      title,
      description,
      rewardPoints,
      specialReward,
    }: {
      id: string;
      category: ChallengeCategory;
      title: string;
      description: string;
      rewardPoints: bigint;
      specialReward: string | null;
    }) => {
      if (!actor) throw new Error("Actor not available");
      const result = await actor.updateChallenge(
        id,
        category as Parameters<typeof actor.updateChallenge>[1],
        title,
        description,
        rewardPoints,
        specialReward,
      );
      if (result.__kind__ === "err") throw new Error(result.err);
      return result.ok;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["challenges"] });
      queryClient.refetchQueries({ queryKey: ["challenges"] });
    },
  });
}

export function useDeleteChallenge() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!actor) throw new Error("Actor not available");
      const result = await actor.deleteChallenge(id);
      if (result.__kind__ === "err") throw new Error(result.err);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["challenges"] });
      queryClient.refetchQueries({ queryKey: ["challenges"] });
    },
  });
}

export function useUpdateSubmitProofEmail() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (email: string) => {
      if (!actor) throw new Error("Actor not available");
      return actor.updateSubmitProofEmail(email);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["submitProofEmail"] });
      queryClient.refetchQueries({ queryKey: ["submitProofEmail"] });
    },
  });
}
