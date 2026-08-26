"use client";

import Image from "next/image";
import Link from "next/link";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type MouseEvent,
} from "react";

import type { SurahContent } from "@/lib/quran";
import { AyahMarker } from "@/components/AyahMarker";
import { SurahHeader } from "@/components/SurahHeader";
import { saveLastRead } from "@/components/LastRead";

import {
  isSajda,
} from "@/lib/sajda";
import { readBool, readString } from "@/lib/clientSettings";
import {
  FONT_SIZE,
  LINE_HEIGHT,
  WORD_SPACING,
  READING_WIDTH,
  readFontSize, writeFontSize,
  readLineHeight, writeLineHeight,
  readWordSpacing, writeWordSpacing,
  readReadingWidth, writeReadingWidth,
  readHighlightStyle, writeHighlightStyle,
  type HighlightStyle,
} from "@/lib/readingPrefs";
import {
  isBookmarked,
  toggleBookmark,
  copyAyah,
  savePosition,
} from "@/lib/bookmarks";

import {
  RECITERS,
  DEFAULT_RECITER,
  ayahUrl,
  surahUrl,
  hasPerAyah,
  perAyahFallback,
  type Reciter,
} from "@/lib/reciters";
import { SURAHS } from "@/lib/surahs";
import { getReciter as getRegistryReciter } from "@/lib/reciterRegistry";
import { useAudioEngine } from "@/lib/audio/useAudioEngine";
import { AudioControls } from "@/components/AudioControls";
import { useHafiz } from "@/lib/hafiz/useHafiz";
import { HafizPanel } from "@/components/hafiz/HafizPanel";
import { MushafMenu } from "@/components/MushafMenu";
import { baseSyncStatus, loadTimings } from "@/lib/audio/timings";
import type { AudioSource } from "@/lib/audio/types";

type ViewMode = "mushaf" | "ayah" | "continuous";

type MushafTextStyle = CSSProperties & {
  "--mushaf-font-size": string;
  "--mushaf-line-height": string;
  "--mushaf-word-spacing": string;
  "--mushaf-reading-width": string;
};

const FONTS = [
  {
    id: "qf-kfgqpc",
    label: "عثماني · مصحف المدينة",
  },
  {
    id: "qf-amiri",
    label: "أميري قرآن",
  },
  {
    id: "qf-naskh",
    label: "نسخ واضح",
  },
  {
    id: "qf-markazi",
    label: "مركزي عصري",
  },
];

const PAPERS = [
  {
    id: "ivory",
    label: "عاجي",
    preview: "#fffdf5",
  },
  {
    id: "white",
    label: "أبيض",
    preview: "#ffffff",
  },
  {
    id: "green",
    label: "أخضر هادئ",
    preview: "#f0fdf7",
  },
  {
    id: "blue",
    label: "أزرق هادئ",
    preview: "#f1f8ff",
  },
  {
    id: "night",
    label: "ليلي",
    preview: "#17211f",
  },
];

const HIGHLIGHT_COLORS = [
  "#10b981",
  "#3b82f6",
  "#f59e0b",
  "#8b5cf6",
  "#ef4444",
];

function toDigits(n: number): string {
  return String(n);
}

/** Per-surah availability of a reciter for the current surah.
 *  - "ayah": every-ayah recordings for all 114 surahs (best sync)
 *  - "surah": full-surah stream exists for this surah
 *  - "none": no direct source for this surah (falls back silently)
 */
function reciterAvailability(r: Reciter, surahNum: number): "ayah" | "surah" | "none" {
  if (hasPerAyah(r)) return "ayah";
  if (r.surahBase && (!r.surahList || r.surahList.includes(surahNum))) return "surah";
  return "none";
}

