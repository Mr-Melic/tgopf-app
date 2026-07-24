import React, { useState, useRef, useEffect } from "react";
import { useHeaderNavCollision } from "../hooks/useHeaderNavCollision";
import { useIsCallerAdmin, useListShortMessages } from "../hooks/useQueries";
import AmbassadorLoginButton from "./AmbassadorLoginButton";
import TypewriterMessage from "./TypewriterMessage";

/** Three speed tiers for the typewriter animation */
const TYPING_SPEEDS = {
  slow: 85,
  normal: 45,
  fast: 18,
} as const;

function pickRandomTypingSpeed(): number {
  const tiers = Object.values(TYPING_SPEEDS);
  return tiers[Math.floor(Math.random() * tiers.length)];
}

interface NavigationProps {
  currentPage: string;
  onNavigate: (
    page:
      | "home"
      | "cart"
      | "dictionary"
      | "reflection-challenges"
      | "author-notes"
      | "merchandise",
  ) => void;
  onNavigateToAmbassador: () => void;
  onNavigateToAdmin: () => void;
  onNavigateToDictionary: () => void;
  onNavigateToReflectionChallenges: () => void;
  onNavigateToAuthorNotes: () => void;
  onNavigateToMerchandise: () => void;
  isAuthenticated: boolean;
}

function CyclingTitle() {
  const CYCLING_TITLES = [
    { text: "The Gospel of Poetic Frolic", color: "inherit" },
    { text: "Emilie and the Ruins of Azoth", color: "#5C3317" },
    { text: "Emilie en de Ruïne van Azoth", color: "#5C3317" },
    { text: "The Song of Anna the Mermaid", color: "#FFB6C1" },
    { text: "Het Lied van Zeemeermin Anna", color: "#FFB6C1" },
  ] as const;

  type Slot = { text: string; color: string; opacity: number };

  const indexRef = useRef(0);
  const [slotA, setSlotA] = useState<Slot>({
    text: CYCLING_TITLES[0].text,
    color: CYCLING_TITLES[0].color,
    opacity: 1,
  });
  const [slotB, setSlotB] = useState<Slot>({
    text: CYCLING_TITLES[1].text,
    color: CYCLING_TITLES[1].color,
    opacity: 0,
  });
  const [active, setActive] = useState<"a" | "b">("a");

  useEffect(() => {
    const interval = setInterval(() => {
      const nextIndex = (indexRef.current + 1) % CYCLING_TITLES.length;
      indexRef.current = nextIndex;
      const next = CYCLING_TITLES[nextIndex];

      if (active === "a") {
        // Pre-load text into slot B (currently hidden), then cross-fade
        setSlotB({ text: next.text, color: next.color, opacity: 0 });
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            setSlotA((s) => ({ ...s, opacity: 0 }));
            setSlotB({ text: next.text, color: next.color, opacity: 1 });
            setTimeout(() => setActive("b"), 620);
          });
        });
      } else {
        setSlotA({ text: next.text, color: next.color, opacity: 0 });
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            setSlotB((s) => ({ ...s, opacity: 0 }));
            setSlotA({ text: next.text, color: next.color, opacity: 1 });
            setTimeout(() => setActive("a"), 620);
          });
        });
      }
    }, 4000);
    return () => clearInterval(interval);
  }, [active]); // eslint-disable-line react-hooks/exhaustive-deps

  // Longest title used as ghost to maintain stable container width.
  // "The Song of Anna the Mermaid" is the longest of the five titles, so the
  // ghost reserves enough width for every entry without jitter.
  const longestTitle = "The Song of Anna the Mermaid";

  return (
    <span
      className="header-title adobe-jenson whitespace-nowrap"
      style={{ position: "relative", display: "inline-block" }}
    >
      {/* Ghost span keeps width stable */}
      <span style={{ visibility: "hidden", whiteSpace: "nowrap" }}>
        {longestTitle}
      </span>
      {/* Slot A */}
      <span
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          whiteSpace: "nowrap",
          color: slotA.color === "inherit" ? undefined : slotA.color,
          opacity: slotA.opacity,
          transition: "opacity 600ms ease-in-out",
          pointerEvents: "none",
        }}
      >
        {slotA.text}
      </span>
      {/* Slot B */}
      <span
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          whiteSpace: "nowrap",
          color: slotB.color === "inherit" ? undefined : slotB.color,
          opacity: slotB.opacity,
          transition: "opacity 600ms ease-in-out",
          pointerEvents: "none",
        }}
      >
        {slotB.text}
      </span>
    </span>
  );
}

