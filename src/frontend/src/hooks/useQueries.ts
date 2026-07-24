import { Principal } from "@dfinity/principal";
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { type AmazonRegion, UserRole } from "../backend";
import type {
  AuthorNote,
  AuthorNoteReaction,
  HomepageTextBlocks as BackendHomepageTextBlocks,
  BackgroundMusicState,
  BackgroundMusicTrack,
  BookSale,
  DictionaryEntry,
  FooterSettings,
  NewsletterSubscriber,
  PaymentCountry,
  PaymentOption,
  PolicyContent,
  PolicyType,
  Product,
  ReflectionBlock,
  Review,
  ReviewMilestone,
  ShortMessage,
  TaxRecord,
  TextBlock,
  UserProfile,
} from "../backend";
import { useActor } from "./useActor";

// ReflectionBlockReaction is the same enum as AuthorNoteReaction in this backend
type ReflectionBlockReaction = AuthorNoteReaction;

// HomepageTextBlocks is now exported by the generated backend bindings.
// Re-export it here so existing imports from useQueries keep working, and so
// the bilingual type below can reference the canonical shape.
export type HomepageTextBlocks = BackendHomepageTextBlocks;

// Bilingual pair of homepage text blocks — matches the backend binding used by
// the Emilie and Anna book pages, each of which exposes separate EN and NL
// endpoints. Page tasks fetch both halves and pick the active language.
export type BilingualHomepageTextBlocks = {
  en: HomepageTextBlocks;
  nl: HomepageTextBlocks;
};

// AuthorNoteReaction re-exported alias — same as backend AuthorNoteReaction
export type { AuthorNoteReaction };
// Amazon Region hooks
export function useGetAmazonRegions() {
  const { actor, isFetching } = useActor();

  return useQuery<AmazonRegion[]>({
    queryKey: ["amazonRegions"],
    queryFn: async () => {
      if (!actor) return [];
      try {
        return await actor.getAmazonRegions();
      } catch (err) {
        console.error("useGetAmazonRegions error:", err);
        return [];
      }
    },
    enabled: !!actor && !isFetching,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
  });
}

export function useUpdateAmazonRegion() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (region: AmazonRegion) => {
      if (!actor) throw new Error("Actor not available");
      return actor.updateAmazonRegion(region);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["amazonRegions"] });
      queryClient.refetchQueries({ queryKey: ["amazonRegions"] });
    },
  });
}

export function useAddAmazonRegion() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (region: AmazonRegion) => {
      if (!actor) throw new Error("Actor not available");
      return actor.addAmazonRegion(region);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["amazonRegions"] });
      queryClient.refetchQueries({ queryKey: ["amazonRegions"] });
    },
  });
}

export function useDeleteAmazonRegion() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (regionId: string) => {
      if (!actor) throw new Error("Actor not available");
      return actor.deleteAmazonRegion(regionId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["amazonRegions"] });
      queryClient.refetchQueries({ queryKey: ["amazonRegions"] });
    },
  });
}

// Per-book Amazon region hooks
export function useGetAmazonRegionsByBook(bookKey: string) {
  const { actor, isFetching } = useActor();

  return useQuery<AmazonRegion[]>({
    queryKey: ["amazonRegionsByBook", bookKey],
    queryFn: async () => {
      if (!actor) return [];
      try {
        return await actor.getAmazonRegionsByBook(bookKey);
      } catch (err) {
        console.error("useGetAmazonRegionsByBook error:", err);
        return [];
      }
    },
    enabled: !!actor && !isFetching,
    staleTime: 30_000,
  });
}

export function useSaveAmazonRegionForBook() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      bookKey,
      region,
    }: { bookKey: string; region: AmazonRegion }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.saveAmazonRegionForBook(bookKey, region);
    },
    onSuccess: (_, { bookKey }) => {
      queryClient.invalidateQueries({
        queryKey: ["amazonRegionsByBook", bookKey],
      });
    },
  });
}

export function useRemoveAmazonRegionFromBook() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      bookKey,
      regionId,
    }: { bookKey: string; regionId: string }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.removeAmazonRegionFromBook(bookKey, regionId);
    },
    onSuccess: (_, { bookKey }) => {
      queryClient.invalidateQueries({
        queryKey: ["amazonRegionsByBook", bookKey],
      });
    },
  });
}

export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();

  const query = useQuery<UserProfile | null>({
    queryKey: ["currentUserProfile"],
    queryFn: async () => {
      if (!actor) return null;
      try {
        return await actor.getCallerUserProfile();
      } catch (err) {
        console.warn("useGetCallerUserProfile error:", err);
        return null;
      }
    },
    enabled: !!actor && !actorFetching,
    retry: false,
  });

  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
    isFetched: !!actor && query.isFetched,
  };
}

export function useGetCallerUserRole() {
  const { actor, isFetching } = useActor();

  return useQuery<UserRole>({
    queryKey: ["currentUserRole"],
    queryFn: async () => {
      if (!actor) return UserRole.guest;
      try {
        return await actor.getCallerUserRole();
      } catch (err) {
        console.warn("useGetCallerUserRole error:", err);
        // Throw so react-query keeps the previous cached value via placeholderData
        throw err;
      }
    },
    enabled: !!actor && !isFetching,
    // Role is stable — only re-check after 5 minutes, not on every mount/tab switch
    staleTime: 5 * 60 * 1000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    retry: 3,
    retryDelay: 2000,
    // On network/error, keep the last confirmed role rather than clearing it
    placeholderData: keepPreviousData,
  });
}

export function useIsCallerAdmin() {
  const { actor, isFetching } = useActor();

  const query = useQuery<boolean>({
    queryKey: ["isCallerAdmin"],
    queryFn: async () => {
      if (!actor) {
        // Actor not ready — do not return false, throw so previous data is kept
        throw new Error("Actor not yet available");
      }
      // This is the ONLY place a confirmed false is acceptable — when the
      // backend explicitly says "not admin". Any network error should throw
      // so react-query retries and keeps previous data via placeholderData.
      const result = await actor.isCallerAdmin();
      return result;
    },
    enabled: !!actor && !isFetching,
    // Admin status is stable per session — 5 min staleTime prevents re-fetches
    // on every component mount or tab switch
    staleTime: 5 * 60 * 1000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    // 3 retries with 2s delay between them before giving up
    retry: 3,
    retryDelay: 2000,
    // CRITICAL: on any network/transient error, keep the previously confirmed
    // admin status instead of replacing it with undefined/false
    placeholderData: keepPreviousData,
  });

  // ── B3: Resilience for the admin-check error state ─────────────────────────
  // When the admin check is in an ERROR state (query isError, not a confirmed
  // false), automatically retry ONCE the actor becomes ready (transitions from
  // undefined/fetching to a valid actor). Log a console warning naming the
  // error so transient failures are observable. This benefits every consumer
  // of useIsCallerAdmin (Navigation admin button, AdminDashboard gating,
  // GameComments moderation UI) without changing their gating logic.
  const retriedRef = useRef(false);
  useEffect(() => {
    // Only retry when: query is in error state, actor is now ready, and we
    // have not already fired the one-shot retry for this error cycle.
    if (query.isError && !!actor && !isFetching && !retriedRef.current) {
      retriedRef.current = true;
      const err = query.error;
      console.warn(
        "useIsCallerAdmin: admin check failed, retrying once now that actor is ready.",
        err instanceof Error ? err.message : err,
      );
      query.refetch();
    }
    // Reset the one-shot retry flag once the query leaves the error state
    // (success or a fresh error cycle after actor re-becomes undefined).
    if (!query.isError) {
      retriedRef.current = false;
    }
  }, [query.isError, query.error, query.refetch, actor, isFetching]);

  return query;
}

export function useSaveCallerUserProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error("Actor not available");
      return actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["currentUserProfile"] });
    },
  });
}

// ── Access control initialization (first-login-becomes-admin) ──────────────────
// The backend's initializeAccessControl() endpoint is guarded: it only assigns
// the caller as #admin when accessControlState.adminAssigned is false. Once an
// admin exists, repeated calls are safe no-ops. This mutation fires that call
// and, on success, invalidates the admin-status query caches so the Admin
// Dashboard button appears for the now-admin user without a manual reload.
export function useInitializeAccessControl() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("Actor not available");
      return actor.initializeAccessControl();
    },
    onSuccess: () => {
      // Invalidate + refetch the admin-status queries so the UI refreshes
      // immediately after the first user is promoted to admin.
      queryClient.invalidateQueries({ queryKey: ["isCallerAdmin"] });
      queryClient.invalidateQueries({ queryKey: ["currentUserRole"] });
      queryClient.refetchQueries({ queryKey: ["isCallerAdmin"] });
      queryClient.refetchQueries({ queryKey: ["currentUserRole"] });
    },
    onError: (error) => {
      console.warn(
        "useInitializeAccessControl: failed to initialize access control.",
        error instanceof Error ? error.message : error,
      );
    },
  });
}

// Dictionary hooks
export function useGetDictionaryEntries() {
  const { actor, isFetching } = useActor();

  return useQuery<DictionaryEntry[]>({
    queryKey: ["dictionaryEntries"],
    queryFn: async () => {
      if (!actor) return [];
      try {
        return await actor.listDictionaryEntries();
      } catch (err) {
        console.error("useGetDictionaryEntries error:", err);
        return [];
      }
    },
    enabled: !!actor && !isFetching,
    staleTime: 30 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
}

export function useAddDictionaryEntry() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (entry: DictionaryEntry) => {
      if (!actor) throw new Error("Actor not available");
      return actor.addDictionaryEntry(entry);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dictionaryEntries"] });
      queryClient.refetchQueries({ queryKey: ["dictionaryEntries"] });
    },
  });
}

export function useUpdateDictionaryEntry() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (entry: DictionaryEntry) => {
      if (!actor) throw new Error("Actor not available");
      return actor.updateDictionaryEntry(entry);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dictionaryEntries"] });
      queryClient.refetchQueries({ queryKey: ["dictionaryEntries"] });
    },
  });
}

