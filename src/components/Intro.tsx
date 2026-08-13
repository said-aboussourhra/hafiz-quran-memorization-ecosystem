"use client";

import { useEffect, useRef, useState } from "react";

// Sheikh Yasser Al-Dosari — verse 54:17 "وَلَقَدْ يَسَّرْنَا الْقُرْآنَ لِلذِّكْرِ فَهَلْ مِنْ مُدَّكِرٍ"
const RECITATION = "https://everyayah.com/data/Yasser_Ad-Dussary_128kbps/054017.mp3";
const SESSION_KEY = "hafiz_intro_seen_v4";
const TRANSITION_AT = 15000; // begin النور transition after recitation (ms)
const MAX_DURATION = 22000; // hard safety fallback (ms)

type Phase = "hidden" | "running" | "noor" | "fadeout";

export function Intro() {
  const [mounted, setMounted] = useState(false);
  const [phase, setPhase] = useState<Phase>("hidden");

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const transitionedRef = useRef(false);
  const playedRef = useRef(false);
  const timersRef = useRef<number[]>([]);

  useEffect(() => {
    setMounted(true);
    let seen = false;
    try {
      seen = sessionStorage.getItem(SESSION_KEY) === "1";
    } catch {
      seen = false;
    }
    if (seen) {
      setPhase("hidden");
      return;
    }
    setPhase("running");
    document.body.style.overflow = "hidden";

    // Try autoplay immediately; if blocked, start on first user interaction.
    startAudio();
    const onInteract = () => startAudio();
    const events: (keyof WindowEventMap)[] = ["pointerdown", "pointermove", "touchstart", "keydown", "scroll", "click"];
    events.forEach((e) => window.addEventListener(e, onInteract, { once: false, passive: true } as AddEventListenerOptions));

    timersRef.current.push(window.setTimeout(() => toNoor(), TRANSITION_AT));
    timersRef.current.push(window.setTimeout(() => toNoor(), MAX_DURATION));

    return () => {
      timersRef.current.forEach((t) => window.clearTimeout(t));
      events.forEach((e) => window.removeEventListener(e, onInteract));
      document.body.style.overflow = "";
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      () => {
        /* blocked — will retry on next interaction */
      }
    );
  };

  const toNoor = () => {
    if (transitionedRef.current) return;
    transitionedRef.current = true;
    const audio = audioRef.current;
    if (audio && !audio.paused) {
      let v = audio.volume;
      const fade = window.setInterval(() => {
        v = Math.max(0, v - 0.08);
        audio.volume = v;
        if (v <= 0) {
          audio.pause();
          window.clearInterval(fade);
        }
      }, 80);
    }
    setPhase("noor");
    window.setTimeout(() => setPhase("fadeout"), 2600);
    window.setTimeout(() => finish(), 3600);
  };

  const finish = () => {
    try {
      sessionStorage.setItem(SESSION_KEY, "1");
    } catch {
      /* ignore */
    }
    document.body.style.overflow = "";
    setPhase("hidden");
  };

  if (!mounted || phase === "hidden") return null;

  return (
    <div className={`intro-root ${phase === "noor" ? "noor" : ""} ${phase === "fadeout" ? "fade-out" : ""}`} role="presentation">
      <audio ref={audioRef} src={RECITATION} preload="auto" />

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

      <div className="intro-stage relative z-10 px-6">
        <p className="intro-basmala text-[7vw] sm:text-[3.4rem]" style={{ fontFamily: "var(--font-quran)" }}>
          بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
        </p>
        <p className="intro-verse mt-12 text-[8vw] leading-[1.8] sm:text-[3.9rem]" style={{ fontFamily: "var(--font-quran)" }}>
          وَلَقَدْ يَسَّرْنَا الْقُرْآنَ لِلذِّكْرِ فَهَلْ مِن مُّدَّكِرٍ
        </p>
        <p className="intro-attribution mt-10 text-sm tracking-[0.25em] text-[#9a8f74]">
          سورة القمر · بصوت الشيخ ياسر الدوسري
        </p>
      </div>

      {phase === "running" && (
        <button className="intro-skip" onClick={toNoor}>الدخول إلى المنصة ›</button>
      )}
    </div>
  );
}