export default function Navigation({
  currentPage,
  onNavigate,
  onNavigateToAmbassador,
  onNavigateToAdmin,
  onNavigateToDictionary,
  onNavigateToReflectionChallenges,
  onNavigateToAuthorNotes,
  onNavigateToMerchandise,
  isAuthenticated,
}: NavigationProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { data: isAdmin, isLoading: isAdminLoading } = useIsCallerAdmin();
  const { data: shortMessages } = useListShortMessages();

  // Header short message — typewriter cycle, true random selection + random speed
  const [headerMsgIndex, setHeaderMsgIndex] = useState(0);
  const [headerMsgKey, setHeaderMsgKey] = useState(0); // force remount on message change
  const [headerTypingSpeed, setHeaderTypingSpeed] = useState<number>(
    pickRandomTypingSpeed(),
  );

  useEffect(() => {
    if (!shortMessages || shortMessages.length === 0) return;
    setHeaderMsgIndex(Math.floor(Math.random() * shortMessages.length));
    setHeaderTypingSpeed(pickRandomTypingSpeed());
  }, [shortMessages?.length]);

  const handleHeaderCycleEnd = () => {
    if (!shortMessages || shortMessages.length === 0) return;
    const nextSpeed = pickRandomTypingSpeed();
    setHeaderMsgIndex(Math.floor(Math.random() * shortMessages.length));
    setHeaderTypingSpeed(nextSpeed);
    setHeaderMsgKey((k) => k + 1);
  };

  const currentHeaderMessage =
    shortMessages && shortMessages.length > 0
      ? shortMessages[headerMsgIndex]
      : null;

  const titleRef = useRef<HTMLButtonElement>(null);
  const navRef = useRef<HTMLElement>(null);

  // Collapse nav into 4-dot menu when there is not enough space
  const shouldCollapseNav = useHeaderNavCollision({
    titleRef,
    navRef,
    safetyMargin: 64,
  });

  const toggleMobileMenu = () => setIsMobileMenuOpen((o) => !o);

  const handleAmbassadorClick = () => {
    if (isAuthenticated) {
      onNavigateToAmbassador();
      setIsMobileMenuOpen(false);
    }
  };

  const handleAdminClick = () => {
    if (isAuthenticated && isAdmin) {
      onNavigateToAdmin();
      setIsMobileMenuOpen(false);
    }
  };

  const handleHomeClick = () => {
    onNavigate("home");
    setIsMobileMenuOpen(false);
  };

  const handleDictionaryClick = () => {
    onNavigateToDictionary();
    setIsMobileMenuOpen(false);
  };

  const handleReflectionChallengesClick = () => {
    onNavigateToReflectionChallenges();
    setIsMobileMenuOpen(false);
  };

  const handleAuthorNotesClick = () => {
    onNavigateToAuthorNotes();
    setIsMobileMenuOpen(false);
  };

  const handleMerchandiseClick = () => {
    onNavigateToMerchandise();
    setIsMobileMenuOpen(false);
  };

  const navBtnClass =
    "px-3 py-1.5 rounded-full font-medium text-sm frosted-glass text-black hover:bg-black/20 transition-all duration-300";

  return (
    <header className="fixed top-0 left-0 right-0 frosted-glass shadow-md z-50 header-compact">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-3">
          {/* Title — always pinned left, shrink to fit */}
          <button
            ref={titleRef}
            onClick={handleHomeClick}
            className="flex flex-col items-start flex-shrink-0"
          >
            <h1
              className="header-title adobe-jenson whitespace-nowrap"
              style={{ display: "block" }}
            >
              <CyclingTitle />
            </h1>
            <p className="header-subtitle whitespace-nowrap">
              BY LE ROYALTIES SERGIO MELICIO
            </p>
          </button>

          {/* Short message in header — desktop only, up to 3 lines, fits within header height */}
          {currentHeaderMessage && (
            <div
              className="hidden lg:flex flex-1 items-center overflow-hidden"
              style={{ marginLeft: "50px", minWidth: 0 }}
            >
              <p
                className="adobe-jenson"
                style={{
                  fontSize: "0.68rem",
                  lineHeight: "1.2",
                  color: "rgba(0,0,0,0.55)",
                  fontStyle: "italic",
                  maxWidth: "100%",
                  wordBreak: "break-word",
                  display: "-webkit-box",
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                }}
              >
                <TypewriterMessage
                  key={`header-msg-${headerMsgKey}-${headerMsgIndex}`}
                  text={currentHeaderMessage.text}
                  typingSpeed={headerTypingSpeed}
                  lingerDuration={12000}
                  clearDuration={200}
                  onCycleEnd={handleHeaderCycleEnd}
                />
              </p>
            </div>
          )}

          {/* Desktop nav — only rendered (and measured) when not collapsed */}
          {!shouldCollapseNav && (
            <nav
              ref={navRef}
              className="hidden md:flex items-center space-x-2 flex-shrink-0"
            >
              <button onClick={handleMerchandiseClick} className={navBtnClass}>
                Merchandise
              </button>

              <button onClick={handleDictionaryClick} className={navBtnClass}>
                Vocabulary
              </button>

              <button
                onClick={handleReflectionChallengesClick}
                className={navBtnClass}
              >
                Reflection Challenges
              </button>

              <button
                onClick={handleAuthorNotesClick}
                className={navBtnClass}
                data-ocid="author-notes-nav-btn"
              >
                Author's Notes
              </button>

              <button
                onClick={handleAmbassadorClick}
                disabled={!isAuthenticated}
                className={`px-3 py-1.5 rounded-full font-medium text-sm transition-all duration-300 ${
                  isAuthenticated
                    ? "frosted-glass text-black hover:bg-black/20"
                    : "bg-gray-200/70 text-gray-400 cursor-not-allowed backdrop-blur-sm border border-gray-300/30"
                }`}
              >
                Experience Hub
              </button>

              {isAuthenticated && isAdmin && !isAdminLoading && (
                <button onClick={handleAdminClick} className={navBtnClass}>
                  Admin Dashboard
                </button>
              )}

              <AmbassadorLoginButton />
            </nav>
          )}

          {/* 4-dot menu — always shown when collapsed (or on mobile/md) */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* When not collapsed on desktop, the nav above already has the login button */}
            {shouldCollapseNav && (
              <div className="hidden md:block">
                <AmbassadorLoginButton />
              </div>
            )}
            <button
              onClick={toggleMobileMenu}
              className="flex p-2 rounded-lg hover:bg-black/10 transition-colors"
              aria-label="Toggle menu"
              data-ocid="header-menu-toggle"
            >
              <div className="grid grid-cols-2 gap-1 w-6 h-6">
                <div className="w-2 h-2 bg-black rounded-full" />
                <div className="w-2 h-2 bg-black rounded-full" />
                <div className="w-2 h-2 bg-black rounded-full" />
                <div className="w-2 h-2 bg-black rounded-full" />
              </div>
            </button>
          </div>
        </div>

        {/* Dropdown menu */}
        {isMobileMenuOpen && (
          <div className="py-4 border-t border-white/30">
            <nav className="flex flex-col space-y-2">
              <button
                onClick={handleMerchandiseClick}
                className="px-3 py-1.5 rounded-full font-medium text-sm frosted-glass text-black hover:bg-black/20 transition-all duration-300 text-center"
              >
                Merchandise
              </button>

              <button
                onClick={handleDictionaryClick}
                className="px-3 py-1.5 rounded-full font-medium text-sm frosted-glass text-black hover:bg-black/20 transition-all duration-300 text-center"
              >
                Vocabulary
              </button>

              <button
                onClick={handleReflectionChallengesClick}
                className="px-3 py-1.5 rounded-full font-medium text-sm frosted-glass text-black hover:bg-black/20 transition-all duration-300 text-center"
              >
                Reflection Challenges
              </button>

              <button
                onClick={handleAuthorNotesClick}
                className="px-3 py-1.5 rounded-full font-medium text-sm frosted-glass text-black hover:bg-black/20 transition-all duration-300 text-center"
                data-ocid="author-notes-mobile-nav-btn"
              >
                Author's Notes
              </button>

              <button
                onClick={handleAmbassadorClick}
                disabled={!isAuthenticated}
                className={`px-3 py-1.5 rounded-full font-medium text-sm transition-all duration-300 text-center ${
                  isAuthenticated
                    ? "frosted-glass text-black hover:bg-black/20"
                    : "bg-gray-200/70 text-gray-400 cursor-not-allowed backdrop-blur-sm border border-gray-300/30"
                }`}
              >
                Experience Hub
              </button>

              {isAuthenticated && isAdmin && !isAdminLoading && (
                <button
                  onClick={handleAdminClick}
                  className="px-3 py-1.5 rounded-full font-medium text-sm frosted-glass text-black hover:bg-black/20 transition-all duration-300 text-center"
                >
                  Admin Dashboard
                </button>
              )}

              <div className="flex justify-center pt-1">
                <AmbassadorLoginButton />
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