export function useDeleteDictionaryEntry() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (word: string) => {
      if (!actor) throw new Error("Actor not available");
      return actor.deleteDictionaryEntry(word);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dictionaryEntries"] });
      queryClient.refetchQueries({ queryKey: ["dictionaryEntries"] });
    },
  });
}

// Reflection Blocks hooks
export function useGetReflectionBlocks() {
  const { actor, isFetching } = useActor();

  return useQuery<ReflectionBlock[]>({
    queryKey: ["reflectionBlocks"],
    queryFn: async () => {
      if (!actor) return [];
      try {
        return await actor.getReflectionBlocks();
      } catch (err) {
        console.error("useGetReflectionBlocks error:", err);
        return [];
      }
    },
    enabled: !!actor && !isFetching,
    staleTime: 30 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
}

export function useAddReflectionBlock() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (block: ReflectionBlock) => {
      if (!actor) throw new Error("Actor not available");
      return actor.addReflectionBlock(block);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reflectionBlocks"] });
      queryClient.refetchQueries({ queryKey: ["reflectionBlocks"] });
    },
  });
}

export function useUpdateReflectionBlock() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (block: ReflectionBlock) => {
      if (!actor) throw new Error("Actor not available");
      return actor.updateReflectionBlock(block);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reflectionBlocks"] });
      queryClient.refetchQueries({ queryKey: ["reflectionBlocks"] });
    },
  });
}

export function useDeleteReflectionBlock() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (blockId: string) => {
      if (!actor) throw new Error("Actor not available");
      return actor.deleteReflectionBlock(blockId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reflectionBlocks"] });
      queryClient.refetchQueries({ queryKey: ["reflectionBlocks"] });
    },
  });
}

export function useGetProducts() {
  const { actor, isFetching } = useActor();

  return useQuery<Product[]>({
    queryKey: ["products"],
    queryFn: async () => {
      if (!actor) return [];
      try {
        return await actor.getProducts();
      } catch (err) {
        console.error("useGetProducts error:", err);
        return [];
      }
    },
    enabled: !!actor && !isFetching,
    staleTime: 30 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
}

// ─── Per-key product access ───────────────────────────────────────────────────
// The backend now keys products by a text key (the product's `id` field) and
// exposes getProductByKey / updateProductByKey. The legacy first/second product
// hooks below are kept as shims that derive from useGetProducts (6 products in
// canonical order) and useUpdateProductByKey so existing consumers keep
// compiling. The old getFeaturedProducts / updateFirstProduct /
// updateSecondProduct backend endpoints are removed.

export function useGetProductByKey(textKey: string) {
  const { actor, isFetching } = useActor();

  return useQuery<Product | null>({
    queryKey: ["productByKey", textKey],
    queryFn: async () => {
      if (!actor) return null;
      try {
        return await actor.getProductByKey(textKey);
      } catch (err) {
        console.error("useGetProductByKey error:", err);
        return null;
      }
    },
    enabled: !!actor && !isFetching && !!textKey,
    staleTime: 30 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
}

export function useUpdateProductByKey() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      textKey,
      product,
    }: {
      textKey: string;
      product: Product;
    }) => {
      if (!actor) throw new Error("Actor not available");
      if (!textKey || !product.id || !product.title) {
        throw new Error("Product must have textKey, id and title");
      }
      try {
        const result = await actor.updateProductByKey(textKey, product);

        await queryClient.invalidateQueries({ queryKey: ["products"] });
        await queryClient.invalidateQueries({
          queryKey: ["productByKey", textKey],
        });

        await queryClient.refetchQueries({ queryKey: ["products"] });
        await queryClient.refetchQueries({
          queryKey: ["productByKey", textKey],
        });

        return result;
      } catch (error) {
        console.error("Failed to update product by key:", error);
        throw new Error(
          `Failed to update product: ${error instanceof Error ? error.message : "Unknown error"}`,
        );
      }
    },
    onError: (error) => {
      console.error("Update product by key mutation failed:", error);
    },
  });
}

export function useGetBookProducts() {
  const productsQuery = useGetProducts();

  return {
    ...productsQuery,
    data:
      productsQuery.data?.filter(
        (product) => !product.id.startsWith("merchandise-"),
      ) || [],
  };
}

// ── Legacy featured-products shim (deprecated) ───────────────────────────────
// The backend's getFeaturedProducts endpoint is removed. This hook now derives
// the legacy { firstProduct, useFirstPlaceholder, secondProduct,
// useSecondPlaceholder } shape from useGetProducts (6 products in canonical
// order). The first two products map to first/second; the placeholder flag is
// true when the product has no custom cover image. Existing consumers
// (AdminProductsManager.tsx, HomePage.tsx, HomepageMediaPreloader.tsx) keep
// compiling. Page tasks should migrate to useGetProducts / useGetProductByKey.
/** @deprecated Use useGetProducts / useGetProductByKey */
export function useGetFeaturedProducts() {
  const productsQuery = useGetProducts();

  const data =
    productsQuery.data && productsQuery.data.length >= 2
      ? {
          firstProduct: productsQuery.data[0],
          useFirstPlaceholder: !productsQuery.data[0].hasCustomImage,
          secondProduct: productsQuery.data[1],
          useSecondPlaceholder: !productsQuery.data[1].hasCustomImage,
        }
      : null;

  return {
    ...productsQuery,
    data,
  };
}

// ── Legacy first/second product update shims (deprecated) ─────────────────────
// The backend's updateFirstProduct / updateSecondProduct endpoints are removed.
// These shims delegate to useUpdateProductByKey using the first/second product's
// id as textKey, so existing admin consumers keep compiling. Page tasks should
// migrate to useUpdateProductByKey directly.
/** @deprecated Use useUpdateProductByKey */
export function useUpdateFirstProduct() {
  const productsQuery = useGetProducts();
  const updateProductByKey = useUpdateProductByKey();

  return useMutation({
    mutationFn: async (product: Product) => {
      const firstProduct = productsQuery.data?.[0];
      const textKey = firstProduct?.id ?? product.id;
      return updateProductByKey.mutateAsync({ textKey, product });
    },
  });
}

/** @deprecated Use useUpdateProductByKey */
export function useUpdateSecondProduct() {
  const productsQuery = useGetProducts();
  const updateProductByKey = useUpdateProductByKey();

  return useMutation({
    mutationFn: async (product: Product) => {
      const secondProduct = productsQuery.data?.[1];
      const textKey = secondProduct?.id ?? product.id;
      return updateProductByKey.mutateAsync({ textKey, product });
    },
  });
}

export function useGetPolicyContent(policyType: PolicyType) {
  const { actor, isFetching } = useActor();

  return useQuery<PolicyContent>({
    queryKey: ["policy", policyType],
    queryFn: async () => {
      if (!actor)
        return { policyType, title: "", content: "" } as PolicyContent;
      try {
        return await actor.getPolicyContent(policyType);
      } catch (err) {
        console.error("useGetPolicyContent error:", err);
        return { policyType, title: "", content: "" } as PolicyContent;
      }
    },
    enabled: !!actor && !isFetching,
    staleTime: 30 * 1000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });
}

export function useUpdatePolicyContent() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      policyType,
      content,
    }: { policyType: PolicyType; content: string }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.updatePolicyContent(policyType, content);
    },
    onSuccess: async (_, { policyType }) => {
      await queryClient.invalidateQueries({ queryKey: ["policy", policyType] });
      await queryClient.invalidateQueries({ queryKey: ["policy"] });
      await queryClient.refetchQueries({ queryKey: ["policy", policyType] });
    },
  });
}

// Promotional Terms hooks - backend returns string, not PolicyContent
export function useGetPromotionalTermsContent() {
  const { actor, isFetching } = useActor();

  return useQuery<string>({
    queryKey: ["promotionalTerms"],
    queryFn: async () => {
      if (!actor) return "";
      try {
        return await actor.getPromotionalTermsContent();
      } catch (err) {
        console.error("useGetPromotionalTermsContent error:", err);
        return "";
      }
    },
    enabled: !!actor && !isFetching,
    staleTime: 30 * 1000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });
}

export function useUpdatePromotionalTermsContent() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (content: string) => {
      if (!actor) throw new Error("Actor not available");
      await actor.updatePromotionalTermsContent(content);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["promotionalTerms"] });
      await queryClient.refetchQueries({ queryKey: ["promotionalTerms"] });
    },
  });
}

// Current review number hooks
export function useGetCurrentReviewNumber() {
  const { actor, isFetching } = useActor();

  return useQuery<bigint>({
    queryKey: ["currentReviewNumber"],
    queryFn: async () => {
      if (!actor) return BigInt(0);
      try {
        return await actor.getCurrentReviewNumber();
      } catch (err) {
        console.error("useGetCurrentReviewNumber error:", err);
        return BigInt(0);
      }
    },
    enabled: !!actor && !isFetching,
    staleTime: 30 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
}

export function useUpdateCurrentReviewNumber() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (reviewNumber: bigint) => {
      if (!actor) throw new Error("Actor not available");
      return actor.updateCurrentReviewNumber(reviewNumber);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["currentReviewNumber"] });
      queryClient.invalidateQueries({ queryKey: ["roadmapSectionData"] });
      queryClient.refetchQueries({ queryKey: ["currentReviewNumber"] });
      queryClient.refetchQueries({ queryKey: ["roadmapSectionData"] });
    },
  });
}

