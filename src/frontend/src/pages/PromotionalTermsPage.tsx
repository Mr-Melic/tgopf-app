import React, { useEffect } from "react";
import { useGetPromotionalTermsContent } from "../hooks/useQueries";

interface PromotionalTermsPageProps {
  onNavigateHome: () => void;
}

export default function PromotionalTermsPage({
  onNavigateHome,
}: PromotionalTermsPageProps) {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const {
    data: htmlContent,
    isLoading,
    error,
  } = useGetPromotionalTermsContent();

  if (isLoading) {
    return (
      <div className="min-h-screen py-8 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-black" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !htmlContent) {
    return (
      <div className="min-h-screen py-8 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-12">
            <div className="text-4xl mb-4">⚠️</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Content Not Found
            </h1>
            <p className="text-gray-600 mb-6">
              We couldn't load the promotional terms content.
            </p>
            <button
              type="button"
              onClick={onNavigateHome}
              className="bg-black text-white px-6 py-3 rounded-xl font-semibold hover:bg-gray-800 transition-all duration-300"
            >
              Return to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-black mb-2">
              Promotional Terms and Conditions
            </h1>
            <p className="text-gray-600 text-sm">Le Royalties Sergio Melicio</p>
          </div>
          <button
            type="button"
            onClick={onNavigateHome}
            className="flex items-center text-black hover:text-gray-700 transition-colors font-medium bg-white px-4 py-2 rounded-xl shadow-md hover:shadow-lg"
          >
            <svg
              className="w-4 h-4 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
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

        {/* Policy Content - Scrollable Container */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 lg:p-10">
          <div className="max-h-[70vh] overflow-y-auto pr-4 policy-content-scroll">
            <div
              className="promotional-terms-content"
              dangerouslySetInnerHTML={{ __html: htmlContent }}
            />
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-500">Last updated: January 2025</p>
          </div>
        </div>

        {/* Additional Information */}
        <div className="mt-6 bg-gray-100 rounded-xl p-6">
          <h3 className="text-base font-semibold text-gray-900 mb-3">
            Contact Information
          </h3>
          <div className="text-sm text-gray-700 space-y-1">
            <p>
              <strong>Business:</strong> Le Royalties Sergio Melicio
            </p>
            <p>
              <strong>Email:</strong>{" "}
              <a
                href="mailto:tgopf@pm.me"
                className="text-blue-600 hover:underline"
              >
                tgopf@pm.me
              </a>
            </p>
            <p>
              <strong>Phone:</strong> +31 6 488 6 77 66
            </p>
            <p>
              <strong>Tax ID:</strong> NL005317123B43
            </p>
            <p>
              <strong>KVK:</strong> 98223216
            </p>
            <p>
              <strong>IBAN:</strong> NL08 RABO 0155 3288 24
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
