import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Maximize2, Minimize2 } from "lucide-react";
import React, { useRef, useState } from "react";
import type { ReviewMilestone } from "../backend";
import { useFileUrl } from "../blob-storage/FileStorage";
import { useActor } from "../hooks/useActor";
import AnimatedPlaceholder from "./AnimatedPlaceholder";
import SpiralFlowerBackground from "./SpiralFlowerBackground";

interface RoadmapSectionProps {
  onNavigateToPromotionalTerms: () => void;
}

export default function RoadmapSection({
  onNavigateToPromotionalTerms,
}: RoadmapSectionProps) {
  const { actor, isFetching } = useActor();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  // Fetch roadmap section data including progress
  const { data: roadmapData } = useQuery<{
    title: string;
    description: string;
    currentReviews: bigint;
    progressPercentage: bigint;
  }>({
    queryKey: ["roadmapSectionData"],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not available");
      return actor.getRoadmapSectionData();
    },
    enabled: !!actor && !isFetching,
  });

  // Fetch review milestones
  const { data: milestones } = useQuery<ReviewMilestone[]>({
    queryKey: ["roadmapMilestones"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getReviewMilestones();
    },
    enabled: !!actor && !isFetching,
  });

  const scroll = (direction: "left" | "right") => {
    if (scrollContainerRef.current) {
      const scrollAmount = 300;
      const newScrollLeft =
        scrollContainerRef.current.scrollLeft +
        (direction === "left" ? -scrollAmount : scrollAmount);
      scrollContainerRef.current.scrollTo({
        left: newScrollLeft,
        behavior: "smooth",
      });
    }
  };

  // Sort milestones by number
  const sortedMilestones =
    milestones && milestones.length > 0
      ? [...milestones].sort(
          (a, b) => Number(a.milestone) - Number(b.milestone),
        )
      : [];

  // Don't show section if no milestones
  if (!sortedMilestones || sortedMilestones.length === 0) {
    return null;
  }

  const currentReviews = Number(roadmapData?.currentReviews || 0);
  const progressPercentage = Number(roadmapData?.progressPercentage || 0);

  return (
    <section className="py-16 px-4 bg-gray-50 relative overflow-hidden">
      {/* Spiral Flower Background Animation */}
      <SpiralFlowerBackground />

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Section Header */}
        <div className="text-center mb-8">
          <h2 className="text-3xl md:text-4xl font-bold text-black mb-4">
            {roadmapData?.title || "Roadmap to 250 Reviews"}
          </h2>
          <p className="text-base md:text-lg text-gray-600 max-w-3xl mx-auto mb-6">
            {roadmapData?.description ||
              "To participate in this promotion, read the following instructions and promotional terms and conditions, by making a submission you agree to have read these promotional terms and conditions."}
          </p>

          {/* Read & Participate Button */}
          <button
            onClick={onNavigateToPromotionalTerms}
            className="bg-black text-white px-8 py-3 rounded-xl font-semibold hover:bg-gray-800 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            Read & Participate
          </button>
        </div>

        {/* Modular Progress Bar */}
        <div className="mb-12 max-w-6xl mx-auto">
          <ModularProgressBar
            currentReviews={currentReviews}
            progressPercentage={progressPercentage}
            isExpanded={isExpanded}
            onToggleExpand={() => setIsExpanded(!isExpanded)}
          />
        </div>

        {/* Scrollable Timeline */}
        <div className="relative">
          {/* Scroll Buttons */}
          <button
            onClick={() => scroll("left")}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white p-2 rounded-full shadow-lg transition-all duration-300 hover:scale-110"
            aria-label="Scroll left"
          >
            <ChevronLeft className="w-6 h-6 text-black" />
          </button>
          <button
            onClick={() => scroll("right")}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white p-2 rounded-full shadow-lg transition-all duration-300 hover:scale-110"
            aria-label="Scroll right"
          >
            <ChevronRight className="w-6 h-6 text-black" />
          </button>

          {/* Milestone Cards Container */}
          <div
            ref={scrollContainerRef}
            className="flex overflow-x-auto gap-6 pb-4 px-12 scrollbar-hide scroll-smooth"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {sortedMilestones.map((milestone) => (
              <MilestoneCard
                key={Number(milestone.milestone)}
                milestone={Number(milestone.milestone)}
                prizeImagePath={milestone.prizeImagePath}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

interface ModularProgressBarProps {
  currentReviews: number;
  progressPercentage: number;
  isExpanded: boolean;
  onToggleExpand: () => void;
}

function ModularProgressBar({
  currentReviews,
  progressPercentage,
  isExpanded,
  onToggleExpand,
}: ModularProgressBarProps) {
  // Calculate which modules to show based on current progress (10-unit segments for 250 max)
  const getVisibleModules = () => {
    if (isExpanded) {
      // Show all modules when expanded (0-250)
      return Array.from({ length: 25 }, (_, i) => i * 10);
    }

    // Adaptive visible range based on progress
    if (currentReviews < 50) {
      // Show first 5 modules (0-50) when progress is low
      return Array.from({ length: 5 }, (_, i) => i * 10);
    }
    if (currentReviews < 150) {
      // Show 10 modules centered around current progress
      const centerModule = Math.floor(currentReviews / 10);
      const start = Math.max(0, centerModule - 5);
      return Array.from({ length: 10 }, (_, i) => (start + i) * 10);
    }
    // Show 15 modules for higher progress
    const centerModule = Math.floor(currentReviews / 10);
    const start = Math.max(0, centerModule - 7);
    return Array.from({ length: 15 }, (_, i) => (start + i) * 10);
  };

  const visibleModules = getVisibleModules();
  const maxVisible = Math.max(...visibleModules) + 10;

  // Format percentage with proper decimal handling
  const formatPercentage = (value: number) => {
    if (value === 0) return "0%";
    if (value >= 100) return "100%";
    if (value < 1) {
      // Show two decimals for very small percentages
      return `${value.toFixed(2).replace(".", ",")}%`;
    }
    // Show one decimal for percentages between 1 and 100
    return `${value.toFixed(1).replace(".", ",")}%`;
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
      <div className="flex justify-between items-center mb-4">
        <span className="text-sm font-semibold text-gray-700">
          Total Reviews Progress
        </span>
        <div className="flex items-center gap-4">
          <span className="text-sm font-bold text-black">
            {currentReviews.toLocaleString()} / 250
          </span>
          <button
            onClick={onToggleExpand}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title={isExpanded ? "Collapse view" : "Expand view"}
          >
            {isExpanded ? (
              <Minimize2 className="w-5 h-5 text-gray-600" />
            ) : (
              <Maximize2 className="w-5 h-5 text-gray-600" />
            )}
          </button>
        </div>
      </div>

      {/* Modular Progress Bar Container */}
      <div className="relative">
        {/* Module Labels */}
        <div className="flex justify-between mb-2 text-xs text-gray-500 font-medium">
          <span>{visibleModules[0]}</span>
          <span className="text-center flex-1">Review Milestones</span>
          <span>{maxVisible}</span>
        </div>

        {/* Progress Modules */}
        <div
          className={`grid gap-1 ${isExpanded ? "max-h-96 overflow-y-auto scrollbar-thin" : ""}`}
          style={{
            gridTemplateColumns: `repeat(${Math.min(visibleModules.length, 10)}, minmax(0, 1fr))`,
          }}
        >
          {visibleModules.map((moduleStart) => {
            const moduleEnd = moduleStart + 10;
            const isModuleFilled = currentReviews >= moduleEnd;
            const isModulePartial =
              currentReviews > moduleStart && currentReviews < moduleEnd;
            const partialFill = isModulePartial
              ? ((currentReviews - moduleStart) / 10) * 100
              : 0;

            return (
              <div key={moduleStart} className="relative group">
                {/* Module Container */}
                <div className="relative h-16 bg-gray-200 rounded-lg overflow-hidden border border-gray-300">
                  {/* Fill */}
                  <div
                    className={`absolute top-0 left-0 h-full transition-all duration-500 ease-out ${
                      isModuleFilled
                        ? "bg-gradient-to-r from-gray-700 to-black"
                        : isModulePartial
                          ? "bg-gradient-to-r from-gray-600 to-gray-800"
                          : "bg-transparent"
                    }`}
                    style={{
                      width: isModuleFilled
                        ? "100%"
                        : isModulePartial
                          ? `${partialFill}%`
                          : "0%",
                    }}
                  >
                    {/* Animated Characters */}
                    {(isModuleFilled || isModulePartial) && (
                      <AnimatedProgressCharacters />
                    )}
                  </div>

                  {/* Module Label */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span
                      className={`text-xs font-bold z-10 ${
                        isModuleFilled || isModulePartial
                          ? "text-white drop-shadow-lg"
                          : "text-gray-500"
                      }`}
                    >
                      {moduleStart}
                    </span>
                  </div>
                </div>

                {/* Tooltip on hover */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-black text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-20">
                  {moduleStart}–{moduleEnd}
                </div>
              </div>
            );
          })}
        </div>

        {/* Overall Progress Indicator */}
        <div className="mt-4 flex items-center justify-between">
          <div className="flex-1 bg-gray-200 h-2 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-gray-700 to-black transition-all duration-1000 ease-out"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          <span className="ml-4 text-sm font-bold text-black min-w-[60px] text-right">
            {formatPercentage(progressPercentage)}
          </span>
        </div>

        <p className="text-xs text-gray-500 mt-3 text-center">
          {isExpanded
            ? "Showing all 25 modules (0–250). Click to collapse."
            : "Click the expand icon to view all modules up to 250 reviews."}
        </p>
      </div>
    </div>
  );
}

// Animated characters component for progress bar
function AnimatedProgressCharacters() {
  const characters = [
    "A",
    "B",
    "C",
    "D",
    "E",
    "F",
    "G",
    "H",
    "I",
    "J",
    "K",
    "L",
    "M",
    "N",
    "O",
    "P",
    "Q",
    "R",
    "S",
    "T",
    "U",
    "V",
    "W",
    "X",
    "Y",
    "Z",
    "0",
    "1",
    "2",
    "3",
    "4",
    "5",
    "6",
    "7",
    "8",
    "9",
    "!",
    "@",
    "#",
    "$",
    "%",
    "&",
    "*",
  ];

  return (
    <div className="absolute inset-0 overflow-hidden">
      {Array.from({ length: 8 }).map((_, i) => {
        const char = characters[Math.floor(Math.random() * characters.length)];
        const left = Math.random() * 100;
        const animationDuration = 3 + Math.random() * 4;
        const animationDelay = Math.random() * 2;

        return (
          <div
            key={i}
            className="absolute text-white/30 font-bold animate-float-progress"
            style={{
              left: `${left}%`,
              top: "50%",
              transform: "translateY(-50%)",
              fontSize: `${10 + Math.random() * 6}px`,
              animationDuration: `${animationDuration}s`,
              animationDelay: `${animationDelay}s`,
            }}
          >
            {char}
          </div>
        );
      })}
    </div>
  );
}

interface MilestoneCardProps {
  milestone: number;
  prizeImagePath?: string;
}

function MilestoneCard({ milestone, prizeImagePath }: MilestoneCardProps) {
  const { data: imageUrl } = useFileUrl(prizeImagePath || "");

  return (
    <div className="flex-shrink-0 w-64 bg-white rounded-2xl shadow-xl border border-gray-100 p-6 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 relative z-20">
      {/* Prize Image */}
      <div className="w-full aspect-square bg-gray-100 rounded-xl overflow-hidden mb-4">
        {prizeImagePath && imageUrl ? (
          <img
            src={imageUrl}
            alt={`Prize for ${milestone} reviews`}
            className="w-full h-full object-cover"
          />
        ) : (
          <AnimatedPlaceholder className="w-full h-full" />
        )}
      </div>

      {/* Milestone Number */}
      <div className="text-center">
        <div className="text-2xl font-bold text-black mb-1">
          {milestone.toLocaleString()}
        </div>
        <div className="text-sm text-gray-600">Review Milestone</div>
      </div>
    </div>
  );
}