// Homepage text blocks management hooks
export function useGetHomepageTextBlocks() {
  const { actor, isFetching } = useActor();

  return useQuery<HomepageTextBlocks>({
    queryKey: ["homepageTextBlocks"],
    queryFn: async () => {
      const fallback = {
        block1: { title: "", content: "" },
        block2: { title: "", content: "" },
        block3: { title: "", content: "" },
      };
      if (!actor) return fallback;
      try {
        return await actor.getHomepageTextBlocks();
      } catch (err) {
        console.error("useGetHomepageTextBlocks error:", err);
        return fallback;
      }
    },
    enabled: !!actor && !isFetching,
    // 30s staleTime prevents refetch storms after loading screen dismisses.
    // refetchOnWindowFocus/Mount=false avoids blank-window between old and new data.
    staleTime: 30 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
}

export function useUpdateHomepageTextBlocks() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (blocks: HomepageTextBlocks) => {
      if (!actor) throw new Error("Actor not available");
      return actor.updateHomepageTextBlocks(blocks);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["homepageTextBlocks"] });
    },
  });
}
// ─── Bilingual homepage text blocks (Emilie & Anna) ───────────────────────────
// The backend now exposes separate EN and NL endpoints for each book's homepage
// text blocks. Page tasks fetch the pair via the *En/*Nl hooks and select the
// active language at render time. The legacy single-language hooks below are
// kept as thin shims that delegate to the EN endpoint so existing page consumers
// keep compiling until page tasks swap to the bilingual hooks.

const EMPTY_TEXT_BLOCKS: HomepageTextBlocks = {
  block1: { title: "", content: "" },
  block2: { title: "", content: "" },
  block3: { title: "", content: "" },
};

const COMING_SOON_TEXT_BLOCKS: HomepageTextBlocks = {
  block1: { title: "", content: "Coming soon..." },
  block2: { title: "", content: "" },
  block3: { title: "", content: "" },
};

// Emilie — English
export function useGetHomepageTextBlocksEmilieEn() {
  const { actor, isFetching } = useActor();

  return useQuery<HomepageTextBlocks>({
    queryKey: ["homepageTextBlocksEmilieEn"],
    queryFn: async () => {
      if (!actor) return COMING_SOON_TEXT_BLOCKS;
      try {
        return await actor.getHomepageTextBlocksEmilieEn();
      } catch (err) {
        console.error("useGetHomepageTextBlocksEmilieEn error:", err);
        return COMING_SOON_TEXT_BLOCKS;
      }
    },
    enabled: !!actor && !isFetching,
    staleTime: 30 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
}

export function useUpdateHomepageTextBlocksEmilieEn() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (blocks: HomepageTextBlocks) => {
      if (!actor) throw new Error("Actor not available");
      return actor.updateHomepageTextBlocksEmilieEn(blocks);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["homepageTextBlocksEmilieEn"],
      });
    },
  });
}

// Emilie — Dutch
export function useGetHomepageTextBlocksEmilieNl() {
  const { actor, isFetching } = useActor();

  return useQuery<HomepageTextBlocks>({
    queryKey: ["homepageTextBlocksEmilieNl"],
    queryFn: async () => {
      if (!actor) return COMING_SOON_TEXT_BLOCKS;
      try {
        return await actor.getHomepageTextBlocksEmilieNl();
      } catch (err) {
        console.error("useGetHomepageTextBlocksEmilieNl error:", err);
        return COMING_SOON_TEXT_BLOCKS;
      }
    },
    enabled: !!actor && !isFetching,
    staleTime: 30 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
}

export function useUpdateHomepageTextBlocksEmilieNl() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (blocks: HomepageTextBlocks) => {
      if (!actor) throw new Error("Actor not available");
      return actor.updateHomepageTextBlocksEmilieNl(blocks);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["homepageTextBlocksEmilieNl"],
      });
    },
  });
}

// Anna — English
export function useGetHomepageTextBlocksAnnaEn() {
  const { actor, isFetching } = useActor();

  return useQuery<HomepageTextBlocks>({
    queryKey: ["homepageTextBlocksAnnaEn"],
    queryFn: async () => {
      if (!actor) return COMING_SOON_TEXT_BLOCKS;
      try {
        return await actor.getHomepageTextBlocksAnnaEn();
      } catch (err) {
        console.error("useGetHomepageTextBlocksAnnaEn error:", err);
        return COMING_SOON_TEXT_BLOCKS;
      }
    },
    enabled: !!actor && !isFetching,
    staleTime: 30 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
}

export function useUpdateHomepageTextBlocksAnnaEn() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (blocks: HomepageTextBlocks) => {
      if (!actor) throw new Error("Actor not available");
      return actor.updateHomepageTextBlocksAnnaEn(blocks);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["homepageTextBlocksAnnaEn"],
      });
    },
  });
}

// Anna — Dutch
export function useGetHomepageTextBlocksAnnaNl() {
  const { actor, isFetching } = useActor();

  return useQuery<HomepageTextBlocks>({
    queryKey: ["homepageTextBlocksAnnaNl"],
    queryFn: async () => {
      if (!actor) return COMING_SOON_TEXT_BLOCKS;
      try {
        return await actor.getHomepageTextBlocksAnnaNl();
      } catch (err) {
        console.error("useGetHomepageTextBlocksAnnaNl error:", err);
        return COMING_SOON_TEXT_BLOCKS;
      }
    },
    enabled: !!actor && !isFetching,
    staleTime: 30 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
}

export function useUpdateHomepageTextBlocksAnnaNl() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (blocks: HomepageTextBlocks) => {
      if (!actor) throw new Error("Actor not available");
      return actor.updateHomepageTextBlocksAnnaNl(blocks);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["homepageTextBlocksAnnaNl"],
      });
    },
  });
}

// ── Legacy single-language shims (deprecated) ──────────────────────────────────
// These delegate to the EN bilingual endpoint so existing page consumers keep
// compiling. Page tasks should migrate to the *En/*Nl hooks above and remove
// these usages; the shims will be deleted once no consumer remains.

/** @deprecated Use useGetHomepageTextBlocksEmilieEn / useGetHomepageTextBlocksEmilieNl */
export function useGetHomepageTextBlocksEmilie() {
  const query = useGetHomepageTextBlocksEmilieEn();
  return query;
}

/** @deprecated Use useUpdateHomepageTextBlocksEmilieEn / useUpdateHomepageTextBlocksEmilieNl */
export function useUpdateHomepageTextBlocksEmilie() {
  return useUpdateHomepageTextBlocksEmilieEn();
}

/** @deprecated Use useGetHomepageTextBlocksAnnaEn / useGetHomepageTextBlocksAnnaNl */
export function useGetHomepageTextBlocksAnna() {
  const query = useGetHomepageTextBlocksAnnaEn();
  return query;
}

/** @deprecated Use useUpdateHomepageTextBlocksAnnaEn / useUpdateHomepageTextBlocksAnnaNl */
export function useUpdateHomepageTextBlocksAnna() {
  return useUpdateHomepageTextBlocksAnnaEn();
}

// Extended Review type that includes optional backend fields not yet in generated d.ts.
// starRating comes from the backend as ?Nat (bigint | undefined at the binding layer).
// Downstream consumers should call normalizeStarRating() to get a number | null value.
// The field is kept as bigint | null here so existing Review-based casts (e.g.
// `review as ReviewWithExtras` in page components) remain type-compatible.
export type ReviewWithExtras = Review & {
  companyBlogSite?: string;
  sourceLink?: string;
  starRating?: bigint | null;
};

/** Normalize the backend's ?Nat starRating (bigint | undefined) to number | null
 *  so review components can read a plain numeric value. */
export function normalizeStarRating(
  starRating: bigint | undefined | null,
): number | null {
  if (starRating === null || starRating === undefined) return null;
  return Number(starRating);
}

// Review management hooks
export function useGetReviews() {
  const { actor, isFetching } = useActor();

  return useQuery<Review[]>({
    queryKey: ["reviews"],
    queryFn: async () => {
      if (!actor) return [];
      try {
        // Return only real admin-created reviews. When none exist, return an
        // empty array — do NOT fall back to getDefaultReviews() placeholder
        // reviews, which would mask the real (empty) admin state.
        return await actor.getReviews();
      } catch (err) {
        console.error("useGetReviews error:", err);
        return [];
      }
    },
    enabled: !!actor && !isFetching,
    // 30s staleTime prevents refetch storms after loading screen dismisses.
    // refetchOnWindowFocus/Mount=false avoids blank window between old and new data.
    staleTime: 30 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
}

// ── Per-book-title review queries ─────────────────────────────────────────────
// Backend exposes getReviewsByBookTitle(bookTitle) and getReviewBookTitles() so
// the UI can list reviews scoped to a specific title and enumerate the titles
// that have reviews. Used by the reviews page title filter.

export function useGetReviewsByBookTitle(bookTitle: string) {
  const { actor, isFetching } = useActor();

  return useQuery<Review[]>({
    queryKey: ["reviewsByBookTitle", bookTitle],
    queryFn: async () => {
      if (!actor) return [];
      try {
        return await actor.getReviewsByBookTitle(bookTitle);
      } catch (err) {
        console.error("useGetReviewsByBookTitle error:", err);
        return [];
      }
    },
    enabled: !!actor && !isFetching && !!bookTitle,
    staleTime: 30 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
}

export function useGetReviewBookTitles() {
  const { actor, isFetching } = useActor();

  return useQuery<string[]>({
    queryKey: ["reviewBookTitles"],
    queryFn: async () => {
      if (!actor) return [];
      try {
        return await actor.getReviewBookTitles();
      } catch (err) {
        console.error("useGetReviewBookTitles error:", err);
        return [];
      }
    },
    enabled: !!actor && !isFetching,
    staleTime: 30 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
}

export function useAddReview() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (review: ReviewWithExtras) => {
      if (!actor) throw new Error("Actor not available");

      if (
        !review.id ||
        !review.reviewerName ||
        !review.snippet ||
        !review.fullText
      ) {
        throw new Error("Review must have all required fields");
      }

      try {
        // Cast to any to pass optional backend fields (companyBlogSite, sourceLink)
        // that are in the Motoko backend but not yet reflected in the generated d.ts
        const result = await (
          actor as unknown as Record<
            string,
            (r: ReviewWithExtras) => Promise<void>
          >
        ).addReview(review);

        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ["reviews"] }),
        ]);

        await Promise.all([
          queryClient.refetchQueries({ queryKey: ["reviews"] }),
        ]);

        return result;
      } catch (error) {
        console.error("Failed to add review:", error);
        throw new Error(
          `Failed to add review: ${error instanceof Error ? error.message : "Unknown error"}`,
        );
      }
    },
    onError: (error) => {
      console.error("Add review mutation failed:", error);
    },
  });
}

