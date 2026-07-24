import {
  BookOpen,
  MessageSquare,
  Share2,
  ShoppingBag,
  TrendingUp,
} from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { useCollapsedIconBuzz } from "../hooks/useCollapsedIconBuzz";

interface HomeSidebarNavProps {
  onNavigateToMerchandise?: () => void;
}

export default function HomeSidebarNav({
  onNavigateToMerchandise,
}: HomeSidebarNavProps) {
  const navRef = useRef<HTMLDivElement>(null);
  const [headerHeight, setHeaderHeight] = useState(0);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const navItems = [
    { id: "the-book", label: "The Book", icon: BookOpen, section: true },
    {
      id: "merchandise",
      label: "Merchandise",
      icon: ShoppingBag,
      section: false,
      navigate: true,
    },
    {
      id: "what-readers-say",
      label: "What Readers Say",
      icon: MessageSquare,
      section: true,
    },
    {
      id: "roadmap",
      label: "Roadmap to 250 Reviews",
      icon: TrendingUp,
      section: true,
    },
    {
      id: "socials-info",
      label: "Socials & Info",
      icon: Share2,
      section: true,
    },
  ];

  const iconIds = navItems.map((item) => item.id);

  // Detect collapsed state based on viewport width
  useEffect(() => {
    const checkCollapsed = () => {
      setIsCollapsed(window.innerWidth < 1280);
    };

    checkCollapsed();
    window.addEventListener("resize", checkCollapsed);

    return () => {
      window.removeEventListener("resize", checkCollapsed);
    };
  }, []);

  const { getIconBuzzState } = useCollapsedIconBuzz({
    iconIds,
    isCollapsed,
  });

  useEffect(() => {
    const measureHeader = () => {
      const header = document.querySelector("header");
      if (header) {
        setHeaderHeight(header.offsetHeight);
      }
    };

    measureHeader();
    window.addEventListener("resize", measureHeader);

    return () => {
      window.removeEventListener("resize", measureHeader);
    };
  }, []);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (!element) {
      console.warn(`Section with id "${sectionId}" not found`);
      return;
    }

    const headerOffset = headerHeight || 100;
    const elementPosition = element.getBoundingClientRect().top;
    const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

    window.scrollTo({
      top: offsetPosition,
      behavior: "smooth",
    });
  };

  const handleItemClick = (item: (typeof navItems)[number]) => {
    if (item.navigate && onNavigateToMerchandise) {
      onNavigateToMerchandise();
    } else if (item.section) {
      scrollToSection(item.id);
    }
  };

  return (
    <nav
      ref={navRef}
      className="hidden lg:block fixed left-4 top-1/2 -translate-y-1/2 z-40"
    >
      <div className="frosted-glass-sidebar rounded-2xl shadow-lg p-2 xl:p-3">
        <div className="flex flex-col gap-1.5 xl:gap-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const buzzState = getIconBuzzState(item.id);

            return (
              <button
                key={item.id}
                onClick={() => handleItemClick(item)}
                className={`group flex items-center gap-2 xl:gap-3 px-2.5 py-2 xl:px-4 xl:py-3 rounded-xl hover:bg-black hover:text-white transition-all duration-300 text-left ${
                  buzzState.isBuzzing ? "animate-shake" : ""
                }`}
                aria-label={`Navigate to ${item.label}`}
              >
                <Icon
                  className="w-4 h-4 xl:w-5 xl:h-5 flex-shrink-0"
                  style={{
                    color: buzzState.color || "currentColor",
                    transition: "color 0.3s ease",
                  }}
                />
                <span className="text-xs xl:text-sm font-medium whitespace-nowrap hidden xl:inline">
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
