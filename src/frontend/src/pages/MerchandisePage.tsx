import React, { useEffect } from "react";
import ArtProductsSection from "../components/ArtProductsSection";

interface MerchandisePageProps {
  onNavigateHome: () => void;
}

export default function MerchandisePage({
  onNavigateHome,
}: MerchandisePageProps) {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-white">
      {/* Page Header */}
      <section className="py-12 px-4 bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto">
          <button
            onClick={onNavigateHome}
            className="text-sm text-gray-500 hover:text-black transition-colors mb-6 flex items-center gap-2 adobe-jenson"
          >
            ← Back to Home
          </button>
          <h1
            className="text-4xl md:text-5xl font-bold text-black adobe-jenson"
            style={{ fontStyle: "italic" }}
          >
            Merchandise
          </h1>
          <p className="mt-3 text-base text-gray-600 adobe-jenson">
            Original artwork and collectibles inspired by The Gospel of Poetic
            Frolic.
          </p>
        </div>
      </section>

      {/* Art Products Section */}
      <section id="art-products" className="scroll-mt-24">
        <ArtProductsSection />
      </section>
    </div>
  );
}