export function useUpdateReview() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (review: ReviewWithExtras) => {
      if (!actor) throw new Error("Actor not available");

      if (
        !review.id ||
        !review.reviewerName ||
        !review.snippet ||
        !review.fullText
      ) {
        throw new Error("Review must have all required fields");
      }

      try {
        // Cast to any to pass optional backend fields (companyBlogSite, sourceLink)
        // that are in the Motoko backend but not yet reflected in the generated d.ts
        const result = await (
          actor as unknown as Record<
            string,
            (r: ReviewWithExtras) => Promise<void>
          >
        ).updateReview(review);

        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ["reviews"] }),
        ]);

        await Promise.all([
          queryClient.refetchQueries({ queryKey: ["reviews"] }),
        ]);

        return result;
      } catch (error) {
        console.error("Failed to update review:", error);
        throw new Error(
          `Failed to update review: ${error instanceof Error ? error.message : "Unknown error"}`,
        );
      }
    },
    onError: (error) => {
      console.error("Update review mutation failed:", error);
    },
  });
}

export function useDeleteReview() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (reviewId: string) => {
      if (!actor) throw new Error("Actor not available");

      if (!reviewId) {
        throw new Error("Review ID is required");
      }

      try {
        const result = await actor.deleteReview(reviewId);

        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ["reviews"] }),
        ]);

        await Promise.all([
          queryClient.refetchQueries({ queryKey: ["reviews"] }),
        ]);

        return result;
      } catch (error) {
        console.error("Failed to delete review:", error);
        throw new Error(
          `Failed to delete review: ${error instanceof Error ? error.message : "Unknown error"}`,
        );
      }
    },
    onError: (error) => {
      console.error("Delete review mutation failed:", error);
    },
  });
}

// Review milestone management hooks
export function useGetReviewMilestones() {
  const { actor, isFetching } = useActor();

  return useQuery<ReviewMilestone[]>({
    queryKey: ["roadmapMilestones"],
    queryFn: async () => {
      if (!actor) return [];
      try {
        return await actor.getReviewMilestones();
      } catch (err) {
        console.error("useGetReviewMilestones error:", err);
        return [];
      }
    },
    enabled: !!actor && !isFetching,
    staleTime: 30 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
}

export function useAddReviewMilestone() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (milestone: ReviewMilestone) => {
      if (!actor) throw new Error("Actor not available");
      return actor.addReviewMilestone(milestone);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roadmapMilestones"] });
      queryClient.refetchQueries({ queryKey: ["roadmapMilestones"] });
    },
  });
}

export function useUpdateReviewMilestone() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (milestone: ReviewMilestone) => {
      if (!actor) throw new Error("Actor not available");
      return actor.updateReviewMilestone(milestone);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roadmapMilestones"] });
      queryClient.refetchQueries({ queryKey: ["roadmapMilestones"] });
    },
  });
}

export function useDeleteReviewMilestone() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (milestoneNumber: bigint) => {
      if (!actor) throw new Error("Actor not available");
      return actor.deleteReviewMilestone(milestoneNumber);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roadmapMilestones"] });
      queryClient.refetchQueries({ queryKey: ["roadmapMilestones"] });
    },
  });
}

// Book Sales Administration hooks
export function useGetBookSales() {
  const { actor, isFetching } = useActor();

  return useQuery<BookSale[]>({
    queryKey: ["bookSales"],
    queryFn: async () => {
      if (!actor) return [];
      try {
        return await actor.getBookSales();
      } catch (err) {
        console.error("useGetBookSales error:", err);
        return [];
      }
    },
    enabled: !!actor && !isFetching,
    staleTime: 30 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
}

export function useAddBookSale() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (sale: BookSale) => {
      if (!actor) throw new Error("Actor not available");
      return actor.addBookSale(sale);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookSales"] });
      queryClient.refetchQueries({ queryKey: ["bookSales"] });
    },
  });
}

export function useUpdateBookSale() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (sale: BookSale) => {
      if (!actor) throw new Error("Actor not available");
      return actor.updateBookSale(sale);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookSales"] });
      queryClient.refetchQueries({ queryKey: ["bookSales"] });
    },
  });
}

export function useDeleteBookSale() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (bookNumber: bigint) => {
      if (!actor) throw new Error("Actor not available");
      return actor.deleteBookSale(bookNumber);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookSales"] });
      queryClient.refetchQueries({ queryKey: ["bookSales"] });
    },
  });
}

// Tax Records hooks
export function useGetTaxRecords() {
  const { actor, isFetching } = useActor();

  return useQuery<TaxRecord[]>({
    queryKey: ["taxRecords"],
    queryFn: async () => {
      if (!actor) return [];
      try {
        return await actor.getTaxRecords();
      } catch (err) {
        console.error("useGetTaxRecords error:", err);
        return [];
      }
    },
    enabled: !!actor && !isFetching,
    staleTime: 30 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
}

export function useAddTaxRecord() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (record: TaxRecord) => {
      if (!actor) throw new Error("Actor not available");
      return actor.addTaxRecord(record);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["taxRecords"] });
      queryClient.refetchQueries({ queryKey: ["taxRecords"] });
    },
  });
}

export function useUpdateTaxRecord() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (record: TaxRecord) => {
      if (!actor) throw new Error("Actor not available");
      return actor.updateTaxRecord(record);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["taxRecords"] });
      queryClient.refetchQueries({ queryKey: ["taxRecords"] });
    },
  });
}

// Background Music hooks
export function useGetBackgroundMusic() {
  const { actor, isFetching } = useActor();

  const fallback: BackgroundMusicState = {
    tracks: [] as BackgroundMusicState["tracks"],
    musicEnabled: false,
    playlist: [] as BackgroundMusicState["playlist"],
    currentPlaylistIndex: BigInt(0),
    settings: {
      volume: BigInt(50),
      fadeInDuration: BigInt(3000),
      fadeOutDuration: BigInt(3000),
      shouldLoop: true,
    },
  };

  return useQuery<BackgroundMusicState>({
    queryKey: ["backgroundMusic"],
    queryFn: async () => {
      if (!actor) return fallback;
      try {
        return await actor.getBackgroundMusic();
      } catch (err) {
        console.error("useGetBackgroundMusic error:", err);
        return fallback;
      }
    },
    enabled: !!actor && !isFetching,
    staleTime: 30 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
}

export function useUploadBackgroundMusicTrack() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (track: BackgroundMusicTrack) => {
      if (!actor) throw new Error("Actor not available");
      return actor.uploadBackgroundMusicTrack(track);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["backgroundMusic"] });
      queryClient.refetchQueries({ queryKey: ["backgroundMusic"] });
    },
  });
}

export function useSetActiveBackgroundMusicTrack() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (trackPath: string) => {
      if (!actor) throw new Error("Actor not available");
      return actor.setActiveBackgroundMusicTrack(trackPath);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["backgroundMusic"] });
      queryClient.refetchQueries({ queryKey: ["backgroundMusic"] });
    },
  });
}

export function useRemoveBackgroundMusicTrack() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (trackPath: string) => {
      if (!actor) throw new Error("Actor not available");
      return actor.removeBackgroundMusicTrack(trackPath);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["backgroundMusic"] });
      queryClient.refetchQueries({ queryKey: ["backgroundMusic"] });
    },
  });
}

export function useSetBackgroundMusicEnabled() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (enabled: boolean) => {
      if (!actor) throw new Error("Actor not available");
      return actor.setBackgroundMusicEnabled(enabled);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["backgroundMusic"] });
      queryClient.refetchQueries({ queryKey: ["backgroundMusic"] });
    },
  });
}

export function useSetBackgroundMusicPlaylist() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (playlist: string[]) => {
      if (!actor) throw new Error("Actor not available");
      return actor.setBackgroundMusicPlaylist(playlist);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["backgroundMusic"] });
      queryClient.refetchQueries({ queryKey: ["backgroundMusic"] });
    },
  });
}

// ─── Author Notes hooks ──────────────────────────────────────────────────────

export function useGetAuthorNotes() {
  const { actor, isFetching } = useActor();

  return useQuery<AuthorNote[]>({
    queryKey: ["authorNotes"],
    queryFn: async () => {
      if (!actor) return [];
      try {
        return await actor.getAuthorNotes();
      } catch (err) {
        console.error("useGetAuthorNotes error:", err);
        return [];
      }
    },
    enabled: !!actor && !isFetching,
    staleTime: 30 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
}

export function useAddAuthorNote() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      poemTitle,
      poemSubtitle,
      noteText,
    }: { poemTitle: string; poemSubtitle: string; noteText: string }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.addAuthorNote(poemTitle, poemSubtitle, noteText);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["authorNotes"] });
      queryClient.refetchQueries({ queryKey: ["authorNotes"] });
    },
  });
}

export function useUpdateAuthorNote() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      poemTitle,
      poemSubtitle,
      noteText,
    }: {
      id: string;
      poemTitle: string;
      poemSubtitle: string;
      noteText: string;
    }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.updateAuthorNote(id, poemTitle, poemSubtitle, noteText);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["authorNotes"] });
      queryClient.refetchQueries({ queryKey: ["authorNotes"] });
    },
  });
}

export function useDeleteAuthorNote() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!actor) throw new Error("Actor not available");
      return actor.deleteAuthorNote(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["authorNotes"] });
      queryClient.refetchQueries({ queryKey: ["authorNotes"] });
    },
  });
}

export function useReactToAuthorNote() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      noteId,
      reaction,
    }: { noteId: string; reaction: AuthorNoteReaction }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.reactToAuthorNote(
        noteId,
        reaction as ReflectionBlockReaction,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["authorNotes"] });
      queryClient.refetchQueries({ queryKey: ["authorNotes"] });
    },
  });
}

// ─── Review Reactions V2 ─────────────────────────────────────────────────────

export type ReviewReactionType = "love" | "like" | "dislike" | "laugh";

