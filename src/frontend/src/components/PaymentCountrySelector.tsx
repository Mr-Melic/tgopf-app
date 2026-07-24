import { useEffect, useRef, useState } from "react";
import type { PaymentCountry, PaymentOption } from "../backend";
import {
  useGetCryptoSystemEnabled,
  usePaymentCountries,
  usePaymentOptionsByCountry,
} from "../hooks/useQueries";
import BitcoinPaymentModal from "./BitcoinPaymentModal";
import EthereumPaymentModal from "./EthereumPaymentModal";
import IcpPaymentModal from "./IcpPaymentModal";

// ─── Crypto method detection ──────────────────────────────────────────────────

function isBitcoinMethod(name: string): boolean {
  return name.toLowerCase() === "bitcoin";
}
function isEthereumMethod(name: string): boolean {
  const n = name.toLowerCase();
  return n === "ethereum" || n === "eth" || n.includes("ethereum");
}
function isIcpMethod(name: string): boolean {
  const n = name.toLowerCase();
  return n === "icp" || n === "internet computer" || n.includes("icp");
}

// ─── Inline SVG icons (all logos embedded — no external URLs) ────────────────

function BitcoinIcon({ size = 28 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <circle cx="32" cy="32" r="32" fill="#F7931A" />
      <path
        d="M46.1 27.9c.6-4.2-2.6-6.5-7-8L40.6 13l-4.8-1.2-1.5 5.8c-1.3-.3-2.6-.6-3.9-.9l1.5-5.9L27 9.6 25.5 16c-1.1-.2-2.1-.5-3.1-.7v0l-6.6-1.6-1.3 5.1s3.5.8 3.4.9c1.9.5 2.2 1.7 2.2 2.7l-2.2 8.8c.1 0 .3.1.5.1-.2-.1-.4-.1-.5-.2l-3.1 12.3c-.2.6-.8 1.5-2.1 1.1.1.1-3.4-.8-3.4-.8l-2.3 5.5 6.2 1.5c1.2.3 2.3.6 3.4.9L16.7 57l4.8 1.2 1.5-5.9c1.3.4 2.6.7 3.9 1L25.4 59l4.8 1.2 1.5-5.9c6.3 1.2 11 .7 13-5 1.6-4.6-.1-7.2-3.4-8.9 2.4-.6 4.2-2.2 4.8-5.5zm-8.6 12.1c-1.1 4.6-8.9 2.1-11.4 1.5l2-8.2c2.5.6 10.5 1.8 9.4 6.7zm1.2-12.2c-1 4.2-7.4 2.1-9.5 1.6l1.8-7.4c2.1.5 9 1.5 7.7 5.8z"
        fill="#fff"
      />
    </svg>
  );
}

function EthereumIcon({ size = 28 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <circle cx="32" cy="32" r="32" fill="#627EEA" />
      <path
        d="M32 9L31.7 10l-12.2 20.2L32 35.4l12.5-6.2L32 9z"
        fill="#fff"
        fillOpacity="0.9"
      />
      <path
        d="M19.8 31.2L32 55l12.2-23.8L32 37.6 19.8 31.2z"
        fill="#fff"
        fillOpacity="0.75"
      />
    </svg>
  );
}

function IcpIcon({ size = 28 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <circle cx="32" cy="32" r="32" fill="#29ABE2" />
      <text
        x="32"
        y="41"
        textAnchor="middle"
        fontSize="22"
        fontWeight="bold"
        fill="#fff"
        fontFamily="Arial, sans-serif"
      >
        ICP
      </text>
    </svg>
  );
}

function IdealIcon({ size = 28 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <rect width="64" height="64" rx="8" fill="#CC0066" />
      <rect x="8" y="14" width="20" height="36" rx="3" fill="white" />
      <rect x="32" y="14" width="24" height="36" rx="3" fill="white" />
      <text
        x="20"
        y="38"
        textAnchor="middle"
        fontSize="10"
        fontWeight="900"
        fill="#CC0066"
        fontFamily="Arial, sans-serif"
      >
        i
      </text>
      <text
        x="44"
        y="38"
        textAnchor="middle"
        fontSize="9"
        fontWeight="bold"
        fill="#333"
        fontFamily="Arial, sans-serif"
      >
        D
      </text>
    </svg>
  );
}

