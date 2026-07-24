import React, { useState, useRef, useEffect } from "react";

export interface AmazonRegion {
  id: string;
  country: string;
  domain: string;
  kindleLink: string;
  paperbackLink: string;
  hardcoverLink: string;
  kindleButtonText: string;
  paperbackButtonText: string;
  hardcoverButtonText: string;
  kindleButtonColor: string;
  paperbackButtonColor: string;
  hardcoverButtonColor: string;
  kindleFontColor: string;
  paperbackFontColor: string;
  hardcoverFontColor: string;
  showKindleUnlimited: boolean;
  currencySymbol: string;
  kindlePrice: string;
  paperbackPrice: string;
  hardcoverPrice: string;
  enabled: boolean;
}

function makeRegion(
  id: string,
  country: string,
  domain: string,
  kindleLink: string,
  paperbackLink: string,
  hardcoverLink: string,
  currencySymbol: string,
): AmazonRegion {
  return {
    id,
    country,
    domain,
    kindleLink,
    paperbackLink,
    hardcoverLink,
    kindleButtonText: "Kindle e-Book",
    paperbackButtonText: "AMZ Paperback",
    hardcoverButtonText: "Special Ilustr. Hardcover",
    kindleButtonColor: "#FF9900",
    paperbackButtonColor: "#FF9900",
    hardcoverButtonColor: "#1a1a1a",
    kindleFontColor: "#000000",
    paperbackFontColor: "#000000",
    hardcoverFontColor: "#C9A84C",
    showKindleUnlimited: true,
    currencySymbol,
    kindlePrice: "4.99",
    paperbackPrice: "10.99",
    hardcoverPrice: "69.99",
    enabled: true,
  };
}