export function useReactToReviewV2() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      reviewId,
      reaction,
    }: { reviewId: string; reaction: ReviewReactionType }) => {
      if (!actor) throw new Error("Actor not available");
      // Call via cast since bindings may lag behind
      await (
        actor as unknown as Record<
          string,
          (id: string, rx: string) => Promise<void>
        >
      ).reactToReviewV2(reviewId, reaction);
    },
    onSuccess: (_data, { reviewId }) => {
      queryClient.invalidateQueries({ queryKey: ["reviewEmojiV2", reviewId] });
      queryClient.invalidateQueries({
        queryKey: ["userReviewReactionV2", reviewId],
      });
    },
  });
}

export function useGetReviewEmojiV2(reviewId: string) {
  const { actor, isFetching } = useActor();

  return useQuery<{
    love: number;
    like: number;
    dislike: number;
    laugh: number;
  }>({
    queryKey: ["reviewEmojiV2", reviewId],
    queryFn: async () => {
      if (!actor) return { love: 0, like: 0, dislike: 0, laugh: 0 };
      try {
        const raw = await (
          actor as unknown as Record<
            string,
            (id: string) => Promise<{
              love: bigint;
              like: bigint;
              dislike: bigint;
              laugh: bigint;
            }>
          >
        ).getReviewEmojiCountsV2(reviewId);
        return {
          love: Number(raw.love),
          like: Number(raw.like),
          dislike: Number(raw.dislike),
          laugh: Number(raw.laugh),
        };
      } catch {
        return { love: 0, like: 0, dislike: 0, laugh: 0 };
      }
    },
    enabled: !!actor && !isFetching && !!reviewId,
    staleTime: 30 * 1000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });
}

export function useGetUserReviewReactionV2(reviewId: string) {
  const { actor, isFetching } = useActor();

  return useQuery<ReviewReactionType | null>({
    queryKey: ["userReviewReactionV2", reviewId],
    queryFn: async () => {
      if (!actor) return null;
      try {
        const raw = await (
          actor as unknown as Record<
            string,
            (id: string) => Promise<[string] | []>
          >
        ).getUserReviewReactionV2(reviewId);
        // Motoko ?Text returns [] for null, [value] for ?value
        if (Array.isArray(raw) && raw.length > 0) {
          return raw[0] as ReviewReactionType;
        }
        return null;
      } catch {
        return null;
      }
    },
    enabled: !!actor && !isFetching && !!reviewId,
    staleTime: 30 * 1000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });
}

// ─── Favourites hooks ─────────────────────────────────────────────────────────

export function useGetUserFavourites() {
  const { actor, isFetching } = useActor();

  return useQuery<{
    reflections: string[];
    authorNotes: string[];
    games: string[];
    vocabulary: string[];
    shortMessages: string[];
  }>({
    queryKey: ["userFavourites"],
    queryFn: async () => {
      if (!actor)
        return {
          reflections: [],
          authorNotes: [],
          games: [],
          vocabulary: [],
          shortMessages: [],
        };
      try {
        const result = await actor.getUserFavourites();
        return {
          reflections: result.reflections,
          authorNotes: result.authorNotes,
          games: result.games,
          vocabulary: (result as { vocabulary?: string[] }).vocabulary ?? [],
          // backend UserFavourites has shortMessages field
          shortMessages:
            (result as { shortMessages?: string[] }).shortMessages ?? [],
        };
      } catch {
        return {
          reflections: [],
          authorNotes: [],
          games: [],
          vocabulary: [],
          shortMessages: [],
        };
      }
    },
    enabled: !!actor && !isFetching,
    staleTime: 30 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
}

export function useAddFavourite() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      itemType,
      itemId,
    }: { itemType: string; itemId: string }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.addFavourite(itemType, itemId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userFavourites"] });
    },
  });
}

export function useRemoveFavourite() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      itemType,
      itemId,
    }: { itemType: string; itemId: string }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.removeFavourite(itemType, itemId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userFavourites"] });
    },
  });
}

// ─── Short Messages hooks ─────────────────────────────────────────────────────

export function useListShortMessages(options?: { enabled?: boolean }) {
  const { actor, isFetching } = useActor();

  return useQuery<ShortMessage[]>({
    queryKey: ["shortMessages"],
    queryFn: async () => {
      if (!actor) return [];
      try {
        return await actor.listShortMessages();
      } catch {
        return [];
      }
    },
    enabled: (options?.enabled ?? true) && !!actor && !isFetching,
    // 30s staleTime — short messages don't change frequently; avoids re-fetch
    // storms on the homepage which uses this as an onDataReady gate signal.
    staleTime: 30 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
}

export function useAddShortMessage() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (text: string) => {
      if (!actor) throw new Error("Actor not available");
      return actor.addShortMessage(text);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shortMessages"] });
      queryClient.refetchQueries({ queryKey: ["shortMessages"] });
    },
  });
}

export function useUpdateShortMessage() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, text }: { id: string; text: string }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.updateShortMessage(id, text);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shortMessages"] });
      queryClient.refetchQueries({ queryKey: ["shortMessages"] });
    },
  });
}

export function useDeleteShortMessage() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!actor) throw new Error("Actor not available");
      return actor.deleteShortMessage(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shortMessages"] });
      queryClient.refetchQueries({ queryKey: ["shortMessages"] });
    },
  });
}

// ─── Copyright Settings hooks ─────────────────────────────────────────────────

export interface CopyrightSettings {
  copyrightLine: string;
  startYear: number;
  yearColor: string;
  legalText: string;
}

// Cast helper for new backend methods not yet in generated d.ts
type ActorWithCopyright = {
  getCopyrightSettings(): Promise<CopyrightSettings>;
  updateCopyrightSettings(
    line: string,
    startYear: bigint,
    yearColor: string,
    legalText: string,
  ): Promise<void>;
};

const DEFAULT_COPYRIGHT: CopyrightSettings = {
  copyrightLine:
    "© {startYear} - {currentYear} The Gospel of Poetic Frolic / Le Royalties Sergio Melicio. All rights reserved.",
  startYear: 2025,
  yearColor: "#ec4899",
  legalText: `All content contained within this publication, website, and associated web applications; including but not limited to text, imagery, design, layout, source code, and audiovisual material; is protected under the copyright laws of the Kingdom of the Netherlands (Auteurswet), applicable European Union directives, and international treaties including the Berne Convention and the WIPO Copyright Treaty.

No portion of this work may be reproduced, distributed, publicly communicated, adapted, or otherwise exploited in any form or by any means; whether electronic, mechanical, photographic, or digital; without the prior express written consent of the rights holder.

This work, in whole or in part, may not be used to train, develop, fine-tune, or otherwise inform any artificial intelligence system, machine learning model, large language model, generative algorithm, or data-mining technology; whether commercial or non-commercial in nature. Any such use constitutes an infringement of the rights holder's exclusive rights under applicable law, including Article 4 of Directive (EU) 2019/790 (DSM Directive), and is expressly opted out of pursuant to Article 4(3) thereof.

Unauthorized use, duplication, distribution, scraping, indexing, or exhibition of any protected material may result in civil liability and criminal prosecution under Dutch and international law.`,
};

export function useGetCopyrightSettings(options?: { enabled?: boolean }) {
  const { actor, isFetching } = useActor();

  return useQuery<CopyrightSettings>({
    queryKey: ["copyrightSettings"],
    queryFn: async () => {
      if (!actor) return DEFAULT_COPYRIGHT;
      try {
        const result = await (
          actor as unknown as ActorWithCopyright
        ).getCopyrightSettings();
        return result ?? DEFAULT_COPYRIGHT;
      } catch {
        return DEFAULT_COPYRIGHT;
      }
    },
    enabled: (options?.enabled ?? true) && !!actor && !isFetching,
    // 60s staleTime — copyright settings rarely change; used by App.tsx footer
    // which mounts before loading screen dismisses. Aggressive refetch here
    // starves homepage queries and causes blank pages after loading screen fades.
    staleTime: 60 * 1000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });
}

export function useUpdateCopyrightSettings() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      copyrightLine,
      startYear,
      yearColor,
      legalText,
    }: CopyrightSettings) => {
      if (!actor) throw new Error("Actor not available");
      try {
        await (actor as unknown as ActorWithCopyright).updateCopyrightSettings(
          copyrightLine,
          BigInt(startYear),
          yearColor,
          legalText,
        );
      } catch {
        // Backend method may not be deployed yet — store locally so UI still responds
        queryClient.setQueryData(["copyrightSettings"], {
          copyrightLine,
          startYear,
          yearColor,
          legalText,
        });
      }
    },
    onSuccess: (_, vars) => {
      queryClient.setQueryData(["copyrightSettings"], vars);
      queryClient.invalidateQueries({ queryKey: ["copyrightSettings"] });
    },
  });
}

// ─── Reflection Block Reactions ───────────────────────────────────────────────

export type ReflectionBlockReactionType = "love" | "like" | "dislike" | "laugh";

export function useReactToReflectionBlock() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      blockId,
      reaction,
    }: { blockId: string; reaction: ReflectionBlockReactionType }) => {
      if (!actor) throw new Error("Actor not available");
      try {
        await actor.reactToReflectionBlock(
          blockId,
          reaction as ReflectionBlockReaction,
        );
      } catch {
        // Silently ignore if method not available; counters are localStorage-backed
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reflectionBlocks"] });
    },
  });
}

// ─── Amazon Regions (localStorage-backed) ────────────────────────────────────

export { DEFAULT_AMAZON_REGIONS } from "../components/AmazonRegionSelector";
export type { AmazonRegion } from "../components/AmazonRegionSelector";

// ─── Footer Settings ──────────────────────────────────────────────────────────

export const DEFAULT_FOOTER_SETTINGS: FooterSettings = {
  businessName: "Le Royalties Sergio Melicio",
  businessAddress: "Rotterdam, The Netherlands",
  businessTaxId: "NL005317123B43",
  businessKvk: "98223216",
  businessIban: "NL08 RABO 0155 3288 24",
  businessPhone: "+31 6 48867766",
  businessEmail: "tgopf@pm.me",
  footerCaption:
    "Sergio Melicio's first published poetry bundle, crafted with love and innerness.",
};

