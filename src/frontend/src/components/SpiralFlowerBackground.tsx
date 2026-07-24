import React, { useState, useEffect } from "react";

// Spiral Flower Pattern Type
interface SpiralFlower {
  id: number;
  x: number;
  y: number;
  size: number;
  rotation: number;
  startTime: number;
  duration: number;
  color: string;
}

// Spiral Character Type
interface SpiralCharacter {
  x: number;
  y: number;
  char: string;
  rotation: number;
  index: number;
}

// Soft, visually compatible color palette
const softColors = [
  "#8B7355", // Soft brown
  "#6B8E23", // Olive green
  "#708090", // Slate gray
  "#8B4789", // Muted purple
  "#5F9EA0", // Cadet blue
  "#BC8F8F", // Rosy brown
  "#778899", // Light slate gray
  "#9370DB", // Medium purple
  "#8FBC8F", // Dark sea green
  "#B0C4DE", // Light steel blue
  "#DDA0DD", // Plum
  "#87CEEB", // Sky blue
  "#D2B48C", // Tan
  "#9999CC", // Periwinkle
  "#A0522D", // Sienna
];

// Spiral Flower Background Animation Component
export default function SpiralFlowerBackground() {
  const [flowers, setFlowers] = useState<SpiralFlower[]>([]);
  const cycleDuration = 30000; // 30 seconds

  // Japanese character sets (kana and kanji)
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
    "ま",
    "み",
    "む",
    "め",
    "も",
    "や",
    "ゆ",
    "よ",
    "ら",
    "り",
    "る",
    "れ",
    "ろ",
    "わ",
    "を",
    "ん",
    "花",
    "桜",
    "月",
    "星",
    "空",
    "雲",
    "風",
    "水",
    "火",
    "土",
    "光",
    "影",
    "夢",
    "心",
    "愛",
    "詩",
    "歌",
    "音",
    "色",
    "形",
  ];

  // Check if a new position overlaps with existing flowers
  const hasOverlap = (
    x: number,
    y: number,
    existingFlowers: SpiralFlower[],
    minDistance = 15,
  ): boolean => {
    return existingFlowers.some((flower) => {
      const dx = flower.x - x;
      const dy = flower.y - y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      return distance < minDistance;
    });
  };

  // Generate a non-overlapping position
  const generatePosition = (
    existingFlowers: SpiralFlower[],
  ): { x: number; y: number } => {
    let attempts = 0;
    const maxAttempts = 50;

    while (attempts < maxAttempts) {
      const x = 10 + Math.random() * 80; // Keep away from edges
      const y = 10 + Math.random() * 80;

      if (!hasOverlap(x, y, existingFlowers)) {
        return { x, y };
      }
      attempts++;
    }

    // Fallback: return random position if no non-overlapping position found
    return {
      x: 10 + Math.random() * 80,
      y: 10 + Math.random() * 80,
    };
  };

  useEffect(() => {
    // Generate initial flower with random color
    const generateFlower = (
      id: number,
      startTime: number,
      existingFlowers: SpiralFlower[],
    ): SpiralFlower => {
      const position = generatePosition(existingFlowers);
      const randomColor =
        softColors[Math.floor(Math.random() * softColors.length)];

      return {
        id,
        x: position.x,
        y: position.y,
        size: 80 + Math.random() * 120, // Size varies between 80-200px
        rotation: Math.random() * 360,
        startTime,
        duration: 8000 + Math.random() * 4000, // Duration varies 8-12 seconds
        color: randomColor,
      };
    };

    // Initialize with 8-12 flowers at different start times for denser effect
    const numFlowers = 8 + Math.floor(Math.random() * 5);
    const initialFlowers: SpiralFlower[] = [];
    for (let i = 0; i < numFlowers; i++) {
      const flower = generateFlower(
        i,
        Date.now() - Math.random() * cycleDuration,
        initialFlowers,
      );
      initialFlowers.push(flower);
    }
    setFlowers(initialFlowers);

    // Continuously spawn new flowers
    let flowerId = numFlowers;
    const spawnInterval = setInterval(() => {
      setFlowers((prev) => {
        // Remove flowers that have completed their lifecycle
        const now = Date.now();
        const activeFlowers = prev.filter(
          (flower) => now - flower.startTime < flower.duration,
        );

        // Add new flower if we have space (increased max to 12 for denser effect)
        if (activeFlowers.length < 12) {
          const newFlower = generateFlower(flowerId++, now, activeFlowers);
          return [...activeFlowers, newFlower];
        }
        return activeFlowers;
      });
    }, 2500); // Spawn more frequently (every 2.5 seconds)

    return () => clearInterval(spawnInterval);
  }, []);

  return (
    <div
      className="absolute inset-0 pointer-events-none overflow-hidden"
      style={{ zIndex: 1 }}
    >
      {flowers.map((flower) => (
        <SpiralFlowerPattern
          key={flower.id}
          flower={flower}
          characters={japaneseChars}
        />
      ))}
    </div>
  );
}

// Individual Spiral Flower Pattern Component
interface SpiralFlowerPatternProps {
  flower: SpiralFlower;
  characters: string[];
}

function SpiralFlowerPattern({ flower, characters }: SpiralFlowerPatternProps) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const animate = () => {
      const now = Date.now();
      const elapsed = now - flower.startTime;
      const newProgress = Math.min(elapsed / flower.duration, 1);
      setProgress(newProgress);

      if (newProgress < 1) {
        requestAnimationFrame(animate);
      }
    };

    const animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [flower.startTime, flower.duration]);

  // Calculate opacity based on progress (fade in, stay, fade out)
  const getOpacity = () => {
    if (progress < 0.2) {
      // Fade in
      return progress / 0.2;
    }
    if (progress > 0.8) {
      // Fade out
      return (1 - progress) / 0.2;
    }
    return 1;
  };

  // Calculate scale based on progress (bloom effect)
  const getScale = () => {
    if (progress < 0.3) {
      // Expand from small to full size
      return 0.2 + (progress / 0.3) * 0.8;
    }
    return 1;
  };

  // Generate spiral positions for characters
  const numCharacters = 20 + Math.floor(progress * 30); // More characters as it blooms
  const spiralCharacters: SpiralCharacter[] = [];

  for (let i = 0; i < numCharacters; i++) {
    const angle = (i / numCharacters) * Math.PI * 6; // 3 full rotations
    const radius = (i / numCharacters) * flower.size * progress;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    const char = characters[i % characters.length];
    const charRotation = angle * (180 / Math.PI) + flower.rotation;

    spiralCharacters.push({ x, y, char, rotation: charRotation, index: i });
  }

  const opacity = getOpacity();
  const scale = getScale();

  return (
    <div
      className="absolute"
      style={{
        left: `${flower.x}%`,
        top: `${flower.y}%`,
        transform: `translate(-50%, -50%) scale(${scale}) rotate(${flower.rotation * progress}deg)`,
        opacity: opacity * 0.15, // Subtle opacity for background effect
        transition: "transform 0.3s ease-out",
      }}
    >
      {spiralCharacters.map((item, idx) => (
        <div
          key={idx}
          className="absolute font-medium"
          style={{
            left: "50%",
            top: "50%",
            transform: `translate(-50%, -50%) translate(${item.x}px, ${item.y}px) rotate(${item.rotation}deg)`,
            fontSize: `${0.8 + Math.random() * 0.4}rem`,
            opacity: 0.6 + Math.random() * 0.4,
            color: flower.color,
          }}
        >
          {item.char}
        </div>
      ))}
    </div>
  );
}
