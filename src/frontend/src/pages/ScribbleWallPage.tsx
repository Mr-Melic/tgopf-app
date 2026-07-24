import React, { useCallback, useEffect, useRef, useState } from "react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useAddFavourite,
  useGetUserFavourites,
  useListShortMessages,
  useRemoveFavourite,
} from "../hooks/useQueries";

interface ActiveMessage {
  id: string;
  messageId: string;
  text: string;
  x: number;
  y: number;
  typingSpeed: number; // ms per char
  lingerMs: number;
  phase: "typing" | "lingering" | "fading" | "done";
  displayedText: string;
  charIndex: number;
  favourited: boolean;
  showCelebration: boolean;
}

// Side message for decorative columns flanking the header — removed; now lives in HomePage

const TYPING_SPEEDS = { slow: 120, normal: 60, fast: 25 };
const CARD_MAX_W = 280;
const CARD_APPROX_H = 120;
const SAFE_TOP = 130;
const SAFE_BOTTOM = 90;
const SAFE_X = 22;

function randomBetween(a: number, b: number) {
  return a + Math.random() * (b - a);
}

function pickSpeed(): number {
  const roll = Math.random();
  if (roll < 0.33) return TYPING_SPEEDS.slow;
  if (roll < 0.66) return TYPING_SPEEDS.normal;
  return TYPING_SPEEDS.fast;
}

function getRandomPosition(
  viewport: { w: number; h: number },
  existing: ActiveMessage[],
): { x: number; y: number } {
  const maxX = viewport.w - CARD_MAX_W - SAFE_X;
  const maxY = viewport.h - CARD_APPROX_H - SAFE_BOTTOM;
  for (let attempt = 0; attempt < 10; attempt++) {
    const x = randomBetween(SAFE_X, Math.max(SAFE_X + 10, maxX));
    const y = randomBetween(SAFE_TOP, Math.max(SAFE_TOP + 10, maxY));
    const overlaps = existing.some(
      (m) =>
        m.phase !== "done" &&
        Math.abs(m.x - x) < CARD_MAX_W + 12 &&
        Math.abs(m.y - y) < CARD_APPROX_H + 12,
    );
    if (!overlaps) return { x, y };
  }
  return {
    x: randomBetween(SAFE_X, Math.max(SAFE_X + 10, maxX)),
    y: randomBetween(SAFE_TOP, Math.max(SAFE_TOP + 10, maxY)),
  };
}

interface ScribbleWallPageProps {
  onNavigateHome: () => void;
}

