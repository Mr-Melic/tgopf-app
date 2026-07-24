import React, { useState } from "react";

interface ResellerDashboardProps {
  onNavigateHome: () => void;
}

export default function ResellerDashboard({
  onNavigateHome,
}: ResellerDashboardProps) {
  const [activeTab, setActiveTab] = useState<
    "purchase" | "sales" | "leaderboard"
  >("purchase");

  return (
    <div className="min-h-screen py-8 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-black mb-2">Reseller Hub</h1>
            <p className="text-gray-600 text-lg">
              Manage your reseller account and track performance
            </p>
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

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 transform hover:-translate-y-1 transition-all duration-300">
            <div className="flex items-center">
              <div className="p-3 bg-gray-100 rounded-xl">
                <span className="text-gray-600 text-2xl">📚</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Books Sold</p>
                <p className="text-3xl font-bold text-gray-900">--</p>
                <p className="text-xs text-gray-500">This month</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 transform hover:-translate-y-1 transition-all duration-300">
            <div className="flex items-center">
              <div className="p-3 bg-gray-200 rounded-xl">
                <span className="text-gray-600 text-2xl">💰</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Total Earnings
                </p>
                <p className="text-3xl font-bold text-gray-900">$--</p>
                <p className="text-xs text-gray-500">All time</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 transform hover:-translate-y-1 transition-all duration-300">
            <div className="flex items-center">
              <div className="p-3 bg-gray-300 rounded-xl">
                <span className="text-gray-600 text-2xl">🏆</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Leaderboard Rank
                </p>
                <p className="text-3xl font-bold text-gray-900">--</p>
                <p className="text-xs text-gray-500">Out of all resellers</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 mb-8">
          <nav className="flex space-x-1 p-2">
            <button
              type="button"
              onClick={() => setActiveTab("purchase")}
              className={`flex-1 py-3 px-6 rounded-xl font-medium text-sm transition-all duration-300 ${
                activeTab === "purchase"
                  ? "bg-black text-white shadow-lg"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              Purchase Books
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("sales")}
              className={`flex-1 py-3 px-6 rounded-xl font-medium text-sm transition-all duration-300 ${
                activeTab === "sales"
                  ? "bg-black text-white shadow-lg"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              Sales History
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("leaderboard")}
              className={`flex-1 py-3 px-6 rounded-xl font-medium text-sm transition-all duration-300 ${
                activeTab === "leaderboard"
                  ? "bg-black text-white shadow-lg"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              Leaderboard
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === "purchase" && (
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
            <div className="flex items-center mb-8">
              <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center mr-4">
                <span className="text-white text-xl">🛒</span>
              </div>
              <div>
                <h2 className="text-2xl font-semibold text-gray-900">
                  Purchase Books at Reseller Price
                </h2>
                <p className="text-gray-600">
                  Get exclusive discounts on The Poetic Frolic for resale
                </p>
              </div>
            </div>

            <div className="max-w-md mx-auto">
              <div className="bg-gray-50 border border-gray-200 rounded-2xl p-8 shadow-lg">
                <div className="text-center mb-6">
                  <div className="text-5xl mb-4">📚</div>
                  <h3 className="text-xl font-bold text-gray-900">
                    The Poetic Frolic
                  </h3>
                  <p className="text-gray-600">Poetry Collection</p>
                </div>

                <div className="space-y-3 mb-6">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Regular Price:</span>
                    <span className="line-through text-gray-400 text-lg">
                      $24.99
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-lg">
                      Reseller Price:
                    </span>
                    <span className="font-bold text-black text-2xl">
                      $18.99
                    </span>
                  </div>
                  <div className="bg-gray-100 rounded-lg p-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-800 font-medium">
                        Your Profit:
                      </span>
                      <span className="text-gray-800 font-bold text-lg">
                        $6.00 per book
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-center py-8">
                  <div className="text-4xl mb-4">🚧</div>
                  <p className="text-gray-500 mb-2 font-medium">
                    Reseller purchasing system coming soon
                  </p>
                  <p className="text-sm text-gray-400">
                    This feature requires backend support for reseller pricing
                    and order management.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "sales" && (
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-gray-700 rounded-xl flex items-center justify-center mr-4">
                <span className="text-white text-xl">📊</span>
              </div>
              <div>
                <h2 className="text-2xl font-semibold text-gray-900">
                  Sales History
                </h2>
                <p className="text-gray-600">
                  Track your sales performance and earnings
                </p>
              </div>
            </div>

            <div className="text-center py-16">
              <div className="text-6xl mb-6">📈</div>
              <h3 className="text-xl font-semibold text-gray-700 mb-4">
                Sales Tracking Coming Soon
              </h3>
              <p className="text-gray-500 mb-2 max-w-md mx-auto">
                This feature requires backend functionality for sales history
                and commission tracking.
              </p>
              <div className="bg-gray-50 rounded-xl p-6 mt-8 max-w-lg mx-auto">
                <h4 className="font-semibold text-gray-800 mb-3">
                  Planned Features:
                </h4>
                <ul className="text-sm text-gray-600 space-y-2 text-left">
                  <li>• Detailed sales reports</li>
                  <li>• Commission calculations</li>
                  <li>• Monthly performance summaries</li>
                  <li>• Customer purchase history</li>
                  <li>• Earnings analytics</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {activeTab === "leaderboard" && (
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-gray-600 rounded-xl flex items-center justify-center mr-4">
                <span className="text-white text-xl">🏆</span>
              </div>
              <div>
                <h2 className="text-2xl font-semibold text-gray-900">
                  Top Resellers
                </h2>
                <p className="text-gray-600">
                  See how you rank against other resellers
                </p>
              </div>
            </div>

            <div className="text-center py-16">
              <div className="text-6xl mb-6">🥇</div>
              <h3 className="text-xl font-semibold text-gray-700 mb-4">
                Leaderboard Coming Soon
              </h3>
              <p className="text-gray-500 mb-2 max-w-md mx-auto">
                This feature requires backend functionality for reseller
                rankings and performance metrics.
              </p>
              <div className="bg-gray-50 rounded-xl p-6 mt-8 max-w-lg mx-auto">
                <h4 className="font-semibold text-gray-800 mb-3">
                  Planned Features:
                </h4>
                <ul className="text-sm text-gray-600 space-y-2 text-left">
                  <li>• Monthly leaderboard rankings</li>
                  <li>• Top performer recognition</li>
                  <li>• Achievement badges</li>
                  <li>• Performance comparisons</li>
                  <li>• Reward programs</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
