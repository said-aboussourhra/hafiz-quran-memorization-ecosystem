"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type MouseEvent,
  type TouchEvent,
} from "react";

import type { SurahContent } from "@/lib/quran";
import { AyahMarker } from "@/components/AyahMarker";
import { SurahHeader } from "@/components/SurahHeader";
import { OrnamentStar } from "@/components/Ornament";
import { saveLastRead } from "@/components/LastRead";

import { isSajda, SAJDA_DUA, SAJDA_DUA_SOURCE, SAJDA_AYAHS } from "@/lib/sajda";
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
  readMode, writeMode,
  type HighlightStyle,
} from "@/lib/readingPrefs";
import {
  isBookmarked,
  toggleBookmark,
  removeBookmark,
  getBookmarks,
  copyAyah,
  savePosition,
  getPosition,
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
import { SURAHS, getSurah } from "@/lib/surahs";
import { getReciter as getRegistryReciter } from "@/lib/reciterRegistry";
import { useAudioEngine } from "@/lib/audio/useAudioEngine";
import { SYNC_META } from "@/lib/audio/types";
import { useHafiz } from "@/lib/hafiz/useHafiz";
import { HafizPanel } from "@/components/hafiz/HafizPanel";
import { MushafMenu } from "@/components/MushafMenu";
import { baseSyncStatus, getTimingSource, loadTimings } from "@/lib/audio/timings";
import type { AudioSource } from "@/lib/audio/types";
import { getProgress, markVisited } from "@/lib/readingProgress";
import { shareAyahImage } from "@/lib/shareAyah";
import { getJuzForPage, getSurahForPage, getSurahStartPage } from "@/lib/mushafPages";

type ViewMode = "mushaf" | "ayah" | "continuous";

type MushafTextStyle = CSSProperties & {
  "--mushaf-font-size": string;
  "--mushaf-line-height": string;
  "--mushaf-word-spacing": string;
  "--mushaf-reading-width": string;
};

type Page = { pageNo: number; ayahs: SurahContent["ayahs"] };
type Turn = { dir: "fwd" | "back"; from: number; to: number };

const FONTS = [
  { id: "qf-kfgqpc", label: "عثماني · مصحف المدينة" },
  { id: "qf-amiri", label: "أميري قرآن" },
  { id: "qf-naskh", label: "نسخ واضح" },
  { id: "qf-markazi", label: "مركزي عصري" },
];

const PAPERS = [
  { id: "ivory", label: "عاجي", preview: "#fffdf5" },
  { id: "white", label: "أبيض", preview: "#ffffff" },
  { id: "green", label: "أخضر هادئ", preview: "#f0fdf7" },
  { id: "blue", label: "أزرق هادئ", preview: "#f1f8ff" },
  { id: "night", label: "ليلي", preview: "#17211f" },
];

const HIGHLIGHT_COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#8b5cf6", "#ef4444"];
const SLEEP_OPTIONS: (number | null)[] = [null, 10, 20, 30];

function toDigits(n: number): string {
  return String(n);
}

/** Strip diacritics + unify letter forms so search matches regardless of spelling. */
function normalizeArabic(s: string): string {
  return s
    .replace(/[\u064B-\u0652\u0670\u06D6-\u06ED\u0640]/g, "")
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/\s+/g, " ")
    .trim();
}

/** Per-surah availability of a reciter for the current surah. */
function reciterAvailability(r: Reciter, surahNum: number): "ayah" | "surah" | "none" {
  if (hasPerAyah(r)) return "ayah";
  if (r.surahBase && (!r.surahList || r.surahList.includes(surahNum))) return "surah";
  return "none";
}

