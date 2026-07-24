import React, { useEffect } from "react";
import { useCart } from "../hooks/useCart";

interface CartPageProps {
  onNavigateHome: () => void;
}

export default function CartPage({ onNavigateHome }: CartPageProps) {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const { items, updateQuantity, removeItem, getTotalPrice } = useCart();

  if (items.length === 0) {
    return (
      <div className="min-h-screen py-8 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            Shopping Cart
          </h1>
          <div className="bg-white rounded-2xl p-8 text-center">
            <p className="text-gray-600 mb-6">Your cart is empty</p>
            <button
              onClick={onNavigateHome}
              className="bg-black text-white px-6 py-3 rounded-xl font-semibold hover:bg-gray-800 transition-all duration-300"
            >
              Continue Shopping
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Shopping Cart</h1>

        <div className="bg-white rounded-2xl p-6 mb-6">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between py-4 border-b border-gray-200 last:border-b-0"
            >
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">{item.title}</h3>
                <p className="text-sm text-gray-600">
                  {item.type === "book" ? "Book" : "Artistic Print"}
                </p>
                {item.size && (
                  <p className="text-sm text-gray-500">Size: {item.size}</p>
                )}
                <p className="text-sm text-gray-500 mt-1">Incl. 9% Tax</p>
              </div>

              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() =>
                      updateQuantity(item.id, Math.max(1, item.quantity - 1))
                    }
                    className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center"
                  >
                    -
                  </button>
                  <span className="w-8 text-center">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center"
                  >
                    +
                  </button>
                </div>

                <div className="w-24 text-right font-semibold">
                  €{((item.price * item.quantity) / 100).toFixed(2)}
                </div>

                <button
                  onClick={() => removeItem(item.id)}
                  className="text-red-600 hover:text-red-800"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl p-6">
          <div className="flex justify-between items-center mb-6">
            <span className="text-xl font-semibold">Total:</span>
            <span className="text-2xl font-bold">
              €{(getTotalPrice() / 100).toFixed(2)}
            </span>
          </div>

          <div className="space-y-3">
            <p className="text-sm text-gray-600 text-center">
              Please visit the homepage to complete your purchase using PayPal,
              Marktplaats, or Vinted.
            </p>
            <button
              onClick={onNavigateHome}
              className="w-full bg-black text-white py-3 rounded-xl font-semibold hover:bg-gray-800 transition-all duration-300"
            >
              Go to Homepage
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
