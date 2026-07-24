import { useEffect, useRef } from "react";
import { useViewportBreakpoint } from "../hooks/useViewportBreakpoint";

interface BackgroundQuoteLayerProps {
  quotes: string[];
  intervalMs?: number;
  sectionId: string;
  onQuotePositionChange?: (pos: { x: number; y: number } | null) => void;
}

const FONT_SIZES = ["1.1rem", "1.2rem", "1.35rem", "1.5rem", "1.6rem"];

/**
 * Renders randomly positioned, slowly rotating quote text in the background
 * of its containing section. Desktop only — returns null below 1024px.
 * Uses refs + recursive setTimeout to avoid stale closures.
 */
export function BackgroundQuoteLayer({
  quotes,
  intervalMs = 8000,
  sectionId,
  onQuotePositionChange,
}: BackgroundQuoteLayerProps) {
  const isMobile = useViewportBreakpoint(1024);

  // All rotation state in refs — no useState to avoid stale closures
  const containerRef = useRef<HTMLDivElement | null>(null);
  const shuffledRef = useRef<string[]>([]);
  const currentIndexRef = useRef(0);
  const timeoutIdRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const xRef = useRef(40);
  const yRef = useRef(40);
  const fontSizeRef = useRef(FONT_SIZES[0]);
  const phaseRef = useRef<"idle" | "showing" | "hiding">("idle");
  const mountedRef = useRef(false);

  // Stable element ref for direct DOM manipulation — no re-renders
  const quoteElRef = useRef<HTMLParagraphElement | null>(null);

  // Early return for mobile/tablet — hooks still called above
  if (isMobile) return null;
  if (!quotes || quotes.length === 0) return null;

  return (
    <_BackgroundQuoteLayerInner
      quotes={quotes}
      intervalMs={intervalMs}
      sectionId={sectionId}
      isMobile={isMobile}
      containerRef={containerRef}
      shuffledRef={shuffledRef}
      currentIndexRef={currentIndexRef}
      timeoutIdRef={timeoutIdRef}
      xRef={xRef}
      yRef={yRef}
      fontSizeRef={fontSizeRef}
      phaseRef={phaseRef}
      mountedRef={mountedRef}
      quoteElRef={quoteElRef}
      onQuotePositionChange={onQuotePositionChange}
    />
  );
}

// Inner component that only renders on desktop — all hooks are safe here
interface InnerProps extends BackgroundQuoteLayerProps {
  isMobile: boolean;
  containerRef: React.RefObject<HTMLDivElement | null>;
  shuffledRef: React.MutableRefObject<string[]>;
  currentIndexRef: React.MutableRefObject<number>;
  timeoutIdRef: React.MutableRefObject<ReturnType<typeof setTimeout> | null>;
  xRef: React.MutableRefObject<number>;
  yRef: React.MutableRefObject<number>;
  fontSizeRef: React.MutableRefObject<string>;
  phaseRef: React.MutableRefObject<"idle" | "showing" | "hiding">;
  mountedRef: React.MutableRefObject<boolean>;
  quoteElRef: React.MutableRefObject<HTMLParagraphElement | null>;
  onQuotePositionChange?: (pos: { x: number; y: number } | null) => void;
}

function _BackgroundQuoteLayerInner({
  quotes,
  intervalMs = 8000,
  containerRef,
  shuffledRef,
  currentIndexRef,
  timeoutIdRef,
  xRef,
  yRef,
  fontSizeRef,
  phaseRef,
  mountedRef,
  quoteElRef,
  onQuotePositionChange,
}: InnerProps) {
  // Keep callback ref so showNext can call it without capturing stale closure
  const onChangRef = useRef(onQuotePositionChange);
  onChangRef.current = onQuotePositionChange;
  useEffect(() => {
    mountedRef.current = true;

    // Fisher-Yates shuffle on mount
    const arr = [...quotes];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    shuffledRef.current = arr;
    currentIndexRef.current = 0;

    // Start first cycle with a small initial delay so page load isn't impacted
    timeoutIdRef.current = setTimeout(() => {
      if (mountedRef.current) showNext();
    }, 1500);

    return () => {
      mountedRef.current = false;
      if (timeoutIdRef.current !== null) {
        clearTimeout(timeoutIdRef.current);
        timeoutIdRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quotes]);

  function showNext() {
    if (!mountedRef.current || !quoteElRef.current || !containerRef.current)
      return;

    const arr = shuffledRef.current;
    if (arr.length === 0) return;

    const idx = currentIndexRef.current % arr.length;
    const text = arr[idx];

    // Random position and size — stored in refs
    xRef.current = 10 + Math.random() * 70; // 10%–80%
    yRef.current = 10 + Math.random() * 70; // 10%–80%
    fontSizeRef.current =
      FONT_SIZES[Math.floor(Math.random() * FONT_SIZES.length)];

    const el = quoteElRef.current;
    // Update content and position directly on DOM element — no React re-render
    el.textContent = text;
    el.style.left = `${xRef.current}%`;
    el.style.top = `${yRef.current}%`;
    el.style.fontSize = fontSizeRef.current;
    el.style.opacity = "0";
    el.style.transition = "opacity 400ms ease";

    // Phase: fade in — small delay ensures CSS transition triggers
    phaseRef.current = "showing";
    setTimeout(() => {
      if (!mountedRef.current) return;
      el.style.opacity = "0.10";
      // Notify parent of the active quote position (percent coords)
      onChangRef.current?.({ x: xRef.current, y: yRef.current });
    }, 50);

    // After intervalMs, fade out
    timeoutIdRef.current = setTimeout(() => {
      if (!mountedRef.current || !quoteElRef.current) return;
      phaseRef.current = "hiding";
      quoteElRef.current.style.opacity = "0";
      // Notify parent that quote is gone
      onChangRef.current?.(null);

      // After fade-out (400ms gap), advance index and show next
      timeoutIdRef.current = setTimeout(() => {
        if (!mountedRef.current) return;
        currentIndexRef.current = (idx + 1) % arr.length;
        // Reshuffle when we've gone through all quotes
        if (currentIndexRef.current === 0) {
          const reshuffle = [...shuffledRef.current];
          for (let i = reshuffle.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [reshuffle[i], reshuffle[j]] = [reshuffle[j], reshuffle[i]];
          }
          shuffledRef.current = reshuffle;
        }
        showNext();
      }, 400);
    }, intervalMs);
  }

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      style={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        zIndex: 0,
        pointerEvents: "none",
      }}
    >
      <p
        ref={quoteElRef}
        style={{
          position: "absolute",
          left: "40%",
          top: "40%",
          maxWidth: "280px",
          textAlign: "center",
          fontFamily: "'Adobe Jenson Pro', 'Times New Roman', serif",
          fontSize: "1.2rem",
          fontStyle: "italic",
          color: "var(--foreground)",
          opacity: 0,
          pointerEvents: "none",
          userSelect: "none",
          zIndex: 0,
          lineHeight: 1.5,
          transition: "opacity 400ms ease",
          margin: 0,
          padding: 0,
        }}
      />
    </div>
  );
}