export const DEFAULT_AMAZON_REGIONS: AmazonRegion[] = [
  makeRegion(
    "au",
    "Australia",
    "www.amazon.com.au",
    "https://www.amazon.com.au/dp/B0GNN2N55K",
    "https://www.amazon.com.au/dp/B0GNJ1MMW4",
    "https://www.amazon.com.au/dp/B0GQ372WBH",
    "A$",
  ),
  makeRegion(
    "be",
    "Belgium",
    "www.amazon.com.be",
    "https://www.amazon.com.be/dp/B0GNN2N55K",
    "https://www.amazon.com.be/dp/B0GNJ1MMW4",
    "https://www.amazon.com.be/dp/B0GQ372WBH",
    "€",
  ),
  makeRegion(
    "br",
    "Brazil",
    "www.amazon.com.br",
    "https://www.amazon.com.br/dp/B0GNN2N55K",
    "https://www.amazon.com.br/dp/B0GNJ1MMW4",
    "https://www.amazon.com.br/dp/B0GQ372WBH",
    "R$",
  ),
  makeRegion(
    "ca",
    "Canada",
    "www.amazon.ca",
    "https://www.amazon.ca/dp/B0GNN2N55K",
    "https://www.amazon.ca/dp/B0GNJ1MMW4",
    "https://www.amazon.ca/dp/B0GQ372WBH",
    "CA$",
  ),
  makeRegion(
    "cn",
    "China",
    "www.amazon.cn",
    "https://www.amazon.cn/dp/B0GNN2N55K",
    "https://www.amazon.cn/dp/B0GNJ1MMW4",
    "https://www.amazon.cn/dp/B0GQ372WBH",
    "¥",
  ),
  makeRegion(
    "eg",
    "Egypt",
    "www.amazon.eg",
    "https://www.amazon.eg/dp/B0GNN2N55K",
    "https://www.amazon.eg/dp/B0GNJ1MMW4",
    "https://www.amazon.eg/dp/B0GQ372WBH",
    "EGP",
  ),
  makeRegion(
    "fr",
    "France",
    "www.amazon.fr",
    "https://www.amazon.fr/dp/B0GNN2N55K",
    "https://www.amazon.fr/dp/B0GNJ1MMW4",
    "https://www.amazon.fr/dp/B0GQ372WBH",
    "€",
  ),
  makeRegion(
    "de",
    "Germany",
    "www.amazon.de",
    "https://www.amazon.de/dp/B0GNN2N55K",
    "https://www.amazon.de/dp/B0GNJ1MMW4",
    "https://www.amazon.de/dp/B0GQ372WBH",
    "€",
  ),
  makeRegion(
    "in",
    "India",
    "www.amazon.in",
    "https://www.amazon.in/dp/B0GNN2N55K",
    "https://www.amazon.in/dp/B0GNJ1MMW4",
    "https://www.amazon.in/dp/B0GQ372WBH",
    "₹",
  ),
  makeRegion(
    "it",
    "Italy",
    "www.amazon.it",
    "https://www.amazon.it/dp/B0GNN2N55K",
    "https://www.amazon.it/dp/B0GNJ1MMW4",
    "https://www.amazon.it/dp/B0GQ372WBH",
    "€",
  ),
  makeRegion(
    "jp",
    "Japan",
    "www.amazon.co.jp",
    "https://www.amazon.co.jp/dp/B0GNN2N55K",
    "https://www.amazon.co.jp/dp/B0GNJ1MMW4",
    "https://www.amazon.co.jp/dp/B0GQ372WBH",
    "¥",
  ),
  makeRegion(
    "mx",
    "Mexico",
    "www.amazon.com.mx",
    "https://www.amazon.com.mx/dp/B0GNN2N55K",
    "https://www.amazon.com.mx/dp/B0GNJ1MMW4",
    "https://www.amazon.com.mx/dp/B0GQ372WBH",
    "MX$",
  ),
  makeRegion(
    "nl",
    "Netherlands",
    "www.amazon.nl",
    "https://www.amazon.co.uk/dp/B0GNN2N55K",
    "https://www.amazon.nl/dp/B0GNJ1MMW4",
    "https://www.amazon.com/dp/B0GQ372WBH",
    "€",
  ),
  makeRegion(
    "pl",
    "Poland",
    "www.amazon.pl",
    "https://www.amazon.pl/dp/B0GNN2N55K",
    "https://www.amazon.pl/dp/B0GNJ1MMW4",
    "https://www.amazon.pl/dp/B0GQ372WBH",
    "zł",
  ),
  makeRegion(
    "sa",
    "Saudi Arabia",
    "www.amazon.sa",
    "https://www.amazon.sa/dp/B0GNN2N55K",
    "https://www.amazon.sa/dp/B0GNJ1MMW4",
    "https://www.amazon.sa/dp/B0GQ372WBH",
    "SAR",
  ),
  makeRegion(
    "sg",
    "Singapore",
    "www.amazon.sg",
    "https://www.amazon.sg/dp/B0GNN2N55K",
    "https://www.amazon.sg/dp/B0GNJ1MMW4",
    "https://www.amazon.sg/dp/B0GQ372WBH",
    "S$",
  ),
  makeRegion(
    "es",
    "Spain",
    "www.amazon.es",
    "https://www.amazon.es/dp/B0GNN2N55K",
    "https://www.amazon.es/dp/B0GNJ1MMW4",
    "https://www.amazon.es/dp/B0GQ372WBH",
    "€",
  ),
  makeRegion(
    "se",
    "Sweden",
    "www.amazon.se",
    "https://www.amazon.se/dp/B0GNN2N55K",
    "https://www.amazon.se/dp/B0GNJ1MMW4",
    "https://www.amazon.se/dp/B0GQ372WBH",
    "kr",
  ),
  makeRegion(
    "tr",
    "Turkey",
    "www.amazon.com.tr",
    "https://www.amazon.com.tr/dp/B0GNN2N55K",
    "https://www.amazon.com.tr/dp/B0GNJ1MMW4",
    "https://www.amazon.com.tr/dp/B0GQ372WBH",
    "₺",
  ),
  makeRegion(
    "ae",
    "United Arab Emirates",
    "www.amazon.ae",
    "https://www.amazon.ae/dp/B0GNN2N55K",
    "https://www.amazon.ae/dp/B0GNJ1MMW4",
    "https://www.amazon.ae/dp/B0GQ372WBH",
    "AED",
  ),
  makeRegion(
    "uk",
    "United Kingdom",
    "www.amazon.co.uk",
    "https://www.amazon.co.uk/dp/B0GNN2N55K",
    "https://www.amazon.co.uk/dp/B0GNJ1MMW4",
    "https://www.amazon.co.uk/dp/B0GQ372WBH",
    "£",
  ),
  makeRegion(
    "us",
    "United States",
    "www.amazon.com",
    "https://www.amazon.com/dp/B0GNN2N55K",
    "https://www.amazon.com/dp/B0GNJ1MMW4",
    "https://www.amazon.com/dp/B0GQ372WBH",
    "$",
  ),
];