function prefersReducedMotion(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** Accessible −/value/+ control used inside the appearance panel. */
function SettingStepper({
  label,
  value,
  onDec,
  onInc,
  onReset,
  decLabel,
  incLabel,
}: {
  label: string;
  value: string;
  onDec: () => void;
  onInc: () => void;
  onReset: () => void;
  decLabel: string;
  incLabel: string;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <button
        type="button"
        onClick={onReset}
        className="text-[11px] font-semibold text-slate-600 hover:text-emerald-700"
        title="إعادة الافتراضي"
      >
        {label}
      </button>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={onInc}
          aria-label={incLabel}
          className="grid h-7 w-7 place-items-center rounded-lg bg-white text-slate-700 shadow-sm hover:bg-emerald-50 hover:text-emerald-700"
        >
          +
        </button>
        <span className="min-w-[52px] text-center text-[11px] font-bold text-slate-700" dir="ltr">
          {value}
        </span>
        <button
          type="button"
          onClick={onDec}
          aria-label={decLabel}
          className="grid h-7 w-7 place-items-center rounded-lg bg-white text-slate-700 shadow-sm hover:bg-emerald-50 hover:text-emerald-700"
        >
          −
        </button>
      </div>
    </div>
  );
}

/* =========================================================
   ICONS
========================================================= */

function IconBook({
  className = "h-5 w-5",
}: {
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21.5z" />
      <path d="M4 5.5v16" />
      <path d="M8 7h8M8 11h7" />
    </svg>
  );
}

function IconList({
  className = "h-5 w-5",
}: {
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M8 6h12M8 12h12M8 18h12" />
      <circle cx="4" cy="6" r="1" />
      <circle cx="4" cy="12" r="1" />
      <circle cx="4" cy="18" r="1" />
    </svg>
  );
}

function IconScroll({
  className = "h-5 w-5",
}: {
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="6" y="3" width="12" height="18" rx="2" />
      <path d="M10 7h4M10 11h4M10 15h2.5" />
    </svg>
  );
}

function IconBookmark({
  className = "h-5 w-5",
  filled = false,
}: {
  className?: string;
  filled?: boolean;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M6 3h12v18l-6-4-6 4z" />
    </svg>
  );
}

function IconCopy({
  className = "h-5 w-5",
}: {
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="9" y="9" width="11" height="11" rx="2" />
      <path d="M5 15V5a2 2 0 0 1 2-2h10" />
    </svg>
  );
}

function IconTarget({
  className = "h-5 w-5",
}: {
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="12" cy="12" r="0.6" fill="currentColor" />
    </svg>
  );
}

function IconMinus({
  className = "h-4 w-4",
}: {
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M5 12h14" />
    </svg>
  );
}

function IconPlus({
  className = "h-4 w-4",
}: {
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

function IconPalette({
  className = "h-5 w-5",
}: {
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 3a9 9 0 0 0 0 18h1.2a1.8 1.8 0 0 0 1.2-3.1 1.8 1.8 0 0 1 1.2-3.1H18a3 3 0 0 0 3-3A8.8 8.8 0 0 0 12 3Z" />
      <circle cx="7.5" cy="10" r="1" />
      <circle cx="10" cy="6.8" r="1" />
      <circle cx="14" cy="6.5" r="1" />
      <circle cx="17" cy="9" r="1" />
    </svg>
  );
}

function IconType({
  className = "h-5 w-5",
}: {
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M5 5h14M12 5v14M8 19h8" />
    </svg>
  );
}

function IconMic({
  className = "h-5 w-5",
}: {
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="9" y="3" width="6" height="11" rx="3" />
      <path d="M5 11a7 7 0 0 0 14 0M12 18v3M9 21h6" />
    </svg>
  );
}

function IconPlay({
  className = "h-5 w-5",
}: {
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M8 5.2v13.6a1 1 0 0 0 1.52.85l10.2-6.8a1 1 0 0 0 0-1.66L9.52 4.35A1 1 0 0 0 8 5.2Z" />
    </svg>
  );
}

function IconStop({
  className = "h-5 w-5",
}: {
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="currentColor"
      aria-hidden="true"
    >
      <rect x="6" y="6" width="12" height="12" rx="2" />
    </svg>
  );
}

function IconChevron({
  className = "h-4 w-4",
}: {
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function IconClose({
  className = "h-4 w-4",
}: {
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="m6 6 12 12M18 6 6 18" />
    </svg>
  );
}

function IconBookOpen({
  className = "h-5 w-5",
}: {
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3.5 5.5A2.5 2.5 0 0 1 6 3h5.5v17H6a2.5 2.5 0 0 0-2.5 2z" />
      <path d="M20.5 5.5A2.5 2.5 0 0 0 18 3h-6.5v17H18a2.5 2.5 0 0 1 2.5 2z" />
    </svg>
  );
}

export function MushafReader({
  surah,
}: {
  surah: SurahContent;
}) {
  /* =========================================================
     STATE
  ========================================================= */

  const [fontSize, setFontSize] = useState(() => readFontSize());
  const [lineHeight, setLineHeight] = useState(() => readLineHeight());
  const [wordSpacing, setWordSpacing] = useState(() => readWordSpacing());
  const [readingWidth, setReadingWidth] = useState(() => readReadingWidth());
  const [font, setFont] = useState(() =>
    FONTS.some((f) => f.id === readString("hafiz_font", "qf-kfgqpc"))
      ? readString("hafiz_font", "qf-kfgqpc")
      : "qf-kfgqpc"
  );

  const [showFonts, setShowFonts] = useState(false);
  const [showReciters, setShowReciters] = useState(false);
  const [showAppearance, setShowAppearance] =
    useState(false);

  const [view, setView] =
    useState<ViewMode>("mushaf");

  const [selected, setSelected] =
    useState<number | null>(null);

  const [tafsirAyah, setTafsirAyah] =
    useState<number | null>(null);

  const [sajdaOpen, setSajdaOpen] =
    useState(false);

  const [continuous, setContinuous] =
    useState(false);

  const [reciter, setReciter] =
    useState<Reciter>(() => RECITERS.find((r) => r.id === readString("hafiz_reciter", "")) ?? DEFAULT_RECITER);

  const [progress, setProgress] =
    useState(0);

  const [highlight, setHighlight] =
    useState(() => readBool("hafiz_highlight", true));

  const [hlColor, setHlColor] =
    useState(() => readString("hafiz_hlcolor", "#10b981"));

  const [paper, setPaper] =
    useState(() =>
      PAPERS.some((p) => p.id === readString("hafiz_paper", "ivory"))
        ? readString("hafiz_paper", "ivory")
        : "ivory"
    );

  const [hlStyle, setHlStyle] =
    useState<HighlightStyle>(() => readHighlightStyle());

  const [bookmarkVersion, setBookmarkVersion] = useState(0);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<number | null>(null);

  const [showNav, setShowNav] = useState(false);
  const [showHafiz, setShowHafiz] = useState(false);
  const [jumpAyah, setJumpAyah] = useState("");

  /* Royal side index — فهرس جانبي تفاعلي سريع (lives inside the nav menu) */
  const [indexQuery, setIndexQuery] = useState("");
  const [fallbackNotice, setFallbackNotice] = useState<string | null>(null);

  /* Floating side shortcut — اختصار جانبي عائم يفتح لوحة أدوات المصحف */
  const [showQuickPanel, setShowQuickPanel] = useState(false);

  const openMenu = (
    menu: "font" | "reciter" | "appearance",
    opts: { index?: boolean } = {}
  ) => {
    setShowQuickPanel(false);
    setShowNav(!!opts.index);
    setShowAppearance(menu === "appearance");
    setShowFonts(menu === "font");
    setShowReciters(menu === "reciter");
  };

  const showToast = (msg: string) => {
    setToast(msg);
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 2200);
  };

  /* =========================================================
     REFS
  ========================================================= */

  const pageRef =
    useRef<HTMLDivElement | null>(null);

  const ayahRefs =
    useRef<Map<number, HTMLSpanElement>>(
      new Map()
    );

  /* =========================================================
     AUDIO ENGINE
     Exact per-recording sync. Switching reciter reloads BOTH the
     audio and its own timing map — timings are never shared.
  ========================================================= */

  const engine = useAudioEngine();
  const hafiz = useHafiz();

  // Playback state is owned by useAudioEngine (exact per-recording sync).
  const playingAyah = engine.state.currentAyah;
  const surahPlaying =
    engine.state.sourceGranularity === "surah" &&
    (engine.state.status === "playing" ||
      engine.state.status === "loading" ||
      engine.state.status === "paused");
  // engine words are 1-based; ayah.words indexes are 0-based → normalize once.
  const activeWord = engine.state.currentWord != null ? engine.state.currentWord - 1 : -1;

  /* =========================================================
     DATA
  ========================================================= */

  const surahNum =
    surah.meta.number;

  const tafsir =
    tafsirAyah != null
      ? surah.ayahs.find(
          (a) =>
            a.numberInSurah ===
            tafsirAyah
        ) ?? null
      : null;

  const isPlaying =
    engine.state.status === "playing" ||
    engine.state.status === "loading";

  /** Build the exact AudioSource for the current reciter + surah. */
  const buildSource = useCallback(async (): Promise<AudioSource> => {
    const supportsPerAyah = hasPerAyah(reciter);
    // Reciters with only selected full-surah recordings: if THIS surah is not
    // in their library, fall back to the verified every-ayah collection and
    // tell the reader honestly via the toast + reciter menu badge.
    let usingFallback = false;
    let reciterForAudio: Reciter = reciter;
    if (!supportsPerAyah) {
      const avail = reciterAvailability(reciter, surahNum);
      if (avail === "surah") {
        reciterForAudio = reciter;
      } else {
        reciterForAudio = perAyahFallback();
        usingFallback = true;
      }
    }
    // Granularity must reflect the ACTUAL audio source: the every-ayah
    // fallback streams per-ayah files even when the chosen reciter only
    // offers (missing) full-surah recordings.
    const effectivePerAyah = supportsPerAyah || usingFallback;
    const granularity: "ayah" | "surah" = effectivePerAyah ? "ayah" : "surah";
    const syncStatus = baseSyncStatus(reciterForAudio.id, surahNum, granularity);
    if (usingFallback) {
      const fb = reciterForAudio;
      const msg = `تلاوة سورة ${surah.meta.nameAr} غير متوفرة بصوت ${reciter.name} — تُستمع بصوت ${fb.name}`;
      setFallbackNotice(msg);
    } else {
      setFallbackNotice(null);
    }

    // Load exact word timings ONLY if a verified source exists for the
    // reciter actually used for playback (chosen reciter or fallback).
    let timings = null;
    let resolvedStatus = syncStatus;
    if (effectivePerAyah) {
      const loaded = await loadTimings(reciterForAudio.id, surahNum);
      if (loaded) {
        timings = loaded.timings;
        resolvedStatus = loaded.status;
      }
    }

    const getUrl = (ayah: number) => {
      if (granularity === "ayah") {
        const a = surah.ayahs.find((x) => x.numberInSurah === ayah);
        if (!a) return null;
        return ayahUrl(reciterForAudio, surahNum, a.numberInSurah, a.globalNumber);
      }
      return surahUrl(reciter, surahNum);
    };

    return {
      reciterId: reciter.id,
      surahId: surahNum,
      getUrl,
      granularity,
      timings,
      syncStatus: resolvedStatus,
      // Relative word weights (text length) → lets the engine build honest
      // WORD_AUTO estimates from each ayah file's real duration, so the
      // word highlight works for EVERY per-ayah reciter.
      getWordWeights: (ayah: number) => {
        const a = surah.ayahs.find((x) => x.numberInSurah === ayah);
        if (!a || a.words.length === 0) return null;
        return a.words.map((w) => {
          // Ignore harakat/diacritics when weighting so long-vowel words
          // get proportionally more time.
          const bare = w.t.replace(/[\u064B-\u0652\u0670\u06D6-\u06ED\u0640]/g, "");
          return Math.pow(Math.max(2, bare.length), 0.7);
        });
      },
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reciter.id, surahNum]);

  /* =========================================================
     AUDIO
  ========================================================= */

  const playAyah = (
    n: number,
    chain: boolean
  ) => {
    void (async () => {
      const source = await buildSource();
      await engine.loadSource(source, n, { autoPlay: true });
      if (chain) {
        // per-ayah chain is handled by the engine's onEnded advancing; for
        // full-surah streams we start at ayah 1 and let timings drive position.
      }
    })();
  };

  const playFullSurah = () => {
    void (async () => {
      const source = await buildSource();
      if (source.granularity === "surah") {
        await engine.loadSource(source, 1, { autoPlay: true });
      } else {
        await engine.loadSource(source, 1, { autoPlay: true });
      }
    })();
  };

  const stopAudio = () => {
    engine.stopRepeat();
    void engine.pause();
  };

  /* =========================================================
     ENGINE -> UI STATE SYNC
     The engine is the sole source of playback truth (exact
     position). We mirror it into existing state used for styling.
  ========================================================= */

  // Controlled auto-scroll: keep active ayah comfortably in view.
  useEffect(() => {
    if (!engine.state.autoScroll) return;
    if (engine.state.status !== "playing") return;
    const ayah = engine.state.currentAyah;
    if (ayah == null) return;
    const el = ayahRefs.current.get(ayah);
    if (el && typeof el.scrollIntoView === "function") {
      el.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth", block: "center" });
    }
  }, [engine.state.currentAyah, engine.state.autoScroll, engine.state.status]);

  // Reload the source whenever reciter or surah changes while something is playing.
  useEffect(() => {
    if (engine.state.status === "idle") return;
    void (async () => {
      const source = await buildSource();
      await engine.loadSource(source, engine.state.currentAyah ?? 1, { autoPlay: engine.state.status === "playing" });
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reciter.id, surahNum]);

  /* =========================================================
     SAVE LAST READ
  ========================================================= */

  useEffect(() => {
    saveLastRead(
      surah.meta.number,
      surah.meta.nameAr
    );
  }, [
    surah.meta.number,
    surah.meta.nameAr,
  ]);

  // Remember the last ayah the learner opened/listened to, for "متابعة القراءة".
  useEffect(() => {
    const ayah = playingAyah ?? selected ?? 1;
    const ref = surah.ayahs.find((a) => a.numberInSurah === ayah);
    savePosition({ surah: surahNum, ayah, page: ref?.page });
  }, [playingAyah, selected, surahNum, surah.ayahs]);

  /* =========================================================
     FONT
  ========================================================= */

  const chooseFont = (
    id: string
  ) => {
    setFont(id);
    setShowFonts(false);

    try {
      localStorage.setItem(
        "hafiz_font",
        id
      );
    } catch {}
  };

  /* =========================================================
     FONT SIZE
  ========================================================= */

  const changeSize = (delta: number) => {
    setFontSize((current) => {
      const next = Math.max(FONT_SIZE.min, Math.min(FONT_SIZE.max, current + delta));
      writeFontSize(next);
      return next;
    });
  };

  const resetFontSize = () => {
    setFontSize(FONT_SIZE.def);
    writeFontSize(FONT_SIZE.def);
  };

  const changeLineHeight = (delta: number) => {
    setLineHeight((cur) => {
      const next = Math.round(Math.max(LINE_HEIGHT.min, Math.min(LINE_HEIGHT.max, cur + delta)) * 10) / 10;
      writeLineHeight(next);
      return next;
    });
  };

  const changeWordSpacing = (delta: number) => {
    setWordSpacing((cur) => {
      const next = Math.max(WORD_SPACING.min, Math.min(WORD_SPACING.max, cur + delta));
      writeWordSpacing(next);
      return next;
    });
  };

  const changeReadingWidth = (delta: number) => {
    setReadingWidth((cur) => {
      const next = Math.max(READING_WIDTH.min, Math.min(READING_WIDTH.max, cur + delta));
      writeReadingWidth(next);
      return next;
    });
  };

  const chooseHighlightStyle = (s: HighlightStyle) => {
    setHlStyle(s);
    writeHighlightStyle(s);
  };

  const onToggleBookmark = (n: number, page?: number) => {
    const { added } = toggleBookmark({ surah: surahNum, ayah: n, page });
    setBookmarkVersion((v) => v + 1);
    showToast(added ? "تمت إضافة العلامة المرجعية" : "أُزيلت العلامة المرجعية");
  };

  const onCopy = async (text: string, n: number) => {
    const ok = await copyAyah(text, surah.meta.nameAr, n);
    showToast(ok ? "تم نسخ الآية" : "تعذّر النسخ");
  };

  /** Parse Western or Eastern-Arabic digits from user input. */
  const parseAyahInput = (raw: string): number => {
    const map: Record<string, string> = { "٠": "0", "١": "1", "٢": "2", "٣": "3", "٤": "4", "٥": "5", "٦": "6", "٧": "7", "٨": "8", "٩": "9" };
    const normalized = raw.replace(/[٠-٩]/g, (d) => map[d] ?? d).replace(/[^\d]/g, "");
    return Number(normalized);
  };

  const jumpToAyah = (n: number) => {
    if (!Number.isInteger(n) || n < 1 || n > surah.ayahs.length) {
      showToast(`الآيات من ١ إلى ${surah.ayahs.length.toLocaleString("ar-EG")}`);
      return;
    }
    setShowNav(false);
    setTafsirAyah(null);
    setSelected(n);
    // Wait a tick for selection/state, then scroll the ayah into view.
    window.setTimeout(() => {
      const el = ayahRefs.current.get(n);
      el?.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth", block: "center" });
      el?.focus?.({ preventScroll: true });
    }, 60);
  };

  /* =========================================================
     RECITER
  ========================================================= */

  const chooseReciter = (
    nextReciter: Reciter
  ) => {
    setReciter(
      nextReciter
    );

    setShowReciters(false);

    stopAudio();

    try {
      localStorage.setItem(
        "hafiz_reciter",
        nextReciter.id
      );
    } catch {}
  };

  /* =========================================================
     PAPER / APPEARANCE
  ========================================================= */

  const choosePaper = (
    value: string
  ) => {
    setPaper(value);

    try {
      localStorage.setItem(
        "hafiz_paper",
        value
      );
    } catch {}
  };

  const toggleHighlight = () => {
    setHighlight(
      (current) => {
        const next =
          !current;

        try {
          localStorage.setItem(
            "hafiz_highlight",
            next ? "1" : "0"
          );
        } catch {}

        return next;
      }
    );
  };

  const chooseHighlightColor = (
    color: string
  ) => {
    setHlColor(color);

    try {
      localStorage.setItem(
        "hafiz_hlcolor",
        color
      );
    } catch {}
  };

  /* =========================================================
     PAGE PROGRESS
  ========================================================= */

  useEffect(() => {
    const onScroll = () => {
      const element =
        pageRef.current;

      if (!element) {
        return;
      }

      const rect =
        element.getBoundingClientRect();

      const total =
        element.offsetHeight -
        window.innerHeight;

      const scrolled =
        Math.min(
          Math.max(
            -rect.top,
            0
          ),
          Math.max(
            total,
            1
          )
        );

      setProgress(
        total > 0
          ? Math.round(
              (scrolled /
                total) *
                100
            )
          : 0
      );
    };

    window.addEventListener(
      "scroll",
      onScroll,
      {
        passive: true,
      }
    );

    onScroll();

    return () => {
      window.removeEventListener(
        "scroll",
        onScroll
      );
    };
  }, [
    view,
    fontSize,
    paper,
  ]);

  /* =========================================================
     ESC
  ========================================================= */

  useEffect(() => {
    const onKeyDown = (
      event: globalThis.KeyboardEvent
    ) => {
      if (
        event.key !==
        "Escape"
      ) {
        return;
      }

      setSelected(null);
      setTafsirAyah(null);
      setShowFonts(false);
      setShowReciters(false);
      setShowAppearance(false);
    };

    window.addEventListener(
      "keydown",
      onKeyDown
    );

    return () => {
      window.removeEventListener(
        "keydown",
        onKeyDown
      );
    };
  }, []);

  /* =========================================================
     AYAH
  ========================================================= */

  /**
   * Tapping an ayah reveals the option chips (tafsir / listen / bookmark /
   * copy). The options only appear on tap and disappear again — choosing
   * "listen" dismisses them (the ayah must be tapped once more to bring
   * them back).
   */
  const onAyahClick = (
    event: MouseEvent,
    n: number
  ) => {
    event?.stopPropagation?.();

    setTafsirAyah(null);
    setSelected(
      (current) =>
        current === n
          ? null
          : n
    );
  };

  const onAyahKeyDown = (
    event: KeyboardEvent,
    n: number
  ) => {
    if (
      event.key ===
        "Enter" ||
      event.key === " "
    ) {
      event.preventDefault();
      onAyahClick(
        event as unknown as MouseEvent,
        n
      );
    }
  };

  const openTafsirInline = (
    ayah: number
  ) => {
    setTafsirAyah(
      ayah
    );
  };

  const openTafsir = (
    ayah: number
  ) => {
    setSelected(null);
    setTafsirAyah(
      ayah
    );
  };

  /* =========================================================
     CLOSE MENUS
  ========================================================= */

  const closeMenus = () => {
    setSelected(null);
    setShowReciters(false);
    setShowFonts(false);
    setShowAppearance(false);
    setTafsirAyah(null);
  };

  const toggleOnly = (
    menu:
      | "font"
      | "reciter"
      | "appearance"
  ) => {
    if (menu === "font") {
      setShowFonts(
        (value) => !value
      );
      setShowReciters(false);
      setShowAppearance(false);
    }

    if (
      menu === "reciter"
    ) {
      setShowReciters(
        (value) => !value
      );
      setShowFonts(false);
      setShowAppearance(false);
    }

    if (
      menu ===
      "appearance"
    ) {
      setShowAppearance(
        (value) => !value
      );
      setShowFonts(false);
      setShowReciters(false);
    }
  };

  /* =========================================================
     FONT STYLE
  ========================================================= */

  const mushafTextStyle: MushafTextStyle =
    {
      "--mushaf-font-size": `${fontSize}px`,
      "--mushaf-line-height": String(lineHeight),
      "--mushaf-word-spacing": `${wordSpacing}px`,
      "--mushaf-reading-width": `${readingWidth}px`,
      lineHeight,
      wordSpacing: `${wordSpacing}px`,
    };

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <div
      className={`relative min-h-screen ${paper === "night" ? "reader-dark" : ""}`}
      onClick={closeMenus}
    >
      {/* Audio playback is managed by the useAudioEngine hook (single
          HTMLAudioElement), which owns exact per-recording timings. */}

      {/* =====================================================
          PROGRESS
      ===================================================== */}

      <div className="fixed inset-x-0 top-0 z-[100] h-1 bg-transparent">
        <div
          className="h-full transition-[width] duration-150"
          style={{
            width: `${progress}%`,
            background:
              "linear-gradient(90deg,#10b981,#2563eb)",
          }}
        />
      </div>

      {/* =====================================================
          TOOLBAR
      ===================================================== */}

      <div
        className="
          sticky top-2 z-[80]
          mx-auto mb-5
          w-full
          max-w-5xl
          px-2 sm:px-4
        "
      >
        <div
          className="
            mushaf-toolbar
            rounded-[24px]
            border border-emerald-100
            bg-white/95
            p-2
            shadow-[0_12px_40px_rgba(15,23,42,0.10)]
            backdrop-blur-xl
            sm:p-3
          "
          onClick={(e) =>
            e.stopPropagation()
          }
        >
          {/* =================================================
              ROW 1
          ================================================= */}

          <div
            className="
              flex
              flex-wrap
              items-center
              gap-2
            "
          >
            {/* VIEW */}

            <div
              className="
                flex
                flex-1
                items-center
                gap-1
                rounded-2xl
                bg-[#f4f8f5]
                p-1
                sm:flex-none
              "
            >
              <button
                type="button"
                onClick={() =>
                  setView(
                    "mushaf"
                  )
                }
                className={`
                  flex flex-1
                  items-center
                  justify-center
                  gap-1.5
                  rounded-xl
                  px-3 py-2
                  text-xs
                  font-bold
                  transition-all
                  sm:flex-none
                  sm:text-sm
                  ${
                    view ===
                    "mushaf"
                      ? "bg-white text-emerald-700 shadow-sm"
                      : "text-slate-500 hover:text-emerald-700"
                  }
                `}
              >
                <IconBook className="h-4 w-4" />
                <span>
                  مصحف
                </span>
              </button>

              <button
                type="button"
                onClick={() =>
                  setView(
                    "ayah"
                  )
                }
                className={`
                  flex flex-1
                  items-center
                  justify-center
                  gap-1.5
                  rounded-xl
                  px-3 py-2
                  text-xs
                  font-bold
                  transition-all
                  sm:flex-none
                  sm:text-sm
                  ${
                    view ===
                    "ayah"
                      ? "bg-white text-emerald-700 shadow-sm"
                      : "text-slate-500 hover:text-emerald-700"
                  }
                `}
              >
                <IconList className="h-4 w-4" />
                <span>
                  آية بآية
                </span>
              </button>

              <button
                type="button"
                onClick={() =>
                  setView(
                    "continuous"
                  )
                }
                className={`
                  flex flex-1
                  items-center
                  justify-center
                  gap-1.5
                  rounded-xl
                  px-3 py-2
                  text-xs
                  font-bold
                  transition-all
                  sm:flex-none
                  sm:text-sm
                  ${
                    view ===
                    "continuous"
                      ? "bg-white text-emerald-700 shadow-sm"
                      : "text-slate-500 hover:text-emerald-700"
                  }
                `}
                aria-pressed={view === "continuous"}
              >
                <IconScroll className="h-4 w-4" />
                <span>
                  متواصل
                </span>
              </button>
            </div>

            {/* FONT SIZE */}

            <div
              className="
                flex
                items-center
                gap-1
                rounded-2xl
                bg-[#f7f5ec]
                p-1
              "
            >
              <button
                type="button"
                onClick={() =>
                  changeSize(-2)
                }
                className="
                  grid
                  h-9 w-9
                  place-items-center
                  rounded-xl
                  bg-white
                  text-slate-700
                  shadow-sm
                  transition
                  hover:bg-emerald-50
                  hover:text-emerald-700
                  active:scale-95
                "
                aria-label="تصغير الخط"
              >
                <IconMinus />
              </button>

              <button
                type="button"
                onClick={
                  resetFontSize
                }
                className="
                  min-w-[52px]
                  rounded-xl
                  px-2
                  py-2
                  text-center
                  text-xs
                  font-black
                  text-slate-700
                "
                title="إعادة الحجم"
              >
                {fontSize}px
              </button>

              <button
                type="button"
                onClick={() =>
                  changeSize(2)
                }
                className="
                  grid
                  h-9 w-9
                  place-items-center
                  rounded-xl
                  bg-white
                  text-slate-700
                  shadow-sm
                  transition
                  hover:bg-emerald-50
                  hover:text-emerald-700
                  active:scale-95
                "
                aria-label="تكبير الخط"
              >
                <IconPlus />
              </button>
            </div>

            {/* PLAY */}

            <button
              type="button"
              onClick={() => {
                if (isPlaying) {
                  stopAudio();
                } else {
                  playFullSurah();
                }
              }}
              className={`
                flex
                items-center
                justify-center
                gap-2
                rounded-2xl
                px-4
                py-2.5
                text-xs
                font-black
                text-white
                shadow-md
                transition-all
                active:scale-95
                sm:text-sm
                ${
                  isPlaying
                    ? "bg-red-500 hover:bg-red-600"
                    : "bg-gradient-to-l from-blue-600 to-emerald-500 hover:from-blue-700 hover:to-emerald-600"
                }
              `}
            >
              {isPlaying ? (
                <>
                  <IconStop className="h-4 w-4" />
                  <span>
                    إيقاف
                  </span>
                </>
              ) : (
                <>
                  <IconPlay className="h-4 w-4" />
                  <span>
                    تلاوة
                  </span>
                </>
              )}
            </button>
          </div>

          {/* HAFIZ SMART SESSION — the primary memorization action. */}
          <button
            type="button"
            onClick={() => {
              setShowHafiz((v) => !v);
              setShowNav(false);
              setShowAppearance(false);
              setShowFonts(false);
              setShowReciters(false);
            }}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-l from-emerald-500 to-ocean-500 px-3 py-2.5 text-sm font-bold text-white shadow-sm transition active:scale-[0.99]"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 2a7 7 0 00-7 7c0 3 2 5 2 7h10c0-2 2-4 2-7a7 7 0 00-7-7z" /><path d="M9 21h6" />
            </svg>
            ابدأ جلسة ذكية
          </button>

          {showHafiz && (
            <div className="mt-2" onClick={(e) => e.stopPropagation()}>
              <HafizPanel
                teacher={hafiz}
                surah={surah}
                onListenAyah={(n) => playAyah(n, false)}
              />
            </div>
          )}

          {/* =================================================
              ROW 2
          ================================================= */}

          <div
            className="
              mt-2
              grid
              grid-cols-2
              gap-2
              sm:grid-cols-6
            "
          >
            {/* QUICK HIGHLIGHT TOGGLE */}

            <button
              type="button"
              onClick={toggleHighlight}
              aria-pressed={highlight}
              className={`
                flex w-full
                items-center
                justify-center
                gap-1.5
                rounded-2xl
                border
                px-2 py-2.5
                text-xs
                font-bold
                transition
                ${
                  highlight
                    ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                    : "border-slate-100 bg-white text-slate-600 hover:border-emerald-200 hover:text-emerald-700"
                }
              `}
              title="تظليل الكلمات أثناء التلاوة"
            >
              <span
                className="grid h-4 w-4 place-items-center rounded-full text-[9px] font-black text-white"
                style={{ background: hlColor }}
              >
                ✦
              </span>
              <span>تظليل</span>
            </button>

            {/* NAVIGATION */}

            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setShowNav((v) => !v);
                  setShowAppearance(false);
                  setShowFonts(false);
                  setShowReciters(false);
                }}
                className={`
                  flex w-full
                  items-center
                  justify-center
                  gap-1.5
                  rounded-2xl
                  border
                  px-2 py-2.5
                  text-xs
                  font-bold
                  transition
                  ${
                    showNav
                      ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                      : "border-slate-100 bg-white text-slate-600 hover:border-emerald-200 hover:text-emerald-700"
                  }
                `}
                aria-haspopup="dialog"
                aria-expanded={showNav}
              >
                <IconBookOpen className="h-4 w-4" />
                <span>الفهرس</span>
                <IconChevron className="h-3 w-3" />
              </button>

              <MushafMenu open={showNav} onClose={() => setShowNav(false)} side="right" width={300}>
                <div role="dialog" aria-label="الفهرس والانتقال إلى آية">
                  <div className="mb-3 flex items-center justify-between">
                    <div>
                      <div className="text-sm font-black text-slate-900">الفهرس والانتقال السريع</div>
                      <div className="mt-0.5 text-[10px] text-slate-400">
                        {surah.meta.nameAr} · ١–{surah.ayahs.length.toLocaleString("ar-EG")}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowNav(false)}
                      className="grid h-8 w-8 place-items-center rounded-xl bg-slate-50 text-slate-500 hover:bg-slate-100"
                      aria-label="إغلاق"
                    >
                      <IconClose />
                    </button>
                  </div>

                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      const n = parseAyahInput(jumpAyah);
                      jumpToAyah(n);
                    }}
                    className="flex gap-2"
                  >
                    <input
                      inputMode="numeric"
                      autoFocus
                      value={jumpAyah}
                      onChange={(e) => setJumpAyah(e.target.value)}
                      placeholder="رقم الآية"
                      dir="ltr"
                      className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-center text-lg font-bold text-slate-900 outline-none focus:border-emerald-500"
                      aria-label="رقم الآية"
                    />
                    <button type="submit" className="rounded-xl btn-primary px-5 py-2.5 text-sm font-bold">
                      اذهب
                    </button>
                  </form>

                  <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500">
                    <span>الجزء {surah.meta.juz.toLocaleString("ar-EG")} · الصفحة {surah.ayahs[0]?.page.toLocaleString("ar-EG") ?? "—"}</span>
                    <Link href="/mushaf" className="font-bold text-emerald-700 hover:underline">
                      فهرس السور
                    </Link>
                  </div>

                  {/* ===== فهرس جانبي تفاعلي سريع — royal side index ===== */}
                  <div className="mt-4 border-t border-slate-100 pt-3">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-xs font-black text-slate-900">الفهرس السريع للسور</span>
                      <span className="text-[10px] font-bold text-slate-400">اضغط للانتقال فوراً</span>
                    </div>
                    <div className="relative">
                      <input
                        value={indexQuery}
                        onChange={(e) => setIndexQuery(e.target.value)}
                        placeholder="ابحث عن سورة أو رقمها…"
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 pr-8 text-right text-xs font-semibold text-slate-900 outline-none focus:border-emerald-500"
                        aria-label="البحث في الفهرس"
                      />
                      <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-xs">🔍</span>
                    </div>
                    <div
                      className="mt-2 max-h-52 overflow-y-auto rounded-xl bg-slate-50/70 p-1"
                      dir="rtl"
                    >
                      {(() => {
                        const q = indexQuery.trim();
                        const num = q ? parseAyahInput(q) : 0;
                        const matches = SURAHS.filter((s) => {
                          if (!q) return true;
                          return (
                            s.nameAr.includes(q) ||
                            s.nameLatin.toLowerCase().includes(q.toLowerCase()) ||
                            (num >= 1 && num <= 114 && s.number === num)
                          );
                        });
                        return matches.map((s) => {
                        const active = s.number === surahNum;
                        return (
                          <Link
                            key={s.number}
                            href={`/mushaf/${s.number}`}
                            onClick={() => setShowNav(false)}
                            className={`flex items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-right transition ${
                              active
                                ? "bg-emerald-100 text-emerald-800"
                                : "hover:bg-white hover:shadow-sm"
                            }`}
                          >
                            <span className="flex items-center gap-2">
                              <span
                                className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-[11px] font-black text-white"
                                style={{ background: active ? "linear-gradient(135deg,#10b981,#2563eb)" : "linear-gradient(135deg,#059669,#0f172a)" }}
                              >
                                {s.number.toLocaleString("ar-EG")}
                              </span>
                              <span
                                className="text-sm font-bold text-slate-800"
                                style={{ fontFamily: "var(--font-quran)" }}
                              >
                                {s.nameAr}
                              </span>
                            </span>
                            <span className="shrink-0 text-[10px] font-semibold text-slate-400">
                              {s.ayahCount.toLocaleString("ar-EG")} آية
                            </span>
                          </Link>
                        );
                        });
                      })()}
                      {(() => {
                        const q = indexQuery.trim();
                        const num = q ? parseAyahInput(q) : 0;
                        const count = SURAHS.filter((s) => {
                          if (!q) return true;
                          return (
                            s.nameAr.includes(q) ||
                            s.nameLatin.toLowerCase().includes(q.toLowerCase()) ||
                            (num >= 1 && num <= 114 && s.number === num)
                          );
                        }).length;
                        if (count === 0) {
                          return <p className="px-2 py-3 text-center text-[11px] text-slate-400">لا توجد سورة مطابقة</p>;
                        }
                        return null;
                      })()}
                    </div>
                  </div>
                </div>
              </MushafMenu>
            </div>

            {/* APPEARANCE */}

            <div className="relative">
              <button
                type="button"
                onClick={() =>
                  toggleOnly(
                    "appearance"
                  )
                }
                className={`
                  flex w-full
                  items-center
                  justify-center
                  gap-1.5
                  rounded-2xl
                  border
                  px-2 py-2.5
                  text-xs
                  font-bold
                  transition
                  ${
                    showAppearance
                      ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                      : "border-slate-100 bg-white text-slate-600 hover:border-emerald-200 hover:text-emerald-700"
                  }
                `}
              >
                <IconPalette className="h-4 w-4" />
                <span>
                  المظهر
                </span>
                <IconChevron className="h-3 w-3" />
              </button>

              <MushafMenu open={showAppearance} onClose={() => setShowAppearance(false)} side="right" width={310}>
                  <div className="mb-3 flex items-center justify-between">
                    <div>
                      <div className="text-sm font-black text-slate-900">
                        مظهر المصحف
                      </div>

                      <div className="mt-0.5 text-[10px] text-slate-400">
                        اختر الشكل المناسب للقراءة
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        setShowAppearance(
                          false
                        )
                      }
                      className="
                        grid
                        h-8 w-8
                        place-items-center
                        rounded-xl
                        bg-slate-50
                        text-slate-500
                        hover:bg-slate-100
                      "
                    >
                      <IconClose />
                    </button>
                  </div>

                  <div className="mb-4 grid grid-cols-5 gap-1.5">
                    {PAPERS.map(
                      (item) => (
                        <button
                          key={
                            item.id
                          }
                          type="button"
                          onClick={() =>
                            choosePaper(
                              item.id
                            )
                          }
                          className={`
                            rounded-xl
                            border
                            p-1
                            transition
                            ${
                              paper ===
                              item.id
                                ? "border-emerald-500 ring-2 ring-emerald-100"
                                : "border-slate-100"
                            }
                          `}
                        >
                          <span
                            className="
                              block
                              h-8
                              rounded-lg
                              border
                              border-black/5
                            "
                            style={{
                              background:
                                item.preview,
                            }}
                          />

                          <span className="mt-1 block truncate text-[9px] font-bold text-slate-500">
                            {item.label}
                          </span>
                        </button>
                      )
                    )}
                  </div>

                  <div
                    className="
                      rounded-2xl
                      bg-slate-50
                      p-3
                    "
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-xs font-black text-slate-800">
                          تظليل الكلمات
                        </div>

                        <div className="mt-0.5 text-[10px] text-slate-400">
                          أثناء تشغيل التلاوة
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={
                          toggleHighlight
                        }
                        className={`
                          relative
                          h-6 w-11
                          rounded-full
                          transition
                          ${
                            highlight
                              ? "bg-emerald-500"
                              : "bg-slate-300"
                          }
                        `}
                        aria-label="تشغيل أو إيقاف التظليل"
                      >
                        <span
                          className={`
                            absolute
                            top-1
                            h-4 w-4
                            rounded-full
                            bg-white
                            shadow
                            transition
                            ${
                              highlight
                                ? "right-1"
                                : "right-6"
                            }
                          `}
                        />
                      </button>
                    </div>

                    {highlight && (
                      <div className="mt-3">
                        <div className="mb-2 text-[10px] font-bold text-slate-500">
                          لون التظليل
                        </div>

                        <div className="flex items-center gap-2">
                          {HIGHLIGHT_COLORS.map(
                            (color) => (
                              <button
                                key={
                                  color
                                }
                                type="button"
                                onClick={() =>
                                  chooseHighlightColor(
                                    color
                                  )
                                }
                                className={`
                                  grid
                                  h-8 w-8
                                  place-items-center
                                  rounded-full
                                  transition
                                  ${
                                    hlColor ===
                                    color
                                      ? "scale-110 ring-2 ring-slate-400 ring-offset-2"
                                      : ""
                                  }
                                `}
                                style={{
                                  background:
                                    color,
                                }}
                                aria-label={`لون ${color}`}
                              >
                                {hlColor ===
                                  color && (
                                  <span className="text-xs font-black text-white">
                                    ✓
                                  </span>
                                )}
                              </button>
                            )
                          )}
                        </div>
                      </div>
                    )}

                    {/* Highlight style */}
                    <div className="mt-3 rounded-2xl bg-slate-50 p-3">
                      <div className="mb-2 text-[10px] font-bold text-slate-500">
                        نمط التظليل
                      </div>
                      <div className="grid grid-cols-3 gap-1.5">
                        {([
                          ["background", "خلفية"],
                          ["underline", "تسطير"],
                          ["frame", "إطار"],
                        ] as [HighlightStyle, string][]).map(([id, label]) => (
                          <button
                            key={id}
                            type="button"
                            onClick={() => chooseHighlightStyle(id)}
                            className={`rounded-lg px-2 py-2 text-[11px] font-bold transition ${
                              hlStyle === id
                                ? "bg-emerald-600 text-white"
                                : "bg-white text-slate-600 hover:bg-emerald-50"
                            }`}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Typography spacing */}
                    <div className="mt-3 rounded-2xl bg-slate-50 p-3">
                      <div className="mb-2 text-[10px] font-bold text-slate-500">
                        إعدادات القراءة
                      </div>
                      <div className="space-y-2">
                        <SettingStepper
                          label="ارتفاع السطر"
                          value={lineHeight.toFixed(1)}
                          onDec={() => changeLineHeight(-0.1)}
                          onInc={() => changeLineHeight(0.1)}
                          onReset={() => { setLineHeight(LINE_HEIGHT.def); writeLineHeight(LINE_HEIGHT.def); }}
                          decLabel="تقليل ارتفاع السطر"
                          incLabel="زيادة ارتفاع السطر"
                        />
                        <SettingStepper
                          label="تباعد الكلمات"
                          value={`${wordSpacing}px`}
                          onDec={() => changeWordSpacing(-1)}
                          onInc={() => changeWordSpacing(1)}
                          onReset={() => { setWordSpacing(WORD_SPACING.def); writeWordSpacing(WORD_SPACING.def); }}
                          decLabel="تقليل تباعد الكلمات"
                          incLabel="زيادة تباعد الكلمات"
                        />
                        <SettingStepper
                          label="عرض القراءة"
                          value={`${readingWidth}px`}
                          onDec={() => changeReadingWidth(-40)}
                          onInc={() => changeReadingWidth(40)}
                          onReset={() => { setReadingWidth(READING_WIDTH.def); writeReadingWidth(READING_WIDTH.def); }}
                          decLabel="تضييق عرض القراءة"
                          incLabel="توسيع عرض القراءة"
                        />
                      </div>
                    </div>
                  </div>
              </MushafMenu>
            </div>

            {/* FONT */}

            <div className="relative">
              <button
                type="button"
                onClick={() =>
                  toggleOnly(
                    "font"
                  )
                }
                className={`
                  flex w-full
                  items-center
                  justify-center
                  gap-1.5
                  rounded-2xl
                  border
                  px-2 py-2.5
                  text-xs
                  font-bold
                  transition
                  ${
                    showFonts
                      ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                      : "border-slate-100 bg-white text-slate-600 hover:border-emerald-200 hover:text-emerald-700"
                  }
                `}
              >
                <IconType className="h-4 w-4" />
                <span>
                  الخط
                </span>
                <IconChevron className="h-3 w-3" />
              </button>

              <MushafMenu open={showFonts} onClose={() => setShowFonts(false)} side="right" width={280}>
                  <div className="border-b border-slate-100 px-4 py-3">
                    <div className="text-sm font-black text-slate-900">
                      نوع الخط
                    </div>

                    <div className="mt-0.5 text-[10px] text-slate-400">
                      اختر الخط المناسب للمصحف
                    </div>
                  </div>

                  <div className="p-2">
                    {FONTS.map(
                      (item) => (
                        <button
                          key={
                            item.id
                          }
                          type="button"
                          onClick={() =>
                            chooseFont(
                              item.id
                            )
                          }
                          className={`
                            flex w-full
                            items-center
                            justify-between
                            gap-3
                            rounded-2xl
                            px-3 py-3
                            text-right
                            transition
                            ${
                              font ===
                              item.id
                                ? "bg-emerald-50"
                                : "hover:bg-slate-50"
                            }
                          `}
                        >
                          <span
                            className={`
                              ${item.id}
                              text-xl
                              text-slate-900
                            `}
                          >
                            بِسْمِ
                          </span>

                          <span className="flex-1 text-[11px] font-bold text-slate-500">
                            {item.label}
                          </span>

                          {font ===
                            item.id && (
                            <span className="grid h-6 w-6 place-items-center rounded-full bg-emerald-500 text-xs font-black text-white">
                              ✓
                            </span>
                          )}
                        </button>
                      )
                    )}
                  </div>
              </MushafMenu>
            </div>

            {/* RECITER */}

            <div className="relative">
              <button
                type="button"
                onClick={() =>
                  toggleOnly(
                    "reciter"
                  )
                }
                className={`
                  flex w-full
                  items-center
                  justify-center
                  gap-1.5
                  rounded-2xl
                  border
                  px-2 py-2.5
                  text-xs
                  font-bold
                  transition
                  ${
                    showReciters
                      ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                      : "border-slate-100 bg-white text-slate-600 hover:border-emerald-200 hover:text-emerald-700"
                  }
                `}
              >
                <IconMic className="h-4 w-4" />

                <span className="max-w-[90px] truncate">
                  {reciter.name}
                </span>

                {reciterAvailability(reciter, surahNum) === "none" && (
                  <span
                    className="h-2 w-2 shrink-0 rounded-full bg-amber-400 ring-2 ring-amber-100"
                    title="غير متاح لهذه السورة — يُستخدم صوت بديل"
                  />
                )}

                <IconChevron className="h-3 w-3" />
              </button>

              <MushafMenu open={showReciters} onClose={() => setShowReciters(false)} side="left" width={300}>
                  <div className="sticky top-0 z-10 border-b border-slate-100 bg-white px-4 py-3">
                    <div className="text-sm font-black text-slate-900">
                      القارئ
                    </div>

                    <div className="mt-0.5 text-[10px] text-slate-400">
                      يُوضَّح لكل قارئ توفّره لهذه السورة
                    </div>

                    {/* Availability legend */}
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <span className="reciter-avail reciter-avail-ayah">آية بآية · كل السور</span>
                      <span className="reciter-avail reciter-avail-surah">تسجيل كامل للسورة</span>
                      <span className="reciter-avail reciter-avail-none">غير متاح للسورة</span>
                    </div>

                    {fallbackNotice && (
                      <div className="mt-2 rounded-xl bg-amber-50 px-3 py-2 text-[11px] font-bold leading-relaxed text-amber-800 ring-1 ring-amber-200">
                        {fallbackNotice}
                      </div>
                    )}
                  </div>

                  <div className="max-h-[45vh] overflow-y-auto p-2">
                    {RECITERS.map(
                      (item) => {
                        const photo = getRegistryReciter(item.id)?.image ?? null;
                        const avail = reciterAvailability(item, surahNum);
                        const unavailable = avail === "none";
                        return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() =>
                            chooseReciter(item)
                          }
                          className={`
                            flex w-full
                            items-center
                            justify-between
                            gap-2
                            rounded-2xl
                            px-3 py-2.5
                            text-right
                            transition
                            ${
                              item.id ===
                              reciter.id
                                ? "bg-emerald-50"
                                : "hover:bg-slate-50"
                            }
                            ${unavailable ? "reciter-row-unavailable" : ""}
                          `}
                        >
                          <span className="flex min-w-0 items-center gap-2.5">
                            {photo ? (
                              <Image
                                src={photo}
                                alt=""
                                width={40}
                                height={40}
                                className="h-10 w-10 shrink-0 rounded-xl object-cover object-top ring-1 ring-emerald-100"
                              />
                            ) : (
                              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-emerald-500 to-ocean-600 text-sm font-bold text-white">
                                {item.name.charAt(0)}
                              </span>
                            )}
                            <span className="flex min-w-0 flex-col">
                              <span className="truncate font-bold text-slate-800">
                                {item.name}
                              </span>
                              <span className="flex flex-wrap items-center gap-1.5">
                                <span className={`reciter-avail ${
                                  avail === "ayah"
                                    ? "reciter-avail-ayah"
                                    : avail === "surah"
                                      ? "reciter-avail-surah"
                                      : "reciter-avail-none"
                                }`}>
                                  {avail === "ayah"
                                    ? "آية بآية"
                                    : avail === "surah"
                                      ? "متاح للسورة"
                                      : "غير متاح"}
                                </span>
                              </span>
                            </span>
                          </span>

                          {item.id ===
                            reciter.id && (
                            <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-emerald-500 text-xs font-black text-white">
                              ✓
                            </span>
                          )}
                        </button>
                        );
                      }
                    )}
                  </div>
              </MushafMenu>
            </div>
          </div>
        </div>
      </div>

      {/* =====================================================
          ROYAL OPEN BOOK — الكتاب الملكي المفتوح
          Leather cover + spine + open page
      ===================================================== */}

      <div
        className="book-open mx-auto w-full"
        style={{ maxWidth: "calc(var(--mushaf-reading-width, 1024px) + 52px)" }}
      >
        {/* central spine & page-curl shading */}
        <span className="book-spine" aria-hidden />
        <span className="page-curl right" aria-hidden />
        <span className="page-curl left" aria-hidden />

        <div className="book-open-inner">
      <div
        ref={pageRef}
        className={`
          mushaf-page
          paper-${paper}
          hl-style-${hlStyle}
          relative z-10
          w-full
          overflow-hidden
          px-4 py-6
          sm:px-8 sm:py-10
          md:px-12 md:py-14
          lg:px-16 lg:py-16
        `}
        style={
          {
            maxWidth: "var(--mushaf-reading-width, 1024px)",
            margin: "0 auto",
            "--reader-hl": hlColor,
            "--mushaf-font-size": `${fontSize}px`,
            "--mushaf-line-height": String(lineHeight),
            "--mushaf-word-spacing": `${wordSpacing}px`,
            fontSize: `${fontSize}px`,
            lineHeight,
            wordSpacing: `${wordSpacing}px`,
          } as CSSProperties
        }
      >
        {/* WATERMARK */}

        <span className="mushaf-watermark" />

        {/* CORNERS */}

        <span className="mushaf-corner left-3 top-3" aria-hidden />
        <span className="mushaf-corner right-3 top-3" aria-hidden />
        <span className="mushaf-corner bottom-3 left-3" aria-hidden />
        <span className="mushaf-corner bottom-3 right-3" aria-hidden />

        {/* ===================================================
            SURAH HEADER
        =================================================== */}

        <div
          className="
            relative z-20
            transition-all
            duration-300
          "
        >
          <SurahHeader
            nameAr={
              surah.meta.nameAr
            }
            revelation={
              surah.meta.revelation
            }
            ayahCount={
              surah.meta.ayahCount
            }
            juz={
              surah.meta.juz
            }
          />
        </div>

        {/* ===================================================
            BASMALA
        =================================================== */}

        {surah.basmala && (
          <div className="relative z-10 mb-6 text-center">
            <div
              className="
                text-xl
                sm:text-2xl
                md:text-[2.1rem]
              "
              style={{
                fontFamily:
                  "var(--font-quran)",
                background:
                  "linear-gradient(120deg,#047857,#059669,#2563eb)",
                WebkitBackgroundClip:
                  "text",
                backgroundClip:
                  "text",
                color:
                  "transparent",
              }}
            >
              بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
            </div>

            <div className="basmala-ornament mx-auto mt-4 max-w-sm" />
          </div>
        )}

        {/* ===================================================
            MUSHAF VIEW
        =================================================== */}

        {view === "mushaf" && (
          <div className="mushaf-content relative z-10">
            <p
              className={`mushaf-text ${font}`}
              dir="rtl"
              style={
                mushafTextStyle
              }
            >
              {surah.ayahs.map(
                (ayah) => (
                  <span
                    key={
                      ayah.numberInSurah
                    }
                  >
                    {/* AYAH */}

                    <span
                      ref={(
                        element
                      ) => {
                        if (
                          element
                        ) {
                          ayahRefs.current.set(
                            ayah.numberInSurah,
                            element
                          );
                        } else {
                          ayahRefs.current.delete(
                            ayah.numberInSurah
                          );
                        }
                      }}
                      role="button"
                      tabIndex={0}
                      onClick={(
                        event
                      ) =>
                        onAyahClick(
                          event,
                          ayah.numberInSurah
                        )
                      }
                      onKeyDown={(
                        event
                      ) =>
                        onAyahKeyDown(
                          event,
                          ayah.numberInSurah
                        )
                      }
                      className={`
                        cursor-pointer
                        rounded-md
                        transition
                        ${
                          playingAyah ===
                          ayah.numberInSurah
                            ? `ayah-playing ayah-${hlStyle}`
                            : selected ===
                              ayah.numberInSurah
                            ? "bg-[rgba(59,130,246,0.12)]"
                            : "hover:bg-[rgba(16,185,129,0.10)]"
                        }
                      `}
                    >
                      {/* WORD HIGHLIGHT */}

                      {highlight &&
                      playingAyah ===
                        ayah.numberInSurah ? (
                        ayah.words.map(
                          (
                            word,
                            wordIndex
                          ) => (
                            <span
                              key={
                                wordIndex
                              }
                              onClick={(
                                event
                              ) => {
                                event.stopPropagation();

                                engine.seekToWord(
                                  ayah.numberInSurah,
                                  wordIndex + 1
                                );
                              }}
                              className="cursor-pointer"
                              style={
                                wordIndex ===
                                activeWord
                                  ? {
                                      color:
                                        hlColor,
                                      background:
                                        `${hlColor}22`,
                                      borderRadius:
                                        "6px",
                                      padding:
                                        "0 2px",
                                      transition:
                                        "color .15s, background .15s",
                                    }
                                  : undefined
                              }
                            >
                              {
                                word.t
                              }{" "}
                            </span>
                          )
                        )
                      ) : (
                        ayah.text
                      )}

                      <span
                        role="button"
                        tabIndex={-1}
                        title="استماع للآية"
                        aria-label={`استماع للآية ${ayah.numberInSurah}`}
                        onClick={(event) => {
                          event.stopPropagation();
                          playAyah(ayah.numberInSurah, false);
                        }}
                        className="ayah-marker-btn"
                      >
                        <AyahMarker
                          n={
                            ayah.numberInSurah
                          }
                          active={
                            playingAyah ===
                            ayah.numberInSurah
                          }
                        />
                      </span>
                    </span>

                    {/* SAJDA */}

                    {isSajda(
                      surah.meta
                        .number,
                      ayah.numberInSurah
                    ) && (
                      <button
                        type="button"
                        onClick={(
                          event
                        ) => {
                          event.stopPropagation();
                          setSajdaOpen(
                            true
                          );
                        }}
                        title="موضع سجدة"
                        className="
                          mx-1
                          inline-flex
                          items-center
                          gap-1
                          rounded-full
                          bg-amber-100
                          px-2 py-0.5
                          align-middle
                          text-[11px]
                          font-bold
                          text-amber-700
                        "
                      >
                        ۩ سجدة
                      </button>
                    )}

                    {/* AYAH ACTIONS */}

                    {selected ===
                      ayah.numberInSurah && (
                        <span
                          className="ayah-inline-actions"
                          contentEditable={
                            false
                          }
                          onClick={(
                            event
                          ) =>
                            event.stopPropagation()
                          }
                        >
                          <button
                            type="button"
                            onClick={() =>
                              openTafsirInline(
                                ayah.numberInSurah
                              )
                            }
                            className="ayah-chip ayah-chip-tafsir"
                          >
                            📖 التفسير
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              playAyah(
                                ayah.numberInSurah,
                                false
                              );

                              setSelected(
                                null
                              );
                            }}
                            className="ayah-chip ayah-chip-listen"
                          >
                            🔊 استماع
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              onToggleBookmark(
                                ayah.numberInSurah,
                                ayah.page
                              )
                            }
                            className="ayah-chip ayah-chip-bookmark"
                            title="علامة مرجعية"
                          >
                            🔖 علامة
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              onCopy(
                                ayah.text,
                                ayah.numberInSurah
                              )
                            }
                            className="ayah-chip ayah-chip-copy"
                            title="نسخ الآية"
                          >
                            ⧉ نسخ
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              setSelected(
                                null
                              )
                            }
                            className="ayah-chip ayah-chip-close"
                          >
                            ✕
                          </button>
                        </span>
                      )}

                    {/* INLINE TAFSIR */}

                    {tafsirAyah ===
                      ayah.numberInSurah && (
                      <span
                        className="ayah-tafsir-inline"
                        contentEditable={
                          false
                        }
                        onClick={(
                          event
                        ) =>
                          event.stopPropagation()
                        }
                      >
                        <span className="ayah-tafsir-head">
                          <span className="ayah-tafsir-badge">
                            {toDigits(
                              ayah.numberInSurah
                            )}
                          </span>

                          <span className="font-display text-sm font-bold text-ink-900">
                            التفسير الميسّر
                          </span>

                          <button
                            type="button"
                            onClick={() => {
                              setTafsirAyah(
                                null
                              );
                            }}
                            aria-label="إخفاء التفسير"
                            className="ayah-tafsir-close"
                          >
                            ✕
                          </button>
                        </span>

                        <span className="ayah-tafsir-body">
                          {ayah.tafsir ||
                            "التفسير غير متوفّر لهذه الآية حالياً."}
                        </span>

                        <button
                          type="button"
                          onClick={() =>
                            playAyah(
                              ayah.numberInSurah,
                              false
                            )
                          }
                          className="
                            mt-2
                            rounded-lg
                            btn-primary
                            px-4 py-2
                            text-xs
                            font-semibold
                          "
                        >
                          🔊 استماع للآية
                        </button>
                      </span>
                    )}

                    {" "}
                  </span>
                )
              )}
            </p>
          </div>
        )}

        {/* ===================================================
            CONTINUOUS SCROLL
            Calm, one-ayah-per-row reading flow. Same verified text
            and audio as the page mode, optimized for long reading.
        =================================================== */}

        {view === "continuous" && (
          <div className="mushaf-content relative z-10" dir="rtl">
            <div
              className="mushaf-continuous mx-auto"
              style={mushafTextStyle}
            >
              {surah.ayahs.map((ayah) => {
                // bookmarkVersion only exists to force a re-render after toggling.
                const bookmarked = isBookmarked(surahNum, ayah.numberInSurah);
                void bookmarkVersion;
                return (
                  <article
                    key={ayah.numberInSurah}
                    ref={(el) => {
                      if (el) ayahRefs.current.set(ayah.numberInSurah, el as unknown as HTMLSpanElement);
                      else ayahRefs.current.delete(ayah.numberInSurah);
                    }}
                    className={`mushaf-continuous-ayah ${playingAyah === ayah.numberInSurah ? "is-playing" : ""}`}
                  >
                    <div
                      className={`mushaf-continuous-text ${font}`}
                      onClick={() => onAyahClick({ stopPropagation: () => {} } as unknown as MouseEvent, ayah.numberInSurah)}
                    >
                      {highlight && playingAyah === ayah.numberInSurah
                        ? ayah.words.map((word, wi) => (
                            <span
                              key={wi}
                              className="cursor-pointer"
                              style={
                                wi === activeWord
                                  ? { color: hlColor, background: `${hlColor}22`, borderRadius: 6, padding: "0 2px" }
                                  : undefined
                              }
                            >
                              {word.t}{" "}
                            </span>
                          ))
                        : ayah.text}
                      <AyahMarker n={ayah.numberInSurah} active={playingAyah === ayah.numberInSurah} />
                    </div>

                    <div className="mushaf-continuous-actions" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => playAyah(ayah.numberInSurah, false)}
                        className="mushaf-action-chip"
                        aria-label={`استماع للآية ${ayah.numberInSurah}`}
                      >
                        🔊
                      </button>
                      <button
                        type="button"
                        onClick={() => onToggleBookmark(ayah.numberInSurah, ayah.page)}
                        className="mushaf-action-chip"
                        aria-label="علامة مرجعية"
                        aria-pressed={bookmarked}
                      >
                        <IconBookmark className="h-4 w-4" filled={bookmarked} />
                      </button>
                      <button
                        type="button"
                        onClick={() => onCopy(ayah.text, ayah.numberInSurah)}
                        className="mushaf-action-chip"
                        aria-label="نسخ الآية"
                      >
                        <IconCopy className="h-4 w-4" />
                      </button>
                    </div>

                    {tafsirAyah === ayah.numberInSurah && (
                      <div className="ayah-tafsir-inline mt-3" contentEditable={false}>
                        <span className="ayah-tafsir-head">
                          <span className="ayah-tafsir-badge">{toDigits(ayah.numberInSurah)}</span>
                          <span className="font-display text-sm font-bold text-ink-900">التفسير الميسّر</span>
                          <button type="button" onClick={() => { setTafsirAyah(null); setSelected(null); }} className="ayah-tafsir-close">✕</button>
                        </span>
                        <span className="ayah-tafsir-body">{ayah.tafsir || "التفسير غير متوفّر لهذه الآية حالياً."}</span>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          </div>
        )}

        {/* ===================================================
            AYAH BY AYAH
        =================================================== */}

        {view === "ayah" && (
          <div
            className="relative z-10 space-y-4"
            dir="rtl"
          >
            {surah.ayahs.map(
              (ayah) => (
                <div
                  key={
                    ayah.numberInSurah
                  }
                  className={`
                    ayah-card
                    relative
                    overflow-hidden
                    rounded-3xl
                    border
                    bg-white/80
                    p-4
                    transition-all
                    sm:p-6
                    ${
                      playingAyah ===
                      ayah.numberInSurah
                        ? "ayah-card-playing border-emerald-400 shadow-lg"
                        : "border-sand-300/60 hover:border-emerald-200 hover:shadow-md"
                    }
                  `}
                >
                  <span className="ayah-card-bar" style={{ background: "var(--grad-aurora)" }} />

                  <div
                    className="
                      mb-3
                      flex
                      flex-wrap
                      items-center
                      justify-between
                      gap-2
                    "
                  >
                    <span className="flex items-center gap-2">
                      <span
                        className="
                          grid
                          h-9 w-9
                          place-items-center
                          rounded-full
                          text-xs
                          font-bold
                          text-white
                          shadow-md
                        "
                        style={{
                          background:
                            "linear-gradient(135deg,#10b981,#3b82f6)",
                        }}
                      >
                        {ayah.numberInSurah.toLocaleString(
                          "ar-EG"
                        )}
                      </span>
                      <span className="text-[11px] font-semibold text-ink-400">
                        صفحة {ayah.page.toLocaleString("ar-EG")}
                      </span>
                    </span>

                    <div className="flex flex-wrap gap-1.5">
                      <button
                        type="button"
                        onClick={() =>
                          playAyah(
                            ayah.numberInSurah,
                            false
                          )
                        }
                        className="
                          rounded-xl
                          border
                          border-slate-100
                          bg-white
                          px-3 py-1.5
                          text-xs
                          font-bold
                          text-slate-600
                          shadow-sm
                          transition
                          hover:border-emerald-200
                          hover:text-emerald-700
                        "
                      >
                        {playingAyah === ayah.numberInSurah && isPlaying ? "⏸ جارٍ التلاوة" : "🔊 استماع"}
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          openTafsir(
                            ayah.numberInSurah
                          )
                        }
                        className="
                          rounded-xl
                          border
                          border-slate-100
                          bg-white
                          px-3 py-1.5
                          text-xs
                          font-bold
                          text-slate-600
                          shadow-sm
                          transition
                          hover:border-emerald-200
                          hover:text-emerald-700
                        "
                      >
                        📖 تفسير
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          onToggleBookmark(
                            ayah.numberInSurah,
                            ayah.page
                          )
                        }
                        aria-pressed={isBookmarked(surahNum, ayah.numberInSurah)}
                        className="
                          rounded-xl
                          border
                          border-slate-100
                          bg-white
                          px-3 py-1.5
                          text-xs
                          font-bold
                          text-slate-600
                          shadow-sm
                          transition
                          hover:border-emerald-200
                          hover:text-emerald-700
                        "
                      >
                        🔖 علامة
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          onCopy(
                            ayah.text,
                            ayah.numberInSurah
                          )
                        }
                        className="
                          rounded-xl
                          border
                          border-slate-100
                          bg-white
                          px-3 py-1.5
                          text-xs
                          font-bold
                          text-slate-600
                          shadow-sm
                          transition
                          hover:border-emerald-200
                          hover:text-emerald-700
                        "
                      >
                        ⧉ نسخ
                      </button>
                    </div>
                  </div>

                  <p
                    className={`text-ink-900 ${font}`}
                    style={{
                      fontSize:
                        `${fontSize}px`,
                      lineHeight: 2.2,
                    }}
                  >
                    {highlight &&
                    playingAyah ===
                      ayah.numberInSurah ? (
                      ayah.words.map(
                        (word, wordIndex) => (
                          <span
                            key={wordIndex}
                            onClick={() => engine.seekToWord(ayah.numberInSurah, wordIndex + 1)}
                            className="cursor-pointer"
                            style={
                              wordIndex === activeWord
                                ? {
                                    color: hlColor,
                                    background: `${hlColor}22`,
                                    borderRadius: "6px",
                                    padding: "0 2px",
                                    transition: "color .15s, background .15s",
                                  }
                                : undefined
                            }
                          >
                            {word.t}{" "}
                          </span>
                        )
                      )
                    ) : (
                      ayah.text
                    )}
                  </p>
                </div>
              )
            )}
          </div>
        )}
      </div>
        </div>{/* /book-open-inner */}
      </div>{/* /book-open */}

      {/* =====================================================
          SAJDA MODAL
      ===================================================== */}

      {sajdaOpen && (
        <div
          className="
            fixed
            inset-0
            z-[300]
            flex
            items-center
            justify-center
            bg-slate-950/40
            p-4
            backdrop-blur-sm
          "
          onClick={() =>
            setSajdaOpen(false)
          }
        >
          <div
            className="
              w-full
              max-w-md
              rounded-[28px]
              border
              border-amber-100
              bg-white
              p-5
              shadow-2xl
            "
            onClick={(e) =>
              e.stopPropagation()
            }
            dir="rtl"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-lg font-black text-slate-900">
                  موضع سجدة
                </div>

                <div className="mt-1 text-xs text-slate-500">
                  عند الوصول إلى موضع السجدة يستحب سجود التلاوة.
                </div>
              </div>

              <button
                type="button"
                onClick={() =>
                  setSajdaOpen(false)
                }
                className="
                  grid
                  h-9 w-9
                  place-items-center
                  rounded-xl
                  bg-slate-50
                  text-slate-500
                "
              >
                <IconClose />
              </button>
            </div>

            <div className="mt-4 rounded-2xl bg-amber-50 p-4 text-sm leading-8 text-amber-900">
              ۩ سجدة تلاوة
            </div>

            <button
              type="button"
              onClick={() =>
                setSajdaOpen(false)
              }
              className="
                mt-4
                w-full
                rounded-2xl
                bg-gradient-to-l
                from-emerald-600
                to-blue-600
                px-4 py-3
                text-sm
                font-black
                text-white
              "
            >
              فهمت
            </button>
          </div>
        </div>
      )}

      {/* =====================================================
          TAFSIR DIALOG FOR AYAH VIEW
      ===================================================== */}

      {view === "ayah" &&
        tafsir && (
          <div
            className="
              fixed
              inset-0
              z-[250]
              flex
              items-center
              justify-center
              bg-slate-950/40
              p-4
              backdrop-blur-sm
            "
            onClick={() =>
              setTafsirAyah(
                null
              )
            }
          >
            <div
              className="
                max-h-[85vh]
                w-full
                max-w-lg
                overflow-y-auto
                rounded-[28px]
                border
                border-slate-100
                bg-white
                p-5
                shadow-2xl
              "
              dir="rtl"
              onClick={(e) =>
                e.stopPropagation()
              }
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-lg font-black text-slate-900">
                    التفسير الميسّر
                  </div>

                  <div className="mt-1 text-xs text-slate-400">
                    الآية رقم{" "}
                    {tafsir.numberInSurah}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setTafsirAyah(
                      null
                    )
                  }
                  className="
                    grid
                    h-9 w-9
                    place-items-center
                    rounded-xl
                    bg-slate-50
                    text-slate-500
                  "
                >
                  <IconClose />
                </button>
              </div>

              <div className="mt-4 rounded-2xl bg-emerald-50/60 p-4 text-sm leading-8 text-slate-700">
                {tafsir.tafsir ||
                  "التفسير غير متوفّر لهذه الآية حالياً."}
              </div>

              <button
                type="button"
                onClick={() =>
                  playAyah(
                    tafsir.numberInSurah,
                    false
                  )
                }
                className="
                  mt-4
                  flex
                  w-full
                  items-center
                  justify-center
                  gap-2
                  rounded-2xl
                  bg-gradient-to-l
                  from-blue-600
                  to-emerald-500
                  px-4 py-3
                  text-sm
                  font-black
                  text-white
                "
              >
                <IconPlay className="h-4 w-4" />
                استماع للآية
              </button>
            </div>
          </div>
        )}

      {/* Exact-sync transport (Play/Pause/Prev/Next/Repeat/Speed/Seek/Sleep/AutoScroll).
          Owned by useAudioEngine; hidden until a source is loaded. */}
      {engine.state.status !== "idle" && (
        <AudioControls engine={engine} />
      )}

      {/* =====================================================
          FLOATING SIDE SHORTCUT — اختصار جانبي عائم
      ===================================================== */}
      {!showQuickPanel && (
        <button
          type="button"
          className="reader-fab"
          onClick={() => setShowQuickPanel(true)}
          aria-label="أدوات المصحف السريعة"
          title="أدوات المصحف"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M3.5 5.5A2.5 2.5 0 0 1 6 3h5.5v17H6a2.5 2.5 0 0 0-2.5 2z" />
            <path d="M20.5 5.5A2.5 2.5 0 0 0 18 3h-6.5v17H18a2.5 2.5 0 0 1 2.5 2z" />
          </svg>
        </button>
      )}

      {showQuickPanel && (
        <>
          <div
            className="reader-drawer-backdrop"
            onClick={() => setShowQuickPanel(false)}
            aria-hidden
          />
          <aside
            className="reader-drawer"
            role="dialog"
            aria-label="أدوات المصحف"
            dir="rtl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <div>
                <div className="font-display text-lg font-bold text-ink-900">أدوات المصحف</div>
                <div className="text-[11px] font-semibold text-ink-500">سورة {surah.meta.nameAr} · {surah.ayahs.length.toLocaleString("ar-EG")} آية</div>
              </div>
              <button
                type="button"
                onClick={() => setShowQuickPanel(false)}
                className="grid h-9 w-9 place-items-center rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200"
                aria-label="إغلاق"
              >
                <IconClose />
              </button>
            </div>

            {/* العرض */}
            <div className="rd-section">
              <div className="rd-title">نمط العرض</div>
              <div className="rd-seg">
                <button className={view === "mushaf" ? "active" : ""} onClick={() => { setView("mushaf"); setShowQuickPanel(false); }}>
                  <IconBook className="mx-auto mb-1 h-4 w-4" /> مصحف
                </button>
                <button className={view === "ayah" ? "active" : ""} onClick={() => { setView("ayah"); setShowQuickPanel(false); }}>
                  <IconList className="mx-auto mb-1 h-4 w-4" /> آية بآية
                </button>
                <button className={view === "continuous" ? "active" : ""} onClick={() => { setView("continuous"); setShowQuickPanel(false); }}>
                  <IconScroll className="mx-auto mb-1 h-4 w-4" /> متواصل
                </button>
              </div>
            </div>

            {/* الخط */}
            <div className="rd-section">
              <div className="rd-title">حجم الخط · {fontSize}px</div>
              <div className="flex items-center gap-2">
                <button type="button" className="rd-row flex-1 justify-center" onClick={() => changeSize(-2)} aria-label="تصغير">
                  <IconMinus /> تصغير
                </button>
                <button type="button" className="rd-row px-4" onClick={resetFontSize} title="إعادة الافتراضي">معايرة</button>
                <button type="button" className="rd-row flex-1 justify-center" onClick={() => changeSize(2)} aria-label="تكبير">
                  <IconPlus /> تكبير
                </button>
              </div>
            </div>

            {/* التلاوة */}
            <div className="rd-section">
              <div className="rd-title">التلاوة الصوتية</div>
              <button
                type="button"
                className={`rd-btn ${isPlaying ? "rd-btn-stop" : "rd-btn-play"}`}
                onClick={() => {
                  if (isPlaying) stopAudio();
                  else playFullSurah();
                }}
              >
                {isPlaying ? <IconStop className="h-5 w-5" /> : <IconPlay className="h-5 w-5" />}
                {isPlaying ? "إيقاف التلاوة" : "استماع للسورة كاملة"}
              </button>
              <p className="mt-2 text-center text-[11px] font-semibold text-ink-500">
                القارئ الحالي: <span className="text-emerald-700">{reciter.name}</span>
              </p>
            </div>

            {/* جلسة ذكية */}
            <div className="rd-section">
              <button
                type="button"
                className="rd-btn rd-btn-hafiz"
                onClick={() => {
                  setShowQuickPanel(false);
                  setShowHafiz((v) => !v);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M12 2a7 7 0 00-7 7c0 3 2 5 2 7h10c0-2 2-4 2-7a7 7 0 00-7-7z" /><path d="M9 21h6" />
                </svg>
                ابدأ جلسة ذكية
              </button>
            </div>

            {/* أدوات */}
            <div className="rd-section space-y-2">
              <button type="button" className="rd-row" onClick={() => openMenu("reciter")}>
                <span className="flex items-center gap-2"><IconMic className="h-4 w-4 text-emerald-700" /> القارئ والتلاوات</span>
                <IconChevron className="h-4 w-4 text-slate-400" />
              </button>
              <button type="button" className="rd-row" onClick={() => openMenu("font")}>
                <span className="flex items-center gap-2"><IconType className="h-4 w-4 text-emerald-700" /> نوع الخط</span>
                <IconChevron className="h-4 w-4 text-slate-400" />
              </button>
              <button type="button" className="rd-row" onClick={() => openMenu("appearance")}>
                <span className="flex items-center gap-2"><IconPalette className="h-4 w-4 text-emerald-700" /> المظهر والورق والتظليل</span>
                <IconChevron className="h-4 w-4 text-slate-400" />
              </button>
              <button type="button" className="rd-row" onClick={() => openMenu("font", { index: true })}>
                <span className="flex items-center gap-2"><IconBookOpen className="h-4 w-4 text-emerald-700" /> الفهرس والانتقال السريع</span>
                <IconChevron className="h-4 w-4 text-slate-400" />
              </button>
            </div>

            {/* انتقال سريع لآية */}
            <div className="rd-section">
              <div className="rd-title">انتقال إلى آية</div>
              <form
                className="flex gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  jumpToAyah(parseAyahInput(jumpAyah));
                  if (jumpAyah) setShowQuickPanel(false);
                }}
              >
                <input
                  inputMode="numeric"
                  value={jumpAyah}
                  onChange={(e) => setJumpAyah(e.target.value)}
                  placeholder={`رقم الآية (١–${surah.ayahs.length.toLocaleString("ar-EG")})`}
                  dir="rtl"
                  className="rd-jump"
                  aria-label="رقم الآية"
                />
                <button type="submit" className="rounded-xl btn-primary px-5 text-sm font-bold">اذهب</button>
              </form>
            </div>

            <div className="rd-section">
              <div className="rd-row" onClick={toggleHighlight}>
                <span className="flex items-center gap-2"><span className="grid h-4 w-4 place-items-center rounded-full text-[9px] font-black text-white" style={{ background: hlColor }}>✦</span> تظليل الكلمات أثناء التلاوة</span>
                <span className={`relative h-5 w-9 shrink-0 rounded-full transition ${highlight ? "bg-emerald-500" : "bg-slate-300"}`}>
                  <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all ${highlight ? "right-0.5" : "right-4"}`} />
                </span>
              </div>
            </div>
          </aside>
        </>
      )}

      {toast && (
        <div className="mushaf-toast" role="status" aria-live="polite">
          {toast}
        </div>
      )}
    </div>
  );
}