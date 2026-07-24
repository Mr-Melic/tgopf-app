import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  BookOpen,
  ChevronDown,
  ChevronUp,
  Copyright,
  FileText,
  Gamepad2,
  HandCoins,
  Image,
  LayoutDashboard,
  Mail,
  Megaphone,
  MessageCircle,
  MessageSquare,
  Music,
  ScrollText,
  Settings,
  ShoppingCart,
  SmilePlus,
  Star,
  Trophy,
  Users,
  Wrench,
  Zap,
} from "lucide-react";
import type React from "react";
import { useEffect, useRef, useState } from "react";
import type { ExperienceHubTexts } from "../backend";
import AdminAnnouncementsManager from "../components/AdminAnnouncementsManager";
import AdminArtProductsManager from "../components/AdminArtProductsManager";
import AdminAuthorNotesManager from "../components/AdminAuthorNotesManager";
import AdminBackgroundMusicManager from "../components/AdminBackgroundMusicManager";
import AdminBookSalesManager from "../components/AdminBookSalesManager";
import AdminCopyrightSettings from "../components/AdminCopyrightSettings";
import AdminDictionaryManager from "../components/AdminDictionaryManager";
import AdminDonationsManager from "../components/AdminDonationsManager";
import AdminEmojiMonitor from "../components/AdminEmojiMonitor";
import AdminExperienceChallengesManager from "../components/AdminExperienceChallengesManager";
import AdminFooterSettings from "../components/AdminFooterSettings";
import AdminGamesManager from "../components/AdminGamesManager";
import AdminHomepageTextManager from "../components/AdminHomepageTextManager";
import AdminLeaderboardManager from "../components/AdminLeaderboardManager";
import AdminNewsletterManager from "../components/AdminNewsletterManager";
import AdminPaymentOptionsManager from "../components/AdminPaymentOptionsManager";
import AdminPolicyManager from "../components/AdminPolicyManager";
import AdminProductsManager from "../components/AdminProductsManager";
import {
  AdminAmazonRegionsByBook,
  AdminAmazonRegionsManager,
} from "../components/AdminProductsManager";
import AdminReflectionBlocksManager from "../components/AdminReflectionBlocksManager";
import AdminReviewsManager from "../components/AdminReviewsManager";
import AdminRewardsManager from "../components/AdminRewardsManager";
import AdminRoadmapManager from "../components/AdminRoadmapManager";
import AdminShortMessagesManager from "../components/AdminShortMessagesManager";
import AdminSystemControls from "../components/AdminSystemControls";
import ReprocessImagesTool from "../components/ReprocessImagesTool";
import AdminGalleryCarousel from "../components/admin/AdminGalleryCarousel";
import { useActor } from "../hooks/useActor";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useGetCallerUserProfile, useIsCallerAdmin } from "../hooks/useQueries";

// ─── Inline Experience Hub Texts Editor ──────────────────────────────────────

const DEFAULT_HUB_TEXTS: ExperienceHubTexts = {
  mainSubtitle: "Choose your path to earn rewards and climb the leaderboard",
  retailCardDescription:
    "Earn rewards through direct sales, referrals, and retail partnerships. Track your performance and compete with other retail ambassadors.",
  socialCardDescription:
    "Grow your influence through social media engagement, content creation, and community building. Compete on the social leaderboard.",
  gamesCardDescription:
    "Explore a collection of games curated by the author. Discover new ways to play, react to your favourites, and join the conversation.",
  retailPageSubtitle: "Top performers in retail sales and partnerships",
  socialPageSubtitle: "Top performers in social media and community engagement",
  gamesPageSubtitle: "Discover and explore games — shuffled fresh every visit.",
};