function BancontactIcon({ size = 28 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <rect width="64" height="64" rx="8" fill="#005498" />
      <rect x="4" y="22" width="56" height="20" rx="4" fill="white" />
      <rect x="4" y="22" width="28" height="20" rx="4" fill="#FF6600" />
      <text
        x="18"
        y="37"
        textAnchor="middle"
        fontSize="11"
        fontWeight="bold"
        fill="white"
        fontFamily="Arial, sans-serif"
      >
        BC
      </text>
    </svg>
  );
}

function BelfiusIcon({ size = 28 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <rect width="64" height="64" rx="8" fill="#E3001B" />
      <text
        x="32"
        y="43"
        textAnchor="middle"
        fontSize="32"
        fontWeight="900"
        fill="white"
        fontFamily="Arial, sans-serif"
      >
        B
      </text>
    </svg>
  );
}

function BolComIcon({ size = 28 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <rect width="64" height="64" rx="8" fill="#0000A4" />
      <text
        x="32"
        y="42"
        textAnchor="middle"
        fontSize="16"
        fontWeight="900"
        fill="white"
        fontFamily="Arial, sans-serif"
      >
        bol
      </text>
      <circle cx="54" cy="28" r="7" fill="#FF6200" />
    </svg>
  );
}

function CreditcardIcon({ size = 28 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <rect width="64" height="64" rx="8" fill="#1a1a2e" />
      <rect x="8" y="16" width="48" height="32" rx="5" fill="#2d3561" />
      <rect x="8" y="26" width="48" height="10" fill="#e94560" />
      <rect
        x="12"
        y="38"
        width="16"
        height="5"
        rx="2"
        fill="rgba(255,255,255,0.6)"
      />
      <rect x="44" y="37" width="8" height="7" rx="2" fill="#f5a623" />
      <rect
        x="36"
        y="37"
        width="8"
        height="7"
        rx="2"
        fill="#e94560"
        fillOpacity="0.8"
      />
    </svg>
  );
}

function EpsIcon({ size = 28 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <rect width="64" height="64" rx="8" fill="#1565C0" />
      <text
        x="32"
        y="42"
        textAnchor="middle"
        fontSize="18"
        fontWeight="900"
        fill="white"
        fontFamily="Arial, sans-serif"
      >
        eps
      </text>
    </svg>
  );
}

function KbcIcon({ size = 28 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <rect width="64" height="64" rx="8" fill="#00A13A" />
      <text
        x="32"
        y="38"
        textAnchor="middle"
        fontSize="13"
        fontWeight="900"
        fill="white"
        fontFamily="Arial, sans-serif"
      >
        KBC
      </text>
      <text
        x="32"
        y="52"
        textAnchor="middle"
        fontSize="10"
        fontWeight="700"
        fill="rgba(255,255,255,0.8)"
        fontFamily="Arial, sans-serif"
      >
        CBC
      </text>
    </svg>
  );
}

function MbWayIcon({ size = 28 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <rect width="64" height="64" rx="8" fill="#CC1F82" />
      <text
        x="32"
        y="36"
        textAnchor="middle"
        fontSize="12"
        fontWeight="900"
        fill="white"
        fontFamily="Arial, sans-serif"
      >
        MB
      </text>
      <text
        x="32"
        y="50"
        textAnchor="middle"
        fontSize="12"
        fontWeight="900"
        fill="white"
        fontFamily="Arial, sans-serif"
      >
        WAY
      </text>
    </svg>
  );
}

function MultibancoIcon({ size = 28 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <rect width="64" height="64" rx="8" fill="#003B7A" />
      <rect x="10" y="18" width="44" height="28" rx="4" fill="#F0C030" />
      <rect x="14" y="22" width="36" height="7" rx="2" fill="#003B7A" />
      <rect x="14" y="33" width="10" height="8" rx="2" fill="#003B7A" />
      <rect x="27" y="33" width="10" height="8" rx="2" fill="#003B7A" />
      <rect x="40" y="33" width="10" height="8" rx="2" fill="#003B7A" />
    </svg>
  );
}

