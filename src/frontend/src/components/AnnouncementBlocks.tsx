import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { useActor } from "../hooks/useActor";

interface Announcement {
  id: bigint;
  title: string;
  message: string;
  url?: string | null;
  createdAt: bigint;
}

const DEFAULT_INTERVAL = 8;

const EMPTY_MSG = "No new announcements to share at this moment.";

/**
 * Renders 3 (desktop) or 2 (mobile) frosted-glass announcement blocks
 * overlaid on top of the Books section floating-symbols background.
 * Blocks cycle staggered through announcements every N seconds.
 * Desktop-only on screens ≥1024px; on mobile 2 blocks are shown.
 */
export default function AnnouncementBlocks() {
  const { actor, isFetching } = useActor();

  const { data: announcements = [] } = useQuery<Announcement[]>({
    queryKey: ["announcements"],
    queryFn: async () => {
      if (!actor) return [];
      try {
        return await actor.getAnnouncements();
      } catch {
        return [];
      }
    },
    enabled: !!actor && !isFetching,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });

  const { data: intervalRaw } = useQuery<bigint>({
    queryKey: ["announcementRotationInterval"],
    queryFn: async () => {
      if (!actor) return BigInt(DEFAULT_INTERVAL);
      try {
        return await actor.getAnnouncementRotationInterval();
      } catch {
        return BigInt(DEFAULT_INTERVAL);
      }
    },
    enabled: !!actor && !isFetching,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });

  const intervalSec = intervalRaw ? Number(intervalRaw) : DEFAULT_INTERVAL;

  // Block count: 1 on mobile (<1024), 3 on desktop
  const [blockCount, setBlockCount] = useState(() =>
    window.innerWidth >= 1024 ? 3 : 1,
  );
  useEffect(() => {
    const onResize = () => setBlockCount(window.innerWidth >= 1024 ? 3 : 1);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Each block tracks its own current announcement index independently
  const [blockIndexes, setBlockIndexes] = useState<number[]>([0, 1, 2]);
  const [fadeOutBlocks, setFadeOutBlocks] = useState<boolean[]>([
    false,
    false,
    false,
  ]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const staggerTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  // Clear all pending stagger timers
  const clearStaggerTimers = () => {
    staggerTimersRef.current.forEach((t) => clearTimeout(t));
    staggerTimersRef.current = [];
  };

  useEffect(() => {
    if (announcements.length <= 1) return;

    timerRef.current = setInterval(() => {
      // Stagger: block 0 fades first, then 1 (+1.5s), then 2 (+3s)
      clearStaggerTimers();
      const stagger = 1500; // ms between blocks

      for (let b = 0; b < blockCount; b++) {
        const delay = b * stagger;
        const t = setTimeout(() => {
          setFadeOutBlocks((prev) => {
            const next = [...prev];
            next[b] = true;
            return next;
          });
          // After fade-out, advance this block's own index and fade back in
          const t2 = setTimeout(() => {
            setBlockIndexes((prev) => {
              const next = [...prev];
              next[b] = (next[b] + 1) % Math.max(announcements.length, 1);
              return next;
            });
            setFadeOutBlocks((prev) => {
              const next = [...prev];
              next[b] = false;
              return next;
            });
          }, 500);
          staggerTimersRef.current.push(t2);
        }, delay);
        staggerTimersRef.current.push(t);
      }
    }, intervalSec * 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      clearStaggerTimers();
    };
  }, [announcements.length, intervalSec, blockCount]);

  const len = announcements.length;
  const isEmpty = len === 0;

  return (
    <div
      className="absolute inset-0 flex items-center justify-center pointer-events-none"
      style={{ zIndex: 5 }}
      aria-live="polite"
      data-ocid="announcement-blocks"
    >
      <div className="flex flex-row gap-4 px-4 pointer-events-auto">
        {Array.from({ length: blockCount }).map((_, b) => {
          const annIdx = isEmpty ? 0 : blockIndexes[b] % len;
          const ann = isEmpty ? null : announcements[annIdx];
          const annUrl = ann?.url ?? null;

          const isFading = fadeOutBlocks[b] ?? false;

          return (
            <div
              key={b}
              className="flex-1 min-w-0"
              style={
                blockCount === 1
                  ? {
                      // Mobile (<1024px): single block stretches to use available space
                      width: "min(92vw, 560px)",
                      maxWidth: 560,
                    }
                  : {
                      // Desktop (>=1024px): unchanged
                      width: "clamp(160px, 22vw, 280px)",
                      maxWidth: 280,
                    }
              }
              data-ocid={`announcement.block.${b + 1}`}
            >
              <div
                className="rounded-lg p-4 backdrop-blur-sm text-center"
                style={{
                  background: "rgba(0,0,0,0.38)",
                  opacity: isFading ? 0 : 1,
                  transition: "opacity 0.5s ease",
                }}
              >
                <p
                  className="text-xs tracking-widest font-semibold mb-2 uppercase text-center"
                  style={{
                    color: "#ffffff",
                    fontVariant: "small-caps",
                    letterSpacing: "0.12em",
                  }}
                >
                  ❗❗❗ ANNOUNCEMENT ❗❗❗
                </p>
                {isEmpty ? (
                  <p
                    className="text-sm text-center text-white"
                    data-ocid="announcement.empty_state"
                  >
                    {EMPTY_MSG}
                  </p>
                ) : (
                  <>
                    <p
                      className="text-sm font-semibold text-white mb-1 adobe-jenson leading-snug text-center"
                      style={{ textShadow: "0 1px 4px rgba(0,0,0,0.4)" }}
                    >
                      {ann?.title ?? ""}
                    </p>
                    <p className="text-xs leading-relaxed break-words text-white text-center">
                      {ann?.message ?? ""}
                    </p>
                    {annUrl && (
                      <a
                        href={annUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block mt-3 px-4 py-1.5 text-xs font-semibold text-white rounded-md transition-opacity hover:opacity-80 text-center"
                        style={{
                          background: "rgba(255,255,255,0.15)",
                          border: "1px solid rgba(255,255,255,0.3)",
                        }}
                        data-ocid={`announcement.link_button.${b + 1}`}
                      >
                        Learn More
                      </a>
                    )}
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
