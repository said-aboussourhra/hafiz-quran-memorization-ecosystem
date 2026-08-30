"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { LOCAL_QURAN } from "@/data/quranText";
import { WELCOME_TRACKS, pickRandomTrackIndex } from "@/lib/welcomeRecitations";

/**
 * تلاوة ترحيبية فاخرة: عند فتح الموقع يُختار أحد القرّاء الأربعة عشوائياً
 * (حمزة بوديب، إسلام صبحي، محمد عبادة، شريف مصطفى) وتبدأ تلاوة عطرة قصيرة.
 * - محاولة تشغيل تلقائي عند الفتح؛ إن منعها المتصفح، تُشغَّل عند أول لمسة.
 * - أزرار للتبديل بين القرّاء وإيقاف/تشغيل.
 */
export function WelcomeRecitation() {
  const [index, setIndex] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [failed, setFailed] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const triedAutoplay = useRef(false);

  const track = WELCOME_TRACKS[index];

  // اختيار قارئ عشوائي بعد التركيب (يمنع تعارض رطوبة الـ hydration).
  // نؤجّل setState داخل rAF احتراماً لقاعدة عدم الاستدعاء المتزامن في جسم effect.
  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      setIndex(pickRandomTrackIndex());
      setMounted(true);
    });
    return () => cancelAnimationFrame(raf);
  }, []);

  // محاولة التشغيل التلقائي عند تغيّر القارئ
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !mounted) return;
    const tryPlay = () => {
      setFailed(false);
      audio
        .play()
        .then(() => setPlaying(true))
        .catch(() => {
          setPlaying(false);
          if (!triedAutoplay.current) {
            triedAutoplay.current = true;
            const onFirst = () => {
              audio.play().then(() => setPlaying(true)).catch(() => {});
              window.removeEventListener("pointerdown", onFirst);
              window.removeEventListener("keydown", onFirst);
            };
            window.addEventListener("pointerdown", onFirst, { once: true });
            window.addEventListener("keydown", onFirst, { once: true });
          }
        });
    };
    const t = setTimeout(tryPlay, 400);
    return () => clearTimeout(t);
  }, [index, mounted]);

  // إيقاف الصوت عند مغادرة الصفحة
  useEffect(() => {
    const audio = audioRef.current;
    return () => {
      audio?.pause();
    };
  }, []);

  const toggle = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
      setPlaying(false);
    } else {
      audio
        .play()
        .then(() => setPlaying(true))
        .catch(() => setFailed(true));
    }
  };

  const switchTrack = (dir: 1 | -1) => {
    setPlaying(false);
    setIndex((i) => (i + dir + WELCOME_TRACKS.length) % WELCOME_TRACKS.length);
  };

  const surah = LOCAL_QURAN.find((s) => s.s === track.surahNumber);
  const preview = surah ? surah.v.slice(0, 3).join(" ۝ ") : "";

  return (
    <div
      className="welcome-rec"
      dir="rtl"
      style={{
        background:
          "radial-gradient(900px 420px at 50% -12%, rgba(255,244,214,.92), transparent 60%), radial-gradient(640px 460px at 90% 118%, rgba(16,185,129,.13), transparent 60%), radial-gradient(640px 460px at 6% 118%, rgba(37,99,235,.10), transparent 60%), linear-gradient(160deg,#fffef9 0%,#fdf6e7 55%,#f7efda 100%)",
      }}
    >
      <span className="welcome-rec-frame" aria-hidden />
      <audio
        ref={audioRef}
        src={track.audioUrl}
        preload="none"
        onEnded={() => setPlaying(false)}
        onError={() => setFailed(true)}
      />

      <div className="welcome-rec-head">
        <span className="welcome-rec-eyebrow">
          <span className="welcome-rec-dot" />
          تلاوة ترحيبية · قارئ اليوم
        </span>
        <span className="welcome-rec-count">
          {(index + 1).toLocaleString("ar-EG")} / {WELCOME_TRACKS.length.toLocaleString("ar-EG")}
        </span>
      </div>

      <div className="welcome-rec-body">
        {/* زر التشغيل */}
        <button
          type="button"
          className={`welcome-play ${playing ? "is-playing" : ""}`}
          onClick={toggle}
          aria-label={playing ? "إيقاف التلاوة" : "استماع للتلاوة"}
          title={playing ? "إيقاف" : "استماع"}
        >
          {playing ? (
            <svg viewBox="0 0 24 24" width="30" height="30" fill="currentColor" aria-hidden>
              <rect x="6" y="5" width="4.5" height="14" rx="1.6" />
              <rect x="13.5" y="5" width="4.5" height="14" rx="1.6" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" width="30" height="30" fill="currentColor" aria-hidden>
              <path d="M8.5 5.8c0-1.3 1.45-2.05 2.55-1.36l8.7 5.5c.93.6.93 1.98 0 2.58l-8.7 5.5c-1.1.7-2.55-.06-2.55-1.36V5.8z" />
            </svg>
          )}
          {/* أشرطة موازن صوت متحركة أثناء التشغيل */}
          <span className="welcome-eq" aria-hidden>
            <i /><i /><i /><i />
          </span>
        </button>

        {/* النص */}
        <div className="welcome-rec-text">
          <div className="welcome-rec-reciter">
            <span className="welcome-rec-name">{track.reciterName}</span>
            <span className="welcome-rec-origin">{track.reciterOrigin}</span>
          </div>

          <div className="welcome-rec-ayah" style={{ fontFamily: "var(--font-quran)" }}>
            <span className="welcome-surah-chip">سورة {track.surahName}</span>
            <span className="welcome-rec-words">{preview}</span>
          </div>

          <div className="welcome-rec-meta">
            {failed ? (
              <span className="welcome-rec-note">تعذّر تشغيل الصوت الآن (يتطلب اتصالاً بالإنترنت).</span>
            ) : playing ? (
              <span className="welcome-rec-note live">
                <span className="welcome-live-dot" /> تُتلى الآن بصوت {track.reciterName.replace("الشيخ ", "")}
              </span>
            ) : (
              <span className="welcome-rec-note">اضغط زر التشغيل للاستماع · تتغيّر التلاوة في كل زيارة</span>
            )}
            <Link href="/mushaf" className="welcome-rec-link">
              افتح المصحف ‹
            </Link>
          </div>
        </div>
      </div>

      {/* التنقل بين القرّاء */}
      <div className="welcome-switch">
        <button
          type="button"
          className="welcome-switch-btn"
          onClick={() => switchTrack(-1)}
          aria-label="القارئ السابق"
          title="القارئ السابق"
        >
          ›
        </button>
        <div className="welcome-dots" aria-hidden>
          {TrackDots(index)}
        </div>
        <button
          type="button"
          className="welcome-switch-btn"
          onClick={() => switchTrack(1)}
          aria-label="القارئ التالي"
          title="القارئ التالي"
        >
          ‹
        </button>
      </div>
    </div>
  );
}

/** نقاط مؤشّر القارئ الحالي */
function TrackDots(active: number) {
  return WELCOME_TRACKS.map((t, i) => (
    <span key={t.reciterId} className={`welcome-dot ${i === active ? "on" : ""}`} title={t.reciterName} />
  ));
}