function PayPalIcon({ size = 28 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <rect width="64" height="64" rx="8" fill="#003087" />
      <path
        d="M48 22c0 8-5.5 13-14 13H28l-3 18H16l6-38h16c6 0 10 3 10 7z"
        fill="#009CDE"
      />
      <path
        d="M44 18c0 8-5.5 13-14 13H24l-3 18h-6l6-38h16c6 0 7 3 7 7z"
        fill="white"
      />
    </svg>
  );
}

function PrzelewyIcon({ size = 28 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <rect width="64" height="64" rx="8" fill="#CC2029" />
      <text
        x="32"
        y="38"
        textAnchor="middle"
        fontSize="16"
        fontWeight="900"
        fill="white"
        fontFamily="Arial, sans-serif"
      >
        P24
      </text>
    </svg>
  );
}

function RevolutIcon({ size = 28 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <rect width="64" height="64" rx="8" fill="#191C1F" />
      <path
        d="M20 14h16c7 0 12 4.5 12 11 0 5-3 8.5-7 10l8 15H40l-7-14h-5v14H20V14zm8 7v10h8c3 0 5-2 5-5s-2-5-5-5h-8z"
        fill="white"
      />
    </svg>
  );
}

function SatispayIcon({ size = 28 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <circle cx="32" cy="32" r="32" fill="#E31E30" />
      <text
        x="32"
        y="44"
        textAnchor="middle"
        fontSize="36"
        fontWeight="900"
        fill="white"
        fontFamily="Arial, sans-serif"
      >
        S
      </text>
    </svg>
  );
}

function SepaIcon({ size = 28 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <rect width="64" height="64" rx="8" fill="#003399" />
      <circle
        cx="32"
        cy="32"
        r="12"
        fill="none"
        stroke="#FFDD00"
        strokeWidth="3"
      />
      <text
        x="32"
        y="37"
        textAnchor="middle"
        fontSize="11"
        fontWeight="900"
        fill="#FFDD00"
        fontFamily="Arial, sans-serif"
      >
        SEPA
      </text>
    </svg>
  );
}

