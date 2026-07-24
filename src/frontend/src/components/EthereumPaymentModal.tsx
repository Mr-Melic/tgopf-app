import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Copy, Mail, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useEthEurRate, useEthereumPaymentConfig } from "../hooks/useQueries";

// ─── Props ────────────────────────────────────────────────────────────────────

interface EthereumPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  priceEuro: number;
  shippingEuro: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatEth(eth: number): string {
  return eth.toFixed(6);
}

function buildMailtoLink(
  totalEth: string,
  walletAddress: string,
  contactEmail: string,
): string {
  const subject = encodeURIComponent("ETH Payment Proof - TGOPF");
  const body = encodeURIComponent(
    `Hi,\n\nI have sent ${totalEth} ETH to ${walletAddress}.\n\nProof: [please attach screenshot or paste transaction ID]\n\nShipping address: [your address here]`,
  );
  return `mailto:${contactEmail}?subject=${subject}&body=${body}`;
}

// Ethereum brand colour
const ETH_COLOR = "#627EEA";

// Inline Ethereum diamond SVG icon
function EthIcon({
  size = 22,
  color = "#fff",
}: { size?: number; color?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 256 417"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      fill={color}
    >
      <polygon
        points="127.9611,0 125.1661,9.5 125.1661,285.168 127.9611,287.958 255.9231,212.32"
        opacity="0.6"
      />
      <polygon
        points="127.962,0 0,212.32 127.962,287.958 127.962,154.158"
        opacity="0.45"
      />
      <polygon
        points="127.9611,312.1866 126.3861,314.1066 126.3861,412.3066 127.9611,416.9066 255.9991,236.5866"
        opacity="0.8"
      />
      <polygon
        points="127.962,416.9066 127.962,312.1866 0,236.5866"
        opacity="0.45"
      />
      <polygon
        points="127.9611,287.9577 255.9211,212.3207 127.9611,154.1587"
        opacity="0.2"
      />
      <polygon
        points="0.0009,212.3207 127.9609,287.9577 127.9609,154.1587"
        opacity="0.3"
      />
    </svg>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function EthereumPaymentModal({
  isOpen,
  onClose,
  priceEuro,
  shippingEuro,
}: EthereumPaymentModalProps) {
  const [copied, setCopied] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  const { data: ethRate, isLoading: rateLoading } = useEthEurRate({
    enabled: isOpen,
  });
  const { data: ethConfig } = useEthereumPaymentConfig();

  const walletAddress =
    ethConfig?.walletAddress ?? "0x29420495cF2FFBa1EeD56319F5c6EDf620C44858";
  const contactEmail = ethConfig?.contactEmail ?? "tgopf@pm.me";

  const totalEuro = priceEuro + shippingEuro;
  const effectiveRate = ethRate && ethRate > 0 ? ethRate : 3000;
  const totalEth = formatEth(totalEuro / effectiveRate);

  // ethereum: URI — simple address (EIP-55)
  const paymentUri = `ethereum:${walletAddress}`;

  const generateQrCode = useCallback(() => {
    if (!isOpen) return;
    const encoded = encodeURIComponent(paymentUri);
    setQrDataUrl(
      `https://api.qrserver.com/v1/create-qr-code/?size=256x256&data=${encoded}&margin=8&format=png`,
    );
  }, [paymentUri, isOpen]);

  useEffect(() => {
    if (isOpen) generateQrCode();
    else setQrDataUrl(null);
  }, [isOpen, generateQrCode]);

  const handleCopy = () => {
    navigator.clipboard.writeText(walletAddress).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const mailtoLink = buildMailtoLink(totalEth, walletAddress, contactEmail);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="max-w-md w-full overflow-y-auto rounded-2xl p-0 border-0 shadow-2xl"
        style={{ maxHeight: "92vh", fontFamily: "'Adobe Jenson Pro', serif" }}
        data-ocid="ethereum-payment.dialog"
        showCloseButton={false}
      >
        {/* Header strip — Ethereum purple */}
        <div
          className="flex items-center justify-between px-6 py-4 rounded-t-2xl"
          style={{ background: ETH_COLOR }}
        >
          <div className="flex items-center gap-2">
            <EthIcon size={22} color="#fff" />
            <DialogTitle
              className="text-lg font-bold leading-tight"
              style={{ color: "#fff", fontFamily: "'Adobe Jenson Pro', serif" }}
            >
              Pay with Ethereum
            </DialogTitle>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close Ethereum payment modal"
            className="rounded-full p-1 hover:bg-white/20 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            data-ocid="ethereum-payment.close_button"
          >
            <X size={18} color="#fff" />
          </button>
          <DialogDescription className="sr-only">
            Ethereum payment information — QR code, ETH amount, and instructions
          </DialogDescription>
        </div>

        <div
          className="px-6 pb-6 pt-4 space-y-5"
          style={{ background: "#fff" }}
        >
          {/* Price breakdown */}
          <div
            className="rounded-xl p-4 text-center"
            style={{
              background: "#f0f2ff",
              border: `1px solid ${ETH_COLOR}33`,
            }}
          >
            <p className="text-xs mb-1" style={{ color: "#888" }}>
              Price breakdown
            </p>
            <p className="text-sm font-medium" style={{ color: "#333" }}>
              €{priceEuro.toFixed(2)}
              {shippingEuro > 0 && (
                <>
                  {" "}
                  <span style={{ color: "#888" }}>+</span>{" "}
                  <span style={{ color: "#555" }}>
                    €{shippingEuro.toFixed(2)} shipping
                  </span>
                </>
              )}
              {" = "}
              <span className="font-bold" style={{ color: "#111" }}>
                €{totalEuro.toFixed(2)}
              </span>
            </p>
            <div className="mt-2 flex items-center justify-center gap-1">
              {rateLoading ? (
                <span
                  className="animate-pulse text-xs"
                  style={{ color: "#aaa" }}
                >
                  Fetching live rate…
                </span>
              ) : (
                <span
                  className="text-2xl font-bold tracking-tight"
                  style={{ color: ETH_COLOR }}
                  data-ocid="ethereum-payment.eth_amount"
                >
                  {totalEth} ETH
                </span>
              )}
            </div>
            <p className="text-[10px] mt-1" style={{ color: "#bbb" }}>
              Rate: 1 ETH ≈ €{effectiveRate.toLocaleString()} · updates every
              60s
            </p>
          </div>

          {/* QR Code */}
          <div className="flex flex-col items-center gap-2">
            <p
              className="text-xs font-semibold uppercase tracking-wider"
              style={{ color: "#888" }}
            >
              Scan QR Code
            </p>
            <div
              className="rounded-xl p-3 shadow-inner"
              style={{ background: "#fff", border: `2px solid ${ETH_COLOR}44` }}
            >
              {qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt={`Ethereum QR code for ${walletAddress}`}
                  className="w-52 h-52 object-contain rounded"
                  data-ocid="ethereum-payment.qr_code"
                />
              ) : (
                <div
                  className="w-52 h-52 flex items-center justify-center rounded animate-pulse"
                  style={{ background: "#f3f3f3" }}
                >
                  <EthIcon size={48} color={`${ETH_COLOR}55`} />
                </div>
              )}
            </div>
          </div>

          {/* Wallet address */}
          <div>
            <p
              className="text-xs font-semibold uppercase tracking-wider mb-2 text-center"
              style={{ color: "#888" }}
            >
              Ethereum Address
            </p>
            <div
              className="flex items-center gap-2 rounded-xl px-3 py-2"
              style={{ background: "#f9f9f9", border: "1px solid #e5e5e5" }}
            >
              <p
                className="flex-1 text-[11px] font-mono break-all leading-tight select-all"
                style={{ color: "#111" }}
                data-ocid="ethereum-payment.wallet_address"
              >
                {walletAddress}
              </p>
              <button
                type="button"
                onClick={handleCopy}
                aria-label="Copy Ethereum address"
                data-ocid="ethereum-payment.copy_address_button"
                className="flex-shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2"
                style={{
                  background: copied ? "#22c55e" : ETH_COLOR,
                  color: "#fff",
                }}
              >
                <Copy size={12} />
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
          </div>

          {/* Instructions */}
          <div
            className="rounded-xl p-4 text-sm leading-relaxed"
            style={{
              background: "#f8f8f8",
              border: "1px solid #eee",
              color: "#444",
            }}
          >
            <p>
              Scan the QR code or send exactly{" "}
              <strong style={{ color: ETH_COLOR }}>{totalEth} ETH</strong> to
              the address above.
            </p>
            <p className="mt-2">
              After payment, send an email to{" "}
              <strong style={{ color: "#111" }}>{contactEmail}</strong> with:
            </p>
            <ul
              className="mt-1 ml-4 list-disc text-xs space-y-0.5"
              style={{ color: "#555" }}
            >
              <li>Proof of payment (screenshot or transaction ID)</li>
              <li>Your full shipping address</li>
            </ul>
          </div>

          {/* Send proof email button */}
          <a
            href={mailtoLink}
            data-ocid="ethereum-payment.send_proof_button"
            className="flex items-center justify-center gap-2 w-full py-3 rounded-full font-bold text-sm transition-all duration-200 hover:opacity-90 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{ background: "#111", color: "#fff" }}
          >
            <Mail size={16} />
            Send Proof of Payment Email
          </a>
        </div>
      </DialogContent>
    </Dialog>
  );
}