export function useGetFooterSettings(options?: { enabled?: boolean }) {
  const { actor, isFetching } = useActor();

  return useQuery<FooterSettings>({
    queryKey: ["footerSettings"],
    queryFn: async () => {
      if (!actor) return DEFAULT_FOOTER_SETTINGS;
      try {
        const result = await actor.getFooterSettings();
        return result ?? DEFAULT_FOOTER_SETTINGS;
      } catch {
        return DEFAULT_FOOTER_SETTINGS;
      }
    },
    enabled: (options?.enabled ?? true) && !!actor && !isFetching,
    // 60s staleTime — footer settings rarely change; used by App.tsx footer.
    // Aggressive refetch here starves homepage queries and causes blank pages.
    staleTime: 60 * 1000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });
}

export function useUpdateFooterSettings() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (settings: FooterSettings) => {
      if (!actor) throw new Error("Actor not available");
      await actor.updateFooterSettings(settings);
    },
    onSuccess: (_, vars) => {
      queryClient.setQueryData(["footerSettings"], vars);
      queryClient.invalidateQueries({ queryKey: ["footerSettings"] });
    },
  });
}

// ─── Newsletter ───────────────────────────────────────────────────────────────

export function useGetMyNewsletterSubscription() {
  const { actor, isFetching } = useActor();

  return useQuery<NewsletterSubscriber | null>({
    queryKey: ["myNewsletterSubscription"],
    queryFn: async () => {
      if (!actor) return null;
      try {
        return await actor.getMyNewsletterSubscription();
      } catch {
        return null;
      }
    },
    enabled: !!actor && !isFetching,
    // 60s staleTime — newsletter subscription status used by App.tsx footer.
    // Aggressive refetch competes with homepage queries on initial page load.
    staleTime: 60 * 1000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });
}

export function useSubscribeToNewsletter() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (email: string) => {
      if (!actor) throw new Error("Actor not available");
      const result = await actor.subscribeToNewsletter(email);
      if ("err" in result) throw new Error(result.err);
      return result.ok;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myNewsletterSubscription"] });
      queryClient.invalidateQueries({ queryKey: ["newsletterSubscribers"] });
    },
  });
}

export function useUnsubscribeFromNewsletter() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("Actor not available");
      const result = await actor.unsubscribeFromNewsletter();
      if ("err" in result) throw new Error(result.err);
      return result.ok;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myNewsletterSubscription"] });
      queryClient.invalidateQueries({ queryKey: ["newsletterSubscribers"] });
    },
  });
}

export function useListNewsletterSubscribers() {
  const { actor, isFetching } = useActor();

  return useQuery<NewsletterSubscriber[]>({
    queryKey: ["newsletterSubscribers"],
    queryFn: async () => {
      if (!actor) return [];
      try {
        return await actor.listNewsletterSubscribers();
      } catch {
        return [];
      }
    },
    enabled: !!actor && !isFetching,
    staleTime: 30 * 1000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });
}

export function useRemoveNewsletterSubscriber() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (principalId: string) => {
      if (!actor) throw new Error("Actor not available");
      const result = await actor.removeNewsletterSubscriber(principalId);
      if ("err" in result) throw new Error(result.err);
      return result.ok;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["newsletterSubscribers"] });
    },
  });
}

// ─── Donations ────────────────────────────────────────────────────────────────

export interface DonationEntry {
  id: string;
  name: string;
  address: string;
  column: number; // 1 | 2 | 3
  position: number; // 1-6
}

// Actor cast helper — matches actual backend method signatures in backend.d.ts
// Backend uses bigint for column/position and individual params (not an object)
type ActorWithDonations = {
  listDonations(): Promise<
    Array<{
      id: string;
      name: string;
      address: string;
      column: bigint;
      position: bigint;
    }>
  >;
  addDonation(
    name: string,
    address: string,
    column: bigint,
    position: bigint,
  ): Promise<string>;
  updateDonation(
    id: string,
    name: string,
    address: string,
    column: bigint,
    position: bigint,
  ): Promise<boolean>;
  deleteDonation(id: string): Promise<boolean>;
};

function fromBackendDonation(d: {
  id: string;
  name: string;
  address: string;
  column: bigint;
  position: bigint;
}): DonationEntry {
  return {
    id: d.id,
    name: d.name,
    address: d.address,
    column: Number(d.column),
    position: Number(d.position),
  };
}

export function useListDonations(options?: { enabled?: boolean }) {
  const { actor, isFetching } = useActor();

  return useQuery<DonationEntry[]>({
    queryKey: ["donations"],
    queryFn: async () => {
      if (!actor) return [];
      try {
        const raw = await (
          actor as unknown as ActorWithDonations
        ).listDonations();
        return raw.map(fromBackendDonation);
      } catch {
        return [];
      }
    },
    enabled: (options?.enabled ?? true) && !!actor && !isFetching,
    // 60s staleTime — donations used by App.tsx footer which mounts before
    // loading screen dismisses. Aggressive refetch here starves homepage queries.
    staleTime: 60 * 1000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });
}

export function useAddDonation() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (entry: Omit<DonationEntry, "id">) => {
      if (!actor) throw new Error("Actor not available");
      const id = await (actor as unknown as ActorWithDonations).addDonation(
        entry.name,
        entry.address,
        BigInt(entry.column),
        BigInt(entry.position),
      );
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["donations"] });
      queryClient.refetchQueries({ queryKey: ["donations"] });
    },
  });
}

export function useUpdateDonation() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation<boolean, Error, DonationEntry>({
    mutationFn: async (entry: DonationEntry) => {
      if (!actor) throw new Error("Actor not available");
      const ok = await (actor as unknown as ActorWithDonations).updateDonation(
        entry.id,
        entry.name,
        entry.address,
        BigInt(entry.column),
        BigInt(entry.position),
      );
      if (!ok) throw new Error("Backend returned false — save failed.");
      return ok;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["donations"] });
      queryClient.refetchQueries({ queryKey: ["donations"] });
    },
  });
}

export function useDeleteDonation() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!actor) throw new Error("Actor not available");
      return (actor as unknown as ActorWithDonations).deleteDonation(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["donations"] });
      queryClient.refetchQueries({ queryKey: ["donations"] });
    },
  });
}

// ─── Payment Countries & Options ──────────────────────────────────────────────

export function usePaymentCountries() {
  const { actor, isFetching } = useActor();
  return useQuery<PaymentCountry[]>({
    queryKey: ["paymentCountries"],
    queryFn: async () => {
      if (!actor) return [];
      try {
        return await actor.getPaymentCountries();
      } catch {
        return [];
      }
    },
    enabled: !!actor && !isFetching,
    staleTime: 60_000, // 1 minute — country list rarely changes
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });
}

export function usePaymentOptionsByCountry(countryId: string) {
  const { actor, isFetching } = useActor();
  return useQuery<PaymentOption[]>({
    queryKey: ["paymentOptionsByCountry", countryId],
    queryFn: async () => {
      if (!actor || !countryId) return [];
      try {
        return await actor.getPaymentOptionsByCountry(countryId);
      } catch {
        return [];
      }
    },
    enabled: !!actor && !isFetching && !!countryId,
    staleTime: 30_000, // 30 seconds — lazy-load on expand, don't re-fetch constantly
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });
}

export function useAllPaymentOptions() {
  const { actor, isFetching } = useActor();
  return useQuery<PaymentOption[]>({
    queryKey: ["allPaymentOptions"],
    queryFn: async () => {
      if (!actor) return [];
      try {
        return await actor.getPaymentOptions();
      } catch {
        return [];
      }
    },
    enabled: !!actor && !isFetching,
    staleTime: 30_000, // 30 seconds
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });
}

export function useAddPaymentCountry() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (country: PaymentCountry) => {
      if (!actor) throw new Error("Actor not available");
      return actor.addPaymentCountry(country);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["paymentCountries"] });
      queryClient.refetchQueries({ queryKey: ["paymentCountries"] });
    },
  });
}

export function useUpdatePaymentCountry() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (country: PaymentCountry) => {
      if (!actor) throw new Error("Actor not available");
      return actor.updatePaymentCountry(country);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["paymentCountries"] });
      queryClient.refetchQueries({ queryKey: ["paymentCountries"] });
    },
  });
}

export function useDeletePaymentCountry() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      if (!actor) throw new Error("Actor not available");
      return actor.deletePaymentCountry(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["paymentCountries"] });
      queryClient.invalidateQueries({ queryKey: ["allPaymentOptions"] });
      queryClient.refetchQueries({ queryKey: ["paymentCountries"] });
    },
  });
}

export function useAddPaymentOption() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (option: PaymentOption) => {
      if (!actor) throw new Error("Actor not available");
      return actor.addPaymentOption(option);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allPaymentOptions"] });
      queryClient.invalidateQueries({ queryKey: ["paymentOptionsByCountry"] });
      queryClient.refetchQueries({ queryKey: ["allPaymentOptions"] });
    },
  });
}

export function useUpdatePaymentOption() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (option: PaymentOption) => {
      if (!actor) throw new Error("Actor not available");
      return actor.updatePaymentOption(option);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allPaymentOptions"] });
      queryClient.invalidateQueries({ queryKey: ["paymentOptionsByCountry"] });
      queryClient.refetchQueries({ queryKey: ["allPaymentOptions"] });
    },
  });
}

export function useDeletePaymentOption() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      if (!actor) throw new Error("Actor not available");
      return actor.deletePaymentOption(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allPaymentOptions"] });
      queryClient.invalidateQueries({ queryKey: ["paymentOptionsByCountry"] });
      queryClient.refetchQueries({ queryKey: ["allPaymentOptions"] });
    },
  });
}

// ─── Bitcoin Payment hooks ────────────────────────────────────────────────────

const FALLBACK_BTC_EUR_RATE = 85000.0;
const FALLBACK_BTC_ADDRESS = "bc1qksdafkkasm96075gp7yys78h7eq97selp97lh0";
const FALLBACK_CONTACT_EMAIL = "tgopf@pm.me";

