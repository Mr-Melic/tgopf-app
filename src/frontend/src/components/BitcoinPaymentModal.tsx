import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Bitcoin, Copy, Mail, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useBitcoinPaymentConfig, useBtcEurRate } from "../hooks/useQueries";

// ─── Props ────────────────────────────────────────────────────────────────────

interface BitcoinPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  priceEuro: number;
  shippingEuro: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatBtc(btc: number): string {
  return btc.toFixed(8);
}

function buildMailtoLink(
  totalBtc: string,
  walletAddress: string,
  contactEmail: string,
): string {
  const subject = encodeURIComponent("BTC Payment Proof - TGOPF");
  const body = encodeURIComponent(
    `Hi,\n\nI have sent ${totalBtc} BTC to ${walletAddress}.\n\nProof: [please attach screenshot or paste transaction ID]\n\nShipping address: [your address here]`,
  );
  return `mailto:${contactEmail}?subject=${subject}&body=${body}`;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function BitcoinPaymentModal({
  isOpen,
  onClose,
  priceEuro,
  shippingEuro,
}: BitcoinPaymentModalProps) {
  const [copied, setCopied] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  // Live BTC rate & wallet config from backend
  const { data: btcRate, isLoading: rateLoading } = useBtcEurRate({
    enabled: isOpen,
  });
  const { data: btcConfig } = useBitcoinPaymentConfig();

  const walletAddress =
    btcConfig?.walletAddress ?? "bc1qksdafkkasm96075gp7yys78h7eq97selp97lh0";
  const contactEmail = btcConfig?.contactEmail ?? "tgopf@pm.me";

  const totalEuro = priceEuro + shippingEuro;
  const effectiveRate = btcRate && btcRate > 0 ? btcRate : 85000;
  const totalBtc = formatBtc(totalEuro / effectiveRate);

  // Build the Bitcoin payment URI for the QR code
  const paymentUri = `bitcoin:${walletAddress}?amount=${totalBtc}`;

  // Generate QR code URL using qrserver.com (reliable, no CORS issues)
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

  const mailtoLink = buildMailtoLink(totalBtc, walletAddress, contactEmail);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="max-w-md w-full overflow-y-auto rounded-2xl p-0 border-0 shadow-2xl"
        style={{ maxHeight: "92vh", fontFamily: "'Adobe Jenson Pro', serif" }}
        data-ocid="bitcoin-payment.dialog"
        showCloseButton={false}
      >
        {/* Header strip — Bitcoin orange */}
        <div
          className="flex items-center justify-between px-6 py-4 rounded-t-2xl"
          style={{ background: "#F7931A" }}
        >
          <div className="flex items-center gap-2">
            <Bitcoin size={22} color="#fff" aria-hidden="true" />
            <DialogTitle
              className="text-lg font-bold leading-tight"
              style={{ color: "#fff", fontFamily: "'Adobe Jenson Pro', serif" }}
            >
              Pay with Bitcoin
            </DialogTitle>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close Bitcoin payment modal"
            className="rounded-full p-1 hover:bg-white/20 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            data-ocid="bitcoin-payment.close_button"
          >
            <X size={18} color="#fff" />
          </button>
          <DialogDescription className="sr-only">
            Bitcoin payment information — QR code, BTC amount, and instructions
          </DialogDescription>
        </div>

        <div
          className="px-6 pb-6 pt-4 space-y-5"
          style={{ background: "#fff" }}
        >
          {/* Price breakdown */}
          <div
            className="rounded-xl p-4 text-center"
            style={{ background: "#fdf6ec", border: "1px solid #F7931A33" }}
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
                <>
                  <span
                    className="text-2xl font-bold tracking-tight"
                    style={{ color: "#F7931A" }}
                    data-ocid="bitcoin-payment.btc_amount"
                  >
                    {totalBtc} BTC
                  </span>
                </>
              )}
            </div>
            <p className="text-[10px] mt-1" style={{ color: "#bbb" }}>
              Rate: 1 BTC ≈ €{effectiveRate.toLocaleString()} · updates every
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
              style={{ background: "#fff", border: "2px solid #F7931A44" }}
            >
              {qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt={`Bitcoin QR code for ${walletAddress}`}
                  className="w-52 h-52 object-contain rounded"
                  data-ocid="bitcoin-payment.qr_code"
                />
              ) : (
                <div
                  className="w-52 h-52 flex items-center justify-center rounded animate-pulse"
                  style={{ background: "#f3f3f3" }}
                >
                  <Bitcoin size={48} color="#F7931A55" />
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
              Bitcoin Address
            </p>
            <div
              className="flex items-center gap-2 rounded-xl px-3 py-2"
              style={{
                background: "#f9f9f9",
                border: "1px solid #e5e5e5",
              }}
            >
              <p
                className="flex-1 text-[11px] font-mono break-all leading-tight select-all"
                style={{ color: "#111" }}
                data-ocid="bitcoin-payment.wallet_address"
              >
                {walletAddress}
              </p>
              <button
                type="button"
                onClick={handleCopy}
                aria-label="Copy Bitcoin address"
                data-ocid="bitcoin-payment.copy_address_button"
                className="flex-shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2"
                style={{
                  background: copied ? "#22c55e" : "#F7931A",
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
              <strong style={{ color: "#F7931A" }}>{totalBtc} BTC</strong> to
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
            data-ocid="bitcoin-payment.send_proof_button"
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
