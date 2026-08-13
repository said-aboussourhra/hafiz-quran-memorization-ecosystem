"use client";

import { useEffect, useRef, useState } from "react";
import type { SurahContent } from "@/lib/quran";
import { AyahMarker } from "@/components/AyahMarker";
import {
  RECITERS,
  DEFAULT_RECITER,
  ayahUrl,
  surahUrl,
  hasPerAyah,
  perAyahFallback,
  type Reciter,
} from "@/lib/reciters";

type Choice = { ayah: number; x: number; y: number } | null;

export function MushafReader({ surah }: { surah: SurahContent }) {
  const [fontSize, setFontSize] = useState(34);
  const [choice, setChoice] = useState<Choice>(null);
  const [tafsirAyah, setTafsirAyah] = useState<number | null>(null);
  const [playingAyah, setPlayingAyah] = useState<number | null>(null);
  const [surahPlaying, setSurahPlaying] = useState(false);
  const [continuous, setContinuous] = useState(false);
  const [reciter, setReciter] = useState<Reciter>(DEFAULT_RECITER);
  const [showReciters, setShowReciters] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const surahNum = surah.meta.number;
  const tafsir = tafsirAyah != null ? surah.ayahs.find((a) => a.numberInSurah === tafsirAyah) ?? null : null;

  const playAyah = (n: number, chain: boolean) => {
    const ayah = surah.ayahs.find((a) => a.numberInSurah === n);
    if (!ayah || !audioRef.current) return;
    const r = hasPerAyah(reciter) ? reciter : perAyahFallback();
    const url = ayahUrl(r, surahNum, ayah.numberInSurah, ayah.globalNumber);
    if (!url) return;
    setSurahPlaying(false);
    setContinuous(chain);
    setPlayingAyah(n);
    audioRef.current.src = url;
    audioRef.current.play().catch(() => {});
  };

  const playFullSurah = () => {
    if (!audioRef.current) return;
    const full = surahUrl(reciter, surahNum);
    if (full) {
      setPlayingAyah(null);
      setContinuous(false);
      setSurahPlaying(true);
      audioRef.current.src = full;
      audioRef.current.play().catch(() => {});
    } else {
      playAyah(surah.ayahs[0].numberInSurah, true);
    }
  };

  const stopAudio = () => {
    audioRef.current?.pause();
    setPlayingAyah(null);
    setSurahPlaying(false);
    setContinuous(false);
  };

  const onEnded = () => {
    if (continuous && playingAyah != null) {
      const next = playingAyah + 1;
      if (surah.ayahs.some((a) => a.numberInSurah === next)) {
        playAyah(next, true);
        return;
      }
    }
    setPlayingAyah(null);
    setSurahPlaying(false);
    setContinuous(false);
  };

  useEffect(() => {
    if (!choice) return;
    const close = () => setChoice(null);
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setChoice(null);
    window.addEventListener("scroll", close, { passive: true });
    window.addEventListener("keydown", esc);
    return () => {
      window.removeEventListener("scroll", close);
      window.removeEventListener("keydown", esc);
    };
  }, [choice]);

  const onAyahClick = (e: React.MouseEvent, n: number) => {
    e.stopPropagation();
    setChoice({ ayah: n, x: e.clientX, y: e.clientY });
  };

  const isPlaying = playingAyah != null || surahPlaying;

  return (
    <div onClick={() => { setChoice(null); setShowReciters(false); }}>
      <audio ref={audioRef} onEnded={onEnded} />

      {/* Toolbar */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl card p-3">
        <div className="flex items-center gap-2">
          <span className="px-1 text-sm text-ink-500">حجم الخط</span>
          <button onClick={() => setFontSize((s) => Math.max(26, s - 4))} className="grid h-9 w-9 place-items-center rounded-lg btn-ghost text-lg">−</button>
          <button onClick={() => setFontSize((s) => Math.min(60, s + 4))} className="grid h-9 w-9 place-items-center rounded-lg btn-ghost text-lg">+</button>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setShowReciters((v) => !v)} className="flex items-center gap-2 rounded-lg btn-ghost px-3 py-2 text-sm">
              <span>🎙</span>
              <span className="hidden sm:inline">{reciter.name}</span>
              <span className="text-ink-500">▾</span>
            </button>
            {showReciters && (
              <div className="ayah-pop absolute left-0 top-full z-50 mt-2 w-60 overflow-hidden rounded-2xl border border-sand-300 bg-white shadow-xl">
                {RECITERS.map((r) => {
                  const coversSurah = !!surahUrl(r, surahNum) || hasPerAyah(r);
                  return (
                    <button
                      key={r.id}
                      onClick={() => { setReciter(r); setShowReciters(false); stopAudio(); }}
                      className={`flex w-full items-center justify-between gap-2 px-4 py-2.5 text-right text-sm transition hover:bg-cream-100 ${r.id === reciter.id ? "bg-cream-100" : ""}`}
                    >
                      <span>
                        <span className="block font-semibold text-ink-900">{r.name}</span>
                        <span className="block text-[11px] text-ink-500">
                          {r.style}{!coversSurah ? " · غير متوفّر" : ""}
                        </span>
                      </span>
                      {r.id === reciter.id && <span className="text-emerald-700">✓</span>}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {isPlaying ? (
            <button onClick={stopAudio} className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white">■ إيقاف</button>
          ) : (
            <button onClick={playFullSurah} className="rounded-lg btn-primary px-4 py-2 text-sm font-semibold">▷ تلاوة كاملة</button>
          )}
        </div>
      </div>

      {/* Mushaf page */}
      <div className={`mushaf-page px-5 py-9 sm:px-14 sm:py-14 ${surahPlaying ? "ring-2 ring-emerald-500/30" : ""}`}>
        <span className="mushaf-corner left-3 top-3 border-l-2 border-t-2 rounded-tl-lg" />
        <span className="mushaf-corner right-3 top-3 border-r-2 border-t-2 rounded-tr-lg" />
        <span className="mushaf-corner left-3 bottom-3 border-l-2 border-b-2 rounded-bl-lg" />
        <span className="mushaf-corner right-3 bottom-3 border-r-2 border-b-2 rounded-br-lg" />

        <div className="surah-band mx-auto mb-8 flex max-w-md items-center justify-center gap-3 px-10 py-3.5">
          <span className="text-2xl text-ink-900" style={{ fontFamily: "var(--font-quran)" }}>سورة {surah.meta.nameAr}</span>
        </div>

        {surah.basmala && (
          <div className="mb-7 text-center">
            <div className="text-2xl text-gold-600 sm:text-[2rem]" style={{ fontFamily: "var(--font-quran)" }}>
              بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
            </div>
            <div className="basmala-ornament mx-auto mt-5 max-w-sm" />
          </div>
        )}

        <p className="mushaf-text" dir="rtl" style={{ fontSize, lineHeight: 2.5 }}>
          {surah.ayahs.map((a) => (
            <span
              key={a.numberInSurah}
              onClick={(e) => onAyahClick(e, a.numberInSurah)}
              className={`cursor-pointer rounded-md transition ${playingAyah === a.numberInSurah ? "ayah-playing" : "hover:bg-[rgba(184,144,47,0.07)]"}`}
            >
              {a.text}
              <AyahMarker n={a.numberInSurah} active={playingAyah === a.numberInSurah} />
            </span>
          ))}
        </p>
      </div>

      <p className="mt-4 text-center text-xs text-ink-500">انقر على أي آية لاختيار: تفسير أو استماع</p>

      {/* Ayah action popover */}
      {choice && (
        <div
          className="ayah-pop fixed z-50 -translate-x-1/2"
          style={{
            left: Math.min(Math.max(choice.x, 96), typeof window !== "undefined" ? window.innerWidth - 96 : choice.x),
            top: Math.min(choice.y + 12, typeof window !== "undefined" ? window.innerHeight - 90 : choice.y),
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex overflow-hidden rounded-2xl border border-sand-300 bg-white shadow-xl">
            <div className="grid place-items-center bg-cream-100 px-3 text-xs font-bold text-gold-600">
              {choice.ayah.toLocaleString("ar-EG")}
            </div>
            <button onClick={() => { setTafsirAyah(choice.ayah); setChoice(null); }} className="flex items-center gap-2 px-5 py-3 text-sm font-semibold text-ink-900 transition hover:bg-cream-100">
              <span>📖</span> التفسير
            </button>
            <span className="my-2 w-px bg-sand-300" />
            <button onClick={() => { playAyah(choice.ayah, false); setChoice(null); }} className="flex items-center gap-2 px-5 py-3 text-sm font-semibold text-emerald-700 transition hover:bg-cream-100">
              <span>🔊</span> استماع
            </button>
          </div>
        </div>
      )}

      {/* Tafsir bottom sheet */}
      {tafsir && (
        <div className="sheet-backdrop fixed inset-0 z-50 flex items-end justify-center bg-ink-900/30 sm:items-center sm:p-6" onClick={() => setTafsirAyah(null)}>
          <div className="sheet-panel w-full max-w-2xl rounded-t-3xl bg-white p-6 shadow-2xl sm:rounded-3xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-full bg-emerald-700 text-sm font-bold text-white">
                  {tafsir.numberInSurah.toLocaleString("ar-EG")}
                </span>
                <div>
                  <h3 className="font-display text-lg font-bold text-ink-900">التفسير الميسّر</h3>
                  <p className="text-xs text-ink-500">سورة {surah.meta.nameAr} · الآية {tafsir.numberInSurah.toLocaleString("ar-EG")}</p>
                </div>
              </div>
              <button onClick={() => setTafsirAyah(null)} className="grid h-9 w-9 place-items-center rounded-lg btn-ghost">✕</button>
            </div>

            <div className="mt-5 rounded-2xl bg-cream-100 p-5">
              <p className="text-2xl leading-loose text-ink-900" style={{ fontFamily: "var(--font-quran)" }}>{tafsir.text}</p>
            </div>

            <div className="my-4 divider-ornament" />
            <p className="text-[15px] leading-relaxed text-ink-700">{tafsir.tafsir || "التفسير غير متوفّر لهذه الآية حالياً."}</p>

            <div className="mt-5 flex gap-2">
              <button onClick={() => playAyah(tafsir.numberInSurah, false)} className="flex-1 rounded-xl btn-ghost py-3 text-sm font-semibold">🔊 استماع للآية</button>
              <button onClick={() => setTafsirAyah(null)} className="flex-1 rounded-xl btn-primary py-3 text-sm font-semibold">إغلاق</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