function prefersReducedMotion(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** Parse Western or Eastern-Arabic digits from user input. */
function parseDigits(raw: string): number {
  const map: Record<string, string> = { "٠": "0", "١": "1", "٢": "2", "٣": "3", "٤": "4", "٥": "5", "٦": "6", "٧": "7", "٨": "8", "٩": "9" };
  const normalized = raw.replace(/[٠-٩]/g, (d) => map[d] ?? d).replace(/[^\d]/g, "");
  return Number(normalized);
}

/* =========================================================
   SMALL UI PRIMITIVES
========================================================= */

function SettingStepper({
  label, value, onDec, onInc, onReset, decLabel, incLabel,
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
      <button type="button" onClick={onReset} className="text-[11px] font-semibold text-slate-600 hover:text-emerald-700" title="إعادة الافتراضي">
        {label}
      </button>
      <div className="flex items-center gap-1">
        <button type="button" onClick={onInc} aria-label={incLabel} className="grid h-7 w-7 place-items-center rounded-lg bg-white text-slate-700 shadow-sm hover:bg-emerald-50 hover:text-emerald-700">+</button>
        <span className="min-w-[52px] text-center text-[11px] font-bold text-slate-700" dir="ltr">{value}</span>
        <button type="button" onClick={onDec} aria-label={decLabel} className="grid h-7 w-7 place-items-center rounded-lg bg-white text-slate-700 shadow-sm hover:bg-emerald-50 hover:text-emerald-700">−</button>
      </div>
    </div>
  );
}

function ProgressRing({ pct, size = 40 }: { pct: number; size?: number }) {
  const r = 16, c = 2 * Math.PI * r;
  const off = c - (Math.min(100, Math.max(0, pct)) / 100) * c;
  return (
    <span className="relative grid shrink-0 place-items-center" style={{ width: size, height: size }} title={`تقدّم القراءة ${pct}٪`}>
      <svg viewBox="0 0 40 40" className="absolute inset-0 h-full w-full -rotate-90" aria-hidden>
        <circle cx="20" cy="20" r={r} fill="none" stroke="rgba(16,185,129,0.15)" strokeWidth="3.5" />
        {pct > 0 && <circle cx="20" cy="20" r={r} fill="none" stroke="#059669" strokeWidth="3.5" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={off} />}
      </svg>
      <span className="text-[10px] font-black text-emerald-700">{pct}٪</span>
    </span>
  );
}

/* =========================================================
   ICONS
========================================================= */

function IconBook({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21.5z" />
      <path d="M4 5.5v16" />
      <path d="M8 7h8M8 11h7" />
    </svg>
  );
}
function IconList({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M8 6h12M8 12h12M8 18h12" />
      <circle cx="4" cy="6" r="1" /><circle cx="4" cy="12" r="1" /><circle cx="4" cy="18" r="1" />
    </svg>
  );
}
function IconScroll({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="6" y="3" width="12" height="18" rx="2" />
      <path d="M10 7h4M10 11h4M10 15h2.5" />
    </svg>
  );
}
function IconBookmark({ className = "h-5 w-5", filled = false }: { className?: string; filled?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6 3h12v18l-6-4-6 4z" />
    </svg>
  );
}
function IconCopy({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="9" y="9" width="11" height="11" rx="2" />
      <path d="M5 15V5a2 2 0 0 1 2-2h10" />
    </svg>
  );
}
function IconMinus({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M5 12h14" /></svg>
  );
}
function IconPlus({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>
  );
}
function IconPalette({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 3a9 9 0 0 0 0 18h1.2a1.8 1.8 0 0 0 1.2-3.1 1.8 1.8 0 0 1 1.2-3.1H18a3 3 0 0 0 3-3A8.8 8.8 0 0 0 12 3Z" />
      <circle cx="7.5" cy="10" r="1" /><circle cx="10" cy="6.8" r="1" /><circle cx="14" cy="6.5" r="1" /><circle cx="17" cy="9" r="1" />
    </svg>
  );
}
function IconType({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 5h14M12 5v14M8 19h8" />
    </svg>
  );
}
function IconMic({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="9" y="3" width="6" height="11" rx="3" />
      <path d="M5 11a7 7 0 0 0 14 0M12 18v3M9 21h6" />
    </svg>
  );
}
function IconPlay({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M8 5.2v13.6a1 1 0 0 0 1.52.85l10.2-6.8a1 1 0 0 0 0-1.66L9.52 4.35A1 1 0 0 0 8 5.2Z" />
    </svg>
  );
}
function IconPause({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <rect x="6" y="5" width="4" height="14" rx="1.4" /><rect x="14" y="5" width="4" height="14" rx="1.4" />
    </svg>
  );
}
function IconStop({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true"><rect x="6" y="6" width="12" height="12" rx="2" /></svg>
  );
}
function IconChevron({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg>
  );
}
function IconClose({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" /></svg>
  );
}
function IconBookOpen({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3.5 5.5A2.5 2.5 0 0 1 6 3h5.5v17H6a2.5 2.5 0 0 0-2.5 2z" />
      <path d="M20.5 5.5A2.5 2.5 0 0 0 18 3h-6.5v17H18a2.5 2.5 0 0 1 2.5 2z" />
    </svg>
  );
}
function IconShare({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="6" cy="12" r="2.6" /><circle cx="18" cy="5.5" r="2.6" /><circle cx="18" cy="18.5" r="2.6" />
      <path d="m8.3 10.8 7.4-4M8.3 13.2l7.4 4" />
    </svg>
  );
}
function IconSearch({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="11" cy="11" r="7" /><path d="m20 20-3.8-3.8" />
    </svg>
  );
}
function IconEye({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}
function IconExpand({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />
    </svg>
  );
}
function IconRepeat({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M17 2.5 20.5 6 17 9.5" /><path d="M3 11.5v-1a3 3 0 0 1 3-3h14.5" />
      <path d="M7 21.5 3.5 18 7 14.5" /><path d="M21 12.5v1a3 3 0 0 1-3 3H3.5" />
    </svg>
  );
}
function IconTimer({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="13.5" r="7.5" /><path d="M12 9.5v4l2.6 2M9.5 2.5h5" />
    </svg>
  );
}
function IconChevL({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m14 6-6 6 6 6" /></svg>
  );
}
function IconChevR({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m10 6 6 6-6 6" /></svg>
  );
}
function IconSparkle({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3Z" />
      <path d="M19 15.5l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8.8-2.2Z" />
    </svg>
  );
}

/* =========================================================
   ROYAL MUSHAF READER — القارئ الملكي
   Two-page spread book · 3D leaf turns · floating player ·
   hifz mode · focus mode · in-surah search · bookmarks ·
   share-as-image · resume reading · swipe + keyboard
========================================================= */

export function MushafReader({
  surah,
  initialAyah,
  initialPage,
}: {
  surah: SurahContent;
  initialAyah?: number;
  initialPage?: number;
}) {
  const router = useRouter();
  const surahNum = surah.meta.number;

  /* ---------- appearance prefs ---------- */
  const [fontSize, setFontSize] = useState(() => readFontSize());
  const [lineHeight, setLineHeight] = useState(() => readLineHeight());
  const [wordSpacing, setWordSpacing] = useState(() => readWordSpacing());
  const [readingWidth, setReadingWidth] = useState(() => readReadingWidth());
  const [font, setFont] = useState(() =>
    FONTS.some((f) => f.id === readString("hafiz_font", "qf-kfgqpc"))
      ? readString("hafiz_font", "qf-kfgqpc")
      : "qf-kfgqpc",
  );
  const [paper, setPaper] = useState(() =>
    PAPERS.some((p) => p.id === readString("hafiz_paper", "ivory"))
      ? readString("hafiz_paper", "ivory")
      : "ivory",
  );
  const [hlStyle, setHlStyle] = useState<HighlightStyle>(() => readHighlightStyle());
  const [highlight, setHighlight] = useState(() => readBool("hafiz_highlight", true));
  const [hlColor, setHlColor] = useState(() => readString("hafiz_hlcolor", "#10b981"));
  const [reciter, setReciter] = useState<Reciter>(
    () => RECITERS.find((r) => r.id === readString("hafiz_reciter", "")) ?? DEFAULT_RECITER,
  );

  /* ---------- view & selection ---------- */
  const [view, setView] = useState<ViewMode>(() => {
    const m = readMode();
    return m === "page" ? "mushaf" : m;
  });
  const [printMode, setPrintMode] = useState(() => readBool("hafiz_print_mushaf", true));
  const initialPrintedPage = Number.isInteger(initialPage) && initialPage! >= 1 && initialPage! <= 604
    ? initialPage!
    : getSurahStartPage(surah.meta.number);
  const [printPage, setPrintPage] = useState(initialPrintedPage);
  const [printPageDraft, setPrintPageDraft] = useState(String(initialPrintedPage));
  const [selected, setSelected] = useState<number | null>(null);
  const [tafsirAyah, setTafsirAyah] = useState<number | null>(null);
  const [sajdaOpen, setSajdaOpen] = useState(false);

  /* ---------- menus & panels ---------- */
  const [showFonts, setShowFonts] = useState(false);
  const [showReciters, setShowReciters] = useState(false);
  const [showAppearance, setShowAppearance] = useState(false);
  const [showNav, setShowNav] = useState(false);
  const [showBookmarks, setShowBookmarks] = useState(false);
  const [showHafiz, setShowHafiz] = useState(false);
  const [showQuickPanel, setShowQuickPanel] = useState(false);
  const [jumpAyah, setJumpAyah] = useState("");
  const [indexQuery, setIndexQuery] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [fallbackNotice, setFallbackNotice] = useState<string | null>(null);

  /* ---------- book (two-page spread) ---------- */
  const pages = useMemo(() => {
    const map = new Map<number, typeof surah.ayahs>();
    for (const a of surah.ayahs) {
      const arr = map.get(a.page) ?? [];
      arr.push(a);
      map.set(a.page, arr);
    }
    return [...map.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([pageNo, ayahs]) => ({ pageNo, ayahs }));
  }, [surah]);

  const [spread, setSpread] = useState(0);
  const [turn, setTurn] = useState<Turn | null>(null);
  const spreadRef = useRef(0);
  const turnRef = useRef<Turn | null>(null);
  const spreadCount = pages.length;
  const rightPage = pages[spread] ?? pages[0];
  const leftPage = pages[spread + 1];
  // The printed Madinah leaves are paired odd-right / even-left, just like
  // the physical book. On narrow screens CSS hides the facing leaf.
  const printedRight = printPage % 2 === 0 ? printPage - 1 : printPage;
  const printedLeft = printedRight < 604 ? printedRight + 1 : null;
  const printedSurah = getSurahForPage(printPage);

  /* ---------- hifz & focus modes ---------- */
  const [hifzMode, setHifzMode] = useState(() => readBool("hafiz_hifz", false));
  const [revealedWords, setRevealedWords] = useState<Set<string>>(new Set());
  const [revealedAyahs, setRevealedAyahs] = useState<Set<number>>(new Set());
  const [focusMode, setFocusMode] = useState(false);

  /* ---------- misc ---------- */
  const [bookmarkVersion, setBookmarkVersion] = useState(0);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<number | null>(null);
  const [progress, setProgress] = useState(0);
  const [readPct, setReadPct] = useState(0);
  const [resume, setResume] = useState<{ ayah: number } | null>(null);
  const [playerOpen, setPlayerOpen] = useState(false);

  const pageRef = useRef<HTMLDivElement | null>(null);
  const bookWrapRef = useRef<HTMLDivElement | null>(null);
  const ayahRefs = useRef<Map<number, HTMLSpanElement>>(new Map());
  const leafContentRef = useRef<Map<string, HTMLDivElement>>(new Map());
  const touchX = useRef<number | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 2400);
  };

  const refreshProgress = useCallback(() => {
    setReadPct(getProgress(surahNum, surah.ayahs.length).pct);
  }, [surahNum, surah.ayahs.length]);

  /* =========================================================
     AUDIO ENGINE (exact per-recording sync — unchanged core)
  ========================================================= */
  const engine = useAudioEngine();
  const hafiz = useHafiz();

  const playingAyah = engine.state.currentAyah;
  const activeWord = engine.state.currentWord != null ? engine.state.currentWord - 1 : -1;
  const isPlaying = engine.state.status === "playing" || engine.state.status === "loading";

  const buildSource = useCallback(async (): Promise<AudioSource> => {
    const supportsPerAyah = hasPerAyah(reciter);
    const expectedWordCounts = new Map(surah.ayahs.map((ayah) => [ayah.numberInSurah, ayah.words.length]));
    const timingSource = getTimingSource(reciter.id);
    const loadedFullSurah = timingSource
      ? await loadTimings(reciter.id, surahNum, expectedWordCounts)
      : null;
    // Keep any source-matched timed words even when coverage is partial;
    // untimed spans stay unlit instead of being guessed from a different file.
    // Use the source-matched map even when some ayahs are untimed; timed
    // words remain accurate, while gaps are left unlit rather than guessed.
    const timedFullSurah = loadedFullSurah;

    let usingFallback = false;
    let reciterForAudio: Reciter = reciter;
    if (!timedFullSurah && !supportsPerAyah) {
      const avail = reciterAvailability(reciter, surahNum);
      if (avail !== "surah") {
        reciterForAudio = perAyahFallback();
        usingFallback = true;
      }
    }
    const effectivePerAyah = !timedFullSurah && (supportsPerAyah || usingFallback);
    const granularity: "ayah" | "surah" = timedFullSurah ? "surah" : effectivePerAyah ? "ayah" : "surah";
    const syncStatus = timedFullSurah?.status ?? baseSyncStatus(reciterForAudio.id, surahNum, granularity);
    if (usingFallback) {
      setFallbackNotice(`تلاوة سورة ${surah.meta.nameAr} غير متوفرة بصوت ${reciter.name} — تُستمع بصوت ${reciterForAudio.name} مع تظليل الكلمات`);
    } else if (timedFullSurah && !timedFullSurah.complete) {
      setFallbackNotice("توقيت الكلمات جزئي لهذا التسجيل؛ الكلمات التي لا تملك توقيتاً ستبقى بلا تظليل.");
    } else if (!timedFullSurah && supportsPerAyah) {
      setFallbackNotice("لا يتوفر توقيت لهذا التسجيل؛ تظليل الكلمات تقديري وقد لا يطابق النطق لحظةً بلحظة.");
    } else if (!timedFullSurah) {
      setFallbackNotice("لا تتوفر مزامنة كلمات كاملة لهذا التسجيل؛ يبقى الصوت متاحاً دون تظليل مضلل.");
    } else {
      setFallbackNotice(null);
    }

    const timings = timedFullSurah?.timings ?? null;
    const getUrl = (ayah: number) => {
      if (granularity === "ayah") {
        const a = surah.ayahs.find((x) => x.numberInSurah === ayah);
        if (!a) return null;
        return ayahUrl(reciterForAudio, surahNum, a.numberInSurah, a.globalNumber);
      }
      return timedFullSurah?.audioUrl ?? surahUrl(reciterForAudio, surahNum);
    };

    return {
      reciterId: timedFullSurah ? reciter.id : reciterForAudio.id,
      surahId: surahNum,
      getUrl,
      granularity,
      timings,
      syncStatus,
      getWordWeights: (ayah: number) => {
        const a = surah.ayahs.find((x) => x.numberInSurah === ayah);
        if (!a || a.words.length === 0) return null;
        return a.words.map((w) => {
          const bare = w.t.replace(/[\u064B-\u0652\u0670\u06D6-\u06ED\u0640]/g, "");
          return Math.pow(Math.max(2, bare.length), 0.7);
        });
      },
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reciter.id, surahNum]);

  const playAyah = (n: number, chain: boolean) => {
    void chain;
    setPlayerOpen(true);
    void (async () => {
      const source = await buildSource();
      await engine.loadSource(source, n, { autoPlay: true });
    })();
  };

  const playFullSurah = () => {
    setPlayerOpen(true);
    void (async () => {
      const source = await buildSource();
      await engine.loadSource(source, 1, { autoPlay: true });
    })();
  };

  const stopAudio = () => {
    engine.stopRepeat();
    void engine.pause();
  };

  const togglePlay = () => {
    if (engine.state.status === "idle") playFullSurah();
    else engine.toggle();
  };

  /* =========================================================
     BOOK NAVIGATION — spread + 3D leaf turns
  ========================================================= */
  const spreadOfAyah = useCallback(
    (n: number) => {
      const ayah = surah.ayahs.find((a) => a.numberInSurah === n);
      if (!ayah) return 0;
      const idx = pages.findIndex((p) => p.pageNo === ayah.page);
      return idx < 0 ? 0 : idx;
    },
    [pages, surah.ayahs],
  );

  const turnTo = useCallback(
    (target: number) => {
      const from = spreadRef.current;
      const clamped = Math.max(0, Math.min(spreadCount - 1, target));
      if (turnRef.current || clamped === from) return;
      const t: Turn = { dir: clamped > from ? "fwd" : "back", from, to: clamped };
      turnRef.current = t;
      setTurn(t);
      setTafsirAyah(null);
    },
    [spreadCount],
  );

  const nextSpread = useCallback(() => turnTo(spreadRef.current + 1), [turnTo]);
  const prevSpread = useCallback(() => turnTo(spreadRef.current - 1), [turnTo]);

  function goToPrintedPage(rawPage: number) {
    const page = Math.max(1, Math.min(604, Math.round(rawPage)));
    setPrintPage(page);
    setPrintPageDraft(String(page));
    try { localStorage.setItem("hafiz_print_page", String(page)); } catch { /* private browsing */ }
    const targetSurah = getSurahForPage(page);
    if (targetSurah) savePosition({ surah: targetSurah.number, ayah: 1, page });
    if (targetSurah && targetSurah.number !== surahNum) {
      router.replace(`/mushaf/${targetSurah.number}?page=${page}`, { scroll: false });
    } else {
      router.replace(`/mushaf/${surahNum}?page=${page}`, { scroll: false });
    }
  }

  function turnPrintedPage(direction: -1 | 1) {
    const isNarrow = typeof window !== "undefined" && window.matchMedia("(max-width: 1023px)").matches;
    goToPrintedPage(printPage + direction * (isNarrow ? 1 : 2));
  }

  const commitTurn = useCallback(() => {
    const t = turnRef.current;
    if (!t) return;
    spreadRef.current = t.to;
    setSpread(t.to);
    turnRef.current = null;
    setTurn(null);
  }, []);

  const jumpToSpread = useCallback(
    (target: number) => {
      const clamped = Math.max(0, Math.min(spreadCount - 1, target));
      turnRef.current = null;
      setTurn(null);
      spreadRef.current = clamped;
      setSpread(clamped);
    },
    [spreadCount],
  );

  /* ---------- resume / deep-link to an ayah (client-only read) ---------- */
  useEffect(() => {
    if (initialAyah && initialAyah >= 1 && initialAyah <= surah.ayahs.length) {
      const id = window.setTimeout(() => jumpToAyah(initialAyah), 120);
      return () => window.clearTimeout(id);
    }
    const pos = getPosition();
    if (pos && pos.surah === surahNum && pos.ayah > 1 && pos.ayah <= surah.ayahs.length) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setResume({ ayah: pos.ayah });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [surahNum]);

  /* ---------- engine → UI sync ---------- */
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

  // Recitation automatically turns the leaf to the ayah being recited.
  useEffect(() => {
    if (view !== "mushaf" || playingAyah == null) return;
    const target = spreadOfAyah(playingAyah);
    if (target !== spreadRef.current) {
      const id = window.requestAnimationFrame(() => turnTo(target));
      return () => window.cancelAnimationFrame(id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playingAyah, view]);

  // Auto-fit leaf fonts so Madani page content never overflows the leaf.
  useEffect(() => {
    if (view !== "mushaf") return;
    const fit = () => {
      for (const el of leafContentRef.current.values()) {
        const leaf = el.closest<HTMLElement>(".spread-leaf");
        if (!leaf) continue;
        let px = Math.round(fontSize * 0.95);
        const minPx = 20;
        const maxH = leaf.clientHeight - 24;
        const maxW = leaf.clientWidth - 24;
        el.style.fontSize = `${px}px`;
        while (px > minPx && (el.scrollHeight > maxH || el.scrollWidth > maxW)) {
          px -= 1;
          el.style.fontSize = `${px}px`;
        }
      }
    };
    const id = window.setTimeout(fit, 90);
    return () => window.clearTimeout(id);
  }, [view, spread, turn, fontSize, paper, font, hifzMode]);

  // Reload source when reciter/surah changes while something is loaded.
  useEffect(() => {
    if (engine.state.status === "idle") return;
    void (async () => {
      const source = await buildSource();
      await engine.loadSource(source, engine.state.currentAyah ?? 1, { autoPlay: engine.state.status === "playing" });
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reciter.id, surahNum]);

  /* ---------- persistence ---------- */
  useEffect(() => {
    saveLastRead(surah.meta.number, surah.meta.nameAr);
  }, [surah.meta.number, surah.meta.nameAr]);

  useEffect(() => {
    if (view === "mushaf" && printMode) {
      const pageSurah = getSurahForPage(printPage);
      savePosition({ surah: pageSurah?.number ?? surahNum, ayah: 1, page: printPage });
      return;
    }
    const ayah = playingAyah ?? selected ?? 1;
    const ref = surah.ayahs.find((a) => a.numberInSurah === ayah);
    savePosition({ surah: surahNum, ayah, page: ref?.page });
    markVisited(surahNum, ayah);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refreshProgress();
  }, [playingAyah, selected, surahNum, surah.ayahs, refreshProgress, view, printMode, printPage]);

  // Mark the first ayah of each newly opened leaf as visited.
  useEffect(() => {
    const first = rightPage?.ayahs[0]?.numberInSurah;
    if (first) {
      markVisited(surahNum, first);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      refreshProgress();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spread, surahNum]);

  /* ---------- page scroll progress ---------- */
  useEffect(() => {
    const onScroll = () => {
      const element = pageRef.current;
      if (!element) return;
      const rect = element.getBoundingClientRect();
      const total = element.offsetHeight - window.innerHeight;
      const scrolled = Math.min(Math.max(-rect.top, 0), Math.max(total, 1));
      setProgress(total > 0 ? Math.round((scrolled / total) * 100) : 0);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, [view, fontSize, paper]);

  /* ---------- keyboard shortcuts ---------- */
  useEffect(() => {
    const onKey = (e: globalThis.KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const typing = target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target?.isContentEditable;
      if (e.key === "Escape") {
        setSelected(null);
        setTafsirAyah(null);
        setShowFonts(false);
        setShowReciters(false);
        setShowAppearance(false);
        setShowNav(false);
        setShowBookmarks(false);
        setShowQuickPanel(false);
        setFocusMode(false);
        return;
      }
      if (typing) return;
      if (e.key === "ArrowLeft" && view === "mushaf") printMode ? turnPrintedPage(1) : nextSpread();
      else if (e.key === "ArrowRight" && view === "mushaf") printMode ? turnPrintedPage(-1) : prevSpread();
      else if (e.key === " ") {
        e.preventDefault();
        togglePlay();
      } else if (e.key === "f" || e.key === "F") setFocusMode((v) => !v);
      else if (e.key === "h" || e.key === "H") toggleHifz();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, engine.state.status]);

  /* =========================================================
     ACTIONS
  ========================================================= */
  const changeView = (v: ViewMode) => {
    setView(v);
    writeMode(v === "mushaf" ? "page" : v);
    setShowQuickPanel(false);
  };

  const chooseFont = (id: string) => {
    setFont(id);
    setShowFonts(false);
    try { localStorage.setItem("hafiz_font", id); } catch { /* ignore */ }
  };

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

  const chooseReciter = (nextReciter: Reciter) => {
    setReciter(nextReciter);
    setShowReciters(false);
    stopAudio();
    try { localStorage.setItem("hafiz_reciter", nextReciter.id); } catch { /* ignore */ }
  };

  const choosePaper = (value: string) => {
    setPaper(value);
    try { localStorage.setItem("hafiz_paper", value); } catch { /* ignore */ }
  };

  const toggleHighlight = () => {
    setHighlight((current) => {
      const next = !current;
      try { localStorage.setItem("hafiz_highlight", next ? "1" : "0"); } catch { /* ignore */ }
      return next;
    });
  };

  const chooseHighlightColor = (color: string) => {
    setHlColor(color);
    try { localStorage.setItem("hafiz_hlcolor", color); } catch { /* ignore */ }
  };

  const toggleHifz = () => {
    setHifzMode((v) => {
      const next = !v;
      try { localStorage.setItem("hafiz_hifz", next ? "1" : "0"); } catch { /* ignore */ }
      if (next) showToast("وضع الحفظ مفعّل — اضغط أي كلمة لكشفها");
      return next;
    });
  };

  const revealWord = (key: string) => {
    setRevealedWords((prev) => {
      const next = new Set(prev);
      next.add(key);
      return next;
    });
  };

  const revealAyah = (n: number) => {
    setRevealedAyahs((prev) => {
      const next = new Set(prev);
      next.add(n);
      return next;
    });
  };

  const revealAllWords = (ayah: SurahContent["ayahs"][number]) => {
    setRevealedWords((prev) => {
      const next = new Set(prev);
      ayah.words.forEach((_, wi) => next.add(`${ayah.numberInSurah}:${wi}`));
      return next;
    });
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

  const onShare = async (ayah: SurahContent["ayahs"][number]) => {
    try {
      const how = await shareAyahImage({
        text: ayah.text,
        surahNameAr: surah.meta.nameAr,
        ayahNumber: ayah.numberInSurah,
      });
      showToast(how === "shared" ? "تم فتح المشاركة" : "تم تنزيل صورة الآية");
    } catch {
      showToast("تعذّر إنشاء الصورة");
    }
  };

  function jumpToAyah(n: number) {
    if (!Number.isInteger(n) || n < 1 || n > surah.ayahs.length) {
      showToast(`الآيات من ١ إلى ${surah.ayahs.length.toLocaleString("ar-EG")}`);
      return;
    }
    setShowNav(false);
    setShowQuickPanel(false);
    setTafsirAyah(null);
    setSelected(n);
    setResume(null);
    const targetAyah = surah.ayahs.find((a) => a.numberInSurah === n);
    const targetPage = targetAyah && targetAyah.page >= 1 && targetAyah.page <= 604
      ? targetAyah.page
      : getSurahStartPage(surahNum);
    setPrintPage(targetPage);
    setPrintPageDraft(String(targetPage));
    markVisited(surahNum, n);
    refreshProgress();
    if (view === "mushaf") {
      jumpToSpread(spreadOfAyah(n));
      window.setTimeout(() => {
        bookWrapRef.current?.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth", block: "center" });
      }, 80);
      return;
    }
    window.setTimeout(() => {
      const el = ayahRefs.current.get(n);
      el?.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth", block: "center" });
      el?.focus?.({ preventScroll: true });
    }, 60);
  };

  const onAyahClick = (event: MouseEvent, n: number) => {
    event?.stopPropagation?.();
    setTafsirAyah(null);
    setSelected((current) => (current === n ? null : n));
  };

  const onAyahKeyDown = (event: KeyboardEvent, n: number) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onAyahClick(event as unknown as MouseEvent, n);
    }
  };

  const openTafsirInline = (ayah: number) => setTafsirAyah(ayah);
  const openTafsir = (ayah: number) => {
    setSelected(null);
    setTafsirAyah(ayah);
  };

  const closeMenus = () => {
    setSelected(null);
    setShowReciters(false);
    setShowFonts(false);
    setShowAppearance(false);
    setShowNav(false);
    setShowBookmarks(false);
    setTafsirAyah(null);
  };

  const openMenu = (menu: "font" | "reciter" | "appearance" | "nav" | "bookmarks") => {
    setShowQuickPanel(false);
    setShowNav(menu === "nav");
    setShowBookmarks(menu === "bookmarks");
    setShowAppearance(menu === "appearance");
    setShowFonts(menu === "font");
    setShowReciters(menu === "reciter");
  };

  /* ---------- swipe on the book ---------- */
  const onTouchStart = (e: TouchEvent) => {
    touchX.current = e.touches[0]?.clientX ?? null;
  };
  const onTouchEnd = (e: TouchEvent) => {
    if (touchX.current == null || view !== "mushaf") return;
    const dx = (e.changedTouches[0]?.clientX ?? touchX.current) - touchX.current;
    touchX.current = null;
    if (dx < -55) printMode ? turnPrintedPage(1) : nextSpread();
    else if (dx > 55) printMode ? turnPrintedPage(-1) : prevSpread();
  };

  /* ---------- player bar helpers ---------- */
  const playerPct = (() => {
    if (engine.state.sourceGranularity === "surah" && engine.state.duration > 0) {
      return Math.round((engine.state.currentTime / engine.state.duration) * 100);
    }
    if (engine.state.currentAyah != null) {
      return Math.round(((engine.state.currentAyah - 1) / Math.max(1, surah.ayahs.length)) * 100);
    }
    return 0;
  })();

  const onSeekClick = (e: MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const frac = 1 - (e.clientX - rect.left) / rect.width; // RTL fill starts at right
    const clamped = Math.max(0, Math.min(1, frac));
    if (engine.state.sourceGranularity === "surah" && engine.state.duration > 0) {
      engine.seek(clamped * engine.state.duration);
    } else {
      engine.seekToAyah(Math.max(1, Math.round(clamped * surah.ayahs.length)));
    }
  };

  const cycleSpeed = () => {
    const speeds = engine.speeds as unknown as number[];
    const idx = speeds.indexOf(engine.state.playbackRate);
    const next = speeds[(idx + 1) % speeds.length] ?? 1;
    engine.setRate(next as 0.5 | 0.75 | 1 | 1.25);
  };

  const cycleSleep = () => {
    const cur = engine.state.sleepTimerMinutes;
    const idx = SLEEP_OPTIONS.indexOf(cur);
    const next = SLEEP_OPTIONS[(idx + 1) % SLEEP_OPTIONS.length];
    engine.setSleepTimer(next);
    showToast(next ? `مؤقت النوم: ${next} دقائق` : "أُلغي مؤقت النوم");
  };

  /* =========================================================
     RENDER HELPERS
  ========================================================= */

  const renderBookAyah = (ayah: SurahContent["ayahs"][number]) => {
    const playing = playingAyah === ayah.numberInSurah;
    const isSajdaHere = isSajda(surah.meta.number, ayah.numberInSurah);
    const showHifz = hifzMode && !playing;
    return (
      <span key={ayah.numberInSurah}>
        <span
          role="button"
          tabIndex={0}
          onClick={(event) => onAyahClick(event, ayah.numberInSurah)}
          onKeyDown={(event) => onAyahKeyDown(event, ayah.numberInSurah)}
          className={`cursor-pointer rounded-md transition ${
            playing
              ? `ayah-playing ayah-${hlStyle}`
              : selected === ayah.numberInSurah
                ? "bg-[rgba(59,130,246,0.12)]"
                : "hover:bg-[rgba(16,185,129,0.10)]"
          }`}
        >
          {highlight && playing
            ? ayah.words.map((word, wi) => (
                <span
                  key={wi}
                  onClick={(event) => {
                    event.stopPropagation();
                    engine.seekToWord(ayah.numberInSurah, wi + 1);
                  }}
                  className={`quran-word cursor-pointer ${wi === activeWord ? "quran-word-active" : ""}`}
                  style={wi === activeWord ? ({ "--word-active": hlColor } as CSSProperties) : undefined}
                  aria-current={wi === activeWord ? "true" : undefined}
                >
                  {word.t}{" "}
                </span>
              ))
            : showHifz
              ? ayah.words.map((word, wi) => {
                  const key = `${ayah.numberInSurah}:${wi}`;
                  const revealed = revealedWords.has(key);
                  return (
                    <span
                      key={wi}
                      onClick={(event) => {
                        event.stopPropagation();
                        revealWord(key);
                      }}
                      className={`hifz-word ${revealed ? "is-revealed" : ""}`}
                      title={revealed ? undefined : "اضغط للكشف"}
                    >
                      {word.t}{" "}
                    </span>
                  );
                })
              : ayah.text}
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
            <AyahMarker n={ayah.numberInSurah} active={playing} />
          </span>
        </span>

        {isSajdaHere && (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              setSajdaOpen(true);
            }}
            title="موضع سجدة"
            className="mx-1 inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 align-middle text-[11px] font-bold text-amber-700"
          >
            ۩ سجدة
          </button>
        )}

        {selected === ayah.numberInSurah && (
          <span className="ayah-inline-actions" contentEditable={false} onClick={(event) => event.stopPropagation()}>
            <button type="button" onClick={() => openTafsirInline(ayah.numberInSurah)} className="ayah-chip ayah-chip-tafsir">📖 التفسير</button>
            <button type="button" onClick={() => { playAyah(ayah.numberInSurah, false); setSelected(null); }} className="ayah-chip ayah-chip-listen">🔊 استماع</button>
            <button type="button" onClick={() => onToggleBookmark(ayah.numberInSurah, ayah.page)} className="ayah-chip ayah-chip-bookmark" title="علامة مرجعية">🔖 علامة</button>
            <button type="button" onClick={() => onCopy(ayah.text, ayah.numberInSurah)} className="ayah-chip ayah-chip-copy" title="نسخ الآية">⧉ نسخ</button>
            <button type="button" onClick={() => onShare(ayah)} className="ayah-chip ayah-chip-share" title="مشاركة كصورة">🖼 مشاركة</button>
            {hifzMode && (
              <button type="button" onClick={() => revealAllWords(ayah)} className="ayah-chip ayah-chip-reveal" title="إظهار كلمات الآية">👁 إظهار</button>
            )}
            <button type="button" onClick={() => setSelected(null)} className="ayah-chip ayah-chip-close">✕</button>
          </span>
        )}

        {tafsirAyah === ayah.numberInSurah && (
          <span className="ayah-tafsir-inline" contentEditable={false} onClick={(event) => event.stopPropagation()}>
            <span className="ayah-tafsir-head">
              <span className="ayah-tafsir-badge">{toDigits(ayah.numberInSurah)}</span>
              <span className="font-display text-sm font-bold text-ink-900">التفسير الميسّر</span>
              <button type="button" onClick={() => { setTafsirAyah(null); setSelected(null); }} className="ayah-tafsir-close">✕</button>
            </span>
            <span className="ayah-tafsir-body">{ayah.tafsir || "التفسير غير متوفّر لهذه الآية حالياً."}</span>
            <button type="button" onClick={() => playAyah(ayah.numberInSurah, false)} className="mt-2 rounded-lg btn-primary px-4 py-2 text-xs font-semibold">🔊 استماع للآية</button>
          </span>
        )}
        {" "}
      </span>
    );
  };

  const registerLeaf = (key: string) => (el: HTMLDivElement | null) => {
    if (el) leafContentRef.current.set(key, el);
    else leafContentRef.current.delete(key);
  };

  const renderLeaf = (page: Page | undefined, side: "right" | "left", keyPrefix: string) => {
    if (!page) {
      const nextSurah = surahNum < 114 ? getSurah(surahNum + 1) : null;
      return (
        <article className="spread-leaf endpaper" key={keyPrefix}>
          <span className="leaf-frame" aria-hidden />
          <div className="endpaper-inner">
            <OrnamentStar className="mx-auto h-14 w-14 text-amber-500" />
            <div className="mt-4 font-display text-2xl font-bold text-emerald-900">تمّت السورة</div>
            <div className="mt-1 text-sm text-ink-500">سورة {surah.meta.nameAr} · {surah.ayahs.length.toLocaleString("ar-EG")} آية</div>
            {nextSurah && (
              <Link href={`/mushaf/${nextSurah.number}`} className="book-nav-btn mt-6">
                السورة التالية: {nextSurah.nameAr} <IconChevL className="h-4 w-4" />
              </Link>
            )}
            <Link href="/mushaf" className="book-nav-btn ghost mt-3">عودة إلى الفهرس</Link>
          </div>
        </article>
      );
    }
    const isFirst = page.pageNo === pages[0]?.pageNo;
    return (
      <article className={`spread-leaf ${side}`} key={keyPrefix}>
        <span className="leaf-frame" aria-hidden />
        {isFirst && (
          <div className="relative z-10 mb-3">
            <SurahHeader nameAr={surah.meta.nameAr} revelation={surah.meta.revelation} ayahCount={surah.meta.ayahCount} juz={surah.meta.juz} />
          </div>
        )}
        {isFirst && surah.basmala && (
          <div className="relative z-10 mb-4 text-center">
            <div
              className="text-xl sm:text-2xl md:text-[1.9rem]"
              style={{
                fontFamily: "var(--font-quran)",
                background: "linear-gradient(120deg,#047857,#059669,#2563eb)",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                color: "transparent",
              }}
            >
              بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
            </div>
            <div className="basmala-ornament mx-auto mt-3 max-w-[14rem]" />
          </div>
        )}
        <div ref={registerLeaf(keyPrefix)} className={`leaf-text ${font}`} dir="rtl">
          {page.ayahs.map(renderBookAyah)}
        </div>
        <span className="leaf-page-num">{page.pageNo >= 1000 ? "۝" : page.pageNo.toLocaleString("ar-EG")}</span>
      </article>
    );
  };

  const mushafTextStyle: MushafTextStyle = {
    "--mushaf-font-size": `${fontSize}px`,
    "--mushaf-line-height": String(lineHeight),
    "--mushaf-word-spacing": `${wordSpacing}px`,
    "--mushaf-reading-width": `${readingWidth}px`,
    lineHeight,
    wordSpacing: `${wordSpacing}px`,
  };

  /* ---------- derived info ---------- */
  const pageNums = surah.ayahs.map((a) => a.page).filter((p) => p < 1000);
  const minPage = pageNums.length ? Math.min(...pageNums) : null;
  const maxPage = pageNums.length ? Math.max(...pageNums) : null;
  const sajdaCount = Object.keys(SAJDA_AYAHS).filter((k) => k.startsWith(`${surahNum}:`)).length;
  const syncMeta = SYNC_META[engine.state.syncStatus];

  const searchMatches = useMemo(() => {
    const q = normalizeArabic(searchQuery);
    if (!q) return [];
    return surah.ayahs
      .filter((a) => normalizeArabic(a.text).includes(q))
      .slice(0, 25);
  }, [searchQuery, surah.ayahs]);

  const bookmarks = getBookmarks();

  /* =========================================================
     RENDER
  ========================================================= */
  return (
    <div
      className={`reader-root ${paper === "night" ? "reader-dark" : ""} ${focusMode ? "focus-mode" : ""}`}
      onClick={closeMenus}
    >
      {/* ambient backdrop */}
      <div className="reader-ambient" aria-hidden />

      {/* scroll progress */}
      <div className="fixed inset-x-0 top-0 z-[130] h-1 bg-transparent">
        <div className="h-full transition-[width] duration-150" style={{ width: `${progress}%`, background: "linear-gradient(90deg,#10b981,#2563eb)" }} />
      </div>

      {/* ================= TOOLBAR ================= */}
      <header className="reader-toolbar" onClick={(e) => e.stopPropagation()}>
        <div className="mx-auto flex w-full max-w-[1400px] flex-wrap items-center gap-2 px-3 py-2 sm:px-4">
          <Link href="/mushaf" className="flex items-center gap-1.5 rounded-xl px-2 py-1.5 text-sm font-bold text-ink-500 transition hover:bg-emerald-50 hover:text-emerald-800">
            <IconChevR className="h-4 w-4" /> الفهرس
          </Link>

          <div className="flex min-w-0 items-center gap-2.5">
            <ProgressRing pct={readPct} />
            <div className="min-w-0">
              <div className="truncate font-display text-base font-bold leading-tight text-ink-900 sm:text-lg">
                سورة {surah.meta.nameAr}
              </div>
              <div className="truncate text-[10px] font-semibold text-ink-500 sm:text-[11px]">
                الجزء {surah.meta.juz.toLocaleString("ar-EG")}
                {minPage != null ? ` · صفحة ${minPage.toLocaleString("ar-EG")}${maxPage && maxPage !== minPage ? `–${maxPage.toLocaleString("ar-EG")}` : ""}` : ""}
                {` · ${surah.ayahs.length.toLocaleString("ar-EG")} آية`}
              </div>
            </div>
          </div>

          {/* view switcher (desktop) */}
          <div className="reader-seg mx-auto hidden lg:flex" role="tablist" aria-label="نمط العرض">
            <button role="tab" aria-selected={view === "mushaf"} className={view === "mushaf" ? "active" : ""} onClick={() => changeView("mushaf")}>
              <IconBook className="h-4 w-4" /> مصحف
            </button>
            <button role="tab" aria-selected={view === "continuous"} className={view === "continuous" ? "active" : ""} onClick={() => changeView("continuous")}>
              <IconScroll className="h-4 w-4" /> متواصل
            </button>
            <button role="tab" aria-selected={view === "ayah"} className={view === "ayah" ? "active" : ""} onClick={() => changeView("ayah")}>
              <IconList className="h-4 w-4" /> آية بآية
            </button>
          </div>

          <div className="ms-auto flex items-center gap-1">
            <button type="button" className="reader-icon-btn" onClick={() => changeSize(-2)} aria-label="تصغير الخط" title="تصغير الخط"><IconMinus /></button>
            <button type="button" className="reader-icon-btn" onClick={() => changeSize(2)} aria-label="تكبير الخط" title="تكبير الخط"><IconPlus /></button>
            <span className="mx-0.5 hidden h-6 w-px bg-slate-200 sm:block" aria-hidden />
            <button type="button" className="reader-icon-btn" onClick={() => openMenu("reciter")} aria-label="القارئ" title="القارئ"><IconMic /></button>
            <button type="button" className="reader-icon-btn" onClick={() => openMenu("font")} aria-label="نوع الخط" title="نوع الخط"><IconType /></button>
            <button type="button" className="reader-icon-btn" onClick={() => openMenu("appearance")} aria-label="المظهر" title="المظهر"><IconPalette /></button>
            <button type="button" className="reader-icon-btn" onClick={() => openMenu("nav")} aria-label="الفهرس والبحث" title="الفهرس والبحث"><IconSearch /></button>
            {view === "mushaf" && (
              <button
                type="button"
                className={`reader-icon-btn ${printMode ? "active" : ""}`}
                onClick={() => { setPrintMode((v) => { const next = !v; try { localStorage.setItem("hafiz_print_mushaf", next ? "1" : "0"); } catch { /* ignore */ } return next; }); }}
                aria-label={printMode ? "عرض صورة المصحف المطبوع" : "عرض النص التفاعلي"}
                title={printMode ? "المصحف المطبوع" : "النص التفاعلي"}
              ><IconBook /></button>
            )}
            <button type="button" className="reader-icon-btn" onClick={() => openMenu("bookmarks")} aria-label="العلامات المرجعية" title="العلامات المرجعية"><IconBookmark /></button>
            <button
              type="button"
              className={`reader-icon-btn ${hifzMode ? "active" : ""}`}
              onClick={toggleHifz}
              aria-label="وضع الحفظ"
              aria-pressed={hifzMode}
              title="وضع الحفظ (H)"
            >
              <IconEye />
            </button>
            <button type="button" className="reader-icon-btn" onClick={() => setFocusMode(true)} aria-label="وضع التركيز" title="وضع التركيز (F)"><IconExpand /></button>
            <button type="button" className="reader-icon-btn lg:hidden" onClick={() => setShowQuickPanel(true)} aria-label="كل الأدوات" title="كل الأدوات"><IconSparkle /></button>
          </div>
        </div>
      </header>

      {/* focus-mode exit */}
      {focusMode && (
        <button type="button" className="focus-exit" onClick={() => setFocusMode(false)} aria-label="خروج من وضع التركيز">
          <IconClose className="h-4 w-4" /> خروج
        </button>
      )}

      <div className="relative z-10 mx-auto w-full max-w-[1400px] px-2 pb-40 pt-4 sm:px-4">
        {/* ================= RESUME BANNER ================= */}
        {resume && (
          <div className="resume-banner" onClick={(e) => e.stopPropagation()}>
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-emerald-500 to-blue-600 text-white">
              <IconBookOpen className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-black text-ink-900">متابعة القراءة</div>
              <div className="text-xs font-semibold text-ink-500">آخر موضع: الآية {resume.ayah.toLocaleString("ar-EG")} من سورة {surah.meta.nameAr}</div>
            </div>
            <button type="button" className="rounded-xl btn-primary px-4 py-2 text-xs font-bold" onClick={() => jumpToAyah(resume.ayah)}>
              متابعة من الآية {resume.ayah.toLocaleString("ar-EG")}
            </button>
            <button type="button" className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 hover:bg-slate-100" onClick={() => setResume(null)} aria-label="إغلاق">
              <IconClose />
            </button>
          </div>
        )}

        {/* ================= SURAH INFO STRIP ================= */}
        <div className="info-strip" onClick={(e) => e.stopPropagation()}>
          <span className="info-chip">الجزء {surah.meta.juz.toLocaleString("ar-EG")}</span>
          <span className="info-chip">{surah.meta.revelation === "meccan" ? "مكية" : "مدنية"}</span>
          <span className="info-chip">{surah.ayahs.length.toLocaleString("ar-EG")} آية</span>
          {minPage != null && <span className="info-chip">صفحة {minPage.toLocaleString("ar-EG")}{maxPage && maxPage !== minPage ? `–${maxPage.toLocaleString("ar-EG")}` : ""}</span>}
          {sajdaCount > 0 && <span className="info-chip info-chip-gold">۩ {sajdaCount.toLocaleString("ar-EG")} مواضع سجود</span>}
          <span className="info-chip info-chip-progress">تقدّمك {readPct}٪</span>
          <span className="ms-auto flex flex-wrap items-center gap-2">
            <button type="button" className={`rounded-xl px-4 py-2 text-xs font-bold transition ${isPlaying ? "bg-rose-50 text-rose-700 ring-1 ring-rose-200" : "btn-primary"}`} onClick={() => (isPlaying ? stopAudio() : playFullSurah())}>
              {isPlaying ? "⏹ إيقاف" : "▶ استماع للسورة"}
            </button>
            <button type="button" className="rounded-xl bg-gradient-to-l from-teal-600 to-blue-600 px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:brightness-110" onClick={() => { setShowHafiz((v) => !v); window.scrollTo({ top: 0, behavior: "smooth" }); }}>
              <IconSparkle className="inline h-3.5 w-3.5" /> جلسة ذكية
            </button>
            <Link href={`/memorize?surah=${surahNum}`} className="rounded-xl bg-white px-4 py-2 text-xs font-bold text-emerald-800 ring-1 ring-emerald-200 transition hover:bg-emerald-50">
              حفظ هذه السورة
            </Link>
          </span>
        </div>

        {/* ================= HAFIZ SESSION ================= */}
        {showHafiz && (
          <div className="mx-auto mb-5 w-full max-w-3xl" onClick={(e) => e.stopPropagation()}>
            <HafizPanel teacher={hafiz} surah={surah} onListenAyah={(n) => playAyah(n, false)} />
          </div>
        )}

        {/* ===== THE ACTUAL 604-PAGE PRINTED MUSHAF ===== */}
        {view === "mushaf" && printMode && (
          <section className="printed-reader" aria-label="المصحف المطبوع، صفحات مصحف المدينة">
            <div className="printed-controls" onClick={(e) => e.stopPropagation()}>
              <div className="printed-edition">
                <span className="printed-seal" aria-hidden>۞</span>
                <div>
                  <strong>مصحف المدينة النبوية</strong>
                  <small>رواية حفص عن عاصم · الصفحة الأصلية كما طُبعت</small>
                </div>
              </div>
              <button type="button" className="printed-turn" onClick={() => turnPrintedPage(-1)} disabled={printPage <= 1} aria-label="الصفحة السابقة"><IconChevR /></button>
              <form
                className="printed-jump"
                onSubmit={(e) => { e.preventDefault(); const n = parseDigits(printPageDraft); if (n >= 1 && n <= 604) goToPrintedPage(n); else showToast("أدخل رقم صفحة من ١ إلى ٦٠٤"); }}
              >
                <label htmlFor="printed-page-input">صفحة</label>
                <input
                  id="printed-page-input"
                  inputMode="numeric"
                  value={printPageDraft}
                  onChange={(e) => setPrintPageDraft(e.target.value)}
                  aria-label="انتقل إلى صفحة المصحف"
                />
                <span>/ ٦٠٤</span>
              </form>
              <button type="button" className="printed-turn" onClick={() => turnPrintedPage(1)} disabled={printPage >= 604} aria-label="الصفحة التالية"><IconChevL /></button>
              <div className="printed-page-context">
                <span>{printedSurah?.nameAr ?? surah.meta.nameAr}</span>
                <span>·</span>
                <span>جزء {getJuzForPage(printPage).toLocaleString("ar-EG")}</span>
              </div>
              <button
                type="button"
                className="printed-text-toggle"
                onClick={() => { setPrintMode(false); try { localStorage.setItem("hafiz_print_mushaf", "0"); } catch { /* ignore */ } }}
                title="الانتقال إلى النص التفاعلي للاستماع والتفسير والحفظ"
              >النص التفاعلي</button>
            </div>

            <div ref={bookWrapRef} className="book-open printed-book mx-auto w-full" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
              <div className="book-open-inner printed-book-inner" dir="rtl">
                <div className="printed-spread" key={printedRight}>
                  <div className="printed-sheet printed-sheet-right">
                    <div className="printed-image-wrap">
                      {/* eslint-disable-next-line @next/next/no-img-element -- direct local PNG loading lets the service worker cache each actual print page on demand. */}
                      <img src={`/mushaf-pages/${printedRight}.png`} alt={`صفحة ${printedRight} من مصحف المدينة`} loading="eager" decoding="async" className="printed-page-image" />
                    </div>
                  </div>
                  <div className="printed-sheet printed-sheet-mobile">
                    <div className="printed-image-wrap">
                      {/* eslint-disable-next-line @next/next/no-img-element -- direct local PNG loading lets the service worker cache each actual print page on demand. */}
                      <img src={`/mushaf-pages/${printPage}.png`} alt={`صفحة ${printPage} من مصحف المدينة`} loading="eager" decoding="async" className="printed-page-image" />
                    </div>
                  </div>
                  {printedLeft && (
                    <div className="printed-sheet printed-sheet-left">
                      <div className="printed-image-wrap">
                        {/* eslint-disable-next-line @next/next/no-img-element -- direct local PNG loading lets the service worker cache each actual print page on demand. */}
                        <img src={`/mushaf-pages/${printedLeft}.png`} alt={`صفحة ${printedLeft} من مصحف المدينة`} loading="eager" decoding="async" className="printed-page-image" />
                      </div>
                    </div>
                  )}
                  <span className="printed-gutter" aria-hidden />
                </div>
              </div>
              <div className="printed-book-footer">
                <span>مصحف المدينة · رواية حفص</span>
                <span>الصفحة {printPage.toLocaleString("ar-EG")} من ٦٠٤</span>
                <a href="/mushaf-pages/ATTRIBUTION.md" target="_blank" rel="noreferrer">مصدر الصور والإسناد</a>
              </div>
            </div>
            <div className="printed-range-wrap" onClick={(e) => e.stopPropagation()}>
              <span>١</span>
              <input
                aria-label="تصفح صفحات المصحف"
                type="range"
                min="1"
                max="604"
                value={printPage}
                onChange={(e) => { setPrintPage(Number(e.target.value)); setPrintPageDraft(e.target.value); }}
                onPointerUp={(e) => goToPrintedPage(Number(e.currentTarget.value))}
                onTouchEnd={(e) => goToPrintedPage(Number(e.currentTarget.value))}
              />
              <span>٦٠٤</span>
            </div>
            <p className="printed-caption">الصفحة المصوّرة مطابقة لصفحة المصحف المطبوع؛ أدوات الآية والتلاوة المتزامنة متاحة من «النص التفاعلي».</p>
          </section>
        )}

        {/* ================= TEXT BOOK / INTERACTIVE READER ================= */}
        {!(view === "mushaf" && printMode) && (
        <div className="book-open mx-auto w-full" style={{ maxWidth: "calc(var(--mushaf-reading-width, 1024px) + 52px)" }}>
          <div className="book-open-inner">
            <div
              ref={pageRef}
              className={`mushaf-page paper-${paper} hl-style-${hlStyle} relative z-10 w-full overflow-hidden px-4 py-6 sm:px-8 sm:py-10 md:px-12 md:py-14 lg:px-16 lg:py-16 ${view === "mushaf" ? "is-book" : ""}`}
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
              {view !== "mushaf" && <span className="mushaf-watermark" />}
              {view !== "mushaf" && (
                <>
                  <span className="mushaf-corner left-3 top-3" aria-hidden />
                  <span className="mushaf-corner right-3 top-3" aria-hidden />
                  <span className="mushaf-corner bottom-3 left-3" aria-hidden />
                  <span className="mushaf-corner bottom-3 right-3" aria-hidden />
                </>
              )}

              {view !== "mushaf" && (
                <div className="relative z-20 transition-all duration-300">
                  <SurahHeader nameAr={surah.meta.nameAr} revelation={surah.meta.revelation} ayahCount={surah.meta.ayahCount} juz={surah.meta.juz} />
                </div>
              )}

              {surah.basmala && view !== "mushaf" && (
                <div className="relative z-10 mb-6 text-center">
                  <div
                    className="text-xl sm:text-2xl md:text-[2.1rem]"
                    style={{
                      fontFamily: "var(--font-quran)",
                      background: "linear-gradient(120deg,#047857,#059669,#2563eb)",
                      WebkitBackgroundClip: "text",
                      backgroundClip: "text",
                      color: "transparent",
                    }}
                  >
                    بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
                  </div>
                  <div className="basmala-ornament mx-auto mt-4 max-w-sm" />
                </div>
              )}

              {/* ---------- TWO-PAGE SPREAD BOOK ---------- */}
              {view === "mushaf" && (
                <div ref={bookWrapRef} className="book-stage relative z-10" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
                  <span className="book-edges left" aria-hidden />
                  <div className="spread-wrap">
                    <div className="spread-grid" dir="rtl">
                      {renderLeaf(rightPage, "right", `r-${spread}`)}
                      <div className="spread-left">{renderLeaf(leftPage, "left", `l-${spread}`)}</div>
                    </div>
                    <span className="spread-spine" aria-hidden />

                    {/* 3D turning leaf overlay */}
                    {turn && (
                      <div
                        className={`leaf-turn ${turn.dir}`}
                        onAnimationEnd={commitTurn}
                        aria-hidden
                      >
                        <div className="leaf-face leaf-face-front">
                          {renderLeaf(pages[turn.to], "right", `tf-${turn.to}`)}
                        </div>
                        <div className="leaf-face leaf-face-back">
                          {renderLeaf(pages[turn.to + 1], "left", `tb-${turn.to}`)}
                        </div>
                      </div>
                    )}

                    {/* edge turn zones (desktop) */}
                    <button type="button" className="spread-edge prev" onClick={prevSpread} disabled={spread === 0} aria-label="الورقة السابقة" title="السابقة">
                      <IconChevR className="h-6 w-6" />
                    </button>
                    <button type="button" className="spread-edge next" onClick={nextSpread} disabled={spread >= spreadCount - 1} aria-label="الورقة التالية" title="التالية">
                      <IconChevL className="h-6 w-6" />
                    </button>
                  </div>

                  <div className="book-nav">
                    <button type="button" className="book-nav-btn ghost" onClick={prevSpread} disabled={spread === 0}>
                      <IconChevR className="h-4 w-4" /> الورقة السابقة
                    </button>
                    <span className="book-nav-indicator">
                      <span className="dot" />
                      {rightPage && rightPage.pageNo < 1000
                        ? `صفحة المصحف ${rightPage.pageNo.toLocaleString("ar-EG")} · ${(spread + 1).toLocaleString("ar-EG")} / ${spreadCount.toLocaleString("ar-EG")}`
                        : `الورقة ${(spread + 1).toLocaleString("ar-EG")} من ${spreadCount.toLocaleString("ar-EG")}`}
                    </span>
                    <button type="button" className="book-nav-btn" onClick={nextSpread} disabled={spread >= spreadCount - 1}>
                      الورقة التالية <IconChevL className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* ---------- CONTINUOUS ---------- */}
              {view === "continuous" && (
                <div className="mushaf-content relative z-10" dir="rtl">
                  <div className="mushaf-continuous mx-auto" style={mushafTextStyle}>
                    {surah.ayahs.map((ayah) => {
                      const bookmarked = isBookmarked(surahNum, ayah.numberInSurah);
                      void bookmarkVersion;
                      const playing = playingAyah === ayah.numberInSurah;
                      const ayahRevealed = revealedAyahs.has(ayah.numberInSurah);
                      const hideText = hifzMode && !playing && !ayahRevealed;
                      return (
                        <article
                          key={ayah.numberInSurah}
                          ref={(el) => {
                            if (el) ayahRefs.current.set(ayah.numberInSurah, el as unknown as HTMLSpanElement);
                            else ayahRefs.current.delete(ayah.numberInSurah);
                          }}
                          className={`mushaf-continuous-ayah ${playing ? "is-playing" : ""}`}
                        >
                          <div
                            className={`mushaf-continuous-text ${font} ${hideText ? "hifz-block" : ""}`}
                            onClick={() => {
                              if (hideText) revealAyah(ayah.numberInSurah);
                              else onAyahClick({ stopPropagation: () => {} } as unknown as MouseEvent, ayah.numberInSurah);
                            }}
                          >
                            {highlight && playing
                              ? ayah.words.map((word, wi) => (
                                  <span
                                    key={wi}
                                    className="cursor-pointer"
                                    style={wi === activeWord ? { color: hlColor, background: `${hlColor}22`, borderRadius: 6, padding: "0 2px" } : undefined}
                                  >
                                    {word.t}{" "}
                                  </span>
                                ))
                              : ayah.text}
                            <AyahMarker n={ayah.numberInSurah} active={playing} />
                          </div>

                          <div className="mushaf-continuous-actions" onClick={(e) => e.stopPropagation()}>
                            <button type="button" onClick={() => playAyah(ayah.numberInSurah, false)} className="mushaf-action-chip" aria-label={`استماع للآية ${ayah.numberInSurah}`}>🔊</button>
                            <button type="button" onClick={() => onToggleBookmark(ayah.numberInSurah, ayah.page)} className="mushaf-action-chip" aria-label="علامة مرجعية" aria-pressed={bookmarked}>
                              <IconBookmark className="h-4 w-4" filled={bookmarked} />
                            </button>
                            <button type="button" onClick={() => onCopy(ayah.text, ayah.numberInSurah)} className="mushaf-action-chip" aria-label="نسخ الآية">
                              <IconCopy className="h-4 w-4" />
                            </button>
                            <button type="button" onClick={() => onShare(ayah)} className="mushaf-action-chip" aria-label="مشاركة كصورة">
                              <IconShare className="h-4 w-4" />
                            </button>
                            <button type="button" onClick={() => openTafsirInline(ayah.numberInSurah)} className="mushaf-action-chip" aria-label="التفسير">📖</button>
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

              {/* ---------- AYAH BY AYAH ---------- */}
              {view === "ayah" && (
                <div className="relative z-10 space-y-4" dir="rtl">
                  {surah.ayahs.map((ayah) => {
                    const playing = playingAyah === ayah.numberInSurah;
                    const ayahRevealed = revealedAyahs.has(ayah.numberInSurah);
                    const hideText = hifzMode && !playing && !ayahRevealed;
                    return (
                      <div
                        key={ayah.numberInSurah}
                        className={`ayah-card relative overflow-hidden rounded-3xl border bg-white/80 p-4 transition-all sm:p-6 ${
                          playing ? "ayah-card-playing border-emerald-400 shadow-lg" : "border-sand-300/60 hover:border-emerald-200 hover:shadow-md"
                        }`}
                      >
                        <span className="ayah-card-bar" style={{ background: "var(--grad-aurora)" }} />
                        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                          <span className="flex items-center gap-2">
                            <span className="grid h-9 w-9 place-items-center rounded-full text-xs font-bold text-white shadow-md" style={{ background: "linear-gradient(135deg,#10b981,#3b82f6)" }}>
                              {ayah.numberInSurah.toLocaleString("ar-EG")}
                            </span>
                            <span className="text-[11px] font-semibold text-ink-400">صفحة {ayah.page.toLocaleString("ar-EG")}</span>
                            {isSajda(surahNum, ayah.numberInSurah) && <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700">۩ سجدة</span>}
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            <button type="button" onClick={() => playAyah(ayah.numberInSurah, false)} className="rounded-xl border border-slate-100 bg-white px-3 py-1.5 text-xs font-bold text-slate-600 shadow-sm transition hover:border-emerald-200 hover:text-emerald-700">
                              {playing && isPlaying ? "⏸ جارٍ التلاوة" : "🔊 استماع"}
                            </button>
                            <button type="button" onClick={() => openTafsir(ayah.numberInSurah)} className="rounded-xl border border-slate-100 bg-white px-3 py-1.5 text-xs font-bold text-slate-600 shadow-sm transition hover:border-emerald-200 hover:text-emerald-700">📖 تفسير</button>
                            <button type="button" onClick={() => onToggleBookmark(ayah.numberInSurah, ayah.page)} aria-pressed={isBookmarked(surahNum, ayah.numberInSurah)} className="rounded-xl border border-slate-100 bg-white px-3 py-1.5 text-xs font-bold text-slate-600 shadow-sm transition hover:border-emerald-200 hover:text-emerald-700">🔖 علامة</button>
                            <button type="button" onClick={() => onCopy(ayah.text, ayah.numberInSurah)} className="rounded-xl border border-slate-100 bg-white px-3 py-1.5 text-xs font-bold text-slate-600 shadow-sm transition hover:border-emerald-200 hover:text-emerald-700">⧉ نسخ</button>
                            <button type="button" onClick={() => onShare(ayah)} className="rounded-xl border border-slate-100 bg-white px-3 py-1.5 text-xs font-bold text-slate-600 shadow-sm transition hover:border-emerald-200 hover:text-emerald-700">🖼 مشاركة</button>
                          </div>
                        </div>
                        <p
                          className={`text-ink-900 ${font} ${hideText ? "hifz-block" : ""}`}
                          style={{ fontSize: `${fontSize}px`, lineHeight: 2.2 }}
                          onClick={hideText ? () => revealAyah(ayah.numberInSurah) : undefined}
                        >
                          {highlight && playing
                            ? ayah.words.map((word, wordIndex) => (
                                <span
                                  key={wordIndex}
                                  onClick={() => engine.seekToWord(ayah.numberInSurah, wordIndex + 1)}
                                  className={`quran-word cursor-pointer ${wordIndex === activeWord ? "quran-word-active" : ""}`}
                                  style={wordIndex === activeWord ? ({ "--word-active": hlColor } as CSSProperties) : undefined}
                                  aria-current={wordIndex === activeWord ? "true" : undefined}
                                >
                                  {word.t}{" "}
                                </span>
                              ))
                            : ayah.text}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
        )}
      </div>

      {/* ================= FLOATING PLAYER ================= */}
      {playerOpen && (
        <div className="player-bar" onClick={(e) => e.stopPropagation()} dir="rtl">
          <button type="button" className="player-btn player-btn-main" onClick={togglePlay} aria-label={isPlaying ? "إيقاف مؤقت" : "تشغيل"}>
            {isPlaying ? <IconPause className="h-6 w-6" /> : <IconPlay className="h-6 w-6" />}
          </button>
          <button type="button" className="player-btn" onClick={() => engine.prevAyah()} aria-label="الآية السابقة" title="السابقة"><IconChevR /></button>
          <button type="button" className="player-btn" onClick={() => engine.nextAyah()} aria-label="الآية التالية" title="التالية"><IconChevL /></button>

          <div className="player-meta">
            <div className="player-meta-title">
              سورة {surah.meta.nameAr}
              {playingAyah != null && <span className="text-emerald-300"> · آية {playingAyah.toLocaleString("ar-EG")} / {surah.ayahs.length.toLocaleString("ar-EG")}</span>}
              {engine.state.currentWord != null && syncMeta.canHighlightWord && <span className="player-word-position"> · كلمة {engine.state.currentWord.toLocaleString("ar-EG")}</span>}
            </div>
            <div className="player-meta-sub">
              {reciter.name}
              <span className="player-sync" style={{ color: syncMeta.color }}>● {syncMeta.label}</span>
              {engine.state.sleepTimerMinutes && <span className="text-amber-300">· نوم {engine.state.sleepTimerMinutes}د</span>}
            </div>
          </div>

          <div className="player-progress" onClick={onSeekClick} role="progressbar" aria-valuenow={playerPct} aria-valuemin={0} aria-valuemax={100} title="اسحب للتنقل">
            <div className="player-progress-fill" style={{ width: `${playerPct}%` }} />
          </div>

          <button type="button" className="player-btn player-btn-text" onClick={cycleSpeed} title="سرعة التلاوة" aria-label="سرعة التلاوة">
            {engine.state.playbackRate}×
          </button>
          <button type="button" className={`player-btn ${engine.state.repeatAyah ? "is-on" : ""}`} onClick={() => engine.toggleRepeatAyah()} title="تكرار الآية" aria-label="تكرار الآية" aria-pressed={engine.state.repeatAyah}>
            <IconRepeat />
          </button>
          <button type="button" className={`player-btn ${engine.state.autoScroll ? "is-on" : ""}`} onClick={() => engine.toggleAutoScroll()} title="التمرير التلقائي" aria-label="التمرير التلقائي" aria-pressed={engine.state.autoScroll}>
            <IconScroll />
          </button>
          <button type="button" className={`player-btn ${engine.state.sleepTimerMinutes ? "is-on" : ""}`} onClick={cycleSleep} title="مؤقت النوم" aria-label="مؤقت النوم">
            <IconTimer />
          </button>
          <button type="button" className="player-btn" onClick={() => { stopAudio(); setPlayerOpen(false); }} aria-label="إغلاق المشغّل" title="إغلاق">
            <IconClose />
          </button>
        </div>
      )}

      {/* ================= FAB + DRAWER ================= */}
      {!showQuickPanel && !focusMode && (
        <button type="button" className="reader-fab" onClick={() => setShowQuickPanel(true)} aria-label="أدوات المصحف السريعة" title="أدوات المصحف">
          <IconBookOpen />
        </button>
      )}

      {showQuickPanel && (
        <>
          <div className="reader-drawer-backdrop" onClick={() => setShowQuickPanel(false)} aria-hidden />
          <aside className="reader-drawer" role="dialog" aria-label="أدوات المصحف" dir="rtl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <div>
                <div className="font-display text-lg font-bold text-ink-900">أدوات المصحف</div>
                <div className="text-[11px] font-semibold text-ink-500">سورة {surah.meta.nameAr} · {surah.ayahs.length.toLocaleString("ar-EG")} آية</div>
              </div>
              <button type="button" onClick={() => setShowQuickPanel(false)} className="grid h-9 w-9 place-items-center rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200" aria-label="إغلاق">
                <IconClose />
              </button>
            </div>

            <div className="rd-section">
              <div className="rd-title">نمط العرض</div>
              <div className="rd-seg">
                <button className={view === "mushaf" ? "active" : ""} onClick={() => changeView("mushaf")}><IconBook className="mx-auto mb-1 h-4 w-4" /> مصحف</button>
                <button className={view === "ayah" ? "active" : ""} onClick={() => changeView("ayah")}><IconList className="mx-auto mb-1 h-4 w-4" /> آية بآية</button>
                <button className={view === "continuous" ? "active" : ""} onClick={() => changeView("continuous")}><IconScroll className="mx-auto mb-1 h-4 w-4" /> متواصل</button>
              </div>
            </div>

            <div className="rd-section">
              <div className="rd-title">حجم الخط · {fontSize}px</div>
              <div className="flex items-center gap-2">
                <button type="button" className="rd-row flex-1 justify-center" onClick={() => changeSize(-2)} aria-label="تصغير"><IconMinus /> تصغير</button>
                <button type="button" className="rd-row px-4" onClick={resetFontSize} title="إعادة الافتراضي">معايرة</button>
                <button type="button" className="rd-row flex-1 justify-center" onClick={() => changeSize(2)} aria-label="تكبير"><IconPlus /> تكبير</button>
              </div>
            </div>

            <div className="rd-section">
              <div className="rd-title">التلاوة الصوتية</div>
              <button type="button" className={`rd-btn ${isPlaying ? "rd-btn-stop" : "rd-btn-play"}`} onClick={() => (isPlaying ? stopAudio() : playFullSurah())}>
                {isPlaying ? <IconStop className="h-5 w-5" /> : <IconPlay className="h-5 w-5" />}
                {isPlaying ? "إيقاف التلاوة" : "استماع للسورة كاملة"}
              </button>
              <p className="mt-2 text-center text-[11px] font-semibold text-ink-500">
                القارئ الحالي: <span className="text-emerald-700">{reciter.name}</span>
              </p>
            </div>

            <div className="rd-section">
              <button type="button" className="rd-btn rd-btn-hafiz" onClick={() => { setShowQuickPanel(false); setShowHafiz((v) => !v); window.scrollTo({ top: 0, behavior: "smooth" }); }}>
                <IconSparkle className="h-5 w-5" /> ابدأ جلسة ذكية
              </button>
            </div>

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
              <button type="button" className="rd-row" onClick={() => openMenu("nav")}>
                <span className="flex items-center gap-2"><IconSearch className="h-4 w-4 text-emerald-700" /> الفهرس والبحث داخل السورة</span>
                <IconChevron className="h-4 w-4 text-slate-400" />
              </button>
              <button type="button" className="rd-row" onClick={() => openMenu("bookmarks")}>
                <span className="flex items-center gap-2"><IconBookmark className="h-4 w-4 text-emerald-700" /> العلامات المرجعية</span>
                <IconChevron className="h-4 w-4 text-slate-400" />
              </button>
            </div>

            <div className="rd-section">
              <div className="rd-title">انتقال إلى آية</div>
              <form
                className="flex gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  jumpToAyah(parseDigits(jumpAyah));
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

            <div className="rd-section space-y-2">
              <div className="rd-row" onClick={toggleHifz} role="button" tabIndex={0} onKeyDown={(e) => e.key === "Enter" && toggleHifz()}>
                <span className="flex items-center gap-2"><IconEye className="h-4 w-4 text-emerald-700" /> وضع الحفظ (إخفاء الكلمات)</span>
                <span className={`relative h-5 w-9 shrink-0 rounded-full transition ${hifzMode ? "bg-emerald-500" : "bg-slate-300"}`}>
                  <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all ${hifzMode ? "right-0.5" : "right-4"}`} />
                </span>
              </div>
              <div className="rd-row" onClick={toggleHighlight} role="button" tabIndex={0} onKeyDown={(e) => e.key === "Enter" && toggleHighlight()}>
                <span className="flex items-center gap-2"><span className="grid h-4 w-4 place-items-center rounded-full text-[9px] font-black text-white" style={{ background: hlColor }}>✦</span> تظليل الكلمات أثناء التلاوة</span>
                <span className={`relative h-5 w-9 shrink-0 rounded-full transition ${highlight ? "bg-emerald-500" : "bg-slate-300"}`}>
                  <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all ${highlight ? "right-0.5" : "right-4"}`} />
                </span>
              </div>
            </div>
          </aside>
        </>
      )}

      {/* ================= NAV / SEARCH MENU ================= */}
      <MushafMenu open={showNav} onClose={() => setShowNav(false)} width={340}>
        <div role="dialog" aria-label="الفهرس والانتقال إلى آية">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <div className="text-sm font-black text-slate-900">الفهرس والانتقال السريع</div>
              <div className="mt-0.5 text-[10px] text-slate-400">{surah.meta.nameAr} · ١–{surah.ayahs.length.toLocaleString("ar-EG")}</div>
            </div>
            <button type="button" onClick={() => setShowNav(false)} className="grid h-8 w-8 place-items-center rounded-xl bg-slate-50 text-slate-500 hover:bg-slate-100" aria-label="إغلاق">
              <IconClose />
            </button>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              jumpToAyah(parseDigits(jumpAyah));
            }}
            className="flex gap-2"
          >
            <input
              inputMode="numeric"
              value={jumpAyah}
              onChange={(e) => setJumpAyah(e.target.value)}
              placeholder="رقم الآية"
              dir="ltr"
              className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-center text-lg font-bold text-slate-900 outline-none focus:border-emerald-500"
              aria-label="رقم الآية"
            />
            <button type="submit" className="rounded-xl btn-primary px-5 py-2.5 text-sm font-bold">اذهب</button>
          </form>

          <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500">
            <span>الجزء {surah.meta.juz.toLocaleString("ar-EG")} · الصفحة {surah.ayahs[0]?.page.toLocaleString("ar-EG") ?? "—"}</span>
            <Link href="/mushaf" className="font-bold text-emerald-700 hover:underline">فهرس السور</Link>
          </div>

          {/* in-surah text search */}
          <div className="mt-4 border-t border-slate-100 pt-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-black text-slate-900">بحث داخل السورة</span>
              <span className="text-[10px] font-bold text-slate-400">اكتب كلمة من الآية</span>
            </div>
            <div className="relative">
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ابحث عن كلمة أو عبارة…"
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 pr-8 text-right text-xs font-semibold text-slate-900 outline-none focus:border-emerald-500"
                aria-label="البحث داخل السورة"
              />
              <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-xs">🔍</span>
            </div>
            {searchQuery.trim() && (
              <div className="mt-2 max-h-44 overflow-y-auto rounded-xl bg-slate-50/70 p-1" dir="rtl">
                {searchMatches.length === 0 && <p className="px-2 py-3 text-center text-[11px] text-slate-400">لا توجد آية مطابقة</p>}
                {searchMatches.map((a) => (
                  <button
                    key={a.numberInSurah}
                    type="button"
                    onClick={() => jumpToAyah(a.numberInSurah)}
                    className="search-match"
                  >
                    <span className="search-match-num">{a.numberInSurah.toLocaleString("ar-EG")}</span>
                    <span className="search-match-text">{a.text.slice(0, 60)}…</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* surah index */}
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
            <div className="mt-2 max-h-52 overflow-y-auto rounded-xl bg-slate-50/70 p-1" dir="rtl">
              {(() => {
                const q = indexQuery.trim();
                const num = q ? parseDigits(q) : 0;
                const matches = SURAHS.filter((s) => {
                  if (!q) return true;
                  return s.nameAr.includes(q) || s.nameLatin.toLowerCase().includes(q.toLowerCase()) || (num >= 1 && num <= 114 && s.number === num);
                });
                if (matches.length === 0) return <p className="px-2 py-3 text-center text-[11px] text-slate-400">لا توجد سورة مطابقة</p>;
                return matches.map((s) => {
                  const active = s.number === surahNum;
                  return (
                    <Link
                      key={s.number}
                      href={`/mushaf/${s.number}`}
                      onClick={() => setShowNav(false)}
                      className={`flex items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-right transition ${active ? "bg-emerald-100 text-emerald-800" : "hover:bg-white hover:shadow-sm"}`}
                    >
                      <span className="flex items-center gap-2">
                        <span
                          className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-[11px] font-black text-white"
                          style={{ background: active ? "linear-gradient(135deg,#10b981,#2563eb)" : "linear-gradient(135deg,#059669,#0f172a)" }}
                        >
                          {s.number.toLocaleString("ar-EG")}
                        </span>
                        <span className="text-sm font-bold text-slate-800" style={{ fontFamily: "var(--font-quran)" }}>{s.nameAr}</span>
                      </span>
                      <span className="shrink-0 text-[10px] font-semibold text-slate-400">{s.ayahCount.toLocaleString("ar-EG")} آية</span>
                    </Link>
                  );
                });
              })()}
            </div>
          </div>
        </div>
      </MushafMenu>

      {/* ================= APPEARANCE MENU ================= */}
      <MushafMenu open={showAppearance} onClose={() => setShowAppearance(false)} width={320}>
        <div role="dialog" aria-label="المظهر">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <div className="text-sm font-black text-slate-900">المظهر والورق</div>
              <div className="mt-0.5 text-[10px] text-slate-400">خصّص تجربة القراءة كما تحب</div>
            </div>
            <button type="button" onClick={() => setShowAppearance(false)} className="grid h-8 w-8 place-items-center rounded-xl bg-slate-50 text-slate-500 hover:bg-slate-100" aria-label="إغلاق">
              <IconClose />
            </button>
          </div>

          <div className="rounded-2xl bg-slate-50 p-3">
            <div className="mb-2 text-[10px] font-bold text-slate-500">لون الورق</div>
            <div className="flex flex-wrap gap-2">
              {PAPERS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => choosePaper(p.id)}
                  className={`flex items-center gap-1.5 rounded-xl px-2.5 py-2 text-[11px] font-bold transition ${paper === p.id ? "bg-emerald-600 text-white" : "bg-white text-slate-600 hover:bg-emerald-50"}`}
                >
                  <span className="h-4 w-4 rounded-full ring-1 ring-black/10" style={{ background: p.preview }} />
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-3 rounded-2xl bg-slate-50 p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-500">تظليل الكلمات أثناء التلاوة</span>
              <button type="button" onClick={toggleHighlight} className={`relative h-5 w-9 rounded-full transition ${highlight ? "bg-emerald-500" : "bg-slate-300"}`} aria-label="تبديل التظليل" aria-pressed={highlight}>
                <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all ${highlight ? "right-0.5" : "right-4"}`} />
              </button>
            </div>
            {highlight && (
              <div className="flex flex-wrap gap-2">
                {HIGHLIGHT_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => chooseHighlightColor(color)}
                    className={`grid h-8 w-8 place-items-center rounded-full transition ${hlColor === color ? "scale-110 ring-2 ring-slate-400 ring-offset-2" : ""}`}
                    style={{ background: color }}
                    aria-label={`لون ${color}`}
                  >
                    {hlColor === color && <span className="text-xs font-black text-white">✓</span>}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="mt-3 rounded-2xl bg-slate-50 p-3">
            <div className="mb-2 text-[10px] font-bold text-slate-500">نمط التظليل</div>
            <div className="grid grid-cols-3 gap-1.5">
              {([["background", "خلفية"], ["underline", "تسطير"], ["frame", "إطار"]] as [HighlightStyle, string][]).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => chooseHighlightStyle(id)}
                  className={`rounded-lg px-2 py-2 text-[11px] font-bold transition ${hlStyle === id ? "bg-emerald-600 text-white" : "bg-white text-slate-600 hover:bg-emerald-50"}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-3 rounded-2xl bg-slate-50 p-3">
            <div className="mb-2 text-[10px] font-bold text-slate-500">إعدادات القراءة</div>
            <div className="space-y-2">
              <SettingStepper label="ارتفاع السطر" value={lineHeight.toFixed(1)} onDec={() => changeLineHeight(-0.1)} onInc={() => changeLineHeight(0.1)} onReset={() => { setLineHeight(LINE_HEIGHT.def); writeLineHeight(LINE_HEIGHT.def); }} decLabel="تقليل ارتفاع السطر" incLabel="زيادة ارتفاع السطر" />
              <SettingStepper label="تباعد الكلمات" value={`${wordSpacing}px`} onDec={() => changeWordSpacing(-1)} onInc={() => changeWordSpacing(1)} onReset={() => { setWordSpacing(WORD_SPACING.def); writeWordSpacing(WORD_SPACING.def); }} decLabel="تقليل تباعد الكلمات" incLabel="زيادة تباعد الكلمات" />
              <SettingStepper label="عرض القراءة" value={`${readingWidth}px`} onDec={() => changeReadingWidth(-40)} onInc={() => changeReadingWidth(40)} onReset={() => { setReadingWidth(READING_WIDTH.def); writeReadingWidth(READING_WIDTH.def); }} decLabel="تضييق عرض القراءة" incLabel="توسيع عرض القراءة" />
            </div>
          </div>
        </div>
      </MushafMenu>

      {/* ================= FONTS MENU ================= */}
      <MushafMenu open={showFonts} onClose={() => setShowFonts(false)} width={280}>
        <div className="border-b border-slate-100 px-4 py-3">
          <div className="text-sm font-black text-slate-900">نوع الخط</div>
          <div className="mt-0.5 text-[10px] text-slate-400">اختر الخط المناسب للمصحف</div>
        </div>
        <div className="p-2">
          {FONTS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => chooseFont(item.id)}
              className={`flex w-full items-center justify-between gap-3 rounded-2xl px-3 py-3 text-right transition ${font === item.id ? "bg-emerald-50" : "hover:bg-slate-50"}`}
            >
              <span className={`${item.id} text-xl text-slate-900`}>بِسْمِ</span>
              <span className="flex-1 text-[11px] font-bold text-slate-500">{item.label}</span>
              {font === item.id && <span className="grid h-6 w-6 place-items-center rounded-full bg-emerald-500 text-xs font-black text-white">✓</span>}
            </button>
          ))}
        </div>
      </MushafMenu>

      {/* ================= RECITERS MENU ================= */}
      <MushafMenu open={showReciters} onClose={() => setShowReciters(false)} width={300}>
        <div className="sticky top-0 z-10 border-b border-slate-100 bg-white px-4 py-3">
          <div className="text-sm font-black text-slate-900">القارئ</div>
          <div className="mt-0.5 text-[10px] text-slate-400">يُوضَّح لكل قارئ توفّره لهذه السورة</div>
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
          {RECITERS.map((item) => {
            const photo = getRegistryReciter(item.id)?.image ?? null;
            const avail = reciterAvailability(item, surahNum);
            const timingSource = getTimingSource(item.id);
            const syncLabel = timingSource?.kind === "qdc"
              ? "توقيت كلمات · Quran.com"
              : timingSource?.kind === "bundled"
                ? "توقيت محاذاة آلية"
                : hasPerAyah(item)
                  ? "تقدير تقريبي · قد ينحرف"
                  : "صوت فقط · بلا توقيت كلمات";
            const unavailable = avail === "none";
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => chooseReciter(item)}
                className={`flex w-full items-center justify-between gap-2 rounded-2xl px-3 py-2.5 text-right transition ${item.id === reciter.id ? "bg-emerald-50" : "hover:bg-slate-50"} ${unavailable ? "reciter-row-unavailable" : ""}`}
              >
                <span className="flex min-w-0 items-center gap-2.5">
                  {photo ? (
                    <Image src={photo} alt="" width={40} height={40} className="h-10 w-10 shrink-0 rounded-xl object-cover object-top ring-1 ring-emerald-100" />
                  ) : (
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-emerald-500 to-ocean-600 text-sm font-bold text-white">
                      {item.name.charAt(0)}
                    </span>
                  )}
                  <span className="flex min-w-0 flex-col">
                    <span className="truncate font-bold text-slate-800">{item.name}</span>
                    <span className="flex flex-wrap items-center gap-1.5">
                      <span className={`reciter-avail ${avail === "ayah" ? "reciter-avail-ayah" : avail === "surah" ? "reciter-avail-surah" : "reciter-avail-none"}`}>
                        {avail === "ayah" ? "آية بآية" : avail === "surah" ? "متاح للسورة" : "غير متاح"}
                      </span>
                      <span className={`reciter-sync-pill ${timingSource ? "timed" : hasPerAyah(item) ? "auto" : "audio"}`}>
                        {syncLabel}
                      </span>
                    </span>
                  </span>
                </span>
                {item.id === reciter.id && <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-emerald-500 text-xs font-black text-white">✓</span>}
              </button>
            );
          })}
        </div>
      </MushafMenu>

      {/* ================= BOOKMARKS MENU ================= */}
      <MushafMenu open={showBookmarks} onClose={() => setShowBookmarks(false)} width={320}>
        <div className="mb-3 flex items-center justify-between">
          <div>
            <div className="text-sm font-black text-slate-900">العلامات المرجعية</div>
            <div className="mt-0.5 text-[10px] text-slate-400">{bookmarks.length.toLocaleString("ar-EG")} علامة محفوظة على هذا الجهاز</div>
          </div>
          <button type="button" onClick={() => setShowBookmarks(false)} className="grid h-8 w-8 place-items-center rounded-xl bg-slate-50 text-slate-500 hover:bg-slate-100" aria-label="إغلاق">
            <IconClose />
          </button>
        </div>
        {bookmarks.length === 0 ? (
          <div className="rounded-2xl bg-slate-50 p-6 text-center">
            <IconBookmark className="mx-auto h-8 w-8 text-slate-300" />
            <p className="mt-2 text-xs font-bold text-slate-500">لا توجد علامات بعد</p>
            <p className="mt-1 text-[11px] text-slate-400">اضغط أي آية ثم اختر «علامة» لحفظ موضعك هنا.</p>
          </div>
        ) : (
          <div className="max-h-[50vh] space-y-1.5 overflow-y-auto">
            {bookmarks.map((b) => {
              const meta = getSurah(b.surah);
              const sameSurah = b.surah === surahNum;
              return (
                <div key={`${b.surah}:${b.ayah}`} className="bookmark-row">
                  <button
                    type="button"
                    className="flex min-w-0 flex-1 items-center gap-2.5 text-right"
                    onClick={() => {
                      setShowBookmarks(false);
                      if (sameSurah) jumpToAyah(b.ayah);
                      else router.push(`/mushaf/${b.surah}?ayah=${b.ayah}`);
                    }}
                  >
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-emerald-500 to-blue-600 text-[11px] font-black text-white">
                      {b.ayah.toLocaleString("ar-EG")}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-bold text-slate-800" style={{ fontFamily: "var(--font-quran)" }}>
                        سورة {meta?.nameAr ?? b.surah} — آية {b.ayah.toLocaleString("ar-EG")}
                      </span>
                      <span className="block text-[10px] font-semibold text-slate-400">
                        {b.page ? `صفحة ${b.page.toLocaleString("ar-EG")} · ` : ""}{new Date(b.createdAt).toLocaleDateString("ar-EG")}
                      </span>
                    </span>
                  </button>
                  <button
                    type="button"
                    className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
                    aria-label="حذف العلامة"
                    onClick={() => {
                      removeBookmark(b.surah, b.ayah);
                      setBookmarkVersion((v) => v + 1);
                    }}
                  >
                    <IconClose className="h-3.5 w-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </MushafMenu>

      {/* ================= SAJDA MODAL ================= */}
      {sajdaOpen && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm" onClick={() => setSajdaOpen(false)}>
          <div className="w-full max-w-md rounded-[28px] border border-amber-100 bg-white p-5 shadow-2xl" onClick={(e) => e.stopPropagation()} dir="rtl">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-lg font-black text-slate-900">موضع سجدة</div>
                <div className="mt-1 text-xs text-slate-500">عند الوصول إلى موضع السجدة يستحب سجود التلاوة.</div>
              </div>
              <button type="button" onClick={() => setSajdaOpen(false)} className="grid h-9 w-9 place-items-center rounded-xl bg-slate-50 text-slate-500" aria-label="إغلاق">
                <IconClose />
              </button>
            </div>
            <div className="mt-4 rounded-2xl bg-amber-50 p-4 text-center">
              <div className="font-arabic text-lg leading-9 text-amber-900">{SAJDA_DUA}</div>
              <div className="mt-2 text-[11px] font-bold text-amber-700">{SAJDA_DUA_SOURCE}</div>
            </div>
            <button type="button" onClick={() => setSajdaOpen(false)} className="mt-4 w-full rounded-2xl bg-gradient-to-l from-emerald-600 to-blue-600 px-4 py-3 text-sm font-black text-white">
              فهمت
            </button>
          </div>
        </div>
      )}

      {/* ================= TAFSIR DIALOG (ayah view) ================= */}
      {tafsirAyah != null && view === "ayah" && (() => {
        const t = surah.ayahs.find((a) => a.numberInSurah === tafsirAyah) ?? null;
        if (!t) return null;
        return (
          <div className="fixed inset-0 z-[300] flex items-end justify-center bg-slate-950/40 p-4 backdrop-blur-sm sm:items-center" onClick={() => setTafsirAyah(null)}>
            <div className="w-full max-w-lg rounded-[28px] border border-emerald-100 bg-white p-5 shadow-2xl" onClick={(e) => e.stopPropagation()} dir="rtl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-emerald-500 to-blue-600 text-xs font-black text-white">{toDigits(t.numberInSurah)}</span>
                  <span className="font-display text-base font-bold text-ink-900">التفسير الميسّر</span>
                </div>
                <button type="button" onClick={() => setTafsirAyah(null)} className="grid h-9 w-9 place-items-center rounded-xl bg-slate-50 text-slate-500" aria-label="إغلاق">
                  <IconClose />
                </button>
              </div>
              <div className="mt-4 rounded-2xl bg-emerald-50/60 p-4 text-sm leading-8 text-slate-700">{t.tafsir || "التفسير غير متوفّر لهذه الآية حالياً."}</div>
              <button type="button" onClick={() => playAyah(t.numberInSurah, false)} className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-l from-blue-600 to-emerald-500 px-4 py-3 text-sm font-black text-white">
                <IconPlay className="h-4 w-4" /> استماع للآية
              </button>
            </div>
          </div>
        );
      })()}

      {toast && (
        <div className="mushaf-toast" role="status" aria-live="polite">
          {toast}
        </div>
      )}
    </div>
  );
}
