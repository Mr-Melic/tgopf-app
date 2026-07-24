import React from "react";
import { useCart } from "../hooks/useCart";

interface CartButtonProps {
  onNavigateToCart: () => void;
}

export default function CartButton({ onNavigateToCart }: CartButtonProps) {
  const { items, getTotalItems } = useCart();
  const totalItems = getTotalItems();

  return (
    <button
      onClick={onNavigateToCart}
      className="relative p-2 text-gray-600 hover:text-black transition-colors rounded-full hover:bg-gray-100"
    >
      <svg
        className="w-6 h-6"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M16 11V7a4 4 0 00-8 0v4M5 9h14l-1 7a2 2 0 01-2 2H8a2 2 0 01-2-2L5 9z"
        />
      </svg>
      {totalItems > 0 && (
        <span className="absolute -top-1 -right-1 bg-black text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
          {totalItems > 99 ? "99+" : totalItems}
        </span>
      )}
    </button>
  );
}
