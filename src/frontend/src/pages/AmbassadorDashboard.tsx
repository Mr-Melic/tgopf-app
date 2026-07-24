import React, { useState } from "react";
import { useFileList, useFileUrl } from "../blob-storage/FileStorage";
import AnimatedPlaceholder from "../components/AnimatedPlaceholder";
import { useGetProducts } from "../hooks/useQueries";

interface AmbassadorDashboardProps {
  onNavigateHome: () => void;
}

// Fixed ambassador pricing
const AMBASSADOR_PRICE_EXCL_TAX = 3093; // €30.93 in cents
const AMBASSADOR_PRICE_INCL_TAX = 3399; // €33.99 in cents
const MINIMUM_QUANTITY = 10;

// Fixed descriptions
const FIXED_SHORT_DESCRIPTION =
  "This book is a gathering of voices—my own, yet spoken through different forms. Within these pages, I weave three distinct styles: the Elizabethan–Anglo-Saxon fusion that draws on the weight of words like thou, thy, ūre, nawiht; the modern lyric, sharp and direct; and the Japanese-influenced form, where silence and seasonal breath shape the words as much as ink does.";

export default function AmbassadorDashboard({
  onNavigateHome,
}: AmbassadorDashboardProps) {
  const { data: products } = useGetProducts();
  const { data: files } = useFileList();
  const [quantity, setQuantity] = useState(MINIMUM_QUANTITY);

  // Get the main product (first product or default)
  const mainProduct = products?.[0];

  // Get cover image path for the product
  const getCoverImagePath = (productId: string): string | null => {
    if (!files) return null;

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

  const coverImagePath = mainProduct ? getCoverImagePath(mainProduct.id) : null;

  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity >= MINIMUM_QUANTITY) {
      setQuantity(newQuantity);
    }
  };

  const totalPriceExclTax = AMBASSADOR_PRICE_EXCL_TAX * quantity;
  const totalPriceInclTax = AMBASSADOR_PRICE_INCL_TAX * quantity;

  return (
    <div className="min-h-screen py-8 bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-black mb-2">
              Ambassador's Hub
            </h1>
            <p className="text-gray-600 text-lg">
              Purchase "The Gospel of Poetic Frolic" at exclusive ambassador
              rates
            </p>
          </div>
          <button
            onClick={onNavigateHome}
            className="flex items-center text-black hover:text-gray-700 transition-colors font-medium bg-white px-4 py-2 rounded-xl shadow-md hover:shadow-lg"
          >
            <svg
              className="w-4 h-4 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back to Home
          </button>
        </div>

        {/* Ambassador Purchase Section */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
          <div className="flex items-center mb-8">
            <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center mr-4">
              <span className="text-white text-xl">📚</span>
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-gray-900">
                Ambassador Purchase
              </h2>
              <p className="text-gray-600">
                Exclusive pricing for ambassadors with minimum order of{" "}
                {MINIMUM_QUANTITY} units
              </p>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Product Display */}
            <div className="space-y-6">
              {/* Product Image */}
              <div className="w-full max-w-sm mx-auto aspect-[3/4] bg-gray-100 rounded-2xl flex items-center justify-center shadow-lg overflow-hidden">
                {coverImagePath ? (
                  <ProductCoverImage imagePath={coverImagePath} />
                ) : (
                  <AnimatedPlaceholder className="w-full h-full rounded-2xl" />
                )}
              </div>

              {/* Product Details */}
              <div className="text-center">
                <h3 className="product-title text-2xl font-bold text-black mb-2">
                  The Gospel of Poetic Frolic
                </h3>
                <p className="product-title text-lg text-gray-600 mb-4">
                  The Softcover Signed First Edition
                </p>
                <p className="text-gray-700 leading-relaxed text-sm">
                  {FIXED_SHORT_DESCRIPTION}
                </p>
              </div>
            </div>

            {/* Purchase Form */}
            <div className="space-y-6">
              {/* Pricing Display */}
              <div className="bg-gray-50 rounded-xl p-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">
                  Ambassador Pricing
                </h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">
                      Price per unit (excl. tax):
                    </span>
                    <span className="font-semibold text-gray-900">
                      €{(AMBASSADOR_PRICE_EXCL_TAX / 100).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">
                      Price per unit (incl. 9% tax):
                    </span>
                    <span className="font-bold text-black text-lg">
                      €{(AMBASSADOR_PRICE_INCL_TAX / 100).toFixed(2)}
                    </span>
                  </div>
                  <div className="border-t border-gray-200 pt-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">
                        Regular retail price:
                      </span>
                      <span className="line-through text-gray-400">€59.39</span>
                    </div>
                    <div className="flex justify-between items-center text-green-700">
                      <span className="font-medium">
                        Your savings per unit:
                      </span>
                      <span className="font-bold">
                        €{((5939 - AMBASSADOR_PRICE_INCL_TAX) / 100).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quantity Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Quantity (minimum {MINIMUM_QUANTITY} units):
                </label>
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => handleQuantityChange(quantity - 1)}
                    disabled={quantity <= MINIMUM_QUANTITY}
                    className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M20 12H4"
                      />
                    </svg>
                  </button>
                  <div className="flex-1">
                    <input
                      type="number"
                      value={quantity}
                      onChange={(e) =>
                        handleQuantityChange(
                          Number.parseInt(e.target.value) || MINIMUM_QUANTITY,
                        )
                      }
                      min={MINIMUM_QUANTITY}
                      className="w-full text-center text-xl font-semibold py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                    />
                  </div>
                  <button
                    onClick={() => handleQuantityChange(quantity + 1)}
                    className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                      />
                    </svg>
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Total books: {quantity} units
                </p>
              </div>

              {/* Order Summary */}
              <div className="bg-black text-white rounded-xl p-6">
                <h4 className="text-lg font-semibold mb-4">Order Summary</h4>
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between">
                    <span>Subtotal (excl. tax):</span>
                    <span>€{(totalPriceExclTax / 100).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tax (9%):</span>
                    <span>
                      €
                      {((totalPriceInclTax - totalPriceExclTax) / 100).toFixed(
                        2,
                      )}
                    </span>
                  </div>
                  <div className="border-t border-gray-600 pt-2">
                    <div className="flex justify-between text-xl font-bold">
                      <span>Total:</span>
                      <span>€{(totalPriceInclTax / 100).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
                <p className="text-sm text-gray-300 mb-6">
                  Incl. Free shipping worldwide
                </p>

                {/* Purchase Button */}
                <div className="text-center py-8">
                  <div className="text-4xl mb-4">🚧</div>
                  <p className="text-gray-300 mb-2 font-medium">
                    Ambassador purchasing system coming soon
                  </p>
                  <p className="text-sm text-gray-400">
                    This feature requires backend support for ambassador pricing
                    and order management.
                  </p>
                </div>
              </div>

              {/* Additional Info */}
              <div className="text-center space-y-2">
                <p className="text-sm text-gray-600 flex items-center justify-center">
                  <svg
                    className="w-4 h-4 mr-2 text-gray-500"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Secure checkout powered by Stripe
                </p>
                <p className="text-sm text-gray-600">
                  14-day money-back guarantee on unopened books
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface ProductCoverImageProps {
  imagePath: string;
}

function ProductCoverImage({ imagePath }: ProductCoverImageProps) {
  const { data: imageUrl } = useFileUrl(imagePath);

  return (
    <>
      {imageUrl ? (
        <img
          src={imageUrl}
          alt="The Gospel of Poetic Frolic cover"
          className="w-full h-full object-cover"
        />
      ) : (
        <AnimatedPlaceholder className="w-full h-full rounded-2xl" />
      )}
    </>
  );
}
