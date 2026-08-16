"use client";

import { useEffect, useRef, useState } from "react";
import type { SurahContent } from "@/lib/quran";
import { AyahMarker } from "@/components/AyahMarker";
import { SurahHeader } from "@/components/SurahHeader";
import { saveLastRead } from "@/components/LastRead";
import {
  RECITERS,
  DEFAULT_RECITER,
  ayahUrl,
  surahUrl,
  hasPerAyah,
  perAyahFallback,
  type Reciter,
} from "@/lib/reciters";

type ViewMode = "mushaf" | "ayah";

// Clear Western numerals (e.g. 123) as requested.
function toDigits(n: number): string {
  return String(n);
}

export function MushafReader({ surah }: { surah: SurahContent }) {
  const [fontSize, setFontSize] = useState(34);
  const [view, setView] = useState<ViewMode>("mushaf");
  const [selected, setSelected] = useState<number | null>(null);
  const [tafsirAyah, setTafsirAyah] = useState<number | null>(null);
  const [playingAyah, setPlayingAyah] = useState<number | null>(null);
  const [surahPlaying, setSurahPlaying] = useState(false);
  const [continuous, setContinuous] = useState(false);
  const [reciter, setReciter] = useState<Reciter>(DEFAULT_RECITER);
  const [showReciters, setShowReciters] = useState(false);
  const [progress, setProgress] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const pageRef = useRef<HTMLDivElement | null>(null);

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
    saveLastRead(surah.meta.number, surah.meta.nameAr);
  }, [surah.meta.number, surah.meta.nameAr]);

  // reading progress bar
  useEffect(() => {
    const onScroll = () => {
      const el = pageRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const total = el.offsetHeight - window.innerHeight;
      const scrolled = Math.min(Math.max(-rect.top, 0), Math.max(total, 1));
      setProgress(total > 0 ? Math.round((scrolled / total) * 100) : 0);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, [view]);

  useEffect(() => {
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") { setSelected(null); setTafsirAyah(null); } };
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, []);

  const onAyahClick = (e: React.MouseEvent, n: number) => {
    e.stopPropagation();
    setTafsirAyah(null);
    // toggle the inline action chip for this exact ayah
    setSelected((cur) => (cur === n ? null : n));
  };

  // open tafsir inline (for the currently selected ayah)
  const openTafsirInline = (ayah: number) => {
    setTafsirAyah(ayah);
  };
  // open tafsir from ayah-by-ayah view
  const openTafsir = (ayah: number) => {
    setSelected(null);
    setTafsirAyah(ayah);
  };

  const isPlaying = playingAyah != null || surahPlaying;

  return (
    <div onClick={() => { setSelected(null); setShowReciters(false); setTafsirAyah(null); }}>
      <audio ref={audioRef} onEnded={onEnded} />

      {/* reading progress bar */}
      <div className="fixed inset-x-0 top-0 z-[60] h-1">
        <div className="h-full transition-[width] duration-150" style={{ width: `${progress}%`, background: "linear-gradient(90deg,#10b981,#3b82f6)" }} />
      </div>

      {/* Toolbar */}
      <div className="sticky top-20 z-30 mb-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/40 bg-white/80 p-3 shadow-md backdrop-blur">
        {/* view toggle */}
        <div className="flex items-center gap-1 rounded-xl bg-cream-100 p-1">
          <button onClick={() => setView("mushaf")} className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition ${view === "mushaf" ? "bg-white text-emerald-700 shadow" : "text-ink-500"}`}>مصحف</button>
          <button onClick={() => setView("ayah")} className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition ${view === "ayah" ? "bg-white text-emerald-700 shadow" : "text-ink-500"}`}>آية بآية</button>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={() => setFontSize((s) => Math.max(26, s - 4))} className="grid h-9 w-9 place-items-center rounded-lg btn-ghost text-lg">−</button>
          <button onClick={() => setFontSize((s) => Math.min(60, s + 4))} className="grid h-9 w-9 place-items-center rounded-lg btn-ghost text-lg">+</button>

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
                        <span className="block text-[11px] text-ink-500">{r.style}{!coversSurah ? " · غير متوفّر" : ""}</span>
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
      <div ref={pageRef} className={`mushaf-page px-5 py-9 sm:px-14 sm:py-14 ${surahPlaying ? "ring-2 ring-emerald-500/30" : ""}`}>
        <span className="mushaf-watermark" />
        <span className="mushaf-corner left-3 top-3 border-l-2 border-t-2 rounded-tl-lg" />
        <span className="mushaf-corner right-3 top-3 border-r-2 border-t-2 rounded-tr-lg" />
        <span className="mushaf-corner left-3 bottom-3 border-l-2 border-b-2 rounded-bl-lg" />
        <span className="mushaf-corner right-3 bottom-3 border-r-2 border-b-2 rounded-br-lg" />

        <SurahHeader nameAr={surah.meta.nameAr} revelation={surah.meta.revelation} ayahCount={surah.meta.ayahCount} juz={surah.meta.juz} />

        {surah.basmala && (
          <div className="mb-8 text-center">
            <div className="text-2xl sm:text-[2.1rem]" style={{ fontFamily: "var(--font-quran)", background: "linear-gradient(120deg,#047857,#059669,#2563eb)", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}>
              بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
            </div>
            <div className="basmala-ornament mx-auto mt-5 max-w-sm" />
          </div>
        )}

        {/* ===== Continuous Mushaf view ===== */}
        {view === "mushaf" && (
          <p className="mushaf-text" dir="rtl" style={{ fontSize, lineHeight: 2.5 }}>
            {surah.ayahs.map((a) => (
              <span key={a.numberInSurah}>
                <span
                  role="button"
                  tabIndex={0}
                  onClick={(e) => onAyahClick(e, a.numberInSurah)}
                  onKeyDown={(e) => { if (e.key === "Enter") onAyahClick(e as unknown as React.MouseEvent, a.numberInSurah); }}
                  className={`cursor-pointer rounded-md transition ${playingAyah === a.numberInSurah ? "ayah-playing" : selected === a.numberInSurah ? "bg-[rgba(59,130,246,0.12)]" : "hover:bg-[rgba(16,185,129,0.10)]"}`}
                >
                  {a.text}
                  <AyahMarker n={a.numberInSurah} active={playingAyah === a.numberInSurah} />
                </span>
                {/* Inline action chip — always appears right beside the selected ayah */}
                {selected === a.numberInSurah && tafsirAyah !== a.numberInSurah && (
                  <span className="ayah-inline-actions" contentEditable={false} onClick={(e) => e.stopPropagation()}>
                    <button onClick={() => openTafsirInline(a.numberInSurah)} className="ayah-chip ayah-chip-tafsir">📖 التفسير</button>
                    <button onClick={() => { playAyah(a.numberInSurah, false); setSelected(null); }} className="ayah-chip ayah-chip-listen">🔊 استماع</button>
                    <button onClick={() => setSelected(null)} className="ayah-chip ayah-chip-close">✕</button>
                  </span>
                )}
                {/* Inline tafsir card — appears right beside/under the exact ayah */}
                {tafsirAyah === a.numberInSurah && (
                  <span className="ayah-tafsir-inline" contentEditable={false} onClick={(e) => e.stopPropagation()}>
                    <span className="ayah-tafsir-head">
                      <span className="ayah-tafsir-badge">{toDigits(a.numberInSurah)}</span>
                      <span className="font-display text-sm font-bold text-ink-900">التفسير الميسّر</span>
                      <button onClick={() => { setTafsirAyah(null); setSelected(null); }} className="ayah-tafsir-close">✕</button>
                    </span>
                    <span className="ayah-tafsir-body">{a.tafsir || "التفسير غير متوفّر لهذه الآية حالياً."}</span>
                    <button onClick={() => playAyah(a.numberInSurah, false)} className="mt-2 rounded-lg btn-primary px-4 py-2 text-xs font-semibold">🔊 استماع للآية</button>
                  </span>
                )}
                {" "}
              </span>
            ))}
          </p>
        )}

        {/* ===== Ayah-by-ayah view ===== */}
        {view === "ayah" && (
          <div className="space-y-4" dir="rtl">
            {surah.ayahs.map((a) => (
              <div
                key={a.numberInSurah}
                className={`rounded-2xl border p-5 transition ${playingAyah === a.numberInSurah ? "border-emerald-400 bg-emerald-50/60 shadow-md" : "border-sand-300/60 bg-white/70"}`}
              >
                <div className="mb-3 flex items-center justify-between">
                  <span className="grid h-8 w-8 place-items-center rounded-full text-xs font-bold text-white" style={{ background: "linear-gradient(135deg,#10b981,#3b82f6)" }}>
                    {a.numberInSurah.toLocaleString("ar-EG")}
                  </span>
                  <div className="flex gap-1.5">
                    <button onClick={() => playAyah(a.numberInSurah, false)} className="rounded-lg btn-ghost px-3 py-1.5 text-xs">🔊 استماع</button>
                    <button onClick={() => openTafsir(a.numberInSurah)} className="rounded-lg btn-ghost px-3 py-1.5 text-xs">📖 تفسير</button>
                  </div>
                </div>
                <p className="text-ink-900" style={{ fontFamily: "var(--font-quran)", fontSize, lineHeight: 2.2 }}>{a.text}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <p className="mt-4 text-center text-xs text-ink-500">
        {view === "mushaf" ? "انقر على أي آية ليظهر بجانبها: تفسير أو استماع" : "وضع القراءة آية بآية — لكل آية أزرار التفسير والاستماع"}
      </p>

      {/* Tafsir modal — used only in ayah-by-ayah view (mushaf view shows it inline) */}
      {tafsir && view === "ayah" && (
        <div className="sheet-backdrop fixed inset-0 z-[80] flex items-end justify-center bg-ink-900/40 p-0 backdrop-blur-sm sm:items-center sm:p-6" onClick={() => setTafsirAyah(null)}>
          <div className="sheet-panel w-full max-w-2xl rounded-t-3xl border-2 border-emerald-300 bg-white p-6 shadow-2xl sm:rounded-3xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-full text-sm font-bold text-white" style={{ background: "linear-gradient(135deg,#10b981,#3b82f6)" }}>
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
            <p className="max-h-56 overflow-y-auto text-[15px] leading-relaxed text-ink-700">{tafsir.tafsir || "التفسير غير متوفّر لهذه الآية حالياً."}</p>
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