// localStorage removed — Amazon region data is now managed exclusively via backend calls.
// Use useGetAmazonRegions() from hooks/useQueries.ts to read, and useUpdateAmazonRegion() to write.

interface AmazonButtonsProps {
  regions?: AmazonRegion[];
  bookKey?: string;
}

export function AmazonButtons({
  regions: regionsProp,
  bookKey,
}: AmazonButtonsProps) {
  // If bookKey provided, import hook inline via lazy approach — handled by parent passing regions
  const regions = regionsProp ?? [];
  const [selectedRegionId, setSelectedRegionId] = useState<string>("");
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const enabledRegions = regions.filter((r) => r.enabled);
  const selectedRegion =
    enabledRegions.find((r) => r.id === selectedRegionId) ?? null;
  const isUnlocked = selectedRegion !== null;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleButtonClick = (link: string) => {
    if (!isUnlocked || !link) return;
    window.open(link, "_blank", "noopener,noreferrer");
  };

  const buttons = [
    {
      key: "kindle",
      text: selectedRegion?.kindleButtonText ?? "Kindle e-Book",
      showSubtext: selectedRegion?.showKindleUnlimited ?? true,
      link: selectedRegion?.kindleLink ?? "",
      color: selectedRegion?.kindleButtonColor ?? "#FF9900",
      fontColor: selectedRegion?.kindleFontColor ?? "#000000",
      price: selectedRegion
        ? `${selectedRegion.currencySymbol}${selectedRegion.kindlePrice}`
        : "",
      isGold: false,
    },
    {
      key: "paperback",
      text: selectedRegion?.paperbackButtonText ?? "AMZ Paperback",
      showSubtext: false,
      link: selectedRegion?.paperbackLink ?? "",
      color: selectedRegion?.paperbackButtonColor ?? "#FF9900",
      fontColor: selectedRegion?.paperbackFontColor ?? "#000000",
      price: selectedRegion
        ? `${selectedRegion.currencySymbol}${selectedRegion.paperbackPrice}`
        : "",
      isGold: false,
    },
    {
      key: "hardcover",
      text: selectedRegion?.hardcoverButtonText ?? "Special Ilustr. Hardcover",
      showSubtext: false,
      link: selectedRegion?.hardcoverLink ?? "",
      color: selectedRegion?.hardcoverButtonColor ?? "#1a1a1a",
      fontColor: selectedRegion?.hardcoverFontColor ?? "#C9A84C",
      price: selectedRegion
        ? `${selectedRegion.currencySymbol}${selectedRegion.hardcoverPrice}`
        : "",
      isGold: true,
    },
  ];

  // Per-button availability: a button is unavailable when region is selected but link is empty
  const isButtonUnavailable = (link: string) =>
    selectedRegion !== null && !link.trim();

  // All-unavailable message: only when region is selected AND all 3 links are empty
  const allUnavailable =
    selectedRegion !== null && buttons.every((btn) => !btn.link.trim());

  return (
    <div className="w-full max-w-xs mx-auto flex flex-col items-center gap-2">
      {buttons.map((btn) => {
        const unavailable = isButtonUnavailable(btn.link);
        // Button is clickable only when region selected, link present, and not unavailable
        const canClick = isUnlocked && !unavailable && !!btn.link.trim();

        return (
          <div key={btn.key} className="w-full flex flex-col items-center">
            <button
              type="button"
              disabled={!canClick}
              onClick={() =>
                canClick ? handleButtonClick(btn.link) : undefined
              }
              data-ocid={`amazon-btn-${btn.key}`}
              className={`w-full px-4 py-2.5 rounded-full font-bold shadow-lg transition-all duration-300 flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
                canClick
                  ? "hover:shadow-xl hover:scale-105 cursor-pointer"
                  : "opacity-60 cursor-not-allowed"
              }`}
              style={{
                backgroundColor: btn.color,
                color: btn.fontColor,
                border: btn.isGold ? `1px solid ${btn.fontColor}` : undefined,
              }}
            >
              {/* Lock icon — always stays on left */}
              <span
                className="text-base leading-none flex-shrink-0"
                aria-hidden="true"
              >
                {canClick ? "🔓" : "🔒"}
              </span>
              {/* Text block — left-aligned */}
              <span className="flex flex-col items-start min-w-0 text-left">
                <span
                  className="text-[11px] leading-tight font-bold"
                  style={{ color: btn.fontColor }}
                >
                  {unavailable ? "UNAVAILABLE" : btn.text}
                </span>
                {!unavailable && btn.showSubtext && (
                  <span
                    className="text-[9px] leading-tight font-medium opacity-80 mt-0.5"
                    style={{ color: btn.fontColor }}
                  >
                    Free with KindleUnlimited!
                  </span>
                )}
              </span>
            </button>
            {canClick && btn.price && (
              <p
                className="text-[10px] text-center mt-0.5 opacity-70"
                style={{ color: "inherit" }}
              >
                {btn.price}
              </p>
            )}
          </div>
        );
      })}

      {/* All-unavailable message — only shown when ALL 3 buttons have no link for the selected region */}
      {allUnavailable && (
        <p
          data-ocid="amazon-all-unavailable-msg"
          className="text-[11px] text-center leading-snug mt-1 px-1 opacity-80 italic"
          style={{ color: "#555" }}
        >
          Please purchase the Signed 1st Edition instead. We ship to almost any
          location in the world.
        </p>
      )}

      {/* Region Selector */}
      <div className="w-full mt-3 relative" ref={dropdownRef}>
        <p className="text-[10px] text-center text-gray-500 mb-1 adobe-jenson">
          Select Amazon Region
        </p>
        <button
          type="button"
          onClick={() => setIsOpen((v) => !v)}
          data-ocid="amazon-region-select"
          className="w-full px-4 py-2 rounded-xl text-left text-sm font-medium transition-all duration-200 flex items-center justify-between"
          style={{
            background: "rgba(255,255,255,0.08)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            border: "1px solid rgba(0,0,0,0.15)",
            color: "#111",
          }}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
        >
          {selectedRegion ? (
            <span className="flex flex-col leading-tight">
              <span className="text-[12px] font-semibold">
                {selectedRegion.country}
              </span>
              <span className="text-[10px] opacity-60">
                {selectedRegion.domain}
              </span>
            </span>
          ) : (
            <span className="text-gray-400 text-[11px]">
              — Select your country —
            </span>
          )}
          <svg
            className={`w-4 h-4 ml-2 flex-shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>

        {isOpen && (
          <ul
            className="absolute bottom-full mb-1 left-0 right-0 rounded-xl overflow-hidden shadow-2xl z-50 max-h-52 overflow-y-auto list-none m-0 p-0"
            style={{
              background: "rgba(255,255,255,0.97)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              border: "1px solid rgba(0,0,0,0.12)",
            }}
          >
            {enabledRegions.map((region) => (
              <li key={region.id}>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedRegionId(region.id);
                    setIsOpen(false);
                  }}
                  className={`w-full px-4 py-2.5 text-left flex flex-col transition-colors hover:bg-gray-100 border-b border-gray-100 last:border-0 ${
                    region.id === selectedRegionId ? "bg-gray-100" : ""
                  }`}
                >
                  <span className="text-[12px] font-semibold text-gray-900">
                    {region.country}
                  </span>
                  <span className="text-[10px] text-gray-400">
                    {region.domain}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
