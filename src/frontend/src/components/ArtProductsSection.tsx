import { useQuery } from "@tanstack/react-query";
import React, { useState, useEffect } from "react";
import type { ArtProduct } from "../backend";
import { useFileUrl } from "../blob-storage/FileStorage";
import { useActor } from "../hooks/useActor";
import ImageLightbox from "./ImageLightbox";
import SpiralFlowerBackground from "./SpiralFlowerBackground";

export default function ArtProductsSection() {
  const { actor, isFetching } = useActor();

  const { data: artProducts, isLoading } = useQuery<ArtProduct[]>({
    queryKey: ["artProducts"],
    queryFn: async () => {
      if (!actor) return [];
      const products = await actor.getArtProducts();
      if (products.length === 0) {
        return actor.getDefaultArtProducts();
      }
      return products;
    },
    enabled: !!actor && !isFetching,
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });

  const { data: sectionData } = useQuery<{ description: string }>({
    queryKey: ["artProductsSectionData"],
    queryFn: async () => {
      if (!actor) return { description: "" };
      return actor.getArtProductsSectionData();
    },
    enabled: !!actor && !isFetching,
  });

  const renderDescription = (text: string) => {
    const bookTitle = "The Gospel of Poetic Frolic";

    // Filter out the promotional paragraph about collecting art pieces for €333
    const promotionalText333 =
      "If The Gospel of Poetic Frolic expanded your sense of dimensions, you can support my work by collecting your favourite art piece from the book: an author-signed artwork measuring 19.2 cm × 19.2 cm (20 cm × 20 cm external dimensions), presented in a black wooden frame (4 mm width, 35 mm depth) ready to hang on your wall, for €333.";

    // Filter out the commission paragraph about custom artwork for €950
    const commissionText =
      "If you would rather own something made specifically for you, you can commission a custom artwork in my Sergio Melicio Cube Dimension style (as shown above). Email tgopf@pm.me with your initial idea, your motivation, and what inspired you, whether a poem, theme, scene, or personal story. Custom commissions are €950.";

    let filteredText = text.replace(promotionalText333, "").trim();
    filteredText = filteredText.replace(commissionText, "").trim();

    // Split by double newlines to get paragraphs
    const paragraphs = filteredText.split("\n\n").filter((p) => p.trim());

    return paragraphs.map((paragraph, pIndex) => {
      const parts = paragraph.split(bookTitle);

      return (
        <p
          key={pIndex}
          className="text-base md:text-lg text-gray-800 leading-relaxed font-semibold mb-4 last:mb-0"
        >
          {parts.map((part, index) => (
            <React.Fragment key={index}>
              {part}
              {index < parts.length - 1 && <em>{bookTitle}</em>}
            </React.Fragment>
          ))}
        </p>
      );
    });
  };

  if (isLoading || !artProducts || artProducts.length === 0) {
    return null;
  }

  return (
    <section className="py-16 px-4 bg-gray-50 relative overflow-hidden">
      {/* Spiral Flower Background Animation */}
      <SpiralFlowerBackground />

      <div className="max-w-7xl mx-auto relative z-10">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-8 text-black adobe-jenson">
          Art Products
        </h2>

        {/* Horizontal Scrollable Art Products */}
        <div className="overflow-x-auto pb-4 mb-8">
          <div className="flex gap-6 min-w-max px-4">
            {artProducts.map((product) => (
              <ArtProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>

        {/* Informational Text */}
        {sectionData?.description && (
          <div className="max-w-4xl mx-auto text-center">
            {renderDescription(sectionData.description)}
          </div>
        )}
      </div>
    </section>
  );
}

interface ArtProductCardProps {
  product: ArtProduct;
}

function ArtProductCard({ product }: ArtProductCardProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const shouldFetchImage = !!product.imagePath;
  const { data: imageUrl, isLoading: imageLoading } = useFileUrl(
    shouldFetchImage ? product.imagePath || "" : "",
  );

  const getImageSrc = (): string => {
    if (!product.imagePath) {
      return "";
    }
    if (imageUrl) {
      return imageUrl;
    }
    return "";
  };

  const imageSrc = getImageSrc();
  const showPlaceholder = !imageSrc || imageLoading;

  const handleImageClick = () => {
    if (!showPlaceholder && imageSrc) {
      setLightboxOpen(true);
    }
  };

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

  return (
    <>
      <div className="flex flex-col items-center relative z-20">
        {/* Square Art Product Image */}
        <div
          className={`w-64 h-64 bg-gray-200 rounded-2xl shadow-xl mb-4 overflow-hidden transform hover:scale-105 transition-all duration-300 relative ${!showPlaceholder ? "cursor-pointer" : ""}`}
          onClick={handleImageClick}
          onContextMenu={handleContextMenu}
          onDragStart={handleDragStart}
        >
          {showPlaceholder ? (
            <div className="w-full h-full flex items-center justify-center bg-gray-100">
              <div className="text-6xl text-gray-400 animate-pulse">?</div>
            </div>
          ) : (
            <>
              <img
                src={imageSrc}
                alt={product.title || "Art Product"}
                className="w-full h-full object-cover select-none pointer-events-none"
                loading="lazy"
                draggable="false"
                onContextMenu={handleContextMenu}
                onDragStart={handleDragStart}
              />
              <WatermarkOverlay />
            </>
          )}
        </div>

        {/* Purchase Button */}
        <a
          href={product.purchaseLink}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-black text-white px-8 py-3 rounded-full font-semibold hover:bg-gray-800 transition-all duration-300 shadow-lg hover:shadow-xl text-center"
        >
          Purchase
        </a>
      </div>

      {/* Lightbox */}
      {lightboxOpen && imageSrc && (
        <ImageLightbox
          imageUrl={imageSrc}
          alt={product.title || "Art Product"}
          onClose={() => setLightboxOpen(false)}
          showWatermark={true}
        />
      )}
    </>
  );
}

// Watermark character type
interface WatermarkChar {
  char: string;
  x: number;
  y: number;
  id: number;
}

// Watermark Overlay Component
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
      const numChars = 30; // Number of watermark characters
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
    <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden">
      {characters.map((item) => (
        <div
          key={item.id}
          className="absolute text-white font-bold transition-all duration-2000 ease-in-out"
          style={{
            left: `${item.x}%`,
            top: `${item.y}%`,
            opacity: 0.3,
            fontSize: "1.5rem",
            transform: "translate(-50%, -50%)",
          }}
        >
          {item.char}
        </div>
      ))}
    </div>
  );
}