export default function ScribbleWallPage({
  onNavigateHome,
}: ScribbleWallPageProps) {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const { identity } = useInternetIdentity();
  const isLoggedIn = !!identity;

  const { data: shortMessages = [] } = useListShortMessages();
  const { data: favourites } = useGetUserFavourites();
  const addFavourite = useAddFavourite();
  const removeFavourite = useRemoveFavourite();

  const [activeTab, setActiveTab] = useState<"wall" | "favourites">("wall");
  const [messages, setMessages] = useState<ActiveMessage[]>([]);
  const [score, setScore] = useState(0);
  const [prevScore, setPrevScore] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");

  const viewportRef = useRef({ w: window.innerWidth, h: window.innerHeight });
  const spawnTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMountedRef = useRef(true);
  const messagesRef = useRef<ActiveMessage[]>([]);
  const shortMessagesRef = useRef(shortMessages);

  // Sync viewport on resize (wall positioning only)
  useEffect(() => {
    const onResize = () => {
      viewportRef.current = { w: window.innerWidth, h: window.innerHeight };
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Sync score with actual favourites count
  useEffect(() => {
    if (favourites?.shortMessages) {
      setScore(favourites.shortMessages.length);
    }
  }, [favourites?.shortMessages]);

  // Score animation
  useEffect(() => {
    if (score > prevScore) {
      const t = setTimeout(() => setPrevScore(score), 600);
      return () => clearTimeout(t);
    }
  }, [score, prevScore]);

  useEffect(() => {
    shortMessagesRef.current = shortMessages;
  }, [shortMessages]);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  // Spawn a single message card
  const spawnMessage = useCallback(() => {
    const msgs = shortMessagesRef.current;
    if (!msgs || msgs.length === 0) return;
    const msg = msgs[Math.floor(Math.random() * msgs.length)];
    const pos = getRandomPosition(viewportRef.current, messagesRef.current);
    const favSet = new Set(
      (favourites?.shortMessages ?? []).map((id: string) => id),
    );
    const newCard: ActiveMessage = {
      id: `${msg.id}-${Date.now()}-${Math.random()}`,
      messageId: msg.id,
      text: msg.text,
      x: pos.x,
      y: pos.y,
      typingSpeed: pickSpeed(),
      lingerMs: Math.floor(randomBetween(4000, 8000)),
      phase: "typing",
      displayedText: "",
      charIndex: 0,
      favourited: favSet.has(msg.id),
      showCelebration: false,
    };
    setMessages((prev) => [...prev.filter((m) => m.phase !== "done"), newCard]);
  }, [favourites?.shortMessages]);

  // Initial burst then periodic spawning
  useEffect(() => {
    if (activeTab !== "wall") return;
    isMountedRef.current = true;

    const scheduleNextSpawn = () => {
      if (!isMountedRef.current) return;
      const delay = Math.floor(randomBetween(2000, 3000));
      spawnTimerRef.current = setTimeout(() => {
        if (!isMountedRef.current) return;
        const count = Math.random() < 0.4 ? 2 : 1;
        for (let i = 0; i < count; i++) spawnMessage();
        scheduleNextSpawn();
      }, delay);
    };

    // Initial burst: 8–12 messages
    const initialCount = Math.floor(randomBetween(8, 13));
    for (let i = 0; i < initialCount; i++) {
      setTimeout(() => {
        if (isMountedRef.current) spawnMessage();
      }, i * 80);
    }
    scheduleNextSpawn();

    return () => {
      isMountedRef.current = false;
      if (spawnTimerRef.current) clearTimeout(spawnTimerRef.current);
    };
  }, [activeTab, spawnMessage, shortMessages.length]);

  // Typewriter ticker
  useEffect(() => {
    if (messages.length === 0) return;

    const tickerMap = new Map<string, ReturnType<typeof setInterval>>();

    messages.forEach((msg) => {
      if (msg.phase !== "typing") return;

      const ticker = setInterval(() => {
        setMessages((prev) =>
          prev.map((m) => {
            if (m.id !== msg.id || m.phase !== "typing") return m;
            const nextIdx = m.charIndex + 1;
            const nextText = m.text.slice(0, nextIdx);
            if (nextIdx >= m.text.length) {
              clearInterval(tickerMap.get(m.id));
              // Start linger timer
              setTimeout(() => {
                setMessages((p) =>
                  p.map((mm) =>
                    mm.id === m.id && mm.phase === "lingering"
                      ? { ...mm, phase: "fading" }
                      : mm,
                  ),
                );
              }, m.lingerMs);
              return {
                ...m,
                displayedText: nextText,
                charIndex: nextIdx,
                phase: "lingering",
              };
            }
            return { ...m, displayedText: nextText, charIndex: nextIdx };
          }),
        );
      }, msg.typingSpeed);

      tickerMap.set(msg.id, ticker);
    });

    return () => {
      tickerMap.forEach((t) => clearInterval(t));
    };
  }, [messages.map((m) => m.id).join(",")]); // eslint-disable-line

  // Fade-out cleanup
  useEffect(() => {
    const fadingIds = messages
      .filter((m) => m.phase === "fading")
      .map((m) => m.id);
    if (fadingIds.length === 0) return;
    const t = setTimeout(() => {
      setMessages((prev) =>
        prev.map((m) =>
          fadingIds.includes(m.id) ? { ...m, phase: "done" } : m,
        ),
      );
    }, 600);
    return () => clearTimeout(t);
  }, [messages.filter((m) => m.phase === "fading").length]); // eslint-disable-line

  const handleFavourite = useCallback(
    (cardId: string, messageId: string, currentlyFavourited: boolean) => {
      if (!isLoggedIn) return;
      setMessages((prev) =>
        prev.map((m) => {
          if (m.id !== cardId) return m;
          if (!currentlyFavourited) {
            setScore((s) => s + 1);
            addFavourite.mutate({
              itemType: "shortMessage",
              itemId: messageId,
            });
            return { ...m, favourited: true, showCelebration: true };
          }
          setScore((s) => Math.max(0, s - 1));
          removeFavourite.mutate({
            itemType: "shortMessage",
            itemId: messageId,
          });
          return { ...m, favourited: false };
        }),
      );
      // Clear celebration after 1.5s
      setTimeout(() => {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === cardId ? { ...m, showCelebration: false } : m,
          ),
        );
      }, 1500);
    },
    [isLoggedIn, addFavourite, removeFavourite],
  );

  // Favourites tab data
  const favouritedIds = new Set(favourites?.shortMessages ?? []);
  const favouritedMessages = shortMessages.filter((m) =>
    favouritedIds.has(m.id),
  );
  const filteredFavourites = favouritedMessages.filter((m) =>
    m.text.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const visibleMessages = messages.filter((m) => m.phase !== "done");

  return (
    <div
      className="min-h-screen bg-white"
      style={{ fontFamily: "'Adobe Jenson Pro', 'Inter', serif" }}
    >
      {/* Header row: [back btn + title + score] */}
      <div className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <div className="flex items-center px-4 py-3 gap-2">
          {/* Back button */}
          <button
            onClick={onNavigateHome}
            className="text-sm text-gray-500 hover:text-black transition-colors flex-shrink-0 mr-1"
            aria-label="Back to home"
          >
            ← Back
          </button>

          {/* Centre: title */}
          <div className="text-center flex-1 min-w-0">
            <h1
              className="text-2xl font-bold italic text-black"
              style={{ fontFamily: "'Adobe Jenson Pro', serif" }}
            >
              Scribble Wall
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Catch your favourite moments
            </p>
          </div>

          {/* Score counter */}
          <div
            className="flex items-center gap-1.5 bg-black text-white rounded-full px-3 py-1 text-sm font-semibold transition-all duration-300 flex-shrink-0"
            style={{ minWidth: 80, textAlign: "center" }}
            data-ocid="scribble-score"
            aria-live="polite"
            aria-label={`Caught: ${score}`}
          >
            <span className={score > prevScore ? "animate-bounce" : ""}>
              ⭐
            </span>
            <span>Caught: {score}</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 px-4 pt-2 bg-white relative z-40">
        <button
          type="button"
          onClick={() => setActiveTab("wall")}
          className={`px-5 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "wall"
              ? "border-black text-black"
              : "border-transparent text-gray-400 hover:text-gray-700"
          }`}
          data-ocid="tab-wall"
        >
          Wall
        </button>
        {isLoggedIn && (
          <button
            type="button"
            onClick={() => setActiveTab("favourites")}
            className={`px-5 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "favourites"
                ? "border-black text-black"
                : "border-transparent text-gray-400 hover:text-gray-700"
            }`}
            data-ocid="tab-favourites"
          >
            Favourites{" "}
            {score > 0 && (
              <span className="ml-1 text-xs text-gray-400">({score})</span>
            )}
          </button>
        )}
      </div>

      {/* Wall tab */}
      {activeTab === "wall" && (
        <div
          className="relative overflow-hidden"
          style={{ height: "calc(100vh - 120px)" }}
          aria-label="Scribble wall — messages appear randomly across the screen"
        >
          {shortMessages.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center">
              <p className="text-gray-400 text-sm">Loading messages…</p>
            </div>
          )}

          {visibleMessages.map((msg) => (
            <MessageCard
              key={msg.id}
              msg={msg}
              isLoggedIn={isLoggedIn}
              onFavourite={handleFavourite}
            />
          ))}

          {/* Fade-out gradient overlay — soft transition to footer */}
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              height: 180,
              background:
                "linear-gradient(to bottom, transparent 0%, rgba(255,255,255,0.4) 30%, rgba(255,255,255,0.8) 65%, #ffffff 100%)",
              zIndex: 20,
              pointerEvents: "none",
            }}
          />
        </div>
      )}

      {/* Favourites tab */}
      {activeTab === "favourites" && (
        <div className="max-w-2xl mx-auto px-4 py-8">
          <div className="mb-4">
            <input
              type="search"
              placeholder="Search your saved messages…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full border border-gray-200 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
              data-ocid="favourites-search"
            />
          </div>

          {filteredFavourites.length === 0 ? (
            <div className="text-center py-20" data-ocid="favourites-empty">
              <p className="text-3xl mb-3">⭐</p>
              <p className="text-gray-500 text-sm">
                {searchQuery
                  ? "No messages match your search."
                  : "No favourites yet — catch some messages on the Wall!"}
              </p>
              {!searchQuery && (
                <button
                  type="button"
                  onClick={() => setActiveTab("wall")}
                  className="mt-4 text-sm text-black underline hover:no-underline"
                >
                  Go to the Wall →
                </button>
              )}
            </div>
          ) : (
            <ul className="space-y-3">
              {filteredFavourites.map((m) => (
                <li
                  key={m.id}
                  className="flex items-start gap-3 bg-white border border-gray-100 rounded-xl p-4 shadow-sm"
                  data-ocid="favourite-item"
                >
                  <p
                    className="flex-1 text-sm text-gray-800 leading-relaxed"
                    style={{ fontFamily: "'Adobe Jenson Pro', serif" }}
                  >
                    {m.text}
                  </p>
                  <button
                    type="button"
                    onClick={() =>
                      removeFavourite.mutate({
                        itemType: "shortMessage",
                        itemId: m.id,
                      })
                    }
                    className="text-gray-400 hover:text-red-500 transition-colors text-lg flex-shrink-0"
                    aria-label="Remove from favourites"
                    data-ocid="remove-favourite"
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

interface MessageCardProps {
  msg: ActiveMessage;
  isLoggedIn: boolean;
  onFavourite: (
    cardId: string,
    messageId: string,
    currentlyFavourited: boolean,
  ) => void;
}

function MessageCard({ msg, isLoggedIn, onFavourite }: MessageCardProps) {
  const opacity =
    msg.phase === "fading"
      ? 0
      : msg.phase === "typing" || msg.phase === "lingering"
        ? 1
        : 0;

  return (
    <div
      className="absolute"
      style={{
        left: msg.x,
        top: msg.y,
        maxWidth: CARD_MAX_W,
        zIndex: 10,
        transition:
          msg.phase === "fading" ? "opacity 0.5s ease-out" : undefined,
        opacity,
        pointerEvents: msg.phase === "done" ? "none" : "auto",
      }}
      data-ocid="scribble-message-card"
    >
      {/* Favourite button above card */}
      <div className="flex justify-end mb-1 relative">
        {msg.showCelebration && (
          <span
            className="absolute -top-6 right-0 text-xs font-semibold text-amber-600 animate-bounce whitespace-nowrap"
            aria-live="polite"
          >
            +1 caught!
          </span>
        )}
        {isLoggedIn ? (
          <button
            type="button"
            onClick={() => onFavourite(msg.id, msg.messageId, msg.favourited)}
            className={`w-7 h-7 flex items-center justify-center rounded-full transition-all duration-200 shadow-sm ${
              msg.favourited
                ? "bg-amber-400 text-white hover:bg-amber-500"
                : "bg-white text-gray-400 hover:text-amber-400 hover:bg-amber-50 border border-gray-200"
            }`}
            aria-label={
              msg.favourited ? "Remove from favourites" : "Save to favourites"
            }
            data-ocid="scribble-fav-btn"
          >
            {msg.favourited ? "★" : "☆"}
          </button>
        ) : (
          <button
            type="button"
            disabled
            className="w-7 h-7 flex items-center justify-center rounded-full bg-white text-gray-300 border border-gray-100 shadow-sm cursor-not-allowed"
            title="Login to save"
            aria-label="Login to save this message"
          >
            ☆
          </button>
        )}
      </div>

      {/* Message card */}
      <div
        className="rounded-xl px-3 py-2 shadow-md"
        style={{
          background: "rgba(255,255,255,0.95)",
          border: "1px solid rgba(0,0,0,0.07)",
          minWidth: 120,
          maxWidth: CARD_MAX_W,
        }}
      >
        <p
          className="text-[14px] leading-relaxed text-gray-800 break-words"
          style={{ fontFamily: "'Adobe Jenson Pro', serif" }}
        >
          {msg.displayedText}
          {msg.phase === "typing" && (
            <span className="inline-block w-0.5 h-3.5 bg-gray-600 ml-0.5 animate-pulse align-middle" />
          )}
        </p>
      </div>
    </div>
  );
}
