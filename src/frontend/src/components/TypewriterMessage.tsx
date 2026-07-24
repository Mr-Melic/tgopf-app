import { useEffect, useRef, useState } from "react";

interface TypewriterMessageProps {
  text: string;
  /** ms per character while typing (default 45) */
  typingSpeed?: number;
  /** ms to linger after full text is typed (default 12000) */
  lingerDuration?: number;
  /** brief ms to pause (invisible) before next cycle starts (default 200) */
  clearDuration?: number;
  /** called when linger ends and the component is ready to move to the next message */
  onCycleEnd?: () => void;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Renders `text` letter-by-letter, then lingers for `lingerDuration` ms,
 * then briefly clears before calling `onCycleEnd` so the parent can swap
 * to the next message.
 *
 * A blinking cursor (|) is shown while typing and hidden during the linger.
 *
 * `typingSpeed` can be changed on each cycle by the parent (e.g. slow/normal/fast)
 * — the prop is re-read whenever `text` changes, so a new speed takes effect
 * at the start of each new message.
 */
export default function TypewriterMessage({
  text,
  typingSpeed = 45,
  lingerDuration = 12000,
  clearDuration = 200,
  onCycleEnd,
  className = "",
  style,
}: TypewriterMessageProps) {
  const [displayed, setDisplayed] = useState("");
  const [phase, setPhase] = useState<"typing" | "linger" | "clear">("typing");

  // Keep stable refs to avoid re-running the effect on every render cycle
  const textRef = useRef(text);
  const onCycleEndRef = useRef(onCycleEnd);
  // Capture typingSpeed at the moment `text` changes so a new speed is snapped
  // to the start of every message cycle rather than mid-cycle.
  const typingSpeedRef = useRef(typingSpeed);

  textRef.current = text;
  onCycleEndRef.current = onCycleEnd;

  useEffect(() => {
    // Snap the current typingSpeed for this entire cycle
    typingSpeedRef.current = typingSpeed;

    // Reset every time `text` changes
    setDisplayed("");
    setPhase("typing");

    let charIndex = 0;
    let typingTimer: ReturnType<typeof setTimeout>;
    let lingerTimer: ReturnType<typeof setTimeout>;
    let clearTimer: ReturnType<typeof setTimeout>;

    const typeNextChar = () => {
      charIndex += 1;
      setDisplayed(textRef.current.slice(0, charIndex));

      if (charIndex < textRef.current.length) {
        typingTimer = setTimeout(typeNextChar, typingSpeedRef.current);
      } else {
        // All chars typed — start linger phase
        setPhase("linger");
        lingerTimer = setTimeout(() => {
          // Start clear phase (brief invisible pause)
          setPhase("clear");
          clearTimer = setTimeout(() => {
            onCycleEndRef.current?.();
          }, clearDuration);
        }, lingerDuration);
      }
    };

    if (textRef.current.length > 0) {
      typingTimer = setTimeout(typeNextChar, typingSpeedRef.current);
    }

    return () => {
      clearTimeout(typingTimer);
      clearTimeout(lingerTimer);
      clearTimeout(clearTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);

  const isClearing = phase === "clear";

  return (
    <span
      className={className}
      style={{
        ...style,
        opacity: isClearing ? 0 : 1,
        transition: isClearing ? `opacity ${clearDuration}ms ease` : "none",
        display: "inline",
      }}
    >
      {displayed}
      {/* Blinking cursor — only during typing */}
      {phase === "typing" && (
        <span
          aria-hidden="true"
          style={{
            display: "inline-block",
            width: "1px",
            marginLeft: "1px",
            animation: "typewriter-blink 0.7s step-end infinite",
            fontWeight: "normal",
          }}
        >
          |
        </span>
      )}
    </span>
  );
}