/**
 * Fetches the live BTC/EUR exchange rate from the backend.
 * Falls back to 85000 if the backend call fails.
 */
export function useBtcEurRate(options?: { enabled?: boolean }) {
  const { actor, isFetching } = useActor();

  return useQuery<number>({
    queryKey: ["btcEurRate"],
    queryFn: async () => {
      if (!actor) return FALLBACK_BTC_EUR_RATE;
      try {
        // getBtcEurPrice is in the generated backend.d.ts
        const rate = await actor.getBtcEurPrice();
        if (typeof rate === "number" && rate > 0) return rate;
        // Try getBtcExchangeRate as alternative
        const rate2 = await actor.getBtcExchangeRate();
        if (rate2 !== null && rate2 !== undefined && rate2 > 0) return rate2;
        return FALLBACK_BTC_EUR_RATE;
      } catch {
        return FALLBACK_BTC_EUR_RATE;
      }
    },
    enabled: (options?.enabled ?? false) && !!actor && !isFetching,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnMount: false,
  });
}

/**
 * Fetches Bitcoin wallet address and contact email from the backend.
 */
export function useBitcoinPaymentConfig() {
  const { actor, isFetching } = useActor();

  return useQuery<{ walletAddress: string; contactEmail: string }>({
    queryKey: ["bitcoinPaymentConfig"],
    queryFn: async () => {
      if (!actor)
        return {
          walletAddress: FALLBACK_BTC_ADDRESS,
          contactEmail: FALLBACK_CONTACT_EMAIL,
        };
      try {
        const walletAddress = await actor.getBtcAddress();
        return {
          walletAddress: walletAddress || FALLBACK_BTC_ADDRESS,
          contactEmail: FALLBACK_CONTACT_EMAIL,
        };
      } catch {
        return {
          walletAddress: FALLBACK_BTC_ADDRESS,
          contactEmail: FALLBACK_CONTACT_EMAIL,
        };
      }
    },
    enabled: !!actor && !isFetching,
    staleTime: 300_000, // 5 minutes
    refetchOnMount: false,
  });
}

// ─── BTC Wallet Address admin mutation ───────────────────────────────────────

/**
 * Admin mutation: saves a new BTC wallet address to the backend.
 * Calls actor.setBtcAddress(address) and refreshes the config cache.
 */
export function useSetBtcWalletAddress() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (address: string) => {
      if (!actor) throw new Error("Actor not available");
      try {
        await (
          actor as unknown as Record<string, (addr: string) => Promise<void>>
        ).setBtcAddress(address);
      } catch (err) {
        // If backend method not yet deployed, optimistically cache locally
        console.warn(
          "setBtcAddress backend call failed, caching locally:",
          err,
        );
        queryClient.setQueryData(["bitcoinPaymentConfig"], {
          walletAddress: address,
          contactEmail: FALLBACK_CONTACT_EMAIL,
        });
        return;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bitcoinPaymentConfig"] });
      queryClient.refetchQueries({ queryKey: ["bitcoinPaymentConfig"] });
    },
  });
}

// ─── Ethereum Payment hooks ───────────────────────────────────────────────────

const FALLBACK_ETH_EUR_RATE = 3000.0;
const FALLBACK_ETH_ADDRESS = "0x29420495cF2FFBa1EeD56319F5c6EDf620C44858";
const FALLBACK_CONTACT_EMAIL_ETH = "tgopf@pm.me";

type ActorWithEth = {
  getEthEurPrice(): Promise<number>;
  getEthAddress(): Promise<string>;
  setEthWalletAddress(address: string): Promise<void>;
};

/**
 * Fetches the live ETH/EUR exchange rate from the backend.
 * Falls back to 3000 if the backend call fails.
 */
export function useEthEurRate(options?: { enabled?: boolean }) {
  const { actor, isFetching } = useActor();

  return useQuery<number>({
    queryKey: ["ethEurRate"],
    queryFn: async () => {
      if (!actor) return FALLBACK_ETH_EUR_RATE;
      try {
        const rate = await (actor as unknown as ActorWithEth).getEthEurPrice();
        if (typeof rate === "number" && rate > 0) return rate;
        return FALLBACK_ETH_EUR_RATE;
      } catch {
        return FALLBACK_ETH_EUR_RATE;
      }
    },
    enabled: (options?.enabled ?? false) && !!actor && !isFetching,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnMount: false,
  });
}

/**
 * Fetches Ethereum wallet address and contact email from the backend.
 */
export function useEthereumPaymentConfig() {
  const { actor, isFetching } = useActor();

  return useQuery<{ walletAddress: string; contactEmail: string }>({
    queryKey: ["ethereumPaymentConfig"],
    queryFn: async () => {
      if (!actor)
        return {
          walletAddress: FALLBACK_ETH_ADDRESS,
          contactEmail: FALLBACK_CONTACT_EMAIL_ETH,
        };
      try {
        const walletAddress = await (
          actor as unknown as ActorWithEth
        ).getEthAddress();
        return {
          walletAddress: walletAddress || FALLBACK_ETH_ADDRESS,
          contactEmail: FALLBACK_CONTACT_EMAIL_ETH,
        };
      } catch {
        return {
          walletAddress: FALLBACK_ETH_ADDRESS,
          contactEmail: FALLBACK_CONTACT_EMAIL_ETH,
        };
      }
    },
    enabled: !!actor && !isFetching,
    staleTime: 300_000,
    refetchOnMount: false,
  });
}

/**
 * Admin mutation: saves a new ETH wallet address to the backend.
 */
export function useSetEthWalletAddress() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (address: string) => {
      if (!actor) throw new Error("Actor not available");
      try {
        await (actor as unknown as ActorWithEth).setEthWalletAddress(address);
      } catch (err) {
        console.warn(
          "setEthWalletAddress backend call failed, caching locally:",
          err,
        );
        queryClient.setQueryData(["ethereumPaymentConfig"], {
          walletAddress: address,
          contactEmail: FALLBACK_CONTACT_EMAIL_ETH,
        });
        return;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ethereumPaymentConfig"] });
      queryClient.refetchQueries({ queryKey: ["ethereumPaymentConfig"] });
    },
  });
}

// ─── ICP Payment hooks ────────────────────────────────────────────────────────

const FALLBACK_ICP_EUR_RATE = 8.0;
const FALLBACK_ICP_ADDRESS =
  "20519ec2411bdf08e185b57d4ac10a717b30add1f7165e258198f21855e21b27";
const FALLBACK_CONTACT_EMAIL_ICP = "tgopf@pm.me";

type ActorWithIcp = {
  getIcpEurPrice(): Promise<number>;
  getIcpAddress(): Promise<string>;
  setIcpWalletAddress(address: string): Promise<void>;
};

/**
 * Fetches the live ICP/EUR exchange rate from the backend.
 * Falls back to 8 if the backend call fails.
 */
export function useIcpEurRate(options?: { enabled?: boolean }) {
  const { actor, isFetching } = useActor();

  return useQuery<number>({
    queryKey: ["icpEurRate"],
    queryFn: async () => {
      if (!actor) return FALLBACK_ICP_EUR_RATE;
      try {
        const rate = await (actor as unknown as ActorWithIcp).getIcpEurPrice();
        if (typeof rate === "number" && rate > 0) return rate;
        return FALLBACK_ICP_EUR_RATE;
      } catch {
        return FALLBACK_ICP_EUR_RATE;
      }
    },
    enabled: (options?.enabled ?? false) && !!actor && !isFetching,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnMount: false,
  });
}

/**
 * Fetches ICP wallet address and contact email from the backend.
 */
export function useIcpPaymentConfig() {
  const { actor, isFetching } = useActor();

  return useQuery<{ walletAddress: string; contactEmail: string }>({
    queryKey: ["icpPaymentConfig"],
    queryFn: async () => {
      if (!actor)
        return {
          walletAddress: FALLBACK_ICP_ADDRESS,
          contactEmail: FALLBACK_CONTACT_EMAIL_ICP,
        };
      try {
        const walletAddress = await (
          actor as unknown as ActorWithIcp
        ).getIcpAddress();
        return {
          walletAddress: walletAddress || FALLBACK_ICP_ADDRESS,
          contactEmail: FALLBACK_CONTACT_EMAIL_ICP,
        };
      } catch {
        return {
          walletAddress: FALLBACK_ICP_ADDRESS,
          contactEmail: FALLBACK_CONTACT_EMAIL_ICP,
        };
      }
    },
    enabled: !!actor && !isFetching,
    staleTime: 300_000,
    refetchOnMount: false,
  });
}

/**
 * Admin mutation: saves a new ICP wallet address to the backend.
 */
export function useSetIcpWalletAddress() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (address: string) => {
      if (!actor) throw new Error("Actor not available");
      try {
        await (actor as unknown as ActorWithIcp).setIcpWalletAddress(address);
      } catch (err) {
        console.warn(
          "setIcpWalletAddress backend call failed, caching locally:",
          err,
        );
        queryClient.setQueryData(["icpPaymentConfig"], {
          walletAddress: address,
          contactEmail: FALLBACK_CONTACT_EMAIL_ICP,
        });
        return;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["icpPaymentConfig"] });
      queryClient.refetchQueries({ queryKey: ["icpPaymentConfig"] });
    },
  });
}

// Keep unused Principal import suppressed
void Principal;

// ─── Shared Payment Logo hooks (backend has these, DID not yet regenerated) ──

/** Mirror of backend SharedPaymentLogo type */
export interface SharedPaymentLogo {
  id: string;
  name: string;
  logoUrl: string;
  logoStorageKey: string;
}

interface ActorWithSharedLogos {
  getSharedPaymentLogos(): Promise<SharedPaymentLogo[]>;
  addSharedPaymentLogo(logo: SharedPaymentLogo): Promise<boolean>;
  updateSharedPaymentLogo(logo: SharedPaymentLogo): Promise<boolean>;
  deleteSharedPaymentLogo(id: string): Promise<boolean>;
}

