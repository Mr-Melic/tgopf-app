import { useEffect, useRef, useState } from "react";

const SYMBOLS = [
  "A",
  "B",
  "C",
  "D",
  "E",
  "F",
  "G",
  "H",
  "I",
  "J",
  "K",
  "L",
  "M",
  "N",
  "O",
  "P",
  "Q",
  "R",
  "S",
  "T",
  "U",
  "V",
  "W",
  "X",
  "Y",
  "Z",
  "a",
  "b",
  "c",
  "d",
  "e",
  "f",
  "g",
  "h",
  "i",
  "j",
  "k",
  "l",
  "m",
  "n",
  "o",
  "p",
  "q",
  "r",
  "s",
  "t",
  "u",
  "v",
  "w",
  "x",
  "y",
  "z",
  "0",
  "1",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "!",
  "@",
  "#",
  "$",
  "%",
  "^",
  "&",
  "*",
  "(",
  ")",
  "-",
  "+",
  "=",
  "[",
  "]",
  "{",
  "}",
  "|",
  "\\",
  ":",
  ";",
  '"',
  "'",
  "<",
  ">",
  ",",
  ".",
  "?",
  "/",
  "~",
  "📚",
  "📖",
  "✍️",
  "🖋️",
  "📝",
  "🎭",
  "🌟",
  "✨",
  "🌙",
  "🏙️",
  "🎨",
  "🌸",
  "🍃",
  "🌿",
  "💫",
  "⭐",
  "🌺",
  "🦋",
  "🕊️",
  "🎪",
];

const MONO_COLORS = [
  "#000000",
  "#222222",
  "#333333",
  "#444444",
  "#555555",
  "#666666",
  "#777777",
  "#888888",
  "#999999",
];

const SYMBOL_COUNT = 32;
const NORMAL_OPACITY = 0.07;
const FADE_RADIUS = 18; // percent of container
const UPDATE_MS = 200;

interface SymbolState {
  id: number;
  char: string;
  // Current position (percent)
  x: number;
  y: number;
  // Sine/cosine drift params — no bounce, just smooth wave
  baseX: number;
  baseY: number;
  ampX: number;
  ampY: number;
  phaseX: number;
  phaseY: number;
  freqX: number;
  freqY: number;
  // Rotation
  rotation: number;
  rotationSpeed: number; // deg per tick
  color: string;
  size: number; // px
  hidden: boolean;
}

export interface QuotePosition {
  x: number;
  y: number;
}

interface FloatingSymbolsLayerProps {
  activeQuotePosition: QuotePosition | null;
}

function buildSymbol(id: number): SymbolState {
  // Keep base anchors in 10%–90% so wave doesn't push off-screen
  const baseX = 10 + Math.random() * 80;
  const baseY = 10 + Math.random() * 80;
  return {
    id,
    char: SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
    x: baseX,
    y: baseY,
    baseX,
    baseY,
    // Amplitude: 3–7% so drift is gentle
    ampX: 3 + Math.random() * 4,
    ampY: 3 + Math.random() * 4,
    phaseX: Math.random() * Math.PI * 2,
    phaseY: Math.random() * Math.PI * 2,
    // Very slow frequency — full cycle in ~30–60s
    freqX: 0.0003 + Math.random() * 0.0003,
    freqY: 0.0003 + Math.random() * 0.0003,
    rotation: Math.random() * 360,
    rotationSpeed: (Math.random() - 0.5) * 0.4, // ±0.4 deg/tick
    color: MONO_COLORS[Math.floor(Math.random() * MONO_COLORS.length)],
    size: 12 + Math.floor(Math.random() * 17), // 12–28px
    hidden: false,
  };
}

function buildSymbols(): SymbolState[] {
  return Array.from({ length: SYMBOL_COUNT }, (_, id) => buildSymbol(id));
}

