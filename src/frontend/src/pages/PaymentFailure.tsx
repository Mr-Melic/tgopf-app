import React, { useEffect } from "react";

interface PaymentFailureProps {
  onNavigateHome: () => void;
}

export default function PaymentFailure({
  onNavigateHome,
}: PaymentFailureProps) {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center py-12 bg-gray-50">
      <div className="max-w-md w-full mx-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 text-center transform animate-fade-in">
          <div className="w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
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
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Payment Cancelled
          </h1>

          <p className="text-gray-600 mb-6 leading-relaxed">
            Your payment was cancelled or could not be processed. No charges
            have been made to your account.
          </p>

          <div className="bg-gray-50 rounded-xl p-6 mb-8 border border-gray-100">
            <h3 className="font-semibold text-gray-800 mb-2">Need help?</h3>
            <p className="text-sm text-gray-700">
              If you experienced any issues during checkout, please try again or
              contact our support team if the problem persists.
            </p>
          </div>

          <div className="space-y-3">
            <button
              onClick={onNavigateHome}
              className="w-full bg-black text-white py-3 px-6 rounded-xl font-semibold hover:bg-gray-800 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              Return to Home
            </button>
            <button
              onClick={() => window.history.back()}
              className="w-full bg-gray-100 text-gray-800 py-3 px-6 rounded-xl font-semibold hover:bg-gray-200 transition-all duration-300"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
