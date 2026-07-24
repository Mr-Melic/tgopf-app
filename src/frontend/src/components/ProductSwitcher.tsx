import type React from "react";
import { useEffect, useRef, useState } from "react";
import { useFileList, useFileUrl } from "../blob-storage/FileStorage";
import { useGetProducts } from "../hooks/useQueries";

interface ProductSwitcherProps {
  currentProductId: string;
  onNavigateToProduct: (productId: string) => void;
}

export default function ProductSwitcher({
  currentProductId,
  onNavigateToProduct,
}: ProductSwitcherProps) {
  const { data: products } = useGetProducts();
  const { data: files } = useFileList();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  // Get cover image path for a product
  const getCoverImagePath = (productId: string): string | null => {
    if (!files) return null;

    // For books, get cover images
    const coverImage = files.find(
      (file) =>
        file.path.startsWith(`covers/${productId}_front.`) &&
        (file.path.toLowerCase().endsWith(".jpg") ||
          file.path.toLowerCase().endsWith(".jpeg") ||
          file.path.toLowerCase().endsWith(".png") ||
          file.path.toLowerCase().endsWith(".webp")),
    );

    return coverImage?.path || null;
  };

  // Mouse drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!scrollContainerRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX - scrollContainerRef.current.offsetLeft);
    setScrollLeft(scrollContainerRef.current.scrollLeft);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !scrollContainerRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollContainerRef.current.offsetLeft;
    const walk = (x - startX) * 2;
    scrollContainerRef.current.scrollLeft = scrollLeft - walk;
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  // Touch handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!scrollContainerRef.current) return;
    const touch = e.touches[0];
    setStartX(touch.pageX - scrollContainerRef.current.offsetLeft);
    setScrollLeft(scrollContainerRef.current.scrollLeft);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!scrollContainerRef.current) return;
    const touch = e.touches[0];
    const x = touch.pageX - scrollContainerRef.current.offsetLeft;
    const walk = (x - startX) * 2;
    scrollContainerRef.current.scrollLeft = scrollLeft - walk;
  };

  if (!products || products.length <= 1) {
    return null;
  }

  return (
    <div className="bg-white border-b border-gray-200 shadow-sm sticky top-20 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div
          ref={scrollContainerRef}
          className={`flex items-center space-x-3 overflow-x-auto scrollbar-hide ${isDragging ? "cursor-grabbing" : "cursor-grab"}`}
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
        >
          {products.map((product) => (
            <ProductSwitchButton
              key={product.id}
              product={product}
              isActive={product.id === currentProductId}
              onClick={() => onNavigateToProduct(product.id)}
              coverImagePath={getCoverImagePath(product.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

interface ProductSwitchButtonProps {
  product: any;
  isActive: boolean;
  onClick: () => void;
  coverImagePath: string | null;
}

function ProductSwitchButton({
  product,
  isActive,
  onClick,
  coverImagePath,
}: ProductSwitchButtonProps) {
  const { data: coverImageUrl } = useFileUrl(coverImagePath || "");

  const getProductIcon = (productId: string) => {
    const icons = ["📚", "🌙", "🏙️", "📖", "✨", "🎭", "🌟", "📝", "🎨", "🌸"];
    const iconIndex = Number.parseInt(productId) - 1;
    return icons[iconIndex % icons.length] || "📖";
  };

  return (
    <button
      onClick={onClick}
      className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-300 whitespace-nowrap hover:-translate-y-0.5 shrink-0 ${
        isActive
          ? "bg-black text-white shadow-lg scale-105"
          : "bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-md"
      }`}
    >
      {/* Product Image/Icon */}
      <div className="w-10 h-10 rounded-lg overflow-hidden bg-white/20 flex items-center justify-center shrink-0 shadow-sm">
        {coverImageUrl ? (
          <img
            src={coverImageUrl}
            alt={`${product.title} cover`}
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="text-lg">{getProductIcon(product.id)}</span>
        )}
      </div>

      {/* Product Info */}
      <div className="text-left">
        <div className="product-title font-medium text-sm leading-tight">
          {product.title}
        </div>
        {product.editionType && (
          <div
            className={`product-title text-xs leading-tight ${isActive ? "text-gray-300" : "text-gray-500"}`}
          >
            {product.editionType}
          </div>
        )}
      </div>

      {/* Active Indicator */}
      {isActive && (
        <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
      )}
    </button>
  );
}
