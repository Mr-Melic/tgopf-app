import React, { useMemo, useState, useEffect } from "react";

interface PurchaseButton {
  id: string;
  provider: string;
  url: string;
  backgroundColor: string;
  hoverColor: string;
  action: "link" | "modal";
  onModalOpen?: () => void;
}

interface PurchaseButtonsGridProps {
  mollieUrl: string;
  payPalUrl: string;
  revolutUrl: string;
  vintedUrl: string;
  onMollieClick: () => void;
  onRevolutClick: () => void;
  onBitcoinClick: () => void;
}

export default function PurchaseButtonsGrid({
  mollieUrl,
  payPalUrl,
  revolutUrl,
  vintedUrl,
  onMollieClick,
  onRevolutClick,
  onBitcoinClick,
}: PurchaseButtonsGridProps) {
  const [shakingButtonId, setShakingButtonId] = useState<string | null>(null);

  // Define all buttons with their configurations
  const allButtons: PurchaseButton[] = useMemo(
    () => [
      {
        id: "mollie",
        provider: "Mollie",
        url: mollieUrl,
        backgroundColor: "#E91E63",
        hoverColor: "#C2185B",
        action: "modal",
        onModalOpen: onMollieClick,
      },
      {
        id: "paypal",
        provider: "PayPal",
        url: payPalUrl,
        backgroundColor: "#0070BA",
        hoverColor: "#005EA6",
        action: "link",
      },
      {
        id: "revolut",
        provider: "Revolut",
        url: revolutUrl,
        backgroundColor: "#000000",
        hoverColor: "#1f1f1f",
        action: "modal",
        onModalOpen: onRevolutClick,
      },
      {
        id: "vinted",
        provider: "Vinted",
        url: vintedUrl,
        backgroundColor: "#2DBFAF",
        hoverColor: "#26A89A",
        action: "link",
      },
      {
        id: "bitcoin",
        provider: "Bitcoin",
        url: "#",
        backgroundColor: "#F7931A",
        hoverColor: "#E08510",
        action: "modal",
        onModalOpen: onBitcoinClick,
      },
      {
        id: "bolcom",
        provider: "Bol",
        url: "https://www.bol.com/nl/nl/p/the-gospel-of-poetic-frolic-softcover-boek-gesigneerd-engelstalig-gedichten/9300000258914105/",
        backgroundColor: "#0000A4",
        hoverColor: "#000080",
        action: "link",
      },
    ],
    [
      mollieUrl,
      payPalUrl,
      revolutUrl,
      vintedUrl,
      onMollieClick,
      onRevolutClick,
      onBitcoinClick,
    ],
  );

  // Shuffle buttons on mount, keeping Bitcoin and Bol.com together
  const shuffledButtons = useMemo(() => {
    // Separate Bitcoin and Bol.com from the rest
    const bitcoinButton = allButtons.find((b) => b.id === "bitcoin")!;
    const bolcomButton = allButtons.find((b) => b.id === "bolcom")!;
    const otherButtons = allButtons.filter(
      (b) => b.id !== "bitcoin" && b.id !== "bolcom",
    );

    // Shuffle other buttons using Fisher-Yates algorithm
    const shuffled = [...otherButtons];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    // Insert Bitcoin+Bol.com pair at a random position
    const insertPosition = Math.floor(Math.random() * (shuffled.length + 1));
    shuffled.splice(insertPosition, 0, bitcoinButton, bolcomButton);

    return shuffled;
  }, []); // Empty deps to shuffle only once on mount

  // Randomized shake animation effect
  useEffect(() => {
    const scheduleNextShake = () => {
      // Random interval between 3-10 seconds
      const interval = 3000 + Math.random() * 7000;

      const timer = setTimeout(() => {
        // Pick a random button from the shuffled list
        const randomIndex = Math.floor(Math.random() * shuffledButtons.length);
        const randomButton = shuffledButtons[randomIndex];

        setShakingButtonId(randomButton.id);

        // Clear shake after animation completes (600ms)
        setTimeout(() => {
          setShakingButtonId(null);
          scheduleNextShake();
        }, 600);
      }, interval);

      return timer;
    };

    const timer = scheduleNextShake();

    return () => {
      clearTimeout(timer);
    };
  }, [shuffledButtons]);

  const handleButtonClick = (button: PurchaseButton) => {
    if (button.action === "modal" && button.onModalOpen) {
      button.onModalOpen();
    }
  };

  const renderButton = (button: PurchaseButton) => {
    const isShaking = shakingButtonId === button.id;

    const content = (
      <div
        className={`relative overflow-hidden rounded-full shadow-lg hover:shadow-xl transition-all duration-300 ${
          isShaking ? "animate-shake" : ""
        }`}
        style={{
          backgroundColor: button.backgroundColor,
        }}
      >
        {/* Button content */}
        <div className="relative z-10 py-3 px-6 text-center font-bold text-white">
          <span className="font-normal">via </span>
          <span className="italic">{button.provider}</span>
        </div>
      </div>
    );

    if (button.action === "link") {
      return (
        <a
          key={button.id}
          href={button.url}
          target="_blank"
          rel="noopener noreferrer"
          className="block"
          onMouseEnter={(e) => {
            const buttonDiv = e.currentTarget.querySelector(
              ".relative.overflow-hidden",
            ) as HTMLElement;
            if (buttonDiv) buttonDiv.style.backgroundColor = button.hoverColor;
          }}
          onMouseLeave={(e) => {
            const buttonDiv = e.currentTarget.querySelector(
              ".relative.overflow-hidden",
            ) as HTMLElement;
            if (buttonDiv)
              buttonDiv.style.backgroundColor = button.backgroundColor;
          }}
        >
          {content}
        </a>
      );
    }
    return (
      <button
        key={button.id}
        onClick={() => handleButtonClick(button)}
        className="block w-full"
        onMouseEnter={(e) => {
          const buttonDiv = e.currentTarget.querySelector(
            ".relative.overflow-hidden",
          ) as HTMLElement;
          if (buttonDiv) buttonDiv.style.backgroundColor = button.hoverColor;
        }}
        onMouseLeave={(e) => {
          const buttonDiv = e.currentTarget.querySelector(
            ".relative.overflow-hidden",
          ) as HTMLElement;
          if (buttonDiv)
            buttonDiv.style.backgroundColor = button.backgroundColor;
        }}
      >
        {content}
      </button>
    );
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-2xl mx-auto">
      {shuffledButtons.map((button) => renderButton(button))}
    </div>
  );
}
