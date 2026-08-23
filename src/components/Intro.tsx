"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { pickIntroVerse, type IntroVerse } from "@/lib/introVerses";

const SESSION_KEY = "hafiz_intro_seen_v7";
const CONTINUE_AT = 9000; // fallback: reveal "continue" even if audio can't autoplay (ms)

type Phase = "hidden" | "running" | "noor" | "fadeout";

const emptySubscribe = () => () => {};

/** true on the client after mount, false on the server and during the first client render. */
function useIsMounted(): boolean {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
}

function wasIntroSeen(): boolean {
  try {
    return window.sessionStorage.getItem(SESSION_KEY) === "1";
  } catch {
    return false;
  }
}

export function Intro() {
  const isMounted = useIsMounted();
  // Before mount we must render null to avoid hydration mismatches (sessionStorage is client-only).
  const [phase, setPhase] = useState<Phase>("hidden");
  const [glow, setGlow] = useState(false);
  const [showContinue, setShowContinue] = useState(false);
  const [verse, setVerse] = useState<IntroVerse | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const transitionedRef = useRef(false);
  const playedRef = useRef(false);
  const timersRef = useRef<number[]>([]);

  const startAudio = () => {
    if (playedRef.current) return;
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = 0;
    audio.play().then(
      () => {
        playedRef.current = true;
        let v = 0;
        const fade = window.setInterval(() => {
          v = Math.min(1, v + 0.07);
          audio.volume = v;
          if (v >= 1) window.clearInterval(fade);
        }, 90);
      },
      () => {}
    );
  };

  useEffect(() => {
    if (!isMounted) return;
    // This runs once on mount (client only). Session storage is safe to read here.
    if (wasIntroSeen()) return;

    // Defer initial state updates out of the synchronous effect body so React can
    // paint the (null) first frame without a cascading render. This is a mount-only
    // initialization path (the effect has empty deps), not a derived-state sync.
    queueMicrotask(() => {
      setVerse(pickIntroVerse());
      setPhase("running");
    });
    document.body.style.overflow = "hidden";

    startAudio();
    const onInteract = () => startAudio();
    const events: (keyof WindowEventMap)[] = ["pointerdown", "touchstart", "keydown", "click"];
    events.forEach((e) => window.addEventListener(e, onInteract, { passive: true } as AddEventListenerOptions));

    const timers = timersRef.current;
    timers.push(window.setTimeout(() => setShowContinue(true), CONTINUE_AT));

    return () => {
      timers.forEach((t) => window.clearTimeout(t));
      events.forEach((e) => window.removeEventListener(e, onInteract));
      document.body.style.overflow = "";
    };
  }, [isMounted]);

  const proceed = () => {
    if (transitionedRef.current) return;
    transitionedRef.current = true;
    const audio = audioRef.current;
    if (audio && !audio.paused) {
      let v = audio.volume;
      const fade = window.setInterval(() => {
        v = Math.max(0, v - 0.1);
        audio.volume = v;
        if (v <= 0) {
          audio.pause();
          window.clearInterval(fade);
        }
      }, 60);
    }
    // soft radiant glow (no lightning), then dissolve into the platform
    setGlow(true);
    window.setTimeout(() => setPhase("noor"), 500);
    window.setTimeout(() => setPhase("fadeout"), 2600);
    window.setTimeout(() => finish(), 3500);
  };

  const finish = () => {
    try {
      window.sessionStorage.setItem(SESSION_KEY, "1");
    } catch {
      /* ignore */
    }
    document.body.style.overflow = "";
    setPhase("hidden");
  };

  if (!isMounted || phase === "hidden" || !verse) return null;

  return (
    <div className={`intro-root ${phase === "noor" ? "noor" : ""} ${phase === "fadeout" ? "fade-out" : ""} ${glow ? "glow-burst" : ""}`} role="presentation">
      <audio
        ref={audioRef}
        src={`https://everyayah.com/data/Yasser_Ad-Dussary_128kbps/${verse.audio}.mp3`}
        preload="auto"
        onEnded={() => setShowContinue(true)}
      />

      <svg className="intro-pattern" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice" aria-hidden>
        <defs>
          <pattern id="introGeo" width="16" height="16" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <path d="M8 0 L16 8 L8 16 L0 8 Z" fill="none" stroke="currentColor" strokeWidth="0.4" />
            <circle cx="8" cy="8" r="3" fill="none" stroke="currentColor" strokeWidth="0.3" />
          </pattern>
        </defs>
        <rect width="100" height="100" fill="url(#introGeo)" />
      </svg>

      <div className="intro-glow" />
      <div className="intro-noor" />
      <div className="intro-burst" />

      <div className="intro-stage relative z-10 px-6">
        <p className="intro-basmala text-[6vw] sm:text-[2.8rem]" style={{ fontFamily: "var(--font-quran)" }}>
          بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
        </p>

        <div className="intro-frame mx-auto mt-12 max-w-3xl">
          <span className="intro-frame-aura" />
          <span className="intro-frame-corner right-4 top-4 border-r-2 border-t-2" style={{ borderTopRightRadius: 12 }} />
          <span className="intro-frame-corner left-4 top-4 border-l-2 border-t-2" style={{ borderTopLeftRadius: 12 }} />
          <span className="intro-frame-corner right-4 bottom-4 border-r-2 border-b-2" style={{ borderBottomRightRadius: 12 }} />
          <span className="intro-frame-corner left-4 bottom-4 border-l-2 border-b-2" style={{ borderBottomLeftRadius: 12 }} />
          <p key={verse.audio} className="intro-verse text-[7vw] leading-[1.9] sm:text-[3.4rem]" style={{ fontFamily: "var(--font-quran)" }}>
            {verse.text}
          </p>
        </div>

        <p className="intro-attribution mt-8 text-sm tracking-[0.25em] text-[#4a6664]">
          {verse.source} · بصوت الشيخ ياسر الدوسري
        </p>

        <div className={`intro-continue-wrap ${showContinue ? "show" : ""}`}>
          <button onClick={proceed} className="intro-continue" disabled={!showContinue}>
            متابعة
            <span className="intro-continue-arrow">‹</span>
          </button>
        </div>
      </div>
    </div>
  );
}
