import { Linkedin } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import {
  SiDiscord,
  SiFacebook,
  SiInstagram,
  SiMedium,
  SiTelegram,
  SiTiktok,
  SiX,
} from "react-icons/si";
import { PolicyType } from "./backend";
import AppErrorFallback from "./components/AppErrorFallback";
import BackgroundMusicPlayer from "./components/BackgroundMusicPlayer";
import ErrorBoundary from "./components/ErrorBoundary";
import HomepageMediaPreloader from "./components/HomepageMediaPreloader";
import LoadingScreen from "./components/LoadingScreen";
import Navigation from "./components/Navigation";
import TypewriterMessage from "./components/TypewriterMessage";
import { Toaster } from "./components/ui/sonner";
import { useActor } from "./hooks/useActor";
import { CartProvider } from "./hooks/useCart";
import { useInternetIdentity } from "./hooks/useInternetIdentity";
import {
  useGetCopyrightSettings,
  useGetFooterSettings,
  useGetMyNewsletterSubscription,
  useGetReviews,
  useListDonations,
  useListShortMessages,
  useSubscribeToNewsletter,
  useUnsubscribeFromNewsletter,
} from "./hooks/useQueries";
import HomePage from "./pages/HomePage";
const AdminDashboard = React.lazy(() => import("./pages/AdminDashboard"));
const AmbassadorHubPage = React.lazy(() => import("./pages/AmbassadorHubPage"));
const AuthorNotesPage = React.lazy(() => import("./pages/AuthorNotesPage"));
const CartPage = React.lazy(() => import("./pages/CartPage"));
const DictionaryPage = React.lazy(() => import("./pages/DictionaryPage"));
const GamesPage = React.lazy(() => import("./pages/GamesPage"));
const MerchandisePage = React.lazy(() => import("./pages/MerchandisePage"));
const PaymentFailure = React.lazy(() => import("./pages/PaymentFailure"));
const PaymentSuccess = React.lazy(() => import("./pages/PaymentSuccess"));
const PolicyPage = React.lazy(() => import("./pages/PolicyPage"));
const PromotionalTermsPage = React.lazy(
  () => import("./pages/PromotionalTermsPage"),
);
const ReflectionChallengesPage = React.lazy(
  () => import("./pages/ReflectionChallengesPage"),
);
const RetailPage = React.lazy(() => import("./pages/RetailPage"));
const ReviewDetailPage = React.lazy(() => import("./pages/ReviewDetailPage"));
const ScribbleWallPage = React.lazy(() => import("./pages/ScribbleWallPage"));
const SocialPage = React.lazy(() => import("./pages/SocialPage"));
import { useAdaptiveLoading } from "./hooks/useAdaptiveLoading";
import { hasCachedQueryData } from "./utils/queryPersister";
import { generateRandomColor } from "./utils/randomColor";

type Page =
  | "home"
  | "ambassador"
  | "retail"
  | "social"
  | "games"
  | "admin"
  | "cart"
  | "payment-success"
  | "payment-failure"
  | "policy"
  | "promotional-terms"
  | "review"
  | "dictionary"
  | "reflection-challenges"
  | "author-notes"
  | "merchandise"
  | "scribble-wall";

interface SocialIconState {
  isBuzzing: boolean;
  color: string;
}

