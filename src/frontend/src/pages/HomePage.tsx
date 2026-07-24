import { useQuery } from "@tanstack/react-query";
import { ChevronDown, ChevronUp } from "lucide-react";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { PolicyType } from "../backend";
import { useFileUrl } from "../blob-storage/FileStorage";
import {
  AmazonButtons,
  type AmazonRegion,
} from "../components/AmazonRegionSelector";
import AnnouncementBlocks from "../components/AnnouncementBlocks";
import { BackgroundQuoteLayer } from "../components/BackgroundQuoteLayer";
import ErrorBoundary from "../components/ErrorBoundary";
import { FloatingSymbolsLayer } from "../components/FloatingSymbolsLayer";
import GalleryCarousel from "../components/GalleryCarousel";
import HomeSidebarNav from "../components/HomeSidebarNav";
import ImageGallery from "../components/ImageGallery";
import PaymentCountrySelector from "../components/PaymentCountrySelector";
import PaymentInstructionModal from "../components/PaymentInstructionModal";
import ProgressiveSection from "../components/ProgressiveSection";
import ReviewsSection from "../components/ReviewsSection";
import RoadmapSection from "../components/RoadmapSection";
import { useActor } from "../hooks/useActor";
import { useGalleryCarousel } from "../hooks/useGalleryCarousel";
import {
  useGetAmazonRegions,
  useGetAmazonRegionsByBook,
  useGetAnnaAmazonEnabled,
  useGetAnnaSongAmazonEnabled,
  useGetEmilieAmazonEnabled,
  useGetEmilieNlAmazonEnabled,
  useGetFeaturedProducts,
  useGetHomepageTextBlocks,
  useGetHomepageTextBlocksAnnaEn,
  useGetHomepageTextBlocksAnnaNl,
  useGetHomepageTextBlocksEmilieEn,
  useGetHomepageTextBlocksEmilieNl,
  useGetReviews,
  useListShortMessages,
} from "../hooks/useQueries";
import type { HomepageTextBlocks } from "../hooks/useQueries";
import { useViewportBreakpoint } from "../hooks/useViewportBreakpoint";

// ── About This Book expandable content (mobile-only collapse) ───────────────

// Extracted component so useState is at top level (React hooks rules)
function TGOPFTextContent({
  textBlocks,
  isMobile,
}: {
  textBlocks: HomepageTextBlocks | undefined;
  isMobile: boolean;
}) {
  const [expanded, setExpanded] = useState(false);

  if (!textBlocks) return null;

  const showExtra = !isMobile || expanded;

  return (
    <div className="space-y-6 py-4">
      {textBlocks.block1.content && (
        <div>
          {textBlocks.block1.title && (
            <h3 className="text-xl font-semibold mb-3 text-black adobe-jenson">
              {textBlocks.block1.title}
            </h3>
          )}
          <p className="text-base text-gray-700 leading-relaxed">
            {textBlocks.block1.content}
          </p>
        </div>
      )}
      {showExtra && (
        <>
          {textBlocks.block2.content && (
            <div>
              {textBlocks.block2.title && (
                <h3 className="text-xl font-semibold mb-3 text-black adobe-jenson">
                  {textBlocks.block2.title}
                </h3>
              )}
              <p className="text-base text-gray-700 leading-relaxed">
                {textBlocks.block2.content}
              </p>
            </div>
          )}
          {textBlocks.block3.content && (
            <div>
              {textBlocks.block3.title && (
                <h3 className="text-xl font-semibold mb-3 text-black adobe-jenson">
                  {textBlocks.block3.title}
                </h3>
              )}
              <p className="text-base text-gray-700 leading-relaxed">
                {textBlocks.block3.content}
              </p>
            </div>
          )}
        </>
      )}
      {isMobile && (
        <button
          type="button"
          aria-label={expanded ? "Collapse section" : "Expand section"}
          onClick={() => setExpanded((v) => !v)}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-black transition-colors duration-200 mt-2 select-none"
          data-ocid="about-book-toggle"
        >
          {expanded ? (
            <>
              <ChevronUp className="w-4 h-4" />
              <span className="adobe-jenson tracking-wide">Show less</span>
            </>
          ) : (
            <>
              <ChevronDown className="w-4 h-4" />
              <span className="adobe-jenson tracking-wide">Read more</span>
            </>
          )}
        </button>
      )}
    </div>
  );
}

// Inline renderer for Emilie/Anna — renders the active language version of the
// bilingual text blocks. Falls back to the other language when the active one
// has no block1 content so the section never renders blank.
function BookTextContent({
  enBlocks,
  nlBlocks,
  language,
}: {
  enBlocks: HomepageTextBlocks | undefined;
  nlBlocks: HomepageTextBlocks | undefined;
  language: "en" | "nl";
}) {
  const hasContent = (b?: HomepageTextBlocks) =>
    !!b?.block1?.content && b.block1.content.trim().length > 0;

  const active = language === "en" ? enBlocks : nlBlocks;
  const fallback = language === "en" ? nlBlocks : enBlocks;

  const textBlocks =
    hasContent(active) || !hasContent(fallback) ? active : fallback;

  if (!textBlocks?.block1?.content) {
    return (
      <p className="py-4 text-base text-gray-500 italic adobe-jenson">
        Coming soon...
      </p>
    );
  }
  return (
    <div className="space-y-6 py-4">
      {textBlocks.block1.content && (
        <div>
          {textBlocks.block1.title && (
            <h3 className="text-xl font-semibold mb-3 text-black adobe-jenson">
              {textBlocks.block1.title}
            </h3>
          )}
          <p className="text-base text-gray-700 leading-relaxed">
            {textBlocks.block1.content}
          </p>
        </div>
      )}
      {textBlocks.block2.content && (
        <div>
          {textBlocks.block2.title && (
            <h3 className="text-xl font-semibold mb-3 text-black adobe-jenson">
              {textBlocks.block2.title}
            </h3>
          )}
          <p className="text-base text-gray-700 leading-relaxed">
            {textBlocks.block2.content}
          </p>
        </div>
      )}
      {textBlocks.block3.content && (
        <div>
          {textBlocks.block3.title && (
            <h3 className="text-xl font-semibold mb-3 text-black adobe-jenson">
              {textBlocks.block3.title}
            </h3>
          )}
          <p className="text-base text-gray-700 leading-relaxed">
            {textBlocks.block3.content}
          </p>
        </div>
      )}
    </div>
  );
}