function ExperienceHubTextsEditor() {
  const { actor, isFetching } = useActor();
  const queryClient = useQueryClient();

  const { data: savedTexts } = useQuery<ExperienceHubTexts>({
    queryKey: ["experienceHubTexts"],
    queryFn: async () => {
      if (!actor) throw new Error("No actor");
      return actor.getExperienceHubTexts();
    },
    enabled: !!actor && !isFetching,
    staleTime: 60 * 1000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  const [form, setForm] = useState<ExperienceHubTexts>(DEFAULT_HUB_TEXTS);
  const [initialized, setInitialized] = useState(false);
  const [saved, setSaved] = useState(false);

  // Populate form once data loads
  if (savedTexts && !initialized) {
    setForm(savedTexts);
    setInitialized(true);
  }

  const mutation = useMutation({
    mutationFn: async (texts: ExperienceHubTexts) => {
      if (!actor) throw new Error("No actor");
      await actor.updateExperienceHubTexts(texts);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["experienceHubTexts"] });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    },
  });

  const handleChange = (field: keyof ExperienceHubTexts, value: string) => {
    setSaved(false);
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const fields: {
    key: keyof ExperienceHubTexts;
    label: string;
    multiline?: boolean;
  }[] = [
    { key: "mainSubtitle", label: "Experience Hub subtitle" },
    {
      key: "retailCardDescription",
      label: "Retail card description",
      multiline: true,
    },
    {
      key: "socialCardDescription",
      label: "Social card description",
      multiline: true,
    },
    {
      key: "gamesCardDescription",
      label: "Games card description",
      multiline: true,
    },
    { key: "retailPageSubtitle", label: "Retail page subtitle" },
    { key: "socialPageSubtitle", label: "Social page subtitle" },
    { key: "gamesPageSubtitle", label: "Games page subtitle" },
  ];

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500 mb-4">
        Edit the subtitle and card descriptions shown on the Experience Hub page
        and each section page.
      </p>
      {fields.map(({ key, label, multiline }) => (
        <div key={key}>
          <label className="block text-xs font-semibold text-gray-700 mb-1 uppercase tracking-wide">
            {label}
          </label>
          {multiline ? (
            <textarea
              value={form[key]}
              onChange={(e) => handleChange(key, e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-black resize-vertical"
              data-ocid={`hub-texts-${key}-textarea`}
            />
          ) : (
            <input
              type="text"
              value={form[key]}
              onChange={(e) => handleChange(key, e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-black"
              data-ocid={`hub-texts-${key}-input`}
            />
          )}
        </div>
      ))}

      <div className="flex items-center gap-3 pt-2">
        <button
          type="button"
          onClick={() => mutation.mutate(form)}
          disabled={mutation.isPending}
          data-ocid="hub-texts-save-btn"
          className="px-5 py-2 bg-black text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
        >
          {mutation.isPending ? "Saving…" : "Save"}
        </button>
        {saved && (
          <span
            className="text-sm text-green-600 font-medium"
            data-ocid="hub-texts-success-state"
          >
            ✓ Saved successfully
          </span>
        )}
        {mutation.isError && (
          <span
            className="text-sm text-red-600 font-medium"
            data-ocid="hub-texts-error-state"
          >
            Failed to save. Try again.
          </span>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

interface AdminDashboardProps {
  onNavigateHome: () => void;
}

type ModuleId =
  | "products"
  | "amazonRegions"
  | "scPaymentOptions"
  | "galleryCarousel"
  | "reviews"
  | "shortMessages"
  | "homepageText"
  | "artProducts"
  | "roadmap"
  | "leaderboardRetail"
  | "leaderboardSocial"
  | "rewardsRetail"
  | "rewardsSocial"
  | "bookSales"
  | "policies"
  | "backgroundMusic"
  | "copyrightSettings"
  | "footerSettings"
  | "donations"
  | "newsletter"
  | "dictionary"
  | "reflectionChallenges"
  | "authorNotes"
  | "experienceChallenges"
  | "experienceHubTexts"
  | "games"
  | "emojiMonitor"
  | "amazon-emilie"
  | "amazon-anna"
  | "amazon-anna-song"
  | "amazon-emilie-nl"
  | "announcements"
  | "systemControls"
  | "reprocessImages";

interface ModuleConfig {
  id: ModuleId;
  title: string;
  icon: React.ReactNode;
  component: () => React.ReactNode;
}

interface GroupConfig {
  id: string;
  label: string;
  accent: string;
  modules: ModuleConfig[];
}

export default function AdminDashboard({
  onNavigateHome,
}: AdminDashboardProps) {
  const { identity } = useInternetIdentity();
  const { data: userProfile, isLoading: profileLoading } =
    useGetCallerUserProfile();
  const {
    data: isAdmin,
    isLoading: adminLoading,
    isError: adminError,
    isFetching: adminFetching,
  } = useIsCallerAdmin();
  const [expandedModules, setExpandedModules] = useState<Set<ModuleId>>(
    new Set(),
  );

  // Sticky admin flag: once we have a confirmed positive result, never
  // revoke it due to a transient network error or refetch in progress.
  const confirmedAdminRef = useRef<boolean>(false);
  useEffect(() => {
    if (isAdmin === true) {
      confirmedAdminRef.current = true;
    }
  }, [isAdmin]);

  const toggleModule = (moduleId: ModuleId) => {
    setExpandedModules((prev) => {
      const next = new Set(prev);
      if (next.has(moduleId)) next.delete(moduleId);
      else next.add(moduleId);
      return next;
    });
  };

  // Show loader while identity or initial admin check is in flight
  const isInitialLoading =
    !identity || profileLoading || (adminLoading && !confirmedAdminRef.current);

  if (isInitialLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  // If there's an error state AND we've never confirmed admin, show a
  // connection problem message — NOT "Access Denied".
  if (adminError && !confirmedAdminRef.current) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center bg-white rounded-2xl shadow-lg border border-gray-200 p-10">
          <h1 className="text-2xl font-bold mb-4 text-gray-900">
            Connection Issue
          </h1>
          <p className="text-gray-600 mb-6">
            Unable to verify admin access. Please check your connection and try
            again.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-black text-white rounded-full hover:bg-gray-800 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Only show Access Denied when we have a confirmed negative result:
  // - isAdmin is explicitly false (not undefined/null)
  // - we are NOT currently loading or fetching (no in-flight check)
  // - we have NEVER seen a confirmed true from the backend
  // A refetch failure while confirmedAdminRef is true means we keep showing
  // the dashboard (admin access is sticky once earned in a session).
  const deniedConfirmed =
    !confirmedAdminRef.current &&
    (confirmedAdminRef.current || isAdmin) === false &&
    !adminLoading &&
    !adminFetching;

  if (deniedConfirmed) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center bg-white rounded-2xl shadow-lg border border-gray-200 p-10">
          <h1 className="text-2xl font-bold mb-4 text-gray-900">
            Access Denied
          </h1>
          <p className="text-gray-600 mb-6">
            You do not have permission to access the admin dashboard.
          </p>
          <button
            onClick={onNavigateHome}
            className="px-6 py-2 bg-black text-white rounded-full hover:bg-gray-800 transition-colors"
          >
            Return Home
          </button>
        </div>
      </div>
    );
  }

  // If still fetching but we previously confirmed admin, render the dashboard
  // with a subtle re-verification indicator — do NOT block or flash Access Denied.
  if (!confirmedAdminRef.current && !(confirmedAdminRef.current || isAdmin)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Verifying access...</p>
      </div>
    );
  }

  const groups: GroupConfig[] = [
    {
      id: "content",
      label: "Content",
      accent: "#b8963d",
      modules: [
        {
          id: "products",
          title: "Products",
          icon: <ShoppingCart className="w-4 h-4" />,
          component: () => <AdminProductsManager />,
        },
        {
          id: "amazonRegions",
          title: "Amazon Regions — The Gospel of Poetic Frolic",
          icon: <ShoppingCart className="w-4 h-4" />,
          component: () => <AdminAmazonRegionsManager />,
        },
        {
          id: "amazon-emilie",
          title: "Amazon Regions — Emilie and the Ruins of Azoth",
          icon: <ShoppingCart className="w-4 h-4" />,
          component: () => (
            <AdminAmazonRegionsByBook
              bookKey="emilie"
              bookTitle="Emilie and the Ruins of Azoth"
            />
          ),
        },
        {
          id: "amazon-anna",
          title: "Amazon Regions — Het Lied van Zeemeermin Anna",
          icon: <ShoppingCart className="w-4 h-4" />,
          component: () => (
            <AdminAmazonRegionsByBook
              bookKey="anna"
              bookTitle="Het Lied van Zeemeermin Anna"
            />
          ),
        },
        {
          id: "amazon-anna-song",
          title: "Amazon Regions — The Song of Anna the Mermaid",
          icon: <ShoppingCart className="w-4 h-4" />,
          component: () => (
            <AdminAmazonRegionsByBook
              bookKey="anna-song"
              bookTitle="The Song of Anna the Mermaid"
            />
          ),
        },
        {
          id: "amazon-emilie-nl",
          title: "Amazon Regions — Emilie en de Ruïne van Azoth",
          icon: <ShoppingCart className="w-4 h-4" />,
          component: () => (
            <AdminAmazonRegionsByBook
              bookKey="emilie-nl"
              bookTitle="Emilie en de Ruïne van Azoth"
            />
          ),
        },
        {
          id: "scPaymentOptions",
          title: "SC Payment Options",
          icon: <ShoppingCart className="w-4 h-4" />,
          component: () => <AdminPaymentOptionsManager />,
        },
        {
          id: "galleryCarousel",
          title: "Gallery Carousel",
          icon: <Image className="w-4 h-4" />,
          component: () => <AdminGalleryCarousel />,
        },
        {
          id: "artProducts",
          title: "Art Products",
          icon: <Star className="w-4 h-4" />,
          component: () => <AdminArtProductsManager />,
        },
        {
          id: "homepageText",
          title: "Homepage Text",
          icon: <FileText className="w-4 h-4" />,
          component: () => <AdminHomepageTextManager />,
        },
      ],
    },
    {
      id: "marketing",
      label: "Marketing",
      accent: "#6d5dfc",
      modules: [
        {
          id: "reviews",
          title: "Reviews",
          icon: <MessageSquare className="w-4 h-4" />,
          component: () => <AdminReviewsManager />,
        },
        {
          id: "shortMessages",
          title: "Short Messages",
          icon: <MessageCircle className="w-4 h-4" />,
          component: () => <AdminShortMessagesManager />,
        },
        {
          id: "announcements",
          title: "Announcements",
          icon: <Megaphone className="w-4 h-4" />,
          component: () => <AdminAnnouncementsManager />,
        },
      ],
    },
    {
      id: "interactive",
      label: "Interactive",
      accent: "#16a34a",
      modules: [
        {
          id: "dictionary",
          title: "Vocabulary / Dictionary",
          icon: <BookOpen className="w-4 h-4" />,
          component: () => <AdminDictionaryManager />,
        },
        {
          id: "reflectionChallenges",
          title: "Reflection Challenges",
          icon: <ScrollText className="w-4 h-4" />,
          component: () => <AdminReflectionBlocksManager />,
        },
        {
          id: "authorNotes",
          title: "Author's Notes",
          icon: <FileText className="w-4 h-4" />,
          component: () => <AdminAuthorNotesManager />,
        },
        {
          id: "experienceChallenges",
          title: "Experience Challenges",
          icon: <Zap className="w-4 h-4" />,
          component: () => <AdminExperienceChallengesManager />,
        },
        {
          id: "experienceHubTexts",
          title: "Experience Hub Texts",
          icon: <FileText className="w-4 h-4" />,
          component: () => <ExperienceHubTextsEditor />,
        },
        {
          id: "games",
          title: "Games",
          icon: <Gamepad2 className="w-4 h-4" />,
          component: () => <AdminGamesManager />,
        },
        {
          id: "emojiMonitor",
          title: "Emoji Reaction Monitor",
          icon: <SmilePlus className="w-4 h-4" />,
          component: () => <AdminEmojiMonitor />,
        },
      ],
    },
    {
      id: "commerce",
      label: "Commerce",
      accent: "#2563eb",
      modules: [
        {
          id: "bookSales",
          title: "Book Sales",
          icon: <ShoppingCart className="w-4 h-4" />,
          component: () => <AdminBookSalesManager />,
        },
        {
          id: "roadmap",
          title: "Roadmap",
          icon: <LayoutDashboard className="w-4 h-4" />,
          component: () => <AdminRoadmapManager />,
        },
        {
          id: "leaderboardRetail",
          title: "Leaderboard · Retail",
          icon: <Trophy className="w-4 h-4" />,
          component: () => <AdminLeaderboardManager leaderboardType="retail" />,
        },
        {
          id: "leaderboardSocial",
          title: "Leaderboard · Social",
          icon: <Trophy className="w-4 h-4" />,
          component: () => <AdminLeaderboardManager leaderboardType="social" />,
        },
        {
          id: "rewardsRetail",
          title: "Rewards · Retail",
          icon: <Star className="w-4 h-4" />,
          component: () => <AdminRewardsManager pageType="retail" />,
        },
        {
          id: "rewardsSocial",
          title: "Rewards · Social",
          icon: <Star className="w-4 h-4" />,
          component: () => <AdminRewardsManager pageType="social" />,
        },
      ],
    },
    {
      id: "system",
      label: "System",
      accent: "#0f172a",
      modules: [
        {
          id: "systemControls",
          title: "System Controls",
          icon: <Settings className="w-4 h-4" />,
          component: () => <AdminSystemControls />,
        },
        {
          id: "reprocessImages",
          title: "Reprocess Migrated Images (V417 to WebP)",
          icon: <Wrench className="w-4 h-4" />,
          component: () => <ReprocessImagesTool />,
        },
      ],
    },
    {
      id: "settings",
      label: "Settings",
      accent: "#dc2626",
      modules: [
        {
          id: "policies",
          title: "Policies & Legal",
          icon: <ScrollText className="w-4 h-4" />,
          component: () => <AdminPolicyManager />,
        },
        {
          id: "backgroundMusic",
          title: "Background Music",
          icon: <Music className="w-4 h-4" />,
          component: () => <AdminBackgroundMusicManager />,
        },
        {
          id: "copyrightSettings",
          title: "Copyright & Legal Notice",
          icon: <Copyright className="w-4 h-4" />,
          component: () => <AdminCopyrightSettings />,
        },
        {
          id: "footerSettings",
          title: "Footer Settings",
          icon: <Settings className="w-4 h-4" />,
          component: () => <AdminFooterSettings />,
        },
        {
          id: "donations",
          title: "Donations",
          icon: <HandCoins className="w-4 h-4" />,
          component: () => <AdminDonationsManager />,
        },
        {
          id: "newsletter",
          title: "Newsletter List",
          icon: <Mail className="w-4 h-4" />,
          component: () => <AdminNewsletterManager />,
        },
      ],
    },
  ];

  return (
    <div
      className="min-h-screen bg-gray-50 text-gray-900"
      style={{ colorScheme: "light" }}
    >
      {/* Dashboard Header */}
      <div className="border-b border-gray-200 bg-white sticky top-0 z-10 shadow-sm">
        <div className="max-w-5xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <LayoutDashboard className="w-5 h-5 text-amber-600" />
            <div>
              <h1 className="text-lg font-bold text-gray-900 leading-none">
                Admin Dashboard
              </h1>
              <p className="text-xs text-gray-500 mt-0.5">
                {userProfile?.name ||
                  `${identity?.getPrincipal()?.toText()?.slice(0, 12)}...` ||
                  "Administrator"}
              </p>
            </div>
          </div>
          <button
            onClick={onNavigateHome}
            className="px-4 py-2 text-sm bg-gray-900 text-white border border-gray-900 rounded-full hover:bg-gray-700 transition-colors"
            data-ocid="admin-back-home-btn"
          >
            ← Back to Site
          </button>
        </div>
      </div>

      {/* Group sections */}
      <div className="max-w-5xl mx-auto px-6 py-8 space-y-10">
        {groups.map((group) => (
          <section key={group.id} data-ocid={`admin-group-${group.id}`}>
            {/* Group header */}
            <div className="flex items-center gap-3 mb-4">
              <div
                className="w-1 h-5 rounded-full flex-shrink-0"
                style={{ backgroundColor: group.accent }}
              />
              <h2
                className="text-xs font-bold uppercase tracking-widest"
                style={{ color: group.accent }}
              >
                {group.label}
              </h2>
              <div className="flex-1 h-px bg-gray-200" />
            </div>

            {/* Module cards */}
            <div className="space-y-2">
              {group.modules.map((module) => {
                const isExpanded = expandedModules.has(module.id);
                return (
                  <div
                    key={module.id}
                    className="rounded-xl border border-gray-200 bg-white overflow-hidden transition-all duration-200 shadow-sm"
                    data-ocid={`admin-module-${module.id}`}
                  >
                    <button
                      type="button"
                      onClick={() => toggleModule(module.id)}
                      className="w-full px-5 py-3.5 flex items-center justify-between hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className="p-1.5 rounded-lg flex-shrink-0"
                          style={{
                            backgroundColor: isExpanded
                              ? `${group.accent}1a`
                              : "#f3f4f6",
                            color: isExpanded ? group.accent : "#6b7280",
                          }}
                        >
                          {module.icon}
                        </span>
                        <span
                          className="text-sm font-medium"
                          style={{
                            color: isExpanded ? group.accent : "#111827",
                          }}
                        >
                          {module.title}
                        </span>
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      )}
                    </button>

                    {isExpanded && (
                      <div className="px-5 py-5 border-t border-gray-200 bg-white text-gray-900">
                        {module.component()}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
