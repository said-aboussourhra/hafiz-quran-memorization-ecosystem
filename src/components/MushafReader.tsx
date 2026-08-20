"use client";

import { useEffect, useRef, useState } from "react";
import type { SurahContent } from "@/lib/quran";
import { AyahMarker } from "@/components/AyahMarker";
import { SurahHeader } from "@/components/SurahHeader";
import { saveLastRead } from "@/components/LastRead";
import { isSajda, SAJDA_DUA, SAJDA_DUA_SOURCE } from "@/lib/sajda";
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

function toDigits(n: number): string {
  return String(n);
}

const FONTS = [
  { id: "qf-kfgqpc", label: "عثماني · مصحف المدينة" },
  { id: "qf-amiri", label: "أميري قرآن" },
  { id: "qf-naskh", label: "نسخ واضح" },
  { id: "qf-markazi", label: "مركزي عصري" },
];

export function MushafReader({ surah }: { surah: SurahContent }) {
  const [fontSize, setFontSize] = useState(34);
  const [font, setFont] = useState("qf-kfgqpc");
  const [showFonts, setShowFonts] = useState(false);
  const [view, setView] = useState<ViewMode>("mushaf");
  const [selected, setSelected] = useState<number | null>(null);
  const [tafsirAyah, setTafsirAyah] = useState<number | null>(null);
  const [sajdaOpen, setSajdaOpen] = useState(false);
  const [playingAyah, setPlayingAyah] = useState<number | null>(null);
  const [surahPlaying, setSurahPlaying] = useState(false);
  const [continuous, setContinuous] = useState(false);
  const [reciter, setReciter] = useState<Reciter>(DEFAULT_RECITER);
  const [showReciters, setShowReciters] = useState(false);
  const [progress, setProgress] = useState(0);
  const [highlight, setHighlight] = useState(true);
  const [hlColor, setHlColor] = useState("#10b981");
  const [paper, setPaper] = useState("ivory");
  const [showSettings, setShowSettings] = useState(false);
  const [activeWord, setActiveWord] = useState<number>(-1);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const pageRef = useRef<HTMLDivElement | null>(null);
  const ayahRefs = useRef<Map<number, HTMLSpanElement>>(new Map());
  const [autoScroll, setAutoScroll] = useState(true);

  const surahNum = surah.meta.number;
  const tafsir = tafsirAyah != null ? surah.ayahs.find((a) => a.numberInSurah === tafsirAyah) ?? null : null;

  const playAyah = (n: number, chain: boolean) => {
    const ayah = surah.ayahs.find((a) => a.numberInSurah === n);
    if (!ayah || !audioRef.current) return;
    const r = hasPerAyah(reciter) ? reciter : perAyahFallback();
    const url = ayahUrl(r, surahNum, ayah.numberInSurah, ayah.globalNumber);
    if (!url) return;
    if (!chain) setSurahPlaying(false);
    setContinuous(chain);
    setPlayingAyah(n);
    setActiveWord(-1);
    audioRef.current.src = url;
    audioRef.current.play().catch(() => {});
  };

  const playFullSurah = () => {
    setSurahPlaying(true);
    playAyah(surah.ayahs[0].numberInSurah, true);
  };

  const stopAudio = () => {
    audioRef.current?.pause();
    setPlayingAyah(null);
    setSurahPlaying(false);
    setContinuous(false);
    setActiveWord(-1);
  };

  const onTimeUpdate = () => {
    const a = audioRef.current;
    if (!a || !highlight || playingAyah == null || !a.duration || isNaN(a.duration)) return;
    const ayah = surah.ayahs.find((x) => x.numberInSurah === playingAyah);
    if (!ayah || ayah.words.length === 0) return;
    const dur = a.duration;
    const t = Math.max(0, a.currentTime - dur * 0.02);
    const weights = ayah.words.map((w) => Math.max(2, w.t.replace(/[^\u0600-\u06FF]/g, "").length));
    const total = weights.reduce((s, x) => s + x, 0);
    const target = (t / (dur * 0.96)) * total;
    let acc = 0;
    let idx = 0;
    for (let i = 0; i < weights.length; i++) {
      acc += weights[i];
      if (target <= acc) { idx = i; break; }
      idx = i;
    }
    setActiveWord(Math.min(ayah.words.length - 1, idx));
  };

  const seekToWord = (ayah: typeof surah.ayahs[number], wordIdx: number) => {
    const a = audioRef.current;
    if (!a || playingAyah !== ayah.numberInSurah || !a.duration || isNaN(a.duration)) return;
    const weights = ayah.words.map((w) => Math.max(2, w.t.replace(/[^\u0600-\u06FF]/g, "").length));
    const total = weights.reduce((s, x) => s + x, 0);
    let before = 0;
    for (let i = 0; i < wordIdx; i++) before += weights[i];
    a.currentTime = (before / total) * a.duration * 0.96;
    setActiveWord(wordIdx);
    if (a.paused) a.play().catch(() => {});
  };

  const onEnded = () => {
    setActiveWord(-1);
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

  useEffect(() => {
    if (!autoScroll || playingAyah == null) return;
    const el = ayahRefs.current.get(playingAyah);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [playingAyah, autoScroll]);

  useEffect(() => {
    try {
      const fav = localStorage.getItem("hafiz_reciter");
      if (fav) {
        const r = RECITERS.find((x) => x.id === fav);
        if (r) setReciter(r);
      }
      const f = localStorage.getItem("hafiz_font");
      if (f && FONTS.some((x) => x.id === f)) setFont(f);
      const s = localStorage.getItem("hafiz_fontsize");
      if (s) setFontSize(Math.max(26, Math.min(60, Number(s) || 34)));
      const as = localStorage.getItem("hafiz_autoscroll");
      if (as != null) setAutoScroll(as === "1");
      const hl = localStorage.getItem("hafiz_highlight");
      if (hl != null) setHighlight(hl === "1");
      const hc = localStorage.getItem("hafiz_hlcolor");
      if (hc) setHlColor(hc);
      const pp = localStorage.getItem("hafiz_paper");
      if (pp) setPaper(pp);
    } catch { /* ignore */ }
  }, []);

  const chooseFont = (id: string) => {
    setFont(id);
    setShowFonts(false);
    try { localStorage.setItem("hafiz_font", id); } catch { /* ignore */ }
  };

  const changeSize = (delta: number) => {
    const newSize = Math.max(28, Math.min(56, fontSize + delta));
    setFontSize(newSize);
    try { localStorage.setItem("hafiz_fontsize", String(newSize)); } catch { /* ignore */ }
  };

  const chooseReciter = (r: Reciter) => {
    setReciter(r);
    setShowReciters(false);
    stopAudio();
    try { localStorage.setItem("hafiz_reciter", r.id); } catch { /* ignore */ }
  };

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
    setSelected((cur) => (cur === n ? null : n));
  };

  const openTafsirInline = (ayah: number) => {
    setTafsirAyah(ayah);
  };

  const openTafsir = (ayah: number) => {
    setSelected(null);
    setTafsirAyah(ayah);
  };

  const isPlaying = playingAyah != null || surahPlaying;

  return (
    <div onClick={() => { setSelected(null); setShowReciters(false); setShowFonts(false); setShowSettings(false); setTafsirAyah(null); }}>
      <audio ref={audioRef} onEnded={onEnded} onTimeUpdate={onTimeUpdate} />

      {/* شريط التقدم */}
      <div className="fixed inset-x-0 top-0 z-[60] h-1">
        <div className="h-full transition-[width] duration-150" style={{ width: `${progress}%`, background: "linear-gradient(90deg,#10b981,#3b82f6)" }} />
      </div>

      {/* ===== شريط الأدوات الثابت ===== */}
      <div className="mushaf-toolbar sticky top-16 z-30 mb-4 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-gold-500/20 bg-white/95 p-2 shadow-lg backdrop-blur">
        {/* تبديل العرض */}
        <div className="flex items-center gap-1 rounded-xl bg-cream-100 p-1">
          <button 
            onClick={() => setView("mushaf")} 
            className={`rounded-lg px-3 py-1.5 text-xs sm:text-sm font-semibold transition ${
              view === "mushaf" ? "bg-white text-emerald-700 shadow" : "text-ink-500 hover:text-emerald-600"
            }`}
          >
            مصحف
          </button>
          <button 
            onClick={() => setView("ayah")} 
            className={`rounded-lg px-3 py-1.5 text-xs sm:text-sm font-semibold transition ${
              view === "ayah" ? "bg-white text-emerald-700 shadow" : "text-ink-500 hover:text-emerald-600"
            }`}
          >
            آية بآية
          </button>
        </div>

        {/* تحكم حجم الخط */}
        <div className="flex items-center gap-1 sm:gap-2 bg-cream-100/50 rounded-xl px-2 py-1">
          <button 
            onClick={() => changeSize(-2)} 
            className="mushaf-control-btn"
            aria-label="تصغير الخط"
          >
            −
          </button>
          <span className="mushaf-font-size">{fontSize}</span>
          <button 
            onClick={() => changeSize(2)} 
            className="mushaf-control-btn"
            aria-label="تكبير الخط"
          >
            +
          </button>
        </div>

        {/* اختيار الخط */}
        <div className="relative" onClick={(e) => e.stopPropagation()}>
          <button 
            onClick={() => { setShowFonts((v) => !v); setShowReciters(false); }} 
            className="flex items-center gap-1 rounded-lg btn-ghost px-2 py-1.5 text-xs sm:text-sm"
          >
            <span>خط</span>
            <span className="text-ink-500">▾</span>
          </button>
          {showFonts && (
            <div className="ayah-pop absolute left-0 top-full z-50 mt-1 w-48 overflow-hidden rounded-xl border border-sand-300 bg-white shadow-xl">
              {FONTS.map((f) => (
                <button 
                  key={f.id} 
                  onClick={() => chooseFont(f.id)} 
                  className={`flex w-full items-center justify-between px-3 py-2 text-right text-xs transition hover:bg-cream-100 ${
                    font === f.id ? "bg-cream-100" : ""
                  }`}
                >
                  <span className={`text-lg ${f.id}`} style={{ color: "#071a1c" }}>بِسْمِ</span>
                  <span className="text-[10px] text-ink-500">{f.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* اختيار القارئ */}
        <div className="relative" onClick={(e) => e.stopPropagation()}>
          <button 
            onClick={() => setShowReciters((v) => !v)} 
            className="flex items-center gap-1 rounded-lg btn-ghost px-2 py-1.5 text-xs sm:text-sm"
          >
            <span>🎙</span>
            <span className="hidden sm:inline max-w-[60px] truncate">{reciter.name}</span>
            <span className="text-ink-500">▾</span>
          </button>
          {showReciters && (
            <div className="ayah-pop absolute left-0 top-full z-[60] mt-1 max-h-[50vh] w-48 overflow-y-auto rounded-xl border border-sand-300 bg-white shadow-xl">
              <div className="sticky top-0 border-b border-sand-300 bg-white px-3 py-1.5 text-[10px] font-bold text-emerald-700">اختر القارئ</div>
              {RECITERS.map((r) => (
                <button
                  key={r.id}
                  onClick={() => chooseReciter(r)}
                  className={`flex w-full items-center justify-between px-3 py-2 text-right text-xs transition hover:bg-cream-100 ${
                    r.id === reciter.id ? "bg-cream-100" : ""
                  }`}
                >
                  <span className="font-semibold text-ink-900">{r.name}</span>
                  {r.id === reciter.id && <span className="text-emerald-700">✓</span>}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* أزرار الصوت */}
        <div className="flex items-center gap-1">
          {isPlaying ? (
            <button 
              onClick={stopAudio} 
              className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700 transition"
            >
              ■ إيقاف
            </button>
          ) : (
            <button 
              onClick={playFullSurah} 
              className="rounded-lg btn-primary px-3 py-1.5 text-xs font-semibold"
            >
              ▶ تلاوة
            </button>
          )}
        </div>
      </div>

      {/* ===== صفحة المصحف ===== */}
      <div 
        ref={pageRef} 
        className={`mushaf-page paper-${paper} px-4 py-6 sm:px-8 sm:py-10 md:px-12 md:py-14 lg:px-16 lg:py-16 ${surahPlaying ? "ring-2 ring-emerald-500/30" : ""}`}
      >
        <span className="mushaf-watermark" />
        <span className="mushaf-corner left-3 top-3 border-l-2 border-t-2 rounded-tl-lg" />
        <span className="mushaf-corner right-3 top-3 border-r-2 border-t-2 rounded-tr-lg" />
        <span className="mushaf-corner left-3 bottom-3 border-l-2 border-b-2 rounded-bl-lg" />
        <span className="mushaf-corner right-3 bottom-3 border-r-2 border-b-2 rounded-br-lg" />

        <SurahHeader nameAr={surah.meta.nameAr} revelation={surah.meta.revelation} ayahCount={surah.meta.ayahCount} juz={surah.meta.juz} />

        {surah.basmala && (
          <div className="mb-6 text-center">
            <div className="text-xl sm:text-2xl md:text-[2.1rem]" style={{ fontFamily: "var(--font-quran)", background: "linear-gradient(120deg,#047857,#059669,#2563eb)", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}>
              بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
            </div>
            <div className="basmala-ornament mx-auto mt-4 max-w-sm" />
          </div>
        )}

        {/* ===== عرض المصحف ===== */}
        {view === "mushaf" && (
          <div className="mushaf-content">
            <p className={`mushaf-text ${font}`} dir="rtl" style={{ fontSize: `clamp(1rem, ${fontSize / 16}rem, 2rem)`, lineHeight: 2.5 }}>
              {surah.ayahs.map((a) => (
                <span key={a.numberInSurah}>
                  <span
                    ref={(el) => { if (el) ayahRefs.current.set(a.numberInSurah, el); }}
                    role="button"
                    tabIndex={0}
                    onClick={(e) => onAyahClick(e, a.numberInSurah)}
                    onKeyDown={(e) => { if (e.key === "Enter") onAyahClick(e as unknown as React.MouseEvent, a.numberInSurah); }}
                    className={`cursor-pointer rounded-md transition ${playingAyah === a.numberInSurah ? "ayah-playing" : selected === a.numberInSurah ? "bg-[rgba(59,130,246,0.12)]" : "hover:bg-[rgba(16,185,129,0.10)]"}`}
                  >
                    {highlight && playingAyah === a.numberInSurah ? (
                      a.words.map((w, wi) => (
                        <span
                          key={wi}
                          onClick={(e) => { e.stopPropagation(); seekToWord(a, wi); }}
                          className="cursor-pointer"
                          style={wi === activeWord ? { color: hlColor, background: `${hlColor}22`, borderRadius: "6px", padding: "0 2px", transition: "color .15s, background .15s" } : undefined}
                        >
                          {w.t}{" "}
                        </span>
                      ))
                    ) : (
                      a.text
                    )}
                    <AyahMarker n={a.numberInSurah} active={playingAyah === a.numberInSurah} />
                  </span>
                  {isSajda(surah.meta.number, a.numberInSurah) && (
                    <button
                      onClick={(e) => { e.stopPropagation(); setSajdaOpen(true); }}
                      title="موضع سجدة"
                      className="mx-1 inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 align-middle text-[11px] font-bold text-amber-700"
                    >
                      ۩ سجدة
                    </button>
                  )}
                  {selected === a.numberInSurah && tafsirAyah !== a.numberInSurah && (
                    <span className="ayah-inline-actions" contentEditable={false} onClick={(e) => e.stopPropagation()}>
                      <button onClick={() => openTafsirInline(a.numberInSurah)} className="ayah-chip ayah-chip-tafsir">📖 التفسير</button>
                      <button onClick={() => { playAyah(a.numberInSurah, false); setSelected(null); }} className="ayah-chip ayah-chip-listen">🔊 استماع</button>
                      <button onClick={() => setSelected(null)} className="ayah-chip ayah-chip-close">✕</button>
                    </span>
                  )}
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
          </div>
        )}

        {/* ===== عرض آية بآية ===== */}
        {view === "ayah" && (
          <div className="space-y-4" dir="rtl">
            {surah.ayahs.map((a) => (
              <div
                key={a.numberInSurah}
                className={`rounded-2xl border p-4 sm:p-5 transition ${playingAyah === a.numberInSurah ? "border-emerald-400 bg-emerald-50/60 shadow-md" : "border-sand-300/60 bg-white/70"}`}
              >
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <span className="grid h-8 w-8 place-items-center rounded-full text-xs font-bold text-white" style={{ background: "linear-gradient(135deg,#10b981,#3b82f6)" }}>
                    {a.numberInSurah.toLocaleString("ar-EG")}
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    <button onClick={() => playAyah(a.numberInSurah, false)} className="rounded-lg btn-ghost px-3 py-1.5 text-xs">🔊 استماع</button>
                    <button onClick={() => openTafsir(a.numberInSurah)} className="rounded-lg btn-ghost px-3 py-1.5 text-xs">📖 تفسير</button>
                  </div>
                </div>
                <p className={`text-ink-900 ${font}`} style={{ fontSize: `clamp(1rem, ${fontSize / 16}rem, 2rem)`, lineHeight: 2.2 }}>{a.text}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <p className="mt-4 text-center text-xs text-ink-500">
        {view === "mushaf" ? "انقر على أي آية ليظهر بجانبها: تفسير أو استماع · أثناء التلاوة انقر أي كلمة للقفز إليها" : "وضع القراءة آية بآية — لكل آية أزرار التفسير والاستماع"}
      </p>

      {/* ===== سجدة ===== */}
      {sajdaOpen && (
        <div className="sheet-backdrop fixed inset-0 z-[80] flex items-end justify-center bg-ink-900/40 p-0 backdrop-blur-sm sm:items-center sm:p-6" onClick={() => setSajdaOpen(false)}>
          <div className="sheet-panel w-full max-w-lg rounded-t-3xl border-2 border-amber-300 bg-white p-6 text-center shadow-2xl sm:rounded-3xl" onClick={(e) => e.stopPropagation()}>
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl text-3xl" style={{ background: "linear-gradient(135deg,#fef3c7,#fde68a)" }}>۩</div>
            <h3 className="mt-4 font-display text-xl font-black text-ink-900">موضع سجدة تلاوة</h3>
            <p className="mt-1 text-sm text-ink-500">يُستحبّ السجود عند تلاوة هذه الآية، ويُقال في السجود:</p>
            <div className="mt-5 rounded-2xl bg-cream-100 p-5">
              <p className="text-2xl leading-loose text-ink-900" style={{ fontFamily: "var(--font-quran)" }}>{SAJDA_DUA}</p>
            </div>
            <p className="mt-3 text-xs text-ink-500">{SAJDA_DUA_SOURCE}</p>
            <button onClick={() => setSajdaOpen(false)} className="mt-5 w-full rounded-xl btn-primary py-3 text-sm font-semibold">تمّ</button>
          </div>
        </div>
      )}

      {/* ===== التفسير ===== */}
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
            <div className="mt-5 flex flex-wrap gap-2">
              <button onClick={() => playAyah(tafsir.numberInSurah, false)} className="flex-1 rounded-xl btn-ghost py-3 text-sm font-semibold">🔊 استماع للآية</button>
              <button onClick={() => setTafsirAyah(null)} className="flex-1 rounded-xl btn-primary py-3 text-sm font-semibold">إغلاق</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}