function TrustyIcon({ size = 28 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <rect width="64" height="64" rx="8" fill="#1E6B3C" />
      <path
        d="M32 10 L50 20 L50 38 C50 48 41 55 32 58 C23 55 14 48 14 38 L14 20 Z"
        fill="rgba(255,255,255,0.15)"
        stroke="white"
        strokeWidth="2"
      />
      <polyline
        points="22,32 30,40 44,26"
        stroke="white"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

function VintedIcon({ size = 28 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <rect width="64" height="64" rx="8" fill="#1D9B6E" />
      <text
        x="32"
        y="43"
        textAnchor="middle"
        fontSize="16"
        fontWeight="900"
        fill="white"
        fontFamily="Arial, sans-serif"
      >
        vinted
      </text>
    </svg>
  );
}

function WeroIcon({ size = 28 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <rect width="64" height="64" rx="8" fill="#6B2D8B" />
      <text
        x="32"
        y="40"
        textAnchor="middle"
        fontSize="14"
        fontWeight="900"
        fill="white"
        fontFamily="Arial, sans-serif"
      >
        WERO
      </text>
    </svg>
  );
}

function GenericPaymentIcon({ size = 28 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 28 28"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="2" y="5" width="24" height="18" rx="3" />
      <line x1="2" y1="11" x2="26" y2="11" />
    </svg>
  );
}

// ─── Inline logo renderer — maps method names to inline SVG components ────────

import type { ReactElement } from "react";

type SvgIconProps = { size: number };
type IconComponent = (props: SvgIconProps) => ReactElement;

const PAYMENT_ICON_MAP: Record<string, IconComponent> = {
  ideal: IdealIcon,
  "ideal / wero": IdealIcon,
  "ideal/wero": IdealIcon,
  wero: WeroIcon,
  paypal: PayPalIcon,
  bancontact: BancontactIcon,
  revolut: RevolutIcon,
  vinted: VintedIcon,
  "bol.com": BolComIcon,
  bol: BolComIcon,
  sepa: SepaIcon,
  creditcard: CreditcardIcon,
  "credit card": CreditcardIcon,
  eps: EpsIcon,
  przelewy24: PrzelewyIcon,
  p24: PrzelewyIcon,
  "kbc/cbc": KbcIcon,
  kbc: KbcIcon,
  cbc: KbcIcon,
  belfius: BelfiusIcon,
  satispay: SatispayIcon,
  "mb way": MbWayIcon,
  mbway: MbWayIcon,
  multibanco: MultibancoIcon,
  trusty: TrustyIcon,
  "pay by bank": SepaIcon,
};

function getInlineIcon(methodName: string): IconComponent | null {
  const key = methodName.toLowerCase().trim();
  return PAYMENT_ICON_MAP[key] ?? null;
}

// ─── Inline logo for a payment method ────────────────────────────────────────

function MethodLogo({
  methodName,
  logoUrl,
  size,
}: { methodName: string; logoUrl: string; size: number }) {
  const [imgFailed, setImgFailed] = useState(false);
  const isBtc = isBitcoinMethod(methodName);
  const isEth = isEthereumMethod(methodName);
  const isIcp = isIcpMethod(methodName);

  // Crypto: always inline SVG
  if (isBtc) return <BitcoinIcon size={size} />;
  if (isEth) return <EthereumIcon size={size} />;
  if (isIcp) return <IcpIcon size={size} />;

  // Admin-uploaded logo (blob storage URL) — highest priority override
  const adminLogoUrl = logoUrl?.trim();
  if (adminLogoUrl && !imgFailed) {
    return (
      <span
        className="flex items-center justify-center rounded-md flex-shrink-0"
        style={{
          width: size,
          height: size,
          background: "rgba(255,255,255,0.85)",
          padding: 2,
        }}
      >
        <img
          src={adminLogoUrl}
          alt={methodName}
          style={{ width: size - 6, height: size - 6, objectFit: "contain" }}
          onError={() => setImgFailed(true)}
        />
      </span>
    );
  }

  // Built-in inline SVG for known payment methods
  const InlineIcon = getInlineIcon(methodName);
  if (InlineIcon) return <InlineIcon size={size} />;

  // Last resort: first-letter pill
  return (
    <span
      className="flex items-center justify-center rounded-md font-bold flex-shrink-0"
      style={{
        width: size,
        height: size,
        background: "rgba(255,255,255,0.25)",
        fontSize: size * 0.45,
        color: "currentColor",
      }}
    >
      {methodName.charAt(0).toUpperCase()}
    </span>
  );
}

// ─── Buzz animation hook ──────────────────────────────────────────────────────

function useBuzzing(enabled: boolean, id: string) {
  const [isShaking, setIsShaking] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!enabled) return;
    const scheduleNext = () => {
      const delay = 3000 + Math.random() * 7000;
      timerRef.current = setTimeout(() => {
        setIsShaking(true);
        setTimeout(() => {
          setIsShaking(false);
          scheduleNext();
        }, 600);
      }, delay);
    };
    scheduleNext();
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [enabled, id]);

  return isShaking;
}

// ─── Price row ────────────────────────────────────────────────────────────────

function PriceRow({
  priceEuro,
  shippingEuro,
  fgColor,
}: { priceEuro: string; shippingEuro: string; fgColor: string }) {
  const hasShipping =
    shippingEuro.trim() &&
    shippingEuro !== "€0.00" &&
    shippingEuro !== "€ 0.00";

  const shippingDisplay = shippingEuro.replace(/\s*shipping\s*/i, "").trim();

  if (!priceEuro && !hasShipping) return null;

  return (
    <span
      className="flex items-center gap-1 text-sm font-semibold mt-0.5 leading-tight"
      style={{ color: fgColor, opacity: 0.97 }}
    >
      <span className="text-sm font-bold">{priceEuro}</span>
      {hasShipping && (
        <>
          <span
            className="text-base font-black leading-none"
            style={{ color: fgColor }}
          >
            +
          </span>
          <span className="text-sm font-bold">{shippingDisplay}</span>
        </>
      )}
    </span>
  );
}

// ─── Single action button ─────────────────────────────────────────────────────