// Small EN/NL toggle control rendered inside the Emilie and Anna accordion
// sub-section headers. The active language is owned by the parent so the
// selection persists across accordion open/close within the session.
function LanguageToggle({
  language,
  onChange,
  ocidPrefix,
}: {
  language: "en" | "nl";
  onChange: (lang: "en" | "nl") => void;
  ocidPrefix: string;
}) {
  const btnClass = (active: boolean) =>
    `px-3 py-1 text-xs font-semibold rounded-full transition-all duration-200 ${
      active
        ? "bg-black text-white shadow"
        : "bg-white/60 text-black hover:bg-white/80"
    }`;
  return (
    <fieldset
      className="inline-flex items-center gap-1 p-1 rounded-full border border-white/30 bg-white/20 backdrop-blur-sm"
      aria-label="Language toggle"
      data-ocid={`${ocidPrefix}.lang_toggle`}
    >
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onChange("en");
        }}
        className={btnClass(language === "en")}
        aria-pressed={language === "en"}
        data-ocid={`${ocidPrefix}.lang_en`}
      >
        EN
      </button>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onChange("nl");
        }}
        className={btnClass(language === "nl")}
        aria-pressed={language === "nl"}
        data-ocid={`${ocidPrefix}.lang_nl`}
      >
        NL
      </button>
    </fieldset>
  );
}

function AboutThisBookContent({
  textBlocks,
  isMobile,
}: {
  textBlocks: HomepageTextBlocks | undefined;
  isMobile: boolean;
}) {
  const [openSection, setOpenSection] = useState<
    "topf" | "emilie" | "anna" | null
  >("topf");
  // Shared language selection for Emilie & Anna — persists across accordion
  // open/close within the session (local React state). Defaults to English.
  const [language, setLanguage] = useState<"en" | "nl">("en");
  const { data: emilieEnBlocks } = useGetHomepageTextBlocksEmilieEn();
  const { data: emilieNlBlocks } = useGetHomepageTextBlocksEmilieNl();
  const { data: annaEnBlocks } = useGetHomepageTextBlocksAnnaEn();
  const { data: annaNlBlocks } = useGetHomepageTextBlocksAnnaNl();

  const toggle = (section: "topf" | "emilie" | "anna") => {
    setOpenSection((prev) => (prev === section ? null : section));
  };

  const accordionBtnClass = (active: boolean) =>
    `w-full text-left px-6 py-4 rounded-xl border transition-all duration-300 adobe-jenson font-semibold text-base flex items-center justify-between gap-3 ${
      active
        ? "bg-black/10 border-black/30 text-black backdrop-blur-sm"
        : "frosted-glass border-white/20 text-black hover:bg-black/5"
    }`;

  return (
    <div className="space-y-3 pt-4">
      {/* TGOPF accordion — single language, no toggle */}
      <div>
        <button
          type="button"
          onClick={() => toggle("topf")}
          className={accordionBtnClass(openSection === "topf")}
          data-ocid="about-topf-toggle"
        >
          <span>The Gospel of Poetic Frolic</span>
          {openSection === "topf" ? (
            <ChevronUp className="w-5 h-5 flex-shrink-0" />
          ) : (
            <ChevronDown className="w-5 h-5 flex-shrink-0" />
          )}
        </button>
        {openSection === "topf" && (
          <div className="px-2 py-1">
            <TGOPFTextContent textBlocks={textBlocks} isMobile={isMobile} />
          </div>
        )}
      </div>

      {/* Emilie accordion — bilingual EN/NL toggle */}
      <div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => toggle("emilie")}
            className={`${accordionBtnClass(openSection === "emilie")} flex-1`}
            data-ocid="about-emilie-toggle"
          >
            <span>
              Emilie and the Ruins of Azoth / Emilie en de Ruïne van Azoth
            </span>
            {openSection === "emilie" ? (
              <ChevronUp className="w-5 h-5 flex-shrink-0" />
            ) : (
              <ChevronDown className="w-5 h-5 flex-shrink-0" />
            )}
          </button>
          <LanguageToggle
            language={language}
            onChange={setLanguage}
            ocidPrefix="about-emilie"
          />
        </div>
        {openSection === "emilie" && (
          <div className="px-2 py-1">
            <BookTextContent
              enBlocks={emilieEnBlocks}
              nlBlocks={emilieNlBlocks}
              language={language}
            />
          </div>
        )}
      </div>

      {/* Anna accordion — bilingual EN/NL toggle */}
      <div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => toggle("anna")}
            className={`${accordionBtnClass(openSection === "anna")} flex-1`}
            data-ocid="about-anna-toggle"
          >
            <span>
              The Song of Anna the Mermaid / Het Lied van Zeemeermin Anna
            </span>
            {openSection === "anna" ? (
              <ChevronUp className="w-5 h-5 flex-shrink-0" />
            ) : (
              <ChevronDown className="w-5 h-5 flex-shrink-0" />
            )}
          </button>
          <LanguageToggle
            language={language}
            onChange={setLanguage}
            ocidPrefix="about-anna"
          />
        </div>
        {openSection === "anna" && (
          <div className="px-2 py-1">
            <BookTextContent
              enBlocks={annaEnBlocks}
              nlBlocks={annaNlBlocks}
              language={language}
            />
          </div>
        )}
      </div>
    </div>
  );
}

