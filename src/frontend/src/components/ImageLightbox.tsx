import type React from "react";
import { useEffect, useState } from "react";

interface ImageLightboxProps {
  imageUrl: string;
  alt: string;
  onClose: () => void;
  showWatermark?: boolean;
}

export default function ImageLightbox({
  imageUrl,
  alt,
  onClose,
  showWatermark = false,
}: ImageLightboxProps) {
  // Handle escape key press
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  // Prevent right-click context menu
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    return false;
  };

  // Prevent drag start
  const handleDragStart = (e: React.DragEvent) => {
    e.preventDefault();
    return false;
  };

  // Handle click on image to close
  const handleImageClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClose();
  };

  // Handle click on backdrop to close
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={handleBackdropClick}
      onContextMenu={handleContextMenu}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-50 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
        aria-label="Close lightbox"
      >
        <svg
          className="w-6 h-6 text-white"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>

      {/* Image container with viewport-relative sizing */}
      <div
        className="relative max-w-[90vw] max-h-[90vh] flex items-center justify-center cursor-pointer"
        onClick={handleImageClick}
        onContextMenu={handleContextMenu}
      >
        <img
          src={imageUrl}
          alt={alt}
          className="max-w-full max-h-[90vh] w-auto h-auto object-contain select-none pointer-events-none"
          draggable="false"
          onDragStart={handleDragStart}
          onContextMenu={handleContextMenu}
          loading="eager"
        />
        {/* Watermark overlay for art products */}
        {showWatermark && <WatermarkOverlay />}
        {/* Invisible protective overlay */}
        <div
          className="absolute inset-0 z-10"
          onContextMenu={handleContextMenu}
          onDragStart={handleDragStart}
        />
      </div>
    </div>
  );
}

// Watermark character type
interface WatermarkChar {
  char: string;
  x: number;
  y: number;
  id: number;
}

// Watermark Overlay Component for Lightbox
function WatermarkOverlay() {
  const [characters, setCharacters] = useState<WatermarkChar[]>([]);

  useEffect(() => {
    // Character sets
    const latinChars = [
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
    ];
    const japaneseChars = [
      "あ",
      "い",
      "う",
      "え",
      "お",
      "か",
      "き",
      "く",
      "け",
      "こ",
      "さ",
      "し",
      "す",
      "せ",
      "そ",
      "た",
      "ち",
      "つ",
      "て",
      "と",
      "な",
      "に",
      "ぬ",
      "ね",
      "の",
      "は",
      "ひ",
      "ふ",
      "へ",
      "ほ",
    ];

    // Generate initial characters
    const generateCharacters = (): WatermarkChar[] => {
      const numChars = 50; // More characters for larger lightbox view
      const newChars: WatermarkChar[] = [];

      for (let i = 0; i < numChars; i++) {
        // 70% Latin, 30% Japanese
        const isLatin = Math.random() < 0.7;
        const charSet = isLatin ? latinChars : japaneseChars;
        const char = charSet[Math.floor(Math.random() * charSet.length)];

        newChars.push({
          char,
          x: Math.random() * 100,
          y: Math.random() * 100,
          id: i,
        });
      }

      return newChars;
    };

    setCharacters(generateCharacters());

    // Animate characters - change them periodically
    const interval = setInterval(() => {
      setCharacters((prev) =>
        prev.map((item) => {
          const isLatin = Math.random() < 0.7;
          const charSet = isLatin ? latinChars : japaneseChars;
          const char = charSet[Math.floor(Math.random() * charSet.length)];

          return {
            ...item,
            char,
            x: (item.x + Math.random() * 2 - 1 + 100) % 100,
            y: (item.y + Math.random() * 2 - 1 + 100) % 100,
          };
        }),
      );
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none z-20 overflow-hidden">
      {characters.map((item) => (
        <div
          key={item.id}
          className="absolute text-white font-bold transition-all duration-2000 ease-in-out"
          style={{
            left: `${item.x}%`,
            top: `${item.y}%`,
            opacity: 0.3,
            fontSize: "2rem",
            transform: "translate(-50%, -50%)",
          }}
        >
          {item.char}
        </div>
      ))}
    </div>
  );
}
