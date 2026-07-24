import React, { useEffect } from "react";

interface PaymentSuccessProps {
  onNavigateHome: () => void;
}

export default function PaymentSuccess({
  onNavigateHome,
}: PaymentSuccessProps) {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center py-12 bg-gray-50">
      <div className="max-w-md w-full mx-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 text-center transform animate-fade-in">
          <div className="w-20 h-20 bg-black rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
            <svg
              className="w-10 h-10 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Payment Successful! 🎉
          </h1>

          <p className="text-gray-600 mb-6 leading-relaxed">
            Thank you for your purchase of "The Poetic Frolic"! Your whimsical
            poetry collection will be shipped to you soon.
          </p>

          <div className="bg-gray-50 rounded-xl p-6 mb-8 border border-gray-100">
            <h3 className="font-semibold text-gray-800 mb-2">
              What happens next?
            </h3>
            <ul className="text-sm text-gray-700 space-y-1 text-left">
              <li>• Confirmation email sent to your inbox</li>
              <li>• Order processing within 1-2 business days</li>
              <li>• Tracking information provided</li>
              <li>• Free shipping to your address</li>
            </ul>
          </div>

          <button
            onClick={onNavigateHome}
            className="w-full bg-black text-white py-3 px-6 rounded-xl font-semibold hover:bg-gray-800 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            Return to Home
          </button>

          <p className="text-sm text-gray-500 mt-4">
            Questions? Contact our support team anytime.
          </p>
        </div>
      </div>
    </div>
  );
}