function App() {
  const { identity, isInitializing } = useInternetIdentity();
  const adaptiveConfig = useAdaptiveLoading();
  const [currentPage, setCurrentPage] = React.useState<Page>("home");
  const [currentPolicyType, setCurrentPolicyType] = React.useState<PolicyType>(
    PolicyType.intellectualProperty,
  );
  const [currentReviewId, setCurrentReviewId] = React.useState<string>("");

  // ── Loading gate state ─────────────────────────────────────────────────────
  // Three independent gates that must ALL be true before loading screen fades.
  // The loading screen is a fixed overlay — the main app tree ALWAYS mounts so
  // React Query hooks fire immediately and populate the cache before the overlay
  // disappears. This prevents the "blank page after loading screen" bug.
  const [isPreloadComplete, setIsPreloadComplete] = React.useState(false);
  const [isDataReady, setIsDataReady] = React.useState(false);
  // showLoadingOverlay: controls whether the DOM overlay exists at all.
  // Set to false AFTER the CSS fade completes (500ms after shouldDismiss=true).
  const [showLoadingOverlay, setShowLoadingOverlay] = React.useState(true);
  const [loadingProgress, setLoadingProgress] = React.useState(0);
  // showFooter: footer only mounts 600ms AFTER the loading overlay is removed.
  // This prevents footer queries from competing with homepage queries during the
  // critical first-render window, which was causing blank pages after the loading
  // screen faded (footer queries starved the homepage queries on initial load).
  const [showFooter, setShowFooter] = React.useState(false);
  const [footerQueriesEnabled, setFooterQueriesEnabled] = React.useState(false);
  const [footerMuted, setFooterMuted] = React.useState(
    () => localStorage.getItem("tgopf_mute") === "true",
  );
  const toggleFooterMute = () => {
    const newMuted = !footerMuted;
    setFooterMuted(newMuted);
    localStorage.setItem("tgopf_mute", String(newMuted));
    window.dispatchEvent(
      new StorageEvent("storage", {
        key: "tgopf_mute",
        newValue: String(newMuted),
      }),
    );
  };

  // ── Smart loading screen skip for return visitors ──────────────────────────
  // If IndexedDB has cached React Query data, skip the full loading sequence
  // and show the homepage immediately (with a brief fade).
  const [hasCachedData, setHasCachedData] = React.useState(false);
  const [cacheChecked, setCacheChecked] = React.useState(false);

  useEffect(() => {
    hasCachedQueryData().then((hasCache) => {
      setHasCachedData(hasCache);
      setCacheChecked(true);
    });
  }, []);

  // Refs for smooth interpolation and hard fallback
  const smoothProgressRef = React.useRef(0);
  const interpolationFrameRef = React.useRef<number | null>(null);
  const hardFallbackFiredRef = React.useRef(false);
  const progressTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const pendingProgressRef = React.useRef(0);

  const { data: reviews } = useGetReviews();
  // Footer queries are gated behind footerQueriesEnabled which only becomes
  // true 1500ms AFTER the loading screen is fully dismissed. This ensures
  // homepage queries always have priority during the critical startup window.
  const { data: shortMessages } = useListShortMessages({
    enabled: footerQueriesEnabled,
  });
  const { data: copyrightSettings } = useGetCopyrightSettings({
    enabled: footerQueriesEnabled,
  });
  const { data: footerSettings } = useGetFooterSettings({
    enabled: footerQueriesEnabled,
  });
  const { data: mySubscription } = useGetMyNewsletterSubscription();
  const subscribeMutation = useSubscribeToNewsletter();
  const unsubscribeMutation = useUnsubscribeFromNewsletter();
  const { data: donations = [] } = useListDonations({
    enabled: footerQueriesEnabled,
  });

  // Scroll to top on every page change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  }, [currentPage]);

  // ── Smooth progress interpolation ──────────────────────────────────────────
  // Throttled to 100ms max frequency — CSS transition handles visual smoothness
  const setProgressSmooth = React.useCallback((target: number) => {
    const clampedTarget = Math.min(100, Math.max(0, target));
    // Only advance, never regress
    if (clampedTarget <= smoothProgressRef.current) return;
    smoothProgressRef.current = clampedTarget;
    pendingProgressRef.current = clampedTarget;

    if (progressTimeoutRef.current !== null) return; // already scheduled

    progressTimeoutRef.current = setTimeout(() => {
      progressTimeoutRef.current = null;
      setLoadingProgress(pendingProgressRef.current);
    }, 100);
  }, []);

  // ── HARD FALLBACK: dismiss loading screen after 20s no matter what ─────────
  // This fires ALL gates unconditionally so the overlay always goes away.
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!hardFallbackFiredRef.current) {
        hardFallbackFiredRef.current = true;
        console.warn(
          "[App] Hard fallback: forcing loading screen dismiss after 20s",
        );
        setIsPreloadComplete(true);
        setIsDataReady(true);
        setLoadingProgress(100);
      }
    }, 20000);
    return () => clearTimeout(timer);
  }, []);

  // Newsletter state
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [newsletterError, setNewsletterError] = useState("");
  const [newsletterSuccess, setNewsletterSuccess] = useState(false);
  const [showUnsubscribeConfirm, setShowUnsubscribeConfirm] = useState(false);

  const isAuthenticated = !!identity;

  // Footer short message — typewriter cycle, true random, independent from header
  const [footerMsgIndex, setFooterMsgIndex] = useState(0);
  const [footerMsgKey, setFooterMsgKey] = useState(0); // force TypewriterMessage remount

  const handleFooterCycleEnd = () => {
    if (!shortMessages || shortMessages.length === 0) return;
    setFooterMsgIndex(Math.floor(Math.random() * shortMessages.length));
    setFooterMsgKey((k) => k + 1);
  };

  // Pick initial random index when messages first load
  useEffect(() => {
    if (!shortMessages || shortMessages.length === 0) return;
    setFooterMsgIndex(Math.floor(Math.random() * shortMessages.length));
  }, [shortMessages?.length]);

  // Social icon buzz state
  const [socialIconStates, setSocialIconStates] = React.useState<
    Record<string, SocialIconState>
  >({
    facebook: { isBuzzing: false, color: "" },
    linkedin: { isBuzzing: false, color: "" },
    instagram: { isBuzzing: false, color: "" },
    x: { isBuzzing: false, color: "" },
    tiktok: { isBuzzing: false, color: "" },
    discord: { isBuzzing: false, color: "" },
    telegram: { isBuzzing: false, color: "" },
    medium: { isBuzzing: false, color: "" },
  });

  const buzzTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);

  // Handle preload completion
  const handlePreloadComplete = () => {
    setIsPreloadComplete(true);
    // Image phase complete → interpolate to 85%
    setProgressSmooth(85);
  };

  // Handle loading screen dismissal — remove overlay from DOM after fade,
  // then mount footer 600ms later so its queries don't starve homepage queries.
  const handleLoadingScreenDismiss = () => {
    setShowLoadingOverlay(false);
    // Delay footer mount until after the loading screen is fully gone and
    // homepage queries have had time to settle in the cache.
    setTimeout(() => setShowFooter(true), 600);
  };

  // Footer queries get an extra 1500ms delay after footer mounts to ensure
  // zero competition with homepage queries during the critical load window.
  React.useEffect(() => {
    if (!showFooter) {
      setFooterQueriesEnabled(false);
      return;
    }
    const timer = setTimeout(() => setFooterQueriesEnabled(true), 1500);
    return () => clearTimeout(timer);
  }, [showFooter]);

  // All three gates must pass before dismissing
  const shouldDismissLoadingScreen =
    !isInitializing && isPreloadComplete && isDataReady;

  // Return visitor with cached data — skip full loading sequence
  useEffect(() => {
    if (cacheChecked && hasCachedData) {
      setShowLoadingOverlay(false);
      setShowFooter(true);
      setLoadingProgress(100);
    }
  }, [cacheChecked, hasCachedData]);

  // Stage 3: data ready → interpolate 85% → 95%, then snap to 100%
  React.useEffect(() => {
    if (isDataReady) {
      setProgressSmooth(95);
      const timer = setTimeout(() => {
        setProgressSmooth(100);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isDataReady, setProgressSmooth]);

  // Cleanup timers on unmount
  React.useEffect(() => {
    return () => {
      if (progressTimeoutRef.current !== null) {
        clearTimeout(progressTimeoutRef.current);
      }
    };
  }, []);

  const currentFooterMessage =
    shortMessages && shortMessages.length > 0
      ? shortMessages[footerMsgIndex]
      : null;

  // Social icon buzz effect
  useEffect(() => {
    isMountedRef.current = true;

    const scheduleBuzz = () => {
      if (!isMountedRef.current) return;

      // Random interval between 3 and 12 seconds
      const interval = 3000 + Math.random() * 9000;

      buzzTimerRef.current = setTimeout(() => {
        if (!isMountedRef.current) return;

        // Select 1-3 random icons
        const iconKeys = [
          "facebook",
          "linkedin",
          "instagram",
          "x",
          "tiktok",
          "discord",
          "telegram",
          "medium",
        ];
        const numIconsToBuzz = 1 + Math.floor(Math.random() * 3); // 1, 2, or 3
        const selectedIcons: string[] = [];

        // Randomly select distinct icons
        while (
          selectedIcons.length < numIconsToBuzz &&
          selectedIcons.length < iconKeys.length
        ) {
          const randomIcon =
            iconKeys[Math.floor(Math.random() * iconKeys.length)];
          if (!selectedIcons.includes(randomIcon)) {
            selectedIcons.push(randomIcon);
          }
        }

        // Apply buzz and random color to selected icons
        setSocialIconStates((prev) => {
          const newStates = { ...prev };
          for (const icon of selectedIcons) {
            newStates[icon] = {
              isBuzzing: true,
              color: generateRandomColor(),
            };
          }
          return newStates;
        });

        // Remove buzz after animation duration (~600ms)
        setTimeout(() => {
          if (!isMountedRef.current) return;
          setSocialIconStates((prev) => {
            const newStates = { ...prev };
            for (const icon of selectedIcons) {
              newStates[icon] = {
                isBuzzing: false,
                color: "",
              };
            }
            return newStates;
          });
        }, 600);

        // Schedule next buzz
        scheduleBuzz();
      }, interval);
    };

    scheduleBuzz();

    return () => {
      isMountedRef.current = false;
      if (buzzTimerRef.current) {
        clearTimeout(buzzTimerRef.current);
      }
    };
  }, []);

  // Global right-click protection on public pages
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest(".admin-panel")) {
        e.preventDefault();
      }
    };
    document.addEventListener("contextmenu", handleContextMenu);
    return () => document.removeEventListener("contextmenu", handleContextMenu);
  }, []);

  // Newsletter helpers
  const validateEmail = (email: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  const handleNewsletterSubscribe = () => {
    setNewsletterError("");
    if (!validateEmail(newsletterEmail)) {
      setNewsletterError("Please enter a valid email address.");
      return;
    }
    subscribeMutation.mutate(newsletterEmail.trim(), {
      onSuccess: () => {
        setNewsletterSuccess(true);
        setNewsletterEmail("");
      },
      onError: (err) => {
        setNewsletterError(
          err instanceof Error ? err.message : "Failed to subscribe.",
        );
      },
    });
  };

  const handleNewsletterUnsubscribe = () => {
    unsubscribeMutation.mutate(undefined, {
      onSuccess: () => {
        setShowUnsubscribeConfirm(false);
      },
    });
  };

  const handleNavigateToAmbassador = () => {
    if (!isAuthenticated) {
      return;
    }
    setCurrentPage("ambassador");
  };

  const handleNavigateToAdmin = () => {
    if (!isAuthenticated) {
      return;
    }
    setCurrentPage("admin");
  };

  const handleNavigateToPolicy = (policyType: PolicyType) => {
    setCurrentPolicyType(policyType);
    setCurrentPage("policy");
  };

  const handleNavigateToReview = (reviewId: string) => {
    setCurrentReviewId(reviewId);
    setCurrentPage("review");
  };

  const handleNavigateToPromotionalTerms = () => {
    setCurrentPage("promotional-terms");
  };

  const handleNavigateToDictionary = () => {
    setCurrentPage("dictionary");
  };

  const handleNavigateToReflectionChallenges = () => {
    setCurrentPage("reflection-challenges");
  };

  const handleNavigateToAuthorNotes = () => {
    setCurrentPage("author-notes");
  };

  const handleNavigateToMerchandise = () => {
    setCurrentPage("merchandise");
  };

  const handleNavigateToScribbleWall = () => {
    setCurrentPage("scribble-wall");
  };

  const handleNavigate = (
    page:
      | "home"
      | "cart"
      | "dictionary"
      | "reflection-challenges"
      | "author-notes"
      | "merchandise"
      | "scribble-wall",
  ) => {
    if (page === "home") {
      setCurrentPage("home");
    } else if (page === "cart") {
      setCurrentPage("cart");
    } else if (page === "dictionary") {
      setCurrentPage("dictionary");
    } else if (page === "reflection-challenges") {
      setCurrentPage("reflection-challenges");
    } else if (page === "author-notes") {
      setCurrentPage("author-notes");
    } else if (page === "merchandise") {
      setCurrentPage("merchandise");
    } else if (page === "scribble-wall") {
      setCurrentPage("scribble-wall");
    }
  };

  const renderPage = () => {
    switch (currentPage) {
      case "home":
        // HomePage is always mounted via the keep-alive wrapper below.
        // This case is never hit because currentPage==='home' is handled
        // by the always-mounted homepage branch. Returning null here
        // keeps the switch exhaustive without rendering a second copy.
        return null;
      case "dictionary":
        return <DictionaryPage onNavigateHome={() => setCurrentPage("home")} />;
      case "reflection-challenges":
        return (
          <ReflectionChallengesPage
            onNavigateHome={() => setCurrentPage("home")}
          />
        );
      case "author-notes":
        return (
          <AuthorNotesPage onNavigateHome={() => setCurrentPage("home")} />
        );
      case "merchandise":
        return (
          <MerchandisePage onNavigateHome={() => setCurrentPage("home")} />
        );
      case "scribble-wall":
        return (
          <ScribbleWallPage onNavigateHome={() => setCurrentPage("home")} />
        );
      case "ambassador":
        if (!isAuthenticated) {
          // Redirect unauthenticated users to home (keep-alive wrapper shows it)
          setCurrentPage("home");
          return null;
        }
        return (
          <AmbassadorHubPage
            onNavigateToRetail={() => setCurrentPage("retail")}
            onNavigateToSocial={() => setCurrentPage("social")}
            onNavigateToGames={() => setCurrentPage("games")}
            onNavigateHome={() => setCurrentPage("home")}
          />
        );
      case "retail":
        if (!isAuthenticated) {
          setCurrentPage("home");
          return null;
        }
        return (
          <RetailPage
            onNavigateHome={() => setCurrentPage("home")}
            onNavigateToAmbassadorHub={() => setCurrentPage("ambassador")}
          />
        );
      case "social":
        if (!isAuthenticated) {
          setCurrentPage("home");
          return null;
        }
        return (
          <SocialPage
            onNavigateHome={() => setCurrentPage("home")}
            onNavigateToAmbassadorHub={() => setCurrentPage("ambassador")}
          />
        );
      case "games":
        return (
          <GamesPage
            onNavigateHome={() => setCurrentPage("home")}
            onNavigateToAmbassadorHub={() => setCurrentPage("ambassador")}
            onNavigateToLogin={handleNavigateToAmbassador}
          />
        );
      case "admin":
        if (!isAuthenticated) {
          setCurrentPage("home");
          return null;
        }
        return <AdminDashboard onNavigateHome={() => setCurrentPage("home")} />;
      case "cart":
        return <CartPage onNavigateHome={() => setCurrentPage("home")} />;
      case "payment-success":
        return <PaymentSuccess onNavigateHome={() => setCurrentPage("home")} />;
      case "payment-failure":
        return <PaymentFailure onNavigateHome={() => setCurrentPage("home")} />;
      case "policy":
        return (
          <PolicyPage
            policyType={currentPolicyType}
            onNavigateHome={() => setCurrentPage("home")}
          />
        );
      case "promotional-terms":
        return (
          <PromotionalTermsPage onNavigateHome={() => setCurrentPage("home")} />
        );
      case "review": {
        const currentReview =
          reviews?.find((r) => r.id === currentReviewId) || null;
        return (
          <ReviewDetailPage
            review={currentReview}
            onNavigateHome={() => setCurrentPage("home")}
          />
        );
      }
      default:
        // Fallback to home via keep-alive wrapper
        setCurrentPage("home");
        return null;
    }
  };

  const getSocialIconStyle = (iconKey: string) => {
    const state = socialIconStates[iconKey];
    return {
      color: state.color || "currentColor",
      transition: "color 0.3s ease",
    };
  };

  // ── ARCHITECTURE NOTE ──────────────────────────────────────────────────────
  // The loading screen is a FIXED OVERLAY on top of the main app tree.
  // The main app tree (Navigation + HomePage + footer) ALWAYS mounts immediately.
  // This means React Query hooks in HomePage fire right away, populating the
  // cache. When the loading overlay removes itself after the fade, the homepage
  // already has its data and renders fully — no blank page.
  //
  // Previous pattern (early return with hidden div) caused the bug:
  //   Branch-A tree (loading) was entirely unmounted when Branch-B (loaded)
  //   mounted, so query caches had to re-fetch from scratch on the fresh mount.
  // ──────────────────────────────────────────────────────────────────────────

  return (
    <CartProvider>
      <ErrorBoundary fallback={<AppErrorFallback />}>
        {/* ── Loading overlay — sits on top, removed from DOM after fade ── */}
        {/* Skip loading screen entirely for return visitors with cached data */}
        {showLoadingOverlay && !(cacheChecked && hasCachedData) && (
          <LoadingScreen
            onDismiss={handleLoadingScreenDismiss}
            shouldDismiss={shouldDismissLoadingScreen}
            progress={loadingProgress}
          />
        )}

        {/* ── Media preloader — mounts as soon as actor is initialised ── */}
        {!isInitializing && (
          <HomepageMediaPreloader
            onComplete={handlePreloadComplete}
            onProgressUpdate={(pct) => setProgressSmooth(pct)}
          />
        )}

        {/* ── Main app tree — ALWAYS mounted, even while loading overlay shows ── */}
        <div className="min-h-screen bg-white">
          {/* ── Keep-alive homepage wrapper ────────────────────────────────────
               HomePage is ALWAYS mounted but hidden with CSS when not active.
               This prevents unmounting/remounting on navigation, preserving
               all animation timers, floating symbols, carousel state, etc.
          ───────────────────────────────────────────────────────────────────── */}
          <div
            style={{
              display: currentPage === "home" ? "block" : "none",
              visibility: currentPage === "home" ? "visible" : "hidden",
            }}
          >
            <Navigation
              currentPage={currentPage}
              onNavigate={handleNavigate}
              onNavigateToAmbassador={handleNavigateToAmbassador}
              onNavigateToAdmin={handleNavigateToAdmin}
              onNavigateToDictionary={handleNavigateToDictionary}
              onNavigateToReflectionChallenges={
                handleNavigateToReflectionChallenges
              }
              onNavigateToAuthorNotes={handleNavigateToAuthorNotes}
              onNavigateToMerchandise={handleNavigateToMerchandise}
              isAuthenticated={isAuthenticated}
            />

            <BackgroundMusicPlayer />

            <main className="pt-20">
              <HomePage
                onNavigateToReview={handleNavigateToReview}
                onNavigateToPromotionalTerms={handleNavigateToPromotionalTerms}
                onNavigateToPolicy={handleNavigateToPolicy}
                onNavigateToMerchandise={handleNavigateToMerchandise}
                onNavigateToScribbleWall={handleNavigateToScribbleWall}
                onDataReady={() => setIsDataReady(true)}
                disableAnimations={adaptiveConfig.disableAnimations}
                reducedSymbols={adaptiveConfig.reducedSymbols}
              />
            </main>
          </div>

          {/* ── Non-home pages render on top when active ─────────────────────── */}
          {currentPage !== "home" && (
            <>
              <Navigation
                currentPage={currentPage}
                onNavigate={handleNavigate}
                onNavigateToAmbassador={handleNavigateToAmbassador}
                onNavigateToAdmin={handleNavigateToAdmin}
                onNavigateToDictionary={handleNavigateToDictionary}
                onNavigateToReflectionChallenges={
                  handleNavigateToReflectionChallenges
                }
                onNavigateToAuthorNotes={handleNavigateToAuthorNotes}
                onNavigateToMerchandise={handleNavigateToMerchandise}
                isAuthenticated={isAuthenticated}
              />

              <BackgroundMusicPlayer />

              <main className="pt-20">{renderPage()}</main>
            </>
          )}

          {/* ── Footer ───────────────────────────────────────────────────────
               Footer renders for both home and non-home pages.
               When on a non-home page, it sits inside the non-home fragment
               so it renders on top of the hidden homepage.
          ───────────────────────────────────────────────────────────────────── */}
          {showFooter && (
            <footer
              id="socials-info"
              className="bg-black text-white py-12 mt-20 scroll-mt-24"
            >
              <div className="max-w-6xl mx-auto px-4">
                <div className="grid md:grid-cols-3 gap-8 mb-8">
                  {/* Business details — dynamic from admin */}
                  <div>
                    <h3 className="text-xl font-bold mb-4 text-white">
                      The Gospel of Poetic Frolic
                    </h3>
                    <p className="text-gray-300 leading-relaxed mb-6">
                      {footerSettings?.footerCaption ??
                        "Sergio Melicio's first published poetry bundle, crafted with love and innerness."}
                    </p>

                    <div className="text-sm text-gray-400 space-y-1">
                      <p>
                        <strong className="text-gray-300">Business:</strong>{" "}
                        {footerSettings?.businessName ??
                          "Le Royalties Sergio Melicio"}
                      </p>
                      <p>
                        <strong className="text-gray-300">Address:</strong>{" "}
                        {footerSettings?.businessAddress ??
                          "Rotterdam, The Netherlands"}
                      </p>
                      <p>
                        <strong className="text-gray-300">Tax ID:</strong>{" "}
                        {footerSettings?.businessTaxId ?? "NL005317123B43"}
                      </p>
                      <p>
                        <strong className="text-gray-300">KVK:</strong>{" "}
                        {footerSettings?.businessKvk ?? "98223216"}
                      </p>
                      <p>
                        <strong className="text-gray-300">IBAN:</strong>{" "}
                        {footerSettings?.businessIban ??
                          "NL08 RABO 0155 3288 24"}
                      </p>
                      <p>
                        <strong className="text-gray-300">Email:</strong>{" "}
                        {footerSettings?.businessEmail ?? "tgopf@pm.me"}
                      </p>
                      <p>
                        <strong className="text-gray-300">WhatsApp:</strong>{" "}
                        {footerSettings?.businessPhone ?? "+31 6 48867766"}
                      </p>
                    </div>
                  </div>

                  {/* Social icons + rotating messages */}
                  <div>
                    <h3 className="text-xl font-bold mb-4 text-white">
                      Connect with me
                    </h3>
                    <div className="flex flex-wrap gap-4">
                      <a
                        href="https://www.facebook.com/melicio.sergio"
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`text-white hover:text-gray-300 transition-colors ${
                          socialIconStates.facebook.isBuzzing
                            ? "animate-buzz"
                            : ""
                        }`}
                        style={getSocialIconStyle("facebook")}
                        aria-label="Facebook"
                      >
                        <SiFacebook size={28} />
                      </a>
                      <a
                        href="https://nl.linkedin.com/in/melicio"
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`text-white hover:text-gray-300 transition-colors ${
                          socialIconStates.linkedin.isBuzzing
                            ? "animate-buzz"
                            : ""
                        }`}
                        style={getSocialIconStyle("linkedin")}
                        aria-label="LinkedIn"
                      >
                        <Linkedin size={28} />
                      </a>
                      <a
                        href="https://www.instagram.com/melicio_sergio"
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`text-white hover:text-gray-300 transition-colors ${
                          socialIconStates.instagram.isBuzzing
                            ? "animate-buzz"
                            : ""
                        }`}
                        style={getSocialIconStyle("instagram")}
                        aria-label="Instagram"
                      >
                        <SiInstagram size={28} />
                      </a>
                      <a
                        href="https://x.com/melicio_sergio"
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`text-white hover:text-gray-300 transition-colors ${
                          socialIconStates.x.isBuzzing ? "animate-buzz" : ""
                        }`}
                        style={getSocialIconStyle("x")}
                        aria-label="X (Twitter)"
                      >
                        <SiX size={28} />
                      </a>
                      <a
                        href="https://www.tiktok.com/@tgopf_book"
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`text-white hover:text-gray-300 transition-colors ${
                          socialIconStates.tiktok.isBuzzing
                            ? "animate-buzz"
                            : ""
                        }`}
                        style={getSocialIconStyle("tiktok")}
                        aria-label="TikTok"
                      >
                        <SiTiktok size={28} />
                      </a>
                      <a
                        href="https://discord.gg/SWTUwv6CM"
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`text-white hover:text-gray-300 transition-colors ${
                          socialIconStates.discord.isBuzzing
                            ? "animate-buzz"
                            : ""
                        }`}
                        style={getSocialIconStyle("discord")}
                        aria-label="Discord"
                      >
                        <SiDiscord size={28} />
                      </a>
                      <a
                        href="https://t.me/tgopf_book"
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`text-white hover:text-gray-300 transition-colors ${
                          socialIconStates.telegram.isBuzzing
                            ? "animate-buzz"
                            : ""
                        }`}
                        style={getSocialIconStyle("telegram")}
                        aria-label="Telegram"
                      >
                        <SiTelegram size={28} />
                      </a>
                      <a
                        href="https://medium.com/@meliciosergiobel"
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`text-white hover:text-gray-300 transition-colors ${
                          socialIconStates.medium.isBuzzing
                            ? "animate-buzz"
                            : ""
                        }`}
                        style={getSocialIconStyle("medium")}
                        aria-label="Medium"
                      >
                        <SiMedium size={28} />
                      </a>
                    </div>

                    {/* Rotating short messages below social buttons — typewriter effect */}
                    {currentFooterMessage && (
                      <div className="mt-5 max-w-xs">
                        <p
                          className="text-sm leading-relaxed adobe-jenson"
                          style={{ color: "rgba(255,255,255,0.8)" }}
                        >
                          <TypewriterMessage
                            key={`footer-msg-${footerMsgKey}-${footerMsgIndex}`}
                            text={currentFooterMessage.text}
                            typingSpeed={45}
                            lingerDuration={12000}
                            clearDuration={200}
                            onCycleEnd={handleFooterCycleEnd}
                          />
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Newsletter signup */}
                  <div>
                    <h3 className="text-xl font-bold mb-4 text-white">
                      Newsletter
                    </h3>
                    {!isAuthenticated ? (
                      <div>
                        <p className="text-sm text-gray-400 mb-2">
                          Sign up for our newsletter:
                        </p>
                        <p className="text-xs text-gray-500 italic">
                          Log in to subscribe for exclusive updates.
                        </p>
                      </div>
                    ) : mySubscription ? (
                      <div>
                        <p className="text-sm text-gray-300 mb-1">
                          You are subscribed as:
                        </p>
                        <p className="text-xs text-gray-400 mb-3 break-all">
                          {mySubscription.email}
                        </p>
                        {showUnsubscribeConfirm ? (
                          <div className="space-y-2">
                            <p className="text-xs text-gray-300">
                              Are you sure you want to unsubscribe?
                            </p>
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={handleNewsletterUnsubscribe}
                                disabled={unsubscribeMutation.isPending}
                                className="text-xs px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                                data-ocid="newsletter-confirm-unsub"
                              >
                                {unsubscribeMutation.isPending
                                  ? "Removing…"
                                  : "Yes, remove me"}
                              </button>
                              <button
                                type="button"
                                onClick={() => setShowUnsubscribeConfirm(false)}
                                className="text-xs px-3 py-1.5 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-800 transition-colors"
                                data-ocid="newsletter-cancel-unsub"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setShowUnsubscribeConfirm(true)}
                            className="text-xs text-red-400 hover:text-red-300 underline transition-colors"
                            data-ocid="newsletter-unsub-btn"
                          >
                            Remove me from the Newsletter
                          </button>
                        )}
                      </div>
                    ) : (
                      <div>
                        <p className="text-sm text-gray-400 mb-3">
                          Sign up for our newsletter:
                        </p>
                        {newsletterSuccess ? (
                          <p className="text-sm text-green-400">
                            ✓ You're subscribed!
                          </p>
                        ) : (
                          <div className="space-y-2">
                            <input
                              type="email"
                              value={newsletterEmail}
                              onChange={(e) => {
                                setNewsletterEmail(e.target.value);
                                setNewsletterError("");
                              }}
                              onKeyDown={(e) => {
                                if (e.key === "Enter")
                                  handleNewsletterSubscribe();
                              }}
                              placeholder="your@email.com"
                              className="w-full px-3 py-2 text-sm text-black rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-white/30"
                              data-ocid="newsletter-email-input"
                            />
                            {newsletterError && (
                              <p className="text-xs text-red-400">
                                {newsletterError}
                              </p>
                            )}
                            <button
                              type="button"
                              onClick={handleNewsletterSubscribe}
                              disabled={subscribeMutation.isPending}
                              className="w-full px-4 py-2 bg-white text-black text-sm font-semibold rounded-lg hover:bg-gray-200 transition-colors"
                              data-ocid="newsletter-subscribe-btn"
                            >
                              {subscribeMutation.isPending
                                ? "Subscribing…"
                                : "Subscribe"}
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Donations section — shown only when at least one donation entry exists */}
                {donations.length > 0 &&
                  (() => {
                    const col1 = donations
                      .filter((d) => d.column === 1)
                      .sort((a, b) => a.position - b.position)
                      .slice(0, 6);
                    const col2 = donations
                      .filter((d) => d.column === 2)
                      .sort((a, b) => a.position - b.position)
                      .slice(0, 6);
                    const col3 = donations
                      .filter((d) => d.column === 3)
                      .sort((a, b) => a.position - b.position)
                      .slice(0, 6);
                    const activeCols = [col1, col2, col3].filter(
                      (c) => c.length > 0,
                    );
                    if (activeCols.length === 0) return null;
                    return (
                      <div className="donations-copyable border-t border-gray-800 pt-8 mb-8">
                        <h3 className="text-xl font-bold mb-5 text-white">
                          Donations
                        </h3>
                        <div
                          className="grid gap-6"
                          style={{
                            gridTemplateColumns: `repeat(${activeCols.length}, minmax(0, 1fr))`,
                          }}
                        >
                          {[col1, col2, col3].map((col, colIdx) => {
                            if (col.length === 0) return null;
                            return (
                              <div key={colIdx} className="space-y-2">
                                {col.map((entry) => (
                                  <div key={entry.id} className="text-sm">
                                    <span className="font-semibold text-gray-300">
                                      {entry.name}:
                                    </span>{" "}
                                    {entry.address.startsWith("http") ? (
                                      <a
                                        href={entry.address}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-gray-400 hover:text-white transition-colors underline break-all"
                                      >
                                        {entry.address}
                                      </a>
                                    ) : (
                                      <span className="text-gray-400 break-all">
                                        {entry.address}
                                      </span>
                                    )}
                                  </div>
                                ))}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })()}

                <div className="border-t border-gray-700 pt-8 text-center text-sm text-gray-400">
                  {/* Dynamic copyright line */}
                  <p className="mb-2">
                    {(() => {
                      const line =
                        copyrightSettings?.copyrightLine ??
                        "© {startYear} - {currentYear} The Gospel of Poetic Frolic / Le Royalties Sergio Melicio. All rights reserved.";
                      const startYear = copyrightSettings?.startYear ?? 2025;
                      const yearColor =
                        copyrightSettings?.yearColor ?? "#ec4899";
                      const currentYear = new Date().getFullYear();
                      // Replace startYear placeholder first
                      const withStart = line.replace(
                        "{startYear}",
                        String(startYear),
                      );
                      // Split on either {currentYear} or {year} — backend may store either token
                      const splitToken = withStart.includes("{currentYear}")
                        ? "{currentYear}"
                        : "{year}";
                      const parts = withStart.split(splitToken);
                      if (parts.length === 1) return <span>{withStart}</span>;
                      return (
                        <>
                          {parts[0]}
                          <span
                            style={{ color: yearColor }}
                            className="font-semibold"
                          >
                            {currentYear}
                          </span>
                          {parts[1]}
                        </>
                      );
                    })()}
                  </p>

                  {/* Legal text paragraphs — always show, use default when backend returns empty */}
                  {(() => {
                    const DEFAULT_LEGAL = `All content contained within this publication, website, and associated web applications; including but not limited to text, imagery, design, layout, source code, and audiovisual material; is protected under the copyright laws of the Kingdom of the Netherlands (Auteurswet), applicable European Union directives, and international treaties including the Berne Convention and the WIPO Copyright Treaty.

No portion of this work may be reproduced, distributed, publicly communicated, adapted, or otherwise exploited in any form or by any means; whether electronic, mechanical, photographic, or digital; without the prior express written consent of the rights holder.

This work, in whole or in part, may not be used to train, develop, fine-tune, or otherwise inform any artificial intelligence system, machine learning model, large language model, generative algorithm, or data-mining technology; whether commercial or non-commercial in nature. Any such use constitutes an infringement of the rights holder's exclusive rights under applicable law, including Article 4 of Directive (EU) 2019/790 (DSM Directive), and is expressly opted out of pursuant to Article 4(3) thereof.

Unauthorized use, duplication, distribution, scraping, indexing, or exhibition of any protected material may result in civil liability and criminal prosecution under Dutch and international law.`;
                    const legalText =
                      copyrightSettings?.legalText || DEFAULT_LEGAL;
                    return (
                      <div className="mt-4 mb-6 max-w-3xl mx-auto text-left space-y-3">
                        {legalText.split(/\n\s*\n/).map((para, i) => (
                          <p
                            key={i}
                            className="text-xs leading-relaxed adobe-jenson"
                            style={{ color: "rgba(156,163,175,0.85)" }}
                          >
                            {para.trim()}
                          </p>
                        ))}
                      </div>
                    );
                  })()}

                  <div className="flex flex-wrap justify-center gap-4 text-xs">
                    <button
                      type="button"
                      onClick={() =>
                        handleNavigateToPolicy(PolicyType.intellectualProperty)
                      }
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      Intellectual Property
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        handleNavigateToPolicy(PolicyType.termsAndConditions)
                      }
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      Terms & Conditions
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        handleNavigateToPolicy(PolicyType.privacyPolicy)
                      }
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      Privacy Policy
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        handleNavigateToPolicy(PolicyType.refundAndReturn)
                      }
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      Refund & Return
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        handleNavigateToPolicy(PolicyType.shippingAndDelivery)
                      }
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      Shipping & Delivery
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        handleNavigateToPolicy(PolicyType.cookiePolicy)
                      }
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      Cookie Policy
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        handleNavigateToPolicy(PolicyType.disclaimerLiability)
                      }
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      Disclaimer Liability
                    </button>
                  </div>
                </div>
              </div>
              <div className="flex justify-center mt-4">
                <button
                  type="button"
                  onClick={toggleFooterMute}
                  title={footerMuted ? "Turn sound on" : "Turn sound off"}
                  className="text-xs opacity-50 hover:opacity-100 transition-opacity cursor-pointer px-3 py-1.5 rounded-full border border-current/20 select-none"
                  style={{ color: "rgba(156,163,175,0.85)" }}
                >
                  {footerMuted ? "🔇 Sound Off" : "🔊 Sound On"}
                </button>
              </div>
            </footer>
          )}

          <Toaster />
        </div>
      </ErrorBoundary>
    </CartProvider>
  );
}

export default App;