// ── End About This Book component ────────────────────────────────────────────

// ── Side message utilities (flanking the Scribble Wall button) ──────────────

interface SideMessage {
  id: string;
  text: string;
  displayedText: string;
  charIndex: number;
  typingSpeed: number;
  phase: "typing" | "lingering" | "fading" | "done";
}

const SIDE_TYPING_SPEEDS = { slow: 120, normal: 60, fast: 25 };
const SIDE_LINGER_MS = 20000;

function sidePickSpeed(): number {
  const roll = Math.random();
  if (roll < 0.33) return SIDE_TYPING_SPEEDS.slow;
  if (roll < 0.66) return SIDE_TYPING_SPEEDS.normal;
  return SIDE_TYPING_SPEEDS.fast;
}

function getSideSlotCount(): number {
  const w = window.innerWidth;
  if (w < 768) return 0;
  if (w < 1024) return 1;
  if (w < 1440) return 2;
  return Math.random() < 0.5 ? 3 : 4;
}

function SideMessageSlot({ messages }: { messages: string[] }) {
  const [msg, setMsg] = useState<SideMessage | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lingerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fadeRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMountedRef = useRef(true);

  const startNewMessage = useCallback(() => {
    if (!isMountedRef.current || messages.length === 0) return;
    const text = messages[Math.floor(Math.random() * messages.length)];
    const speed = sidePickSpeed();
    const newMsg: SideMessage = {
      id: `${Date.now()}-${Math.random()}`,
      text,
      displayedText: "",
      charIndex: 0,
      typingSpeed: speed,
      phase: "typing",
    };
    setMsg(newMsg);
  }, [messages]);

  useEffect(() => {
    isMountedRef.current = true;
    const delay = Math.floor(Math.random() * 3000);
    const t = setTimeout(() => {
      if (isMountedRef.current) startNewMessage();
    }, delay);
    return () => {
      isMountedRef.current = false;
      clearTimeout(t);
    };
  }, [startNewMessage]);

  // Typewriter tick
  useEffect(() => {
    if (!msg || msg.phase !== "typing") return;
    timerRef.current = setInterval(() => {
      setMsg((prev) => {
        if (!prev || prev.phase !== "typing") return prev;
        const nextIdx = prev.charIndex + 1;
        const nextText = prev.text.slice(0, nextIdx);
        if (nextIdx >= prev.text.length) {
          clearInterval(timerRef.current!);
          lingerRef.current = setTimeout(() => {
            setMsg((p) => (p ? { ...p, phase: "fading" } : p));
          }, SIDE_LINGER_MS);
          return {
            ...prev,
            displayedText: nextText,
            charIndex: nextIdx,
            phase: "lingering",
          };
        }
        return { ...prev, displayedText: nextText, charIndex: nextIdx };
      });
    }, msg.typingSpeed);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [msg?.id]); // eslint-disable-line

  // Fade-out → restart
  useEffect(() => {
    if (!msg || msg.phase !== "fading") return;
    fadeRef.current = setTimeout(() => {
      setMsg((p) => (p ? { ...p, phase: "done" } : p));
      setTimeout(() => {
        if (isMountedRef.current) startNewMessage();
      }, 300);
    }, 600);
    return () => {
      if (fadeRef.current) clearTimeout(fadeRef.current);
    };
  }, [msg?.phase, startNewMessage]); // eslint-disable-line

  if (!msg || msg.phase === "done") return <div className="min-h-[60px]" />;

  const opacity = msg.phase === "fading" ? 0 : 1;

  return (
    <div
      className="text-center text-[12px] leading-relaxed px-2 py-1 transition-opacity duration-500"
      style={{
        fontFamily: "'Adobe Jenson Pro', serif",
        color: "#4b5563",
        opacity,
        minHeight: 60,
        maxWidth: 180,
        margin: "0 auto",
      }}
    >
      {msg.displayedText}
      {msg.phase === "typing" && (
        <span className="inline-block w-0.5 h-3 bg-gray-500 ml-0.5 animate-pulse align-middle" />
      )}
    </div>
  );
}

// ── End side message utilities ───────────────────────────────────────────────

// ── BookHighlightSection ───────────────────────────────────────────────────

interface BookHighlightSectionProps {
  firstProduct:
    | { name?: string; frontCoverImagePath?: string }
    | null
    | undefined;
  firstImageSrc: string;
  isFirstImageLoading: boolean;
  secondProduct:
    | { name?: string; frontCoverImagePath?: string }
    | null
    | undefined;
  secondImageSrc: string;
  isSecondImageLoading: boolean;
  amazonRegions: AmazonRegion[];
}

const FrostedPlaceholder: React.FC = () => (
  <div className="w-full aspect-[2/3] relative backdrop-blur-sm bg-white/10 border border-white/30 rounded overflow-hidden flex items-center justify-center">
    <span
      className="absolute inset-0 flex items-center justify-center text-center text-sm font-serif opacity-60 px-4 leading-tight pointer-events-none select-none"
      style={{ transform: "rotate(-30deg)", whiteSpace: "pre-line" }}
    >
      {"Cover release\nto be revealed\nsoon!"}
    </span>
  </div>
);

function BookHighlightSection({
  firstImageSrc,
  isFirstImageLoading,
  secondImageSrc,
  isSecondImageLoading,
  amazonRegions,
}: BookHighlightSectionProps) {
  const [expandedBook, setExpandedBook] = React.useState<string | null>(null);
  const { data: topfRegions = [] } = useGetAmazonRegionsByBook("topf");
  const { data: emilieRegions = [] } = useGetAmazonRegionsByBook("emilie");
  const { data: annaRegions = [] } = useGetAmazonRegionsByBook("anna");
  const { data: annaSongRegions = [] } = useGetAmazonRegionsByBook("anna-song");
  const { data: emilieNlRegions = [] } = useGetAmazonRegionsByBook("emilie-nl");
  const { data: emilieAmazonEnabled } = useGetEmilieAmazonEnabled();
  const { data: annaAmazonEnabled } = useGetAnnaAmazonEnabled();
  const { data: annaSongAmazonEnabled } = useGetAnnaSongAmazonEnabled();
  const { data: emilieNlAmazonEnabled } = useGetEmilieNlAmazonEnabled();

  const toggle = (key: string) =>
    setExpandedBook((prev) => (prev === key ? null : key));

  const isExpanded = expandedBook !== null;

  return (
    <div className="w-full">
      {/* 6-column card grid — only visible when nothing is expanded */}
      {!isExpanded && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 lg:gap-4 mb-6">
          {/* Card 1 — The Gospel of Poetic Frolic SC Signed 1st Edition */}
          <div
            className="cursor-pointer group"
            onClick={() => toggle("topf")}
            data-ocid="book-card.topf"
          >
            <div className="w-full aspect-[2/3] rounded overflow-hidden">
              {!isFirstImageLoading && firstImageSrc ? (
                <img
                  src={firstImageSrc}
                  alt="The Gospel of Poetic Frolic"
                  className="w-full h-full object-cover pointer-events-none select-none transition-transform duration-300 group-hover:scale-105"
                  onContextMenu={(e) => e.preventDefault()}
                  draggable={false}
                />
              ) : (
                <FrostedPlaceholder />
              )}
            </div>
            <p className="font-bold mt-2 text-xs lg:text-sm adobe-jenson leading-snug">
              The Gospel of Poetic Frolic
            </p>
            <p className="text-[10px] lg:text-xs text-gray-600 mt-0.5 adobe-jenson">
              SC Signed 1st Edition
            </p>
            <p className="text-[10px] italic text-gray-400 mt-1 hidden lg:block">
              Click on the book for price &amp; payment options
            </p>
          </div>

          {/* Card 2 — Amazon TGOPF Editions (own cover) */}
          <div
            className="cursor-pointer group"
            onClick={() => toggle("topf-editions")}
            data-ocid="book-card.topf-editions"
          >
            <div className="w-full aspect-[2/3] rounded overflow-hidden">
              {!isSecondImageLoading && secondImageSrc ? (
                <img
                  src={secondImageSrc}
                  alt="Amazon TGOPF Editions"
                  className="w-full h-full object-cover pointer-events-none select-none transition-transform duration-300 group-hover:scale-105"
                  onContextMenu={(e) => e.preventDefault()}
                  draggable={false}
                />
              ) : (
                <FrostedPlaceholder />
              )}
            </div>
            <p className="font-bold mt-2 text-xs lg:text-sm adobe-jenson leading-snug">
              Amazon TGOPF Editions
            </p>
            <p className="text-[10px] italic text-gray-400 mt-1 hidden lg:block">
              Click on the book for price &amp; payment options
            </p>
          </div>

          {/* Card 3 — Emilie and the Ruins of Azoth (frosted placeholder) */}
          <div
            className="cursor-pointer group"
            onClick={() => toggle("emilie")}
            data-ocid="book-card.emilie"
          >
            <FrostedPlaceholder />
            <p className="font-bold mt-2 text-xs lg:text-sm adobe-jenson leading-snug">
              Emilie and the Ruins of Azoth
            </p>
            <p className="text-[10px] lg:text-xs text-gray-600 mt-0.5 adobe-jenson">
              1st Edition
            </p>
            <p className="text-[10px] italic text-gray-400 mt-1 hidden lg:block">
              Click on the book for price &amp; payment options
            </p>
          </div>

          {/* Card 4 — Emilie en de Ruïne van Azoth (Dutch 1st edition, NEW frosted placeholder) */}
          <div
            className="cursor-pointer group"
            onClick={() => toggle("emilie-nl")}
            data-ocid="book-card.emilie-nl"
          >
            <FrostedPlaceholder />
            <p className="font-bold mt-2 text-xs lg:text-sm adobe-jenson leading-snug">
              Emilie en de Ruïne van Azoth
            </p>
            <p className="text-[10px] lg:text-xs text-gray-600 mt-0.5 adobe-jenson">
              1st Edition
            </p>
            <p className="text-[10px] italic text-gray-400 mt-1 hidden lg:block">
              Click on the book for price &amp; payment options
            </p>
          </div>

          {/* Card 5 — Het Lied van Zeemeermin Anna (Dutch, frosted placeholder, renamed) */}
          <div
            className="cursor-pointer group"
            onClick={() => toggle("anna")}
            data-ocid="book-card.anna"
          >
            <FrostedPlaceholder />
            <p className="font-bold mt-2 text-xs lg:text-sm adobe-jenson leading-snug">
              Het Lied van Zeemeermin Anna
            </p>
            <p className="text-[10px] lg:text-xs text-gray-600 mt-0.5 adobe-jenson">
              1st Edition
            </p>
            <p className="text-[10px] italic text-gray-400 mt-1 hidden lg:block">
              Click on the book for price &amp; payment options
            </p>
          </div>

          {/* Card 6 — The Song of Anna the Mermaid (English 1st edition, NEW frosted placeholder) */}
          <div
            className="cursor-pointer group"
            onClick={() => toggle("anna-song")}
            data-ocid="book-card.anna-song"
          >
            <FrostedPlaceholder />
            <p className="font-bold mt-2 text-xs lg:text-sm adobe-jenson leading-snug">
              The Song of Anna the Mermaid
            </p>
            <p className="text-[10px] lg:text-xs text-gray-600 mt-0.5 adobe-jenson">
              1st Edition
            </p>
            <p className="text-[10px] italic text-gray-400 mt-1 hidden lg:block">
              Click on the book for price &amp; payment options
            </p>
          </div>
        </div>
      )}

      {/* Expanded payment panel — all other cards are gone from layout */}
      {isExpanded && (
        <div
          className="w-full mt-2 p-6 border border-white/20 rounded-lg backdrop-blur-sm bg-white/5"
          data-ocid="book-payment-panel"
        >
          {/* Return button always at top-left */}
          <div className="flex justify-start mb-6">
            <button
              type="button"
              onClick={() => setExpandedBook(null)}
              className="flex items-center gap-2 text-sm text-gray-500 hover:text-black transition-colors duration-200 adobe-jenson"
              data-ocid="book-return-button"
            >
              <span className="text-base leading-none">←</span>
              <span>Return to the book collection</span>
            </button>
          </div>

          {/* Card 1 expanded — SC Signed 1st Edition payment flow */}
          {expandedBook === "topf" && (
            <div className="flex flex-col items-center w-full">
              <div className="w-full max-w-xs mx-auto mb-6 rounded overflow-hidden aspect-[2/3]">
                {!isFirstImageLoading && firstImageSrc ? (
                  <img
                    src={firstImageSrc}
                    alt="The Gospel of Poetic Frolic"
                    className="w-full h-full object-cover pointer-events-none select-none"
                    onContextMenu={(e) => e.preventDefault()}
                    draggable={false}
                  />
                ) : (
                  <FrostedPlaceholder />
                )}
              </div>
              <h3 className="font-bold text-xl mb-6 adobe-jenson text-center">
                The Gospel of Poetic Frolic — SC Signed 1st Edition
              </h3>
              <div className="w-full max-w-xs mx-auto">
                <PaymentCountrySelector />
              </div>
            </div>
          )}

          {/* Card 2 expanded — Amazon TGOPF Editions Amazon region selector */}
          {expandedBook === "topf-editions" && (
            <div className="flex flex-col items-center w-full">
              <div className="w-full max-w-xs mx-auto mb-6 rounded overflow-hidden aspect-[2/3]">
                {!isSecondImageLoading && secondImageSrc ? (
                  <img
                    src={secondImageSrc}
                    alt="Amazon TGOPF Editions"
                    className="w-full h-full object-cover pointer-events-none select-none"
                    onContextMenu={(e) => e.preventDefault()}
                    draggable={false}
                  />
                ) : (
                  <FrostedPlaceholder />
                )}
              </div>
              <h3 className="font-bold text-xl mb-6 adobe-jenson text-center">
                Amazon TGOPF Editions
              </h3>
              <div className="w-full max-w-xs mx-auto">
                <AmazonButtons
                  regions={
                    amazonRegions.length > 0 ? amazonRegions : topfRegions
                  }
                />
              </div>
            </div>
          )}

          {/* Card 3 expanded — Emilie 1st Edition Amazon region selector */}
          {expandedBook === "emilie" && (
            <div className="flex flex-col items-center w-full">
              <div className="w-full max-w-xs mx-auto mb-6 rounded overflow-hidden aspect-[2/3]">
                <FrostedPlaceholder />
              </div>
              <h3 className="font-bold text-xl mb-6 adobe-jenson text-center">
                Emilie and the Ruins of Azoth 1st Edition
              </h3>
              <div className="w-full max-w-xs mx-auto">
                {emilieAmazonEnabled === true ? (
                  <AmazonButtons regions={emilieRegions} />
                ) : (
                  <p
                    className="text-center text-sm italic text-gray-400 py-4 adobe-jenson"
                    data-ocid="emilie-coming-soon"
                  >
                    Coming soon — Emilie and the Ruins of Azoth is not yet
                    available on Amazon.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Card 5 expanded — Anna 1st Edition Amazon region selector */}
          {expandedBook === "anna" && (
            <div className="flex flex-col items-center w-full">
              <div className="w-full max-w-xs mx-auto mb-6 rounded overflow-hidden aspect-[2/3]">
                <FrostedPlaceholder />
              </div>
              <h3 className="font-bold text-xl mb-6 adobe-jenson text-center">
                Het Lied van Zeemeermin Anna 1st Edition
              </h3>
              <div className="w-full max-w-xs mx-auto">
                {annaAmazonEnabled === true ? (
                  <AmazonButtons regions={annaRegions} />
                ) : (
                  <p
                    className="text-center text-sm italic text-gray-400 py-4 adobe-jenson"
                    data-ocid="anna-coming-soon"
                  >
                    Coming soon — Het Lied van Zeemeermin Anna is not yet
                    available on Amazon.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Card 4 expanded — Emilie en de Ruïne van Azoth (Dutch 1st edition) Amazon region selector */}
          {expandedBook === "emilie-nl" && (
            <div className="flex flex-col items-center w-full">
              <div className="w-full max-w-xs mx-auto mb-6 rounded overflow-hidden aspect-[2/3]">
                <FrostedPlaceholder />
              </div>
              <h3 className="font-bold text-xl mb-6 adobe-jenson text-center">
                Emilie en de Ruïne van Azoth 1st Edition
              </h3>
              <div className="w-full max-w-xs mx-auto">
                {emilieNlAmazonEnabled === true ? (
                  <AmazonButtons regions={emilieNlRegions} />
                ) : (
                  <p
                    className="text-center text-sm italic text-gray-400 py-4 adobe-jenson"
                    data-ocid="emilie-nl-coming-soon"
                  >
                    Coming soon — Emilie en de Ruïne van Azoth is not yet
                    available on Amazon.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Card 6 expanded — The Song of Anna the Mermaid (English 1st edition) Amazon region selector */}
          {expandedBook === "anna-song" && (
            <div className="flex flex-col items-center w-full">
              <div className="w-full max-w-xs mx-auto mb-6 rounded overflow-hidden aspect-[2/3]">
                <FrostedPlaceholder />
              </div>
              <h3 className="font-bold text-xl mb-6 adobe-jenson text-center">
                The Song of Anna the Mermaid 1st Edition
              </h3>
              <div className="w-full max-w-xs mx-auto">
                {annaSongAmazonEnabled === true ? (
                  <AmazonButtons regions={annaSongRegions} />
                ) : (
                  <p
                    className="text-center text-sm italic text-gray-400 py-4 adobe-jenson"
                    data-ocid="anna-song-coming-soon"
                  >
                    Coming soon — The Song of Anna the Mermaid is not yet
                    available on Amazon.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── End BookHighlightSection ─────────────────────────────────────────────────

interface HomePageProps {
  onNavigateToReview: (reviewId: string) => void;
  onNavigateToPromotionalTerms: () => void;
  onNavigateToPolicy?: (policyType: PolicyType) => void;
  onNavigateToMerchandise?: () => void;
  onNavigateToScribbleWall?: () => void;
  onDataReady?: () => void;
  disableAnimations?: boolean;
  reducedSymbols?: boolean;
}

export default function HomePage({
  onNavigateToReview,
  onNavigateToPromotionalTerms,
  onNavigateToPolicy,
  onNavigateToMerchandise,
  onNavigateToScribbleWall,
  onDataReady,
  disableAnimations,
  reducedSymbols,
}: HomePageProps) {
  const { data: featuredData, isFetched: featuredFetched } =
    useGetFeaturedProducts();
  const { data: reviews, isFetched: reviewsFetched } = useGetReviews();
  const { data: textBlocks, isFetched: textBlocksFetched } =
    useGetHomepageTextBlocks();
  const { actor, isFetching } = useActor();
  const [booksQuotePos, setBooksQuotePos] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [aboutQuotePos, setAboutQuotePos] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [isMollieModalOpen, setIsMollieModalOpen] = useState(false);
  const [isRevolutModalOpen, setIsRevolutModalOpen] = useState(false);

  // Load Amazon regions from backend — shared across all visitors
  const { data: amazonRegions = [] } = useGetAmazonRegions();

  // Short messages for flanking side slots
  const { data: shortMessages = [], isFetched: shortMsgFetched } =
    useListShortMessages();
  const messageTexts = useMemo(
    () => shortMessages.map((m) => m.text),
    [shortMessages],
  );

  // Side slot count — responsive, updates on resize
  const [sideSlotCount, setSideSlotCount] = useState(() => getSideSlotCount());
  useEffect(() => {
    const onResize = () => setSideSlotCount(getSideSlotCount());
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const { leftPhotos, rightPhotos } = useGalleryCarousel();
  const aboutSectionRef = useRef<HTMLElement>(null);
  const [aboutSectionY, setAboutSectionY] = useState<number | undefined>(
    undefined,
  );

  useEffect(() => {
    const measure = () => {
      if (aboutSectionRef.current) {
        setAboutSectionY(aboutSectionRef.current.offsetTop);
      }
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  // Hide sidebar on desktop (>800px)
  const isMobile = useViewportBreakpoint(800);

  const dataReadyFiredRef = React.useRef(false);
  const actorAvailableSinceRef = React.useRef<number | null>(null);

  useEffect(() => {
    if (dataReadyFiredRef.current) return;

    const fire = () => {
      if (!dataReadyFiredRef.current) {
        dataReadyFiredRef.current = true;
        onDataReady?.();
      }
    };

    if (isFetching || !actor) {
      return;
    }

    if (actorAvailableSinceRef.current === null) {
      actorAvailableSinceRef.current = Date.now();
    }

    const essentialDataReturned =
      featuredFetched &&
      featuredData != null &&
      reviewsFetched &&
      textBlocksFetched;

    if (essentialDataReturned) {
      const fastTimer = setTimeout(fire, 300);
      return () => clearTimeout(fastTimer);
    }

    const elapsed = Date.now() - (actorAvailableSinceRef.current ?? Date.now());
    const remaining = Math.max(0, 6000 - elapsed);
    const waitTimer = setTimeout(fire, remaining);

    return () => clearTimeout(waitTimer);
  }, [
    actor,
    isFetching,
    featuredFetched,
    featuredData,
    reviewsFetched,
    textBlocksFetched,
    onDataReady,
  ]);

  const firstProduct = featuredData?.firstProduct;
  const secondProduct = featuredData?.secondProduct;

  const firstCoverPath = firstProduct?.frontCoverImagePath;
  const secondCoverPath = secondProduct?.frontCoverImagePath;

  // Gate the cover fetch on whether frontCoverImagePath exists and is non-empty,
  // NOT on the hasCustomImage boolean. A stale hasCustomImage flag must not
  // suppress a previously uploaded cover. useFileUrl disables itself when the
  // path is empty/falsy, so passing the actual path (or "") is sufficient.
  const shouldFetchFirstCover = !!firstCoverPath;
  const shouldFetchSecondCover = !!secondCoverPath;

  const { data: firstCoverUrl, isLoading: firstCoverLoading } = useFileUrl(
    shouldFetchFirstCover ? firstCoverPath : "",
  );
  const { data: secondCoverUrl, isLoading: secondCoverLoading } = useFileUrl(
    shouldFetchSecondCover ? secondCoverPath : "",
  );

  const STALE_5MIN = 5 * 60 * 1000;

  const { data: purchaseUrl } = useQuery<string>({
    queryKey: ["purchaseUrl"],
    queryFn: async () => {
      if (!actor)
        return "https://payment-links.mollie.com/payment/LuQNwLdn4JoBgHRBsupHD";
      try {
        return await actor.getPurchaseButtonUrl();
      } catch {
        return "https://payment-links.mollie.com/payment/LuQNwLdn4JoBgHRBsupHD";
      }
    },
    enabled: !!actor && !isFetching,
    staleTime: STALE_5MIN,
  });

  const { data: popupInstructions } = useQuery<{
    mollieInstruction: string;
    revolutInstruction: string;
  }>({
    queryKey: ["popupInstructions"],
    queryFn: async () => {
      if (!actor)
        return {
          mollieInstruction:
            "E-mail tgopf@pm.me or Whatsapp to +31648867766 with proof of payment & shipping details.",
          revolutInstruction:
            "Transfer €55,39 & include e-mail or phone number to contact you for your shipping details.",
        };
      try {
        return await actor.getPopupInstructions();
      } catch {
        return {
          mollieInstruction:
            "E-mail tgopf@pm.me or Whatsapp to +31648867766 with proof of payment & shipping details.",
          revolutInstruction:
            "Transfer €55,39 & include e-mail or phone number to contact you for your shipping details.",
        };
      }
    },
    enabled: !!actor && !isFetching,
    staleTime: STALE_5MIN,
  });

  const { data: revolutPayUrl } = useQuery<string>({
    queryKey: ["revolutPayUrl"],
    queryFn: async () => {
      if (!actor) return "https://revolut.me/meliciosergio";
      try {
        return await actor.getRevolutPayButtonUrl();
      } catch {
        return "https://revolut.me/meliciosergio";
      }
    },
    enabled: !!actor && !isFetching,
    staleTime: STALE_5MIN,
  });

  const { data: disclaimerText } = useQuery<string>({
    queryKey: ["disclaimerText"],
    queryFn: async () => {
      if (!actor)
        return "By making a purchase, you indicate to have read and agree with the corresponding Disclaimer, Terms & Conditions, and policies: Intellectual Property Policy, Terms & Conditions, Privacy Policy, Refund & Return Policy, Shipping & Delivery Policy, Cookie Policy, Disclaimer Liability.";
      try {
        return await actor.getDisclaimerText();
      } catch {
        return "By making a purchase, you indicate to have read and agree with the corresponding Disclaimer, Terms & Conditions, and policies: Intellectual Property Policy, Terms & Conditions, Privacy Policy, Refund & Return Policy, Shipping & Delivery Policy, Cookie Policy, Disclaimer Liability.";
      }
    },
    enabled: !!actor && !isFetching,
    staleTime: STALE_5MIN,
  });

  // Return the resolved cover URL when present. FrostedPlaceholder is shown by
  // the consumer only when frontCoverImagePath is absent/empty (i.e. no path
  // was ever set), not when hasCustomImage is false. A stale flag must not
  // hide a previously uploaded cover.
  const getFirstImageSrc = (): string => {
    if (!firstCoverPath) return "";
    if (firstCoverUrl) return firstCoverUrl;
    return "";
  };

  const getSecondImageSrc = (): string => {
    if (!secondCoverPath) return "";
    if (secondCoverUrl) return secondCoverUrl;
    return "";
  };

  const firstImageSrc = getFirstImageSrc();
  const secondImageSrc = getSecondImageSrc();
  const isFirstImageLoading =
    shouldFetchFirstCover && firstCoverLoading && !firstCoverUrl;
  const isSecondImageLoading =
    shouldFetchSecondCover && secondCoverLoading && !secondCoverUrl;

  const handlePolicyClick = (policyType: PolicyType) => {
    if (onNavigateToPolicy) {
      onNavigateToPolicy(policyType);
    }
  };

  return (
    <div className="min-h-screen">
      {/* Gallery Carousels - Desktop only, fixed sides */}
      {leftPhotos.length > 0 && (
        <GalleryCarousel
          side="left"
          photos={leftPhotos}
          fadeStartY={aboutSectionY}
          intervalMs={4000}
        />
      )}
      {rightPhotos.length > 0 && (
        <GalleryCarousel
          side="right"
          photos={rightPhotos}
          fadeStartY={aboutSectionY}
          intervalMs={4000}
        />
      )}

      {/* Fixed Sidebar Navigation - Only on HomePage and only on mobile (<=800px) */}
      {isMobile && (
        <HomeSidebarNav onNavigateToMerchandise={onNavigateToMerchandise} />
      )}

      {/* Image Gallery Slideshow - Priority: Always render immediately */}
      <section className="w-full h-[15vh] bg-gray-100 relative overflow-hidden">
        <ImageGallery className="w-full h-full" />
        <AnnouncementBlocks />
      </section>

      {/* Books Section */}
      <section
        id="the-book"
        className="py-16 px-4 bg-white relative overflow-hidden scroll-mt-24"
      >
        {!disableAnimations && (
          <BackgroundQuoteLayer
            quotes={messageTexts}
            sectionId="books"
            onQuotePositionChange={setBooksQuotePos}
          />
        )}
        {!disableAnimations && (
          <FloatingSymbolsLayer activeQuotePosition={booksQuotePos} />
        )}
        <div className="max-w-7xl mx-auto">
          <div className="relative z-10">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-black adobe-jenson">
              Sergio Melicio Proudly Presents
            </h2>

            <BookHighlightSection
              firstProduct={firstProduct}
              firstImageSrc={firstImageSrc}
              isFirstImageLoading={isFirstImageLoading}
              secondProduct={secondProduct}
              secondImageSrc={secondImageSrc}
              isSecondImageLoading={isSecondImageLoading}
              amazonRegions={amazonRegions}
            />

            {disclaimerText && (
              <div className="mt-12 text-center max-w-4xl mx-auto">
                <p className="text-xs text-gray-600 leading-relaxed">
                  {disclaimerText.split(":").map((part, index) => {
                    if (index === 0) {
                      return <span key={index}>{part}: </span>;
                    }
                    const policies = part.split(",").map((p) => p.trim());
                    return (
                      <span key={index}>
                        {policies.map((policy, pIndex) => {
                          const policyTypeMap: Record<string, PolicyType> = {
                            "Intellectual Property Policy":
                              PolicyType.intellectualProperty,
                            "Terms & Conditions": PolicyType.termsAndConditions,
                            "Privacy Policy": PolicyType.privacyPolicy,
                            "Refund & Return Policy":
                              PolicyType.refundAndReturn,
                            "Shipping & Delivery Policy":
                              PolicyType.shippingAndDelivery,
                            "Cookie Policy": PolicyType.cookiePolicy,
                            "Disclaimer Liability":
                              PolicyType.disclaimerLiability,
                          };
                          const policyType =
                            policyTypeMap[policy.replace(".", "")];
                          if (policyType) {
                            return (
                              <React.Fragment key={pIndex}>
                                <button
                                  type="button"
                                  onClick={() => handlePolicyClick(policyType)}
                                  className="text-blue-600 hover:underline"
                                >
                                  {policy.replace(".", "")}
                                </button>
                                {pIndex < policies.length - 1 && ", "}
                                {pIndex === policies.length - 1 &&
                                  policy.includes(".") &&
                                  "."}
                              </React.Fragment>
                            );
                          }
                          return (
                            <React.Fragment key={pIndex}>
                              {policy}
                              {pIndex < policies.length - 1 && ", "}
                            </React.Fragment>
                          );
                        })}
                      </span>
                    );
                  })}
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* About This Book Section */}
      <ErrorBoundary>
        <section
          ref={aboutSectionRef}
          className="py-12 px-4 bg-white relative overflow-hidden"
        >
          {!disableAnimations && (
            <BackgroundQuoteLayer
              quotes={messageTexts}
              sectionId="about"
              onQuotePositionChange={setAboutQuotePos}
            />
          )}
          {!disableAnimations && (
            <FloatingSymbolsLayer activeQuotePosition={aboutQuotePos} />
          )}
          <div className="max-w-3xl mx-auto">
            <div className="w-full text-left mb-6">
              <h2 className="text-2xl md:text-3xl font-bold text-black adobe-jenson">
                About these Books!
              </h2>
            </div>
            <AboutThisBookContent textBlocks={textBlocks} isMobile={isMobile} />
          </div>
        </section>
      </ErrorBoundary>

      {/* Scribble Wall CTA */}
      <div className="flex items-center justify-center py-8 px-4 gap-4">
        {sideSlotCount > 0 && (
          <div
            className="hidden sm:flex flex-row flex-wrap gap-2 flex-shrink-0 justify-end"
            style={{ width: sideSlotCount * 160 }}
          >
            {Array.from({ length: sideSlotCount }).map((_, i) => (
              <div key={`left-${i}`} style={{ width: 152 }}>
                <SideMessageSlot messages={messageTexts} />
              </div>
            ))}
          </div>
        )}

        <button
          type="button"
          onClick={() => onNavigateToScribbleWall?.()}
          className="px-8 py-3 rounded-full border border-black text-black bg-white hover:bg-black hover:text-white transition-all duration-300 shadow-sm hover:shadow-md text-sm font-medium adobe-jenson flex-shrink-0"
          style={{
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
          }}
          data-ocid="scribble-wall-cta"
        >
          ✦ Scribble Wall ✦
        </button>

        {sideSlotCount > 0 && (
          <div
            className="hidden sm:flex flex-row flex-wrap gap-2 flex-shrink-0 justify-start"
            style={{ width: sideSlotCount * 160 }}
          >
            {Array.from({ length: sideSlotCount }).map((_, i) => (
              <div key={`right-${i}`} style={{ width: 152 }}>
                <SideMessageSlot messages={messageTexts} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Reviews Section - Progressive */}
      <ProgressiveSection>
        <section id="what-readers-say" className="scroll-mt-24">
          <ErrorBoundary>
            <ReviewsSection
              reviews={reviews || []}
              onReviewClick={onNavigateToReview}
              disableAnimations={disableAnimations}
            />
          </ErrorBoundary>
        </section>
      </ProgressiveSection>

      {/* Roadmap Section - Progressive */}
      <ProgressiveSection>
        <section id="roadmap" className="scroll-mt-24">
          <RoadmapSection
            onNavigateToPromotionalTerms={onNavigateToPromotionalTerms}
          />
        </section>
      </ProgressiveSection>

      {/* Mollie Payment Instruction Modal */}
      <PaymentInstructionModal
        isOpen={isMollieModalOpen}
        onClose={() => setIsMollieModalOpen(false)}
        title="Mollie Payment Instructions"
        instruction={
          popupInstructions?.mollieInstruction ||
          "E-mail tgopf@pm.me or Whatsapp to +31648867766 with proof of payment & shipping details."
        }
        continueUrl={
          purchaseUrl ||
          "https://payment-links.mollie.com/payment/LuQNwLdn4JoBgHRBsupHD"
        }
      />

      {/* Revolut Payment Instruction Modal */}
      <PaymentInstructionModal
        isOpen={isRevolutModalOpen}
        onClose={() => setIsRevolutModalOpen(false)}
        title="Revolut Payment Instructions"
        instruction={
          popupInstructions?.revolutInstruction ||
          "Transfer €55,39 & include e-mail or phone number to contact you for your shipping details."
        }
        continueUrl={revolutPayUrl || "https://revolut.me/meliciosergio"}
      />
    </div>
  );
}
