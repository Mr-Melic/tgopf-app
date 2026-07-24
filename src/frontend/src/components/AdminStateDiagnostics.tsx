import { useQuery } from "@tanstack/react-query";
import type { Announcement, HomepageTextBlocks, Review } from "../backend";
import { useFileList } from "../blob-storage/FileStorage";
import { useActor } from "../hooks/useActor";
import {
  useAllPaymentOptions,
  useGetGalleryCarouselPhotos,
  useGetHomepageTextBlocks,
  useGetHomepageTextBlocksAnnaEn,
  useGetHomepageTextBlocksAnnaNl,
  useGetHomepageTextBlocksEmilieEn,
  useGetHomepageTextBlocksEmilieNl,
  useGetProducts,
  useGetReviews,
  useSharedPaymentLogos,
} from "../hooks/useQueries";

// ─── Inline announcements query ──────────────────────────────────────────────
// No shared hook exists for getAnnouncements, so we call the actor directly via
// an inline useQuery. Read-only: no mutations, no writes.

function useGetAnnouncements() {
  const { actor, isFetching } = useActor();
  return useQuery<Announcement[]>({
    queryKey: ["announcements"],
    queryFn: async () => {
      if (!actor) return [];
      try {
        return await actor.getAnnouncements();
      } catch (err) {
        console.error("useGetAnnouncements error:", err);
        return [];
      }
    },
    enabled: !!actor && !isFetching,
    staleTime: 30 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
}

// ─── Small presentational helpers ─────────────────────────────────────────────

interface SectionProps {
  title: string;
  ocid: string;
  isLoading?: boolean;
  error?: unknown;
  children: React.ReactNode;
}

function Section({ title, ocid, isLoading, error, children }: SectionProps) {
  return (
    <div
      className="rounded-xl border border-gray-200 bg-white p-4"
      data-ocid={ocid}
    >
      <h3 className="text-xs font-semibold text-gray-900 uppercase tracking-wide mb-3">
        {title}
      </h3>
      {isLoading ? (
        <p
          className="text-xs text-gray-500"
          data-ocid={`${ocid}.loading_state`}
        >
          Loading…
        </p>
      ) : error ? (
        <p
          className="text-xs text-red-600 font-medium"
          data-ocid={`${ocid}.error_state`}
        >
          Error: {(error as Error)?.message ?? "failed to load"}
        </p>
      ) : (
        children
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4 py-1">
      <span className="text-xs text-gray-500">{label}</span>
      <span className="text-xs text-gray-900 font-medium text-right">
        {value}
      </span>
    </div>
  );
}

// ─── Section components (each renders independently) ───────────────────────────

function ReviewsSection() {
  const { data, isLoading, isError, error } = useGetReviews();
  const reviews = (data as Review[] | undefined) ?? [];
  const total = reviews.length;
  const first3 = reviews.slice(0, 3);

  // Flag: list is exactly the 2 'Anonymous' / 'Default Book Title' placeholders.
  const isDefaultPlaceholder =
    total === 2 &&
    reviews.every(
      (r) =>
        r.reviewerName === "Anonymous" && r.bookTitle === "Default Book Title",
    );

  return (
    <Section
      title="Reviews (getReviews)"
      ocid="state-diagnostics.reviews"
      isLoading={isLoading}
      error={isError ? error : undefined}
    >
      <Row label="Total count" value={total} />
      {first3.length > 0 && (
        <div className="mt-2 space-y-1">
          <p className="text-xs text-gray-500 mb-1">First 3 entries:</p>
          {first3.map((r, i) => (
            <div
              key={i}
              className="text-xs text-gray-900"
              data-ocid={`state-diagnostics.reviews.item.${i + 1}`}
            >
              <span className="font-medium">{r.reviewerName}</span>
              {" — "}
              <span>{r.bookTitle}</span>
            </div>
          ))}
        </div>
      )}
      {isDefaultPlaceholder && (
        <p
          className="mt-2 text-xs text-amber-600 font-medium"
          data-ocid="state-diagnostics.reviews.default-flag"
        >
          ⚠ List is exactly the 2 default placeholder reviews (Anonymous /
          Default Book Title)
        </p>
      )}
    </Section>
  );
}

function TextBlocksSection({
  title,
  ocid,
  useHook,
}: {
  title: string;
  ocid: string;
  useHook: () => {
    data?: HomepageTextBlocks;
    isLoading: boolean;
    isError: boolean;
    error?: unknown;
  };
}) {
  const { data, isLoading, isError, error } = useHook();
  const blocks = data
    ? ([data.block1, data.block2, data.block3] as const)
    : null;

  return (
    <Section
      title={title}
      ocid={ocid}
      isLoading={isLoading}
      error={isError ? error : undefined}
    >
      {blocks ? (
        <div className="space-y-2">
          {blocks.map((b, i) => (
            <div
              key={i}
              data-ocid={`${ocid}.block.${i + 1}`}
              className="border-t border-gray-100 first:border-0 pt-2 first:pt-0"
            >
              <Row
                label={`Block ${i + 1} — title length`}
                value={`${(b.title ?? "").length} chars`}
              />
              <Row
                label={`Block ${i + 1} — content length`}
                value={`${(b.content ?? "").length} chars`}
              />
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-gray-500">No data</p>
      )}
    </Section>
  );
}

function LegacyHomepageTextSection() {
  const { data, isLoading, isError, error } = useGetHomepageTextBlocks();
  const blocks = data
    ? ([data.block1, data.block2, data.block3] as const)
    : null;

  return (
    <Section
      title="Legacy Homepage Text (getHomepageTextBlocks)"
      ocid="state-diagnostics.legacy-homepage-text"
      isLoading={isLoading}
      error={isError ? error : undefined}
    >
      {blocks ? (
        <div className="space-y-2">
          {blocks.map((b, i) => {
            const content = b.content ?? "";
            const preview = content.slice(0, 60);
            return (
              <div
                key={i}
                data-ocid={`state-diagnostics.legacy-homepage-text.block.${i + 1}`}
                className="border-t border-gray-100 first:border-0 pt-2 first:pt-0"
              >
                <Row
                  label={`block${i + 1} content length`}
                  value={`${content.length} chars`}
                />
                <div className="text-xs text-gray-700 mt-1">
                  <span className="text-gray-500">First 60 chars: </span>
                  <span className="font-mono">{preview}</span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-xs text-gray-500">No data</p>
      )}
    </Section>
  );
}

function FileListSection() {
  const { data, isLoading, isError, error } = useFileList();
  const files = (data ?? []) as { path: string }[];
  const total = files.length;

  return (
    <Section
      title="Registered Files (listFileReferences)"
      ocid="state-diagnostics.file-list"
      isLoading={isLoading}
      error={isError ? error : undefined}
    >
      <Row label="Total registered file paths" value={total} />
    </Section>
  );
}

function CountSection({
  title,
  ocid,
  useHook,
  itemLabel,
}: {
  title: string;
  ocid: string;
  useHook: () => {
    data?: unknown[];
    isLoading: boolean;
    isError: boolean;
    error?: unknown;
  };
  itemLabel: string;
}) {
  const { data, isLoading, isError, error } = useHook();
  const count = (data ?? []).length;

  return (
    <Section
      title={title}
      ocid={ocid}
      isLoading={isLoading}
      error={isError ? error : undefined}
    >
      <Row label={itemLabel} value={count} />
    </Section>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function AdminStateDiagnostics() {
  return (
    <div className="space-y-4">
      <p className="text-xs text-gray-500 mb-4 leading-relaxed">
        Read-only diagnostics of current backend state. Each section queries
        existing public endpoints independently — a failure in one does not
        affect the others. No data is written.
      </p>

      <ReviewsSection />

      <TextBlocksSection
        title="Emilie Homepage Text — English (getHomepageTextBlocksEmilieEn)"
        ocid="state-diagnostics.emilie-en"
        useHook={useGetHomepageTextBlocksEmilieEn}
      />
      <TextBlocksSection
        title="Emilie Homepage Text — Dutch (getHomepageTextBlocksEmilieNl)"
        ocid="state-diagnostics.emilie-nl"
        useHook={useGetHomepageTextBlocksEmilieNl}
      />
      <TextBlocksSection
        title="Anna Homepage Text — English (getHomepageTextBlocksAnnaEn)"
        ocid="state-diagnostics.anna-en"
        useHook={useGetHomepageTextBlocksAnnaEn}
      />
      <TextBlocksSection
        title="Anna Homepage Text — Dutch (getHomepageTextBlocksAnnaNl)"
        ocid="state-diagnostics.anna-nl"
        useHook={useGetHomepageTextBlocksAnnaNl}
      />

      <LegacyHomepageTextSection />

      <FileListSection />

      <CountSection
        title="Announcements (getAnnouncements)"
        ocid="state-diagnostics.announcements"
        useHook={useGetAnnouncements}
        itemLabel="Total announcements"
      />
      <CountSection
        title="Products (getProducts)"
        ocid="state-diagnostics.products"
        useHook={useGetProducts}
        itemLabel="Total products"
      />
      <CountSection
        title="Gallery Carousel (getGalleryCarouselPhotos)"
        ocid="state-diagnostics.gallery-carousel"
        useHook={useGetGalleryCarouselPhotos}
        itemLabel="Total carousel photos"
      />
      <CountSection
        title="Payment Options (getPaymentOptions)"
        ocid="state-diagnostics.payment-options"
        useHook={useAllPaymentOptions}
        itemLabel="Total payment options"
      />
      <CountSection
        title="Shared Payment Logos (getSharedPaymentLogos)"
        ocid="state-diagnostics.shared-payment-logos"
        useHook={useSharedPaymentLogos}
        itemLabel="Total shared payment logos"
      />
    </div>
  );
}