interface ActionButtonProps {
  option: PaymentOption;
  onBitcoinClick: () => void;
  onEthereumClick: () => void;
  onIcpClick: () => void;
}

function ActionButton({
  option,
  onBitcoinClick,
  onEthereumClick,
  onIcpClick,
}: ActionButtonProps) {
  const isShaking = useBuzzing(option.buzzingEnabled, option.id);
  const isBitcoin = isBitcoinMethod(option.methodName);
  const isEthereum = isEthereumMethod(option.methodName);
  const isIcp = isIcpMethod(option.methodName);
  const isCrypto = isBitcoin || isEthereum || isIcp;
  const isUnavailable = !isCrypto && !option.link.trim();

  const bgColor = option.buttonColor || "#1a1a1a";
  const fgColor = option.fontColor || "#ffffff";

  const handleClick = () => {
    if (isUnavailable) return;
    if (isBitcoin) onBitcoinClick();
    else if (isEthereum) onEthereumClick();
    else if (isIcp) onIcpClick();
    else window.open(option.link, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="w-full flex flex-col items-center gap-1">
      <button
        type="button"
        disabled={isUnavailable}
        onClick={handleClick}
        data-ocid={`payment-action-btn-${option.id}`}
        className={`w-full px-4 py-3 rounded-full font-bold shadow-lg transition-all duration-300 flex items-center gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 select-none ${
          isShaking ? "animate-shake" : ""
        } ${
          isUnavailable
            ? "opacity-60 cursor-not-allowed"
            : "hover:shadow-xl hover:scale-105 cursor-pointer"
        }`}
        style={{ backgroundColor: bgColor, color: fgColor }}
      >
        {/* Lock / unlock icon */}
        <span
          className="text-base leading-none flex-shrink-0"
          aria-hidden="true"
        >
          {isUnavailable ? "🔒" : "🔓"}
        </span>

        {/* Logo — 28×28 */}
        <MethodLogo
          methodName={option.methodName}
          logoUrl={option.logoUrl}
          size={28}
        />

        {/* Text */}
        <span className="flex flex-col items-start min-w-0 text-left">
          <span className="text-sm leading-tight font-bold">
            {isUnavailable ? (
              "UNAVAILABLE"
            ) : (
              <>
                <span className="font-normal">via </span>
                <span className="italic">{option.methodName}</span>
              </>
            )}
          </span>
          {!isUnavailable && (option.priceEuro || option.shippingEuro) && (
            <PriceRow
              priceEuro={option.priceEuro}
              shippingEuro={option.shippingEuro}
              fgColor={fgColor}
            />
          )}
        </span>
      </button>
    </div>
  );
}

// ─── Country dropdown ─────────────────────────────────────────────────────────

interface CountryDropdownProps {
  countries: PaymentCountry[];
  selectedId: string;
  onSelect: (id: string) => void;
  onOpenChange?: (open: boolean) => void;
}

function CountryDropdown({
  countries,
  selectedId,
  onSelect,
  onOpenChange,
}: CountryDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const selected = countries.find((c) => c.id === selectedId) ?? null;

  const toggleOpen = (next: boolean) => {
    setIsOpen(next);
    onOpenChange?.(next);
  };

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        toggleOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const sorted = [...countries].sort(
    (a, b) => Number(a.sortOrder) - Number(b.sortOrder),
  );

  return (
    <div
      className="w-full"
      ref={dropdownRef}
      style={{ position: "relative", zIndex: isOpen ? 9999 : "auto" }}
    >
      <p
        className="text-[10px] text-center mb-1 select-none"
        style={{ color: "#6b7280", fontFamily: "'Adobe Jenson Pro', serif" }}
      >
        Step 1 — Select your country
      </p>
      <button
        type="button"
        onClick={() => toggleOpen(!isOpen)}
        data-ocid="payment-country-select"
        className="w-full px-4 py-2.5 rounded-xl text-left text-sm font-medium transition-all duration-200 flex items-center justify-between select-none"
        style={{
          background: "rgba(255,255,255,0.85)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          border: "1px solid rgba(0,0,0,0.18)",
          color: "#111",
          fontFamily: "'Adobe Jenson Pro', serif",
        }}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        {selected ? (
          <span className="text-[12px] font-semibold">{selected.name}</span>
        ) : (
          <span className="text-[11px]" style={{ color: "#9ca3af" }}>
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
        <div
          className="absolute left-0 right-0 rounded-xl overflow-hidden shadow-2xl max-h-56 overflow-y-auto"
          style={{
            top: "calc(100% + 4px)",
            zIndex: 9999,
            background: "rgba(255,255,255,0.98)",
            border: "1px solid rgba(0,0,0,0.12)",
          }}
        >
          {sorted.map((c) => (
            <button
              key={c.id}
              type="button"
              aria-pressed={c.id === selectedId}
              onClick={() => {
                onSelect(c.id);
                toggleOpen(false);
              }}
              className={`w-full px-4 py-2.5 text-left text-[12px] font-semibold transition-colors hover:bg-gray-100 border-b border-gray-100 last:border-0 select-none ${c.id === selectedId ? "bg-gray-100" : ""}`}
              style={{ color: "#111" }}
              data-ocid={`payment-country-option-${c.id}`}
            >
              {c.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Payment method selector (Step 2 grid) ───────────────────────────────────

interface MethodSelectorProps {
  options: PaymentOption[];
  selectedId: string;
  onSelect: (id: string) => void;
}

function MethodSelector({
  options,
  selectedId,
  onSelect,
}: MethodSelectorProps) {
  const sorted = [...options].sort(
    (a, b) => Number(a.sortOrder) - Number(b.sortOrder),
  );

  return (
    <div className="w-full">
      <p
        className="text-[10px] text-center mb-2 select-none"
        style={{ color: "#6b7280", fontFamily: "'Adobe Jenson Pro', serif" }}
      >
        Step 2 — Choose how you'd like to pay:
      </p>
      <div className="grid grid-cols-2 gap-2">
        {sorted.map((opt) => {
          const isSelected = opt.id === selectedId;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => onSelect(opt.id)}
              data-ocid={`payment-method-btn-${opt.id}`}
              className={`px-2.5 py-2 rounded-lg text-left text-[11px] font-medium transition-all duration-200 flex items-center gap-2 select-none border ${
                isSelected
                  ? "border-black bg-black text-white shadow-md"
                  : "border-gray-300 bg-white text-gray-800 hover:border-gray-500 hover:bg-gray-50"
              }`}
              style={{ fontFamily: "'Adobe Jenson Pro', serif" }}
            >
              {/* 32×32 logo in the method grid */}
              <MethodLogo
                methodName={opt.methodName}
                logoUrl={opt.logoUrl}
                size={32}
              />
              <span className="truncate leading-tight">{opt.methodName}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function PaymentCountrySelector() {
  const { data: allCountries = [], isLoading: countriesLoading } =
    usePaymentCountries();
  const { data: cryptoEnabled } = useGetCryptoSystemEnabled();
  const [selectedCountryId, setSelectedCountryId] = useState("");
  const [selectedOptionId, setSelectedOptionId] = useState("");
  const [btcModalOpen, setBtcModalOpen] = useState(false);
  const [ethModalOpen, setEthModalOpen] = useState(false);
  const [icpModalOpen, setIcpModalOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const bookPriceEuro = 39.39;
  const enabledCountries = allCountries.filter((c) => c.enabled);

  const { data: countryOptions = [], isLoading: optionsLoading } =
    usePaymentOptionsByCountry(selectedCountryId);
  const enabledOptions = countryOptions.filter((o) => {
    if (!o.enabled) return false;
    // When crypto system is explicitly disabled, filter out BTC/ETH/ICP
    if (cryptoEnabled === false) {
      const n = o.methodName.toLowerCase();
      if (
        n === "bitcoin" ||
        n === "ethereum" ||
        n === "eth" ||
        n.includes("ethereum") ||
        n === "icp" ||
        n === "internet computer" ||
        n.includes("icp")
      )
        return false;
    }
    return true;
  });

  const handleCountrySelect = (id: string) => {
    setSelectedCountryId(id);
    setSelectedOptionId("");
  };

  const selectedOption =
    enabledOptions.find((o) => o.id === selectedOptionId) ?? null;

  const parseEuro = (raw: string) =>
    Number.parseFloat(raw.replace(/[^0-9.,]/g, "").replace(",", ".")) || 0;

  const shippingEuro = selectedOption
    ? parseEuro(selectedOption.shippingEuro)
    : 0;

  if (countriesLoading) {
    return (
      <div className="w-full max-w-xs mx-auto flex flex-col items-center gap-3 py-4">
        <div className="animate-pulse h-10 w-full rounded-xl bg-gray-200" />
        <div className="animate-pulse h-8 w-3/4 rounded-lg bg-gray-100" />
      </div>
    );
  }

  if (enabledCountries.length === 0) {
    return (
      <div
        className="w-full max-w-xs mx-auto text-center text-[11px] py-6 select-none"
        style={{ color: "#9ca3af", fontFamily: "'Adobe Jenson Pro', serif" }}
        data-ocid="payment-selector-empty-state"
      >
        Payment options coming soon.
      </div>
    );
  }

  return (
    <>
      <div
        className="w-full max-w-xs mx-auto flex flex-col items-center gap-4 px-4 py-5 rounded-2xl"
        style={{
          background: "rgba(255,255,255,0.7)",
          backdropFilter: "blur(14px)",
          WebkitBackdropFilter: "blur(14px)",
          border: "1px solid rgba(0,0,0,0.10)",
          fontFamily: "'Adobe Jenson Pro', serif",
          position: "relative",
          zIndex: dropdownOpen ? 9999 : "auto",
          overflow: dropdownOpen ? "visible" : undefined,
        }}
        data-ocid="payment-country-selector"
      >
        {/* Step 1 — country */}
        <CountryDropdown
          countries={enabledCountries}
          selectedId={selectedCountryId}
          onSelect={handleCountrySelect}
          onOpenChange={setDropdownOpen}
        />

        {/* Step 2 — method (only after country chosen) */}
        {selectedCountryId && (
          <div className="w-full">
            {optionsLoading ? (
              <div className="w-full flex flex-col items-center gap-2">
                <p
                  className="text-[11px] text-center select-none"
                  style={{
                    color: "#6b7280",
                    fontFamily: "'Adobe Jenson Pro', serif",
                  }}
                  data-ocid="payment-options-loading-text"
                >
                  Loading payment options…
                </p>
                <div className="w-full animate-pulse h-16 rounded-lg bg-gray-100" />
              </div>
            ) : enabledOptions.length === 0 ? (
              <p
                className="text-[11px] text-center select-none"
                style={{ color: "#9ca3af" }}
                data-ocid="payment-no-options-msg"
              >
                No payment options available for this country.
              </p>
            ) : (
              <MethodSelector
                options={enabledOptions}
                selectedId={selectedOptionId}
                onSelect={setSelectedOptionId}
              />
            )}
          </div>
        )}

        {/* Step 3 — action button (only after both selections) */}
        {selectedOption && (
          <div className="w-full mt-1">
            <ActionButton
              option={selectedOption}
              onBitcoinClick={() => setBtcModalOpen(true)}
              onEthereumClick={() => setEthModalOpen(true)}
              onIcpClick={() => setIcpModalOpen(true)}
            />
          </div>
        )}
      </div>

      {/* Crypto modals */}
      {selectedOption && isBitcoinMethod(selectedOption.methodName) && (
        <BitcoinPaymentModal
          isOpen={btcModalOpen}
          onClose={() => setBtcModalOpen(false)}
          priceEuro={bookPriceEuro}
          shippingEuro={shippingEuro}
        />
      )}
      {selectedOption && isEthereumMethod(selectedOption.methodName) && (
        <EthereumPaymentModal
          isOpen={ethModalOpen}
          onClose={() => setEthModalOpen(false)}
          priceEuro={bookPriceEuro}
          shippingEuro={shippingEuro}
        />
      )}
      {selectedOption && isIcpMethod(selectedOption.methodName) && (
        <IcpPaymentModal
          isOpen={icpModalOpen}
          onClose={() => setIcpModalOpen(false)}
          priceEuro={bookPriceEuro}
          shippingEuro={shippingEuro}
        />
      )}
    </>
  );
}
