"use client";

import Image from "next/image";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { pickIntroVerse, type IntroVerse } from "@/lib/introVerses";
import { OrnamentStar } from "@/components/Ornament";
import { useAdminLogin } from "./AdminLoginProvider";

const SESSION_KEY = "hafiz_intro_seen_v10";
const CONTINUE_REVEAL_MS = 2400; // reveal "continue" button smoothly after 2.4s

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
  const { openAdminLogin } = useAdminLogin();
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
    if (wasIntroSeen()) return;

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
    timers.push(window.setTimeout(() => setShowContinue(true), CONTINUE_REVEAL_MS));

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
        src={verse.audioUrl}
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

      {/* ===== 1) الشعار فقط في الزاوية العلوية (~56px بإطار ذهبي رقيق) ===== */}
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          openAdminLogin();
        }}
        className="intro-corner-logo cursor-pointer hover:scale-105 transition-transform"
        aria-label="فتح لوحة التحكم"
      >
        <span className="intro-corner-ring">
          <Image
            src="/HAFIZ.jpg"
            alt="شعار حافظ"
            width={56}
            height={56}
            priority
            className="intro-corner-img"
          />
        </span>
        <div className="intro-corner-text">
          <span className="intro-corner-title">حافظ</span>
          <span className="intro-corner-sub">رحلتك مع القرآن</span>
        </div>
      </button>

      <div className="intro-stage relative z-10 w-full max-w-4xl px-5 sm:px-8">
        {/* ===== 2) البسملة صغيرة في الوسط ===== */}
        <p className="intro-basmala text-[5.5vw] sm:text-[2.2rem]" style={{ fontFamily: "var(--font-quran)" }}>
          بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
        </p>

        {/* ===== 3) الآية داخل إطار فخم ===== */}
        <div className="intro-frame mx-auto mt-6 sm:mt-8 max-w-3xl">
          <span className="intro-frame-aura" />

          {/* نجمة ذهبية دوّارة أعلى الإطار */}
          <div className="intro-frame-top" aria-hidden="true">
            <span className="intro-star-wrap">
              <OrnamentStar className="h-6 w-6 text-[#b8902f] intro-spinning-star" />
            </span>
          </div>

          {/* زوايا ذهبية بأركان الإطار */}
          <span className="intro-frame-corner right-3 top-3 sm:right-4 sm:top-4 border-r-2 border-t-2" style={{ borderTopRightRadius: 12 }} />
          <span className="intro-frame-corner left-3 top-3 sm:left-4 sm:top-4 border-l-2 border-t-2" style={{ borderTopLeftRadius: 12 }} />
          <span className="intro-frame-corner right-3 bottom-3 sm:right-4 sm:bottom-4 border-r-2 border-b-2" style={{ borderBottomRightRadius: 12 }} />
          <span className="intro-frame-corner left-3 bottom-3 sm:left-4 sm:bottom-4 border-l-2 border-b-2" style={{ borderBottomLeftRadius: 12 }} />

          {/* نص الآية الكريمة */}
          <p key={verse.audio} className="intro-verse text-[6.5vw] leading-[2.1] sm:text-[3rem]" style={{ fontFamily: "var(--font-quran)" }}>
            {verse.text}
          </p>

          {/* الزخرفة السفلية */}
          <div className="intro-frame-bottom-decor mt-4 pt-3 border-t border-[#b8902f]/20 flex items-center justify-center gap-3" aria-hidden="true">
            <span className="h-px w-12 sm:w-20 bg-gradient-to-l from-[#b8902f]/60 to-transparent" />
            <OrnamentStar className="h-3.5 w-3.5 text-[#b8902f]/80" />
            <span className="h-px w-12 sm:w-20 bg-gradient-to-r from-[#b8902f]/60 to-transparent" />
          </div>
        </div>

        <p className="intro-attribution mt-5 text-xs sm:text-sm tracking-[0.2em] text-[#4a6664]">
          {verse.source} · بصوت {verse.reciter}
        </p>

        {/* ===== 4) زر «متابعة» أسفل الآية ===== */}
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
