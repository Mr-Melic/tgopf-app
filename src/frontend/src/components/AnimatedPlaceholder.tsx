import React, { useState, useEffect } from "react";

interface FloatingQuestionMark {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  rotation: number;
  rotationSpeed: number;
}

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

interface AnimatedPlaceholderProps {
  className?: string;
  width?: number;
  height?: number;
}

export default function AnimatedPlaceholder({
  className = "",
  width = 200,
  height = 200,
}: AnimatedPlaceholderProps) {
  const [questionMarks, setQuestionMarks] = useState<FloatingQuestionMark[]>(
    [],
  );

  // Simple pseudo-random number generator using Internet Computer-like randomness
  const generateRandom = (seed: number) => {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  };

  // Initialize question marks with IC-like randomness
  useEffect(() => {
    const initQuestionMarks = () => {
      const newQuestionMarks: FloatingQuestionMark[] = [];
      const numQuestionMarks = 8; // Fewer question marks for cleaner look

      // Use current timestamp as initial seed (simulating IC randomness)
      let seed = Date.now() % 1000000;

      for (let i = 0; i < numQuestionMarks; i++) {
        seed = (seed * 1103515245 + 12345) % 2 ** 31;
        const random1 = generateRandom(seed);

        seed = (seed * 1103515245 + 12345) % 2 ** 31;
        const random2 = generateRandom(seed);

        seed = (seed * 1103515245 + 12345) % 2 ** 31;
        const random3 = generateRandom(seed);

        seed = (seed * 1103515245 + 12345) % 2 ** 31;
        const random4 = generateRandom(seed);

        seed = (seed * 1103515245 + 12345) % 2 ** 31;
        const random5 = generateRandom(seed);

        seed = (seed * 1103515245 + 12345) % 2 ** 31;
        const random6 = generateRandom(seed);

        seed = (seed * 1103515245 + 12345) % 2 ** 31;
        const random7 = generateRandom(seed);

        seed = (seed * 1103515245 + 12345) % 2 ** 31;
        const random8 = generateRandom(seed);

        newQuestionMarks.push({
          id: i,
          x: random1 * width,
          y: random2 * height,
          vx: (random3 - 0.5) * 0.8, // Slower movement
          vy: (random4 - 0.5) * 0.8, // Slower movement
          color: COLORS[Math.floor(random5 * COLORS.length)],
          size: 16 + random6 * 12, // Question mark sizes
          rotation: random7 * 360,
          rotationSpeed: (random8 - 0.5) * 1.2, // Slower rotation
        });
      }

      setQuestionMarks(newQuestionMarks);
    };

    initQuestionMarks();
  }, [width, height]);

  // Animate question marks
  useEffect(() => {
    const animateQuestionMarks = () => {
      setQuestionMarks((prevQuestionMarks) =>
        prevQuestionMarks.map((qm) => {
          let newX = qm.x + qm.vx;
          let newY = qm.y + qm.vy;
          let newVx = qm.vx;
          let newVy = qm.vy;

          // Bounce off edges
          if (newX <= 0 || newX >= width) {
            newVx = -newVx;
            newX = Math.max(0, Math.min(width, newX));
          }
          if (newY <= 0 || newY >= height) {
            newVy = -newVy;
            newY = Math.max(0, Math.min(height, newY));
          }

          return {
            ...qm,
            x: newX,
            y: newY,
            vx: newVx,
            vy: newVy,
            rotation: qm.rotation + qm.rotationSpeed,
          };
        }),
      );
    };

    const interval = setInterval(animateQuestionMarks, 100); // Slightly slower animation
    return () => clearInterval(interval);
  }, [width, height]);

  return (
    <div
      className={`relative bg-gray-100 overflow-hidden ${className}`}
      style={{ width, height }}
    >
      {/* Floating Question Marks */}
      <div className="absolute inset-0">
        {questionMarks.map((qm) => (
          <div
            key={qm.id}
            className="absolute font-bold select-none pointer-events-none"
            style={{
              left: `${qm.x}px`,
              top: `${qm.y}px`,
              color: qm.color,
              fontSize: `${qm.size}px`,
              transform: `rotate(${qm.rotation}deg)`,
              transition: "none",
              opacity: 0.6,
            }}
          >
            ?
          </div>
        ))}
      </div>

      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-50/30 via-transparent to-gray-200/20 pointer-events-none" />
    </div>
  );
}
