import { useQuery } from "@tanstack/react-query";
import React, { useEffect } from "react";
import { type PolicyContent, PolicyType } from "../backend";
import { useActor } from "../hooks/useActor";

interface PolicyPageProps {
  policyType: PolicyType;
  onNavigateHome: () => void;
}

export default function PolicyPage({
  policyType,
  onNavigateHome,
}: PolicyPageProps) {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const { actor, isFetching } = useActor();

  const {
    data: policyContent,
    isLoading,
    error,
  } = useQuery<PolicyContent>({
    queryKey: ["policy", policyType],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not available");
      return actor.getPolicyContent(policyType);
    },
    enabled: !!actor && !isFetching,
  });

  const formatContent = (content: string) => {
    // For Terms & Conditions, display as unified text with preserved line breaks
    if (policyType === PolicyType.termsAndConditions) {
      const sections = content.split("\n\n");

      return sections
        .map((section, index) => {
          const trimmedSection = section.trim();
          if (!trimmedSection) return null;

          // Check if this is the main title (first section)
          if (index === 0 && trimmedSection === "Terms & Conditions") {
            return (
              <h1
                key={index}
                className="text-lg font-bold text-gray-900 mb-6"
                style={{ fontSize: "12px" }}
              >
                {trimmedSection}
              </h1>
            );
          }

          // Display all other content as regular paragraphs with preserved formatting
          return (
            <p
              key={index}
              className="text-gray-700 leading-relaxed mb-4"
              style={{ fontSize: "12px" }}
            >
              {trimmedSection}
            </p>
          );
        })
        .filter(Boolean);
    }

    // For other policies, use the existing structured formatting
    const sections = content.split("\n\n");

    return sections
      .map((section, index) => {
        const trimmedSection = section.trim();
        if (!trimmedSection) return null;

        // Check if this is the main title (first section)
        if (
          index === 0 &&
          (trimmedSection === "Intellectual Property Policy" ||
            trimmedSection === "Privacy Policy" ||
            trimmedSection === "Refund & Return Policy")
        ) {
          return (
            <h1
              key={index}
              className="text-lg font-bold text-gray-900 mb-6"
              style={{ fontSize: "12px" }}
            >
              {trimmedSection}
            </h1>
          );
        }

        // Check if this is a numbered section (e.g., "1. Acceptance of Terms" or "1) Ownership of Content")
        const isNumberedSection = /^\d+[\.)]\s/.test(trimmedSection);

        if (isNumberedSection) {
          const lines = trimmedSection.split("\n");
          const sectionTitle = lines[0];
          const sectionContent = lines.slice(1).join("\n");

          return (
            <div key={index} className="mb-6">
              <h2
                className="font-semibold text-gray-900 mb-3"
                style={{ fontSize: "12px" }}
              >
                {sectionTitle}
              </h2>
              {sectionContent && (
                <div className="space-y-3">
                  {sectionContent.split("\n").map((line, lineIndex) => {
                    const trimmedLine = line.trim();
                    if (!trimmedLine) return null;

                    // Handle bullet points or dashes
                    if (
                      trimmedLine.startsWith("-") ||
                      trimmedLine.startsWith("•")
                    ) {
                      return (
                        <p
                          key={lineIndex}
                          className="text-gray-700 leading-relaxed ml-4"
                          style={{ fontSize: "12px" }}
                        >
                          {trimmedLine}
                        </p>
                      );
                    }
                    return (
                      <p
                        key={lineIndex}
                        className="text-gray-700 leading-relaxed"
                        style={{ fontSize: "12px" }}
                      >
                        {trimmedLine}
                      </p>
                    );
                  })}
                </div>
              )}
            </div>
          );
        }

        // Handle multi-line sections that might contain sub-paragraphs
        const subParagraphs = trimmedSection
          .split("\n")
          .filter((line) => line.trim());

        if (subParagraphs.length === 1) {
          return (
            <p
              key={index}
              className="text-gray-700 leading-relaxed mb-4"
              style={{ fontSize: "12px" }}
            >
              {trimmedSection}
            </p>
          );
        }
        return (
          <div key={index} className="mb-4">
            {subParagraphs.map((paragraph, subIndex) => (
              <p
                key={`${index}-${subIndex}`}
                className="text-gray-700 leading-relaxed mb-3"
                style={{ fontSize: "12px" }}
              >
                {paragraph.trim()}
              </p>
            ))}
          </div>
        );
      })
      .filter(Boolean);
  };

  if (isLoading || isFetching) {
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

  if (error || !policyContent) {
    return (
      <div className="min-h-screen py-8 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-12">
            <div className="text-4xl mb-4">⚠️</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Policy Not Found
            </h1>
            <p className="text-gray-600 mb-6">
              We couldn't load the requested policy content.
            </p>
            <button
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
              {policyContent.title}
            </h1>
            <p className="text-gray-600 text-sm">Le Royalties Sergio Melicio</p>
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

        {/* Policy Content - Scrollable Container */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 lg:p-8">
          <div className="max-h-[70vh] overflow-y-auto pr-4 policy-content-scroll">
            <div className="prose prose-xs max-w-none">
              {formatContent(policyContent.content)}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-500" style={{ fontSize: "12px" }}>
              Last updated: January 2025
            </p>
          </div>
        </div>

        {/* Additional Information */}
        <div className="mt-6 bg-gray-100 rounded-xl p-4">
          <h3
            className="text-sm font-semibold text-gray-900 mb-2"
            style={{ fontSize: "12px" }}
          >
            Contact Information
          </h3>
          <div
            className="text-xs text-gray-700 space-y-1"
            style={{ fontSize: "12px" }}
          >
            <p>
              <strong>Business:</strong> Le Royalties Sergio Melicio
            </p>
            <p>
              <strong>Email:</strong> melicio@pm.me
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
