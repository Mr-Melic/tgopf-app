import { useEffect, useRef, useState } from "react";
import { useGetBackgroundMusic } from "../hooks/useQueries";
import { useViewportBreakpoint } from "../hooks/useViewportBreakpoint";

export default function BackgroundMusicPlayer() {
  const { data: backgroundMusic } = useGetBackgroundMusic();
  const audioRef = useRef<HTMLAudioElement>(new Audio());
  const [hasInteracted, setHasInteracted] = useState(false);
  const [isMuted, setIsMuted] = useState(
    () => localStorage.getItem("tgopf_mute") === "true",
  );
  const fadeIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const currentTrackIndexRef = useRef(0);
  const isPlayingRef = useRef(false);

  // Use all tracks sorted by uploadTimestamp as the playlist
  const playlist = [...(backgroundMusic?.tracks ?? [])]
    .sort((a, b) => Number(a.uploadTimestamp) - Number(b.uploadTimestamp))
    .map((t) => t.path);
  const settings = backgroundMusic?.settings;
  // Music is enabled when there is an active track set by admin
  const musicEnabled = !!(
    backgroundMusic?.activeTrack && backgroundMusic.activeTrack.length > 0
  );

  const isBelowBreakpoint = useViewportBreakpoint(1024);

  // Listen for mute changes dispatched by the footer button
  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key === "tgopf_mute") {
        setIsMuted(e.newValue === "true");
      }
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  // User interaction gate — autoplay requires a gesture
  useEffect(() => {
    const handleInteraction = () => setHasInteracted(true);
    document.addEventListener("click", handleInteraction, { once: true });
    document.addEventListener("keydown", handleInteraction, { once: true });
    document.addEventListener("touchstart", handleInteraction, { once: true });
    return () => {
      document.removeEventListener("click", handleInteraction);
      document.removeEventListener("keydown", handleInteraction);
      document.removeEventListener("touchstart", handleInteraction);
    };
  }, []);

  const clearFade = () => {
    if (fadeIntervalRef.current) {
      clearInterval(fadeIntervalRef.current);
      fadeIntervalRef.current = null;
    }
  };

  const fadeOut = (audio: HTMLAudioElement, duration: number): Promise<void> =>
    new Promise((resolve) => {
      clearFade();
      const startVol = audio.volume;
      if (startVol === 0) {
        resolve();
        return;
      }
      const steps = 30;
      const stepChange = startVol / steps;
      let step = 0;
      fadeIntervalRef.current = setInterval(() => {
        step++;
        audio.volume = Math.max(0, startVol - stepChange * step);
        if (step >= steps) {
          clearFade();
          audio.volume = 0;
          resolve();
        }
      }, duration / steps);
    });

  const fadeIn = (
    audio: HTMLAudioElement,
    targetVol: number,
    duration: number,
  ): Promise<void> =>
    new Promise((resolve) => {
      clearFade();
      audio.volume = 0;
      if (targetVol === 0) {
        resolve();
        return;
      }
      const steps = 30;
      const stepChange = targetVol / steps;
      let step = 0;
      fadeIntervalRef.current = setInterval(() => {
        step++;
        audio.volume = Math.min(targetVol, stepChange * step);
        if (step >= steps) {
          clearFade();
          audio.volume = targetVol;
          resolve();
        }
      }, duration / steps);
    });

  const playTrack = async (index: number) => {
    const audio = audioRef.current;
    if (!audio || playlist.length === 0 || !settings) return;
    const trackPath = playlist[index];
    if (!trackPath) return;
    // Construct blob URL same way as useFileUrl
    const encodedPath = encodeURIComponent(trackPath);
    audio.src = `${window.location.origin}/api/blob/${encodedPath}`;
    audio.volume = 0;
    try {
      await audio.play();
      isPlayingRef.current = true;
      const targetVolume = isMuted ? 0 : Number(settings.volume) / 100;
      await fadeIn(audio, targetVolume, Number(settings.fadeInDuration));
    } catch {
      isPlayingRef.current = false;
    }
  };

  // On track end: fade out -> advance index -> play next
  useEffect(() => {
    const audio = audioRef.current;
    const handleEnded = async () => {
      if (playlist.length <= 1 || !settings) return;
      await fadeOut(audio, Number(settings.fadeOutDuration));
      audio.pause();
      isPlayingRef.current = false;
      currentTrackIndexRef.current =
        (currentTrackIndexRef.current + 1) % playlist.length;
      await playTrack(currentTrackIndexRef.current);
    };
    audio.addEventListener("ended", handleEnded);
    return () => audio.removeEventListener("ended", handleEnded);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playlist.length, settings]);

  // Main playback controller
  useEffect(() => {
    const audio = audioRef.current;
    if (!settings) return;
    const shouldPlay =
      musicEnabled &&
      playlist.length > 0 &&
      hasInteracted &&
      !isBelowBreakpoint;
    if (!shouldPlay) {
      if (isPlayingRef.current) {
        fadeOut(audio, Number(settings.fadeOutDuration)).then(() => {
          audio.pause();
          audio.src = "";
          isPlayingRef.current = false;
        });
      }
      return;
    }
    if (!isPlayingRef.current) {
      if (currentTrackIndexRef.current >= playlist.length)
        currentTrackIndexRef.current = 0;
      playTrack(currentTrackIndexRef.current);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    musicEnabled,
    playlist.length,
    hasInteracted,
    isBelowBreakpoint,
    settings,
  ]);

  // Apply mute/unmute immediately without stopping playback
  useEffect(() => {
    const audio = audioRef.current;
    if (!isPlayingRef.current || !settings) return;
    clearFade();
    audio.volume = isMuted ? 0 : Number(settings.volume) / 100;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMuted, settings]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearFade();
      audioRef.current.pause();
      audioRef.current.src = "";
    };
  }, []);

  return null;
}