/**
 * Renders 32 gently drifting symbols in the background of a section.
 * Desktop only — returns null below 1024px.
 * Quote-aware: symbols near an active quote are truly REMOVED from the DOM
 * (not just hidden) so their animation loops fully stop and burn zero CPU.
 * When the quote leaves, new symbols spawn to replace the removed ones.
 */
export function FloatingSymbolsLayer({
  activeQuotePosition,
}: FloatingSymbolsLayerProps) {
  if (typeof window !== "undefined" && window.innerWidth < 1024) return null;

  return (
    <_FloatingSymbolsLayerInner activeQuotePosition={activeQuotePosition} />
  );
}

// ─── Container — single master loop updates ALL symbols. ───────────────────
function _FloatingSymbolsLayerInner({
  activeQuotePosition,
}: FloatingSymbolsLayerProps) {
  const tickRef = useRef(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mountedRef = useRef(true);
  const activeQuotePosRef = useRef<QuotePosition | null>(activeQuotePosition);
  const nextIdRef = useRef(SYMBOL_COUNT);

  // State array — only symbols in this array get rendered
  const [activeSymbols, setActiveSymbols] = useState<SymbolState[]>(() =>
    Array.from({ length: SYMBOL_COUNT }, (_, id) => buildSymbol(id)),
  );
  const activeSymbolsRef = useRef<SymbolState[]>(activeSymbols);

  // Keep quote position ref current
  activeQuotePosRef.current = activeQuotePosition;

  useEffect(() => {
    mountedRef.current = true;

    intervalRef.current = setInterval(() => {
      if (!mountedRef.current) return;
      tickRef.current += UPDATE_MS;
      const quotePos = activeQuotePosRef.current;
      const symbols = activeSymbolsRef.current;

      let changed = false;
      const surviving: SymbolState[] = [];
      const spawned: SymbolState[] = [];

      for (const sym of symbols) {
        // Update position
        const nextX = Math.min(
          95,
          Math.max(
            5,
            sym.baseX +
              sym.ampX * Math.sin(sym.freqX * tickRef.current + sym.phaseX),
          ),
        );
        const nextY = Math.min(
          95,
          Math.max(
            5,
            sym.baseY +
              sym.ampY * Math.cos(sym.freqY * tickRef.current + sym.phaseY),
          ),
        );
        const nextRotation = sym.rotation + sym.rotationSpeed;

        // Check if this symbol should be removed (near quote)
        if (quotePos !== null) {
          const dx = nextX - quotePos.x;
          const dy = nextY - quotePos.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < FADE_RADIUS) {
            // Truly remove — don't push to surviving, spawn a replacement
            changed = true;
            spawned.push(buildSymbol(nextIdRef.current++));
            continue;
          }
        }

        surviving.push({ ...sym, x: nextX, y: nextY, rotation: nextRotation });
      }

      // Keep total count stable: append any spawned replacements
      const next = [...surviving, ...spawned];

      if (changed || next.some((s, i) => s !== symbols[i])) {
        activeSymbolsRef.current = next;
        if (mountedRef.current) {
          setActiveSymbols(next);
        }
      }
    }, UPDATE_MS);

    return () => {
      mountedRef.current = false;
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, []);

  return (
    <div
      aria-hidden="true"
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        overflow: "hidden",
        pointerEvents: "none",
        zIndex: 0,
      }}
    >
      {activeSymbols.map((sym) => (
        <span
          key={sym.id}
          aria-hidden="true"
          style={{
            position: "absolute",
            left: `${sym.x}%`,
            top: `${sym.y}%`,
            fontSize: `${sym.size}px`,
            color: sym.color,
            opacity: NORMAL_OPACITY,
            pointerEvents: "none",
            userSelect: "none",
            zIndex: 0,
            fontWeight: 700,
            fontFamily: "'Courier New',Courier,monospace",
            transform: `rotate(${sym.rotation}deg)`,
            willChange: "transform",
            whiteSpace: "nowrap",
          }}
        >
          {sym.char}
        </span>
      ))}
    </div>
  );
}
