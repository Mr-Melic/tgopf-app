import React, { useState, useEffect } from "react";
import { useFileList, useFileUrl } from "../blob-storage/FileStorage";

interface ImageGalleryProps {
  className?: string;
}

export default function ImageGallery({ className = "" }: ImageGalleryProps) {
  const { data: files } = useFileList();
  const [currentIndex, setCurrentIndex] = useState(0);

  // Filter for gallery images
  const galleryImages =
    files?.filter(
      (file) =>
        file.path.startsWith("gallery/") &&
        (file.path.toLowerCase().endsWith(".jpg") ||
          file.path.toLowerCase().endsWith(".jpeg") ||
          file.path.toLowerCase().endsWith(".png") ||
          file.path.toLowerCase().endsWith(".webp")),
    ) || [];

  // Auto-advance slideshow every 5 seconds
  useEffect(() => {
    if (galleryImages.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % galleryImages.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [galleryImages.length]);

  // Show animated placeholder when no images
  if (galleryImages.length === 0) {
    return (
      <div className={`w-full h-full bg-black ${className}`}>
        <GalleryAnimatedPlaceholder />
      </div>
    );
  }

  // Calculate buffer range (current + previous + next)
  const getVisibleIndices = () => {
    const indices = new Set<number>();
    indices.add(currentIndex);
    indices.add(
      (currentIndex - 1 + galleryImages.length) % galleryImages.length,
    );
    indices.add((currentIndex + 1) % galleryImages.length);
    return indices;
  };

  const visibleIndices = getVisibleIndices();

  return (
    <div className={`relative w-full h-full bg-black ${className}`}>
      {/* Main Image Display */}
      <div className="relative w-full h-full overflow-hidden">
        {galleryImages.map((image, index) => {
          // Only render visible slides
          if (!visibleIndices.has(index)) return null;

          return (
            <GallerySlide
              key={image.path}
              imagePath={image.path}
              isActive={index === currentIndex}
              isPriority={index === 0 || index === 1}
            />
          );
        })}
      </div>
    </div>
  );
}

interface GallerySlideProps {
  imagePath: string;
  isActive: boolean;
  isPriority?: boolean;
}

function GallerySlide({
  imagePath,
  isActive,
  isPriority = false,
}: GallerySlideProps) {
  const { data: imageUrl, isLoading } = useFileUrl(imagePath);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [showPlaceholder, setShowPlaceholder] = useState(true);

  // Reset loaded state when image URL changes
  useEffect(() => {
    if (imageUrl) {
      setImageLoaded(false);
      setShowPlaceholder(true);
    }
  }, [imageUrl]);

  const handleImageLoad = () => {
    setImageLoaded(true);
    // Keep placeholder visible briefly for smooth transition
    setTimeout(() => {
      setShowPlaceholder(false);
    }, 300);
  };

  return (
    <div
      className={`absolute inset-0 transition-opacity duration-700 ${
        isActive ? "opacity-100" : "opacity-0"
      }`}
    >
      {/* Animated Placeholder - identical to progress bar animation */}
      {showPlaceholder && (
        <div
          className={`absolute inset-0 transition-opacity duration-500 ${
            imageLoaded ? "opacity-0" : "opacity-100"
          }`}
        >
          <GalleryAnimatedPlaceholder />
        </div>
      )}

      {/* Actual Image */}
      {imageUrl && (
        <img
          src={imageUrl}
          alt="Gallery image"
          className={`w-full h-full object-cover transition-opacity duration-500 ${
            imageLoaded ? "opacity-100" : "opacity-0"
          }`}
          loading={isPriority ? "eager" : "lazy"}
          fetchPriority={isPriority ? "high" : "auto"}
          onLoad={handleImageLoad}
        />
      )}
    </div>
  );
}

// Animated placeholder component identical to progress bar animation
function GalleryAnimatedPlaceholder() {
  const [characters, setCharacters] = useState<
    Array<{
      char: string;
      x: number;
      y: number;
      duration: number;
      delay: number;
      color: string;
    }>
  >([]);

  useEffect(() => {
    // Generate random characters for the placeholder animation
    // Using same character set as progress bar for consistency
    const chars =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}|;:,.<>?あいうえおかきくけこさしすせそたちつてとなにぬねのはひふへほまみむめもやゆよらりるれろわをん一二三四五六七八九十百千万億兆京垓秭穰溝澗正載極恒河沙阿僧祇那由他不可思議無量大数";
    const colors = ["#ffffff", "#e0e0e0", "#c0c0c0", "#a0a0a0", "#808080"];

    // Generate more characters for larger gallery area
    const newCharacters = Array.from({ length: 60 }, () => ({
      char: chars[Math.floor(Math.random() * chars.length)],
      x: Math.random() * 100,
      y: Math.random() * 100,
      duration: 3 + Math.random() * 4,
      delay: Math.random() * 2,
      color: colors[Math.floor(Math.random() * colors.length)],
    }));

    setCharacters(newCharacters);
  }, []);

  return (
    <div className="w-full h-full bg-black relative overflow-hidden">
      {characters.map((item, index) => (
        <div
          key={index}
          className="absolute animate-float-progress"
          style={{
            left: `${item.x}%`,
            top: `${item.y}%`,
            animationDuration: `${item.duration}s`,
            animationDelay: `${item.delay}s`,
            color: item.color,
            fontSize: `${0.8 + Math.random() * 0.8}rem`,
            fontWeight: Math.random() > 0.5 ? "bold" : "normal",
            transform: "translateY(-50%)",
          }}
        >
          {item.char}
        </div>
      ))}
    </div>
  );
}
