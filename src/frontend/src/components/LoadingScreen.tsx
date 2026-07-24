import React, { useEffect, useRef, useState } from "react";

interface LoadingScreenProps {
  onDismiss: () => void;
  shouldDismiss?: boolean;
  progress?: number;
}

interface FloatingCharacter {
  id: number;
  char: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  rotation: number;
  rotationSpeed: number;
}

const CHARACTERS = [
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
  "−",
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
  "`",
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

const COLORS = [
  "#000000",
  "#1a1a1a",
  "#333333",
  "#4a4a4a",
  "#666666",
  "#808080",
  "#999999",
  "#b3b3b3",
  "#cccccc",
  "#e6e6e6",
];

const FADE_OUT_DURATION = 500;

export default function LoadingScreen({
  onDismiss,
  shouldDismiss = false,
  progress = 0,
}: LoadingScreenProps) {
  const [characters, setCharacters] = useState<FloatingCharacter[]>([]);
  const [isVisible, setIsVisible] = useState(true);
  const [isDismissing, setIsDismissing] = useState(false);
  const [countdown, setCountdown] = useState<number>(8);

  // Guard: onDismiss fires exactly once
  const dismissedRef = useRef(false);
  const loadStartRef = useRef<number>(Date.now());
  const prevProgressRef = useRef<number>(0);
  const animIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const triggerDismiss = () => {
    if (dismissedRef.current) return;
    dismissedRef.current = true;
    setIsDismissing(true);
    setIsVisible(false);
    setTimeout(() => onDismiss(), FADE_OUT_DURATION);
  };

  // Simple pseudo-random number generator
  const generateRandom = (seed: number) => {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  };

  // Initialize characters
  useEffect(() => {
    const newCharacters: FloatingCharacter[] = [];
    let seed = Date.now() % 1000000;
    for (let i = 0; i < 6; i++) {
      const rands: number[] = [];
      for (let j = 0; j < 8; j++) {
        seed = (seed * 1103515245 + 12345) % 2 ** 31;
        rands.push(generateRandom(seed));
      }
      newCharacters.push({
        id: i,
        char: CHARACTERS[Math.floor(rands[0] * CHARACTERS.length)],
        x: rands[1] * window.innerWidth,
        y: rands[2] * window.innerHeight,
        vx: (rands[3] - 0.5) * 2,
        vy: (rands[4] - 0.5) * 2,
        color: COLORS[Math.floor(rands[5] * COLORS.length)],
        size: 12 + rands[6] * 24,
        rotation: rands[7] * 360,
        rotationSpeed: (rands[0] - 0.5) * 4,
      });
    }
    setCharacters(newCharacters);
  }, []);

  // Animate characters
  useEffect(() => {
    animIntervalRef.current = setInterval(() => {
      setCharacters((prev) =>
        prev.map((char) => {
          let newX = char.x + char.vx;
          let newY = char.y + char.vy;
          let newVx = char.vx;
          let newVy = char.vy;
          if (newX <= 0 || newX >= window.innerWidth) {
            newVx = -newVx;
            newX = Math.max(0, Math.min(window.innerWidth, newX));
          }
          if (newY <= 0 || newY >= window.innerHeight) {
            newVy = -newVy;
            newY = Math.max(0, Math.min(window.innerHeight, newY));
          }
          return {
            ...char,
            x: newX,
            y: newY,
            vx: newVx,
            vy: newVy,
            rotation: char.rotation + char.rotationSpeed,
          };
        }),
      );
    }, 300);
    return () => {
      if (animIntervalRef.current) {
        clearInterval(animIntervalRef.current);
        animIntervalRef.current = null;
      }
    };
  }, []);

  // Stop animation when dismissing to free CPU
  useEffect(() => {
    if (isDismissing && animIntervalRef.current) {
      clearInterval(animIntervalRef.current);
      animIntervalRef.current = null;
    }
  }, [isDismissing]);

  // Progress-based dynamic countdown — updates every second
  useEffect(() => {
    if (isDismissing) return;

    const interval = setInterval(() => {
      const elapsedMs = Date.now() - loadStartRef.current;
      const elapsedSec = elapsedMs / 1000;
      const currentProgress = progress;

      // Never let progress appear to go backward
      const effectiveProgress = Math.max(
        currentProgress,
        prevProgressRef.current,
      );
      prevProgressRef.current = effectiveProgress;

      if (effectiveProgress >= 100) {
        setCountdown(0);
        return;
      }

      if (effectiveProgress <= 0 || elapsedSec <= 0) {
        // Very early — show a reasonable estimate
        setCountdown(8);
        return;
      }

      // Above 85%: tick down by 1 real second per interval instead of
      // re-estimating, which avoids the "countdown hit 0 but still loading" bug.
      // Hold at 1 if we reach it before dismissal.
      if (effectiveProgress >= 85) {
        setCountdown((prev) => {
          if (prev <= 1) return 1; // hold at 1 until dismissed
          return prev - 1;
        });
        return;
      }

      // Below 85%: estimate remaining time from progress speed
      const estimatedTotalSec = (elapsedSec / effectiveProgress) * 100;
      const remainingSec = estimatedTotalSec - elapsedSec;
      const capped = Math.min(15, Math.max(1, Math.ceil(remainingSec)));
      setCountdown(capped);
    }, 1000);

    return () => clearInterval(interval);
  }, [isDismissing, progress]);

  // Dismiss when shouldDismiss becomes true or progress reaches 100
  useEffect(() => {
    if (!isDismissing && (shouldDismiss || progress >= 100)) {
      triggerDismiss();
    }
  }, [shouldDismiss, progress, isDismissing]); // eslint-disable-line

  // Hard safety fallback: dismiss after 20s no matter what
  useEffect(() => {
    const timer = setTimeout(() => {
      console.warn(
        "[LoadingScreen] Hard safety timeout reached — forcing dismiss",
      );
      triggerDismiss();
    }, 10000);
    return () => clearTimeout(timer);
  }, []); // eslint-disable-line

  // Clamp display progress to never exceed 100
  const displayProgress = Math.min(100, Math.round(progress));

  return (
    <div
      className={`fixed inset-0 z-50 bg-white transition-opacity duration-500 ${
        isVisible ? "opacity-100" : "opacity-0"
      }`}
      style={{ pointerEvents: isVisible ? "auto" : "none" }}
    >
      {/* Floating Characters — fully removed from DOM after fade-out */}
      <div className="absolute inset-0 overflow-hidden">
        {isVisible &&
          characters.map((char) => (
            <div
              key={char.id}
              className="absolute font-mono font-bold select-none pointer-events-none"
              style={{
                left: `${char.x}px`,
                top: `${char.y}px`,
                color: char.color,
                fontSize: `${char.size}px`,
                transform: `rotate(${char.rotation}deg)`,
                transition: "none",
              }}
            >
              {char.char}
            </div>
          ))}
      </div>

      {/* Loading Content */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <div className="relative mb-8">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 border-t-black mx-auto mb-6" />
            <div className="absolute inset-0 rounded-full h-16 w-16 border-4 border-transparent border-r-gray-400 animate-spin animation-delay-150 mx-auto" />
          </div>

          <h1 className="header-title text-4xl md:text-5xl font-bold text-black mb-4">
            The Gospel of Poetic Frolic
          </h1>

          {/* Progress bar + percentage + countdown */}
          <div className="flex flex-col items-center mb-6 w-full px-4">
            <div
              className="w-3/5 rounded-full overflow-hidden"
              style={{ height: "6px", background: "rgba(0,0,0,0.12)" }}
            >
              <div
                className="h-full rounded-full"
                style={{
                  width: `${displayProgress}%`,
                  background: "rgba(0,0,0,0.72)",
                  transition: "width 0.5s ease",
                }}
              />
            </div>
            <div className="flex items-center justify-center gap-3 mt-2">
              <span
                className="text-sm font-mono font-medium tabular-nums"
                style={{ color: "rgba(0,0,0,0.55)" }}
              >
                {displayProgress}%
              </span>
              {!isDismissing && displayProgress < 100 && (
                <span
                  className="text-xs font-mono"
                  style={{ color: "rgba(0,0,0,0.35)" }}
                >
                  ~{countdown}s
                </span>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-center space-x-1">
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
              <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce animation-delay-150" />
              <div className="w-2 h-2 bg-gray-600 rounded-full animate-bounce animation-delay-300" />
            </div>
          </div>
        </div>
      </div>

      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/90 via-transparent to-gray-50/30 pointer-events-none" />
    </div>
  );
}