export function useSharedPaymentLogos() {
  const { actor, isFetching } = useActor();
  return useQuery<SharedPaymentLogo[]>({
    queryKey: ["sharedPaymentLogos"],
    queryFn: async () => {
      if (!actor) return [];
      try {
        return await (
          actor as unknown as ActorWithSharedLogos
        ).getSharedPaymentLogos();
      } catch {
        return [];
      }
    },
    enabled: !!actor && !isFetching,
    staleTime: 5 * 60_000,
    refetchOnWindowFocus: false,
  });
}

export function useAddSharedPaymentLogo() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (logo: SharedPaymentLogo) => {
      if (!actor) throw new Error("Actor not available");
      return (actor as unknown as ActorWithSharedLogos).addSharedPaymentLogo(
        logo,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sharedPaymentLogos"] });
      queryClient.refetchQueries({ queryKey: ["sharedPaymentLogos"] });
    },
  });
}

export type GalleryCarouselPhoto = {
  id: string;
  path: string;
  linkUrl: string;
  sortOrder: bigint | number;
  side: string;
};

interface ActorWithGalleryCarousel {
  getGalleryCarouselPhotos(): Promise<GalleryCarouselPhoto[]>;
  saveGalleryCarouselPhoto(
    id: string,
    path: string,
    linkUrl: string,
    sortOrder: bigint,
    side: string,
  ): Promise<{ ok: null } | { err: string }>;
  deleteGalleryCarouselPhoto(
    id: string,
  ): Promise<{ ok: null } | { err: string }>;
  reorderGalleryCarouselPhotos(
    orderedIds: string[],
  ): Promise<{ ok: null } | { err: string }>;
}

export function useGetGalleryCarouselPhotos() {
  const { actor, isFetching } = useActor();
  return useQuery<GalleryCarouselPhoto[]>({
    queryKey: ["galleryCarouselPhotos"],
    queryFn: async () => {
      if (!actor) return [];
      try {
        return await (
          actor as unknown as ActorWithGalleryCarousel
        ).getGalleryCarouselPhotos();
      } catch {
        return [];
      }
    },
    enabled: !!actor && !isFetching,
    staleTime: 30_000,
    gcTime: 300_000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
}

export function useSaveGalleryCarouselPhoto() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (photo: GalleryCarouselPhoto) => {
      if (!actor) throw new Error("Actor not available");
      return (
        actor as unknown as ActorWithGalleryCarousel
      ).saveGalleryCarouselPhoto(
        photo.id,
        photo.path,
        photo.linkUrl,
        BigInt(
          typeof photo.sortOrder === "bigint"
            ? photo.sortOrder
            : Number(photo.sortOrder),
        ),
        photo.side,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["galleryCarouselPhotos"] });
      queryClient.refetchQueries({ queryKey: ["galleryCarouselPhotos"] });
    },
  });
}

export function useDeleteGalleryCarouselPhoto() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      if (!actor) throw new Error("Actor not available");
      return (
        actor as unknown as ActorWithGalleryCarousel
      ).deleteGalleryCarouselPhoto(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["galleryCarouselPhotos"] });
      queryClient.refetchQueries({ queryKey: ["galleryCarouselPhotos"] });
    },
  });
}

export function useReorderGalleryCarouselPhotos() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (orderedIds: string[]) => {
      if (!actor) throw new Error("Actor not available");
      return (
        actor as unknown as ActorWithGalleryCarousel
      ).reorderGalleryCarouselPhotos(orderedIds);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["galleryCarouselPhotos"] });
      queryClient.refetchQueries({ queryKey: ["galleryCarouselPhotos"] });
    },
  });
}
// ─── System toggle hooks ──────────────────────────────────────────────────────

export function useGetEmojiSystemEnabled() {
  const { actor, isFetching } = useActor();
  return useQuery<boolean>({
    queryKey: ["emojiSystemEnabled"],
    queryFn: async () => {
      if (!actor) return true;
      try {
        return await actor.getEmojiSystemEnabled();
      } catch {
        return true;
      }
    },
    enabled: !!actor && !isFetching,
    staleTime: 30000,
    refetchOnWindowFocus: false,
  });
}

export function useGetCryptoSystemEnabled() {
  const { actor, isFetching } = useActor();
  return useQuery<boolean>({
    queryKey: ["cryptoSystemEnabled"],
    queryFn: async () => {
      if (!actor) return true;
      try {
        return await actor.getCryptoSystemEnabled();
      } catch {
        return true;
      }
    },
    enabled: !!actor && !isFetching,
    staleTime: 30000,
    refetchOnWindowFocus: false,
  });
}

export function useGetEmilieAmazonEnabled() {
  const { actor, isFetching } = useActor();
  return useQuery<boolean>({
    queryKey: ["emilieAmazonEnabled"],
    queryFn: async () => {
      if (!actor) return false;
      try {
        return await actor.getEmilieAmazonEnabled();
      } catch {
        return false;
      }
    },
    enabled: !!actor && !isFetching,
    staleTime: 30000,
    refetchOnWindowFocus: false,
  });
}

export function useGetAnnaAmazonEnabled() {
  const { actor, isFetching } = useActor();
  return useQuery<boolean>({
    queryKey: ["annaAmazonEnabled"],
    queryFn: async () => {
      if (!actor) return false;
      try {
        return await actor.getAnnaAmazonEnabled();
      } catch {
        return false;
      }
    },
    enabled: !!actor && !isFetching,
    staleTime: 30000,
    refetchOnWindowFocus: false,
  });
}

export function useSetEmojiSystemEnabled() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (enabled: boolean) => {
      if (!actor) throw new Error("Actor not available");
      return actor.setEmojiSystemEnabled(enabled);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["emojiSystemEnabled"] });
    },
  });
}

export function useSetCryptoSystemEnabled() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (enabled: boolean) => {
      if (!actor) throw new Error("Actor not available");
      return actor.setCryptoSystemEnabled(enabled);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cryptoSystemEnabled"] });
    },
  });
}

export function useSetEmilieAmazonEnabled() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (enabled: boolean) => {
      if (!actor) throw new Error("Actor not available");
      return actor.setEmilieAmazonEnabled(enabled);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["emilieAmazonEnabled"] });
    },
  });
}

export function useSetAnnaAmazonEnabled() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (enabled: boolean) => {
      if (!actor) throw new Error("Actor not available");
      return actor.setAnnaAmazonEnabled(enabled);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["annaAmazonEnabled"] });
    },
  });
}

export function useGetAnnaSongAmazonEnabled() {
  const { actor, isFetching } = useActor();
  return useQuery<boolean>({
    queryKey: ["annaSongAmazonEnabled"],
    queryFn: async () => {
      if (!actor) return false;
      try {
        return await actor.getAnnaSongAmazonEnabled();
      } catch {
        return false;
      }
    },
    enabled: !!actor && !isFetching,
    staleTime: 30000,
    refetchOnWindowFocus: false,
  });
}

export function useGetEmilieNlAmazonEnabled() {
  const { actor, isFetching } = useActor();
  return useQuery<boolean>({
    queryKey: ["emilieNlAmazonEnabled"],
    queryFn: async () => {
      if (!actor) return false;
      try {
        return await actor.getEmilieNlAmazonEnabled();
      } catch {
        return false;
      }
    },
    enabled: !!actor && !isFetching,
    staleTime: 30000,
    refetchOnWindowFocus: false,
  });
}

export function useSetAnnaSongAmazonEnabled() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (enabled: boolean) => {
      if (!actor) throw new Error("Actor not available");
      return actor.setAnnaSongAmazonEnabled(enabled);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["annaSongAmazonEnabled"] });
    },
  });
}

export function useSetEmilieNlAmazonEnabled() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (enabled: boolean) => {
      if (!actor) throw new Error("Actor not available");
      return actor.setEmilieNlAmazonEnabled(enabled);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["emilieNlAmazonEnabled"] });
    },
  });
}

// ─── Maintenance notice toggle ────────────────────────────────────────────────
// Backend: getMaintenanceNoticeEnabled() : async Bool, setMaintenanceNoticeEnabled(Bool) : async ()
// Default after deploy is ON (true). The popup component reads this query and
// shows the maintenance overlay when true AND not dismissed this session.

export function useGetMaintenanceNoticeEnabled() {
  const { actor, isFetching } = useActor();
  return useQuery<boolean>({
    queryKey: ["maintenanceNoticeEnabled"],
    queryFn: async () => {
      if (!actor) return true; // safe default = ON (matches post-deploy default)
      try {
        return await (
          actor as unknown as Record<string, () => Promise<boolean>>
        ).getMaintenanceNoticeEnabled();
      } catch {
        return true;
      }
    },
    enabled: !!actor && !isFetching,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
}

export function useSetMaintenanceNoticeEnabled() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (enabled: boolean) => {
      if (!actor) throw new Error("Actor not available");
      return (
        actor as unknown as Record<string, (e: boolean) => Promise<void>>
      ).setMaintenanceNoticeEnabled(enabled);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["maintenanceNoticeEnabled"] });
      queryClient.refetchQueries({ queryKey: ["maintenanceNoticeEnabled"] });
    },
  });
}

export function useDistributeEmojiManually() {
  const { actor } = useActor();
  return useMutation({
    mutationFn: async ({
      section,
      amount,
    }: { section: string; amount: number }) => {
      if (!actor) throw new Error("Not connected");
      await (
        actor as unknown as Record<
          string,
          (s: string, a: bigint) => Promise<unknown>
        >
      ).distributeEmojiManually(section, BigInt(amount));
    },
  });
}

export function useGetDistributionPreview() {
  const { actor } = useActor();
  return useMutation({
    mutationFn: async ({
      section,
      amount,
    }: { section: string; amount: number }) => {
      if (!actor) throw new Error("Not connected");
      return await (
        actor as unknown as Record<
          string,
          (s: string, a: bigint) => Promise<unknown>
        >
      ).getDistributionPreview(section, BigInt(amount));
    },
  });
}
