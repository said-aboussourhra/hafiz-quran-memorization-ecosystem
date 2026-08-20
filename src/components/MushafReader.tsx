"use client";

import {
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

import {
  RECITERS,
  DEFAULT_RECITER,
  ayahUrl,
  hasPerAyah,
  perAyahFallback,
  type Reciter,
} from "@/lib/reciters";

type ViewMode = "mushaf" | "ayah";

type MushafTextStyle = CSSProperties & {
  "--mushaf-font-size": string;
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

  const [fontSize, setFontSize] = useState(34);
  const [font, setFont] = useState("qf-kfgqpc");

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

  const [playingAyah, setPlayingAyah] =
    useState<number | null>(null);

  const [surahPlaying, setSurahPlaying] =
    useState(false);

  const [continuous, setContinuous] =
    useState(false);

  const [reciter, setReciter] =
    useState<Reciter>(DEFAULT_RECITER);

  const [progress, setProgress] =
    useState(0);

  const [highlight, setHighlight] =
    useState(true);

  const [hlColor, setHlColor] =
    useState("#10b981");

  const [paper, setPaper] =
    useState("ivory");

  const [activeWord, setActiveWord] =
    useState(-1);

  /* =========================================================
     REFS
  ========================================================= */

  const audioRef =
    useRef<HTMLAudioElement | null>(null);

  const pageRef =
    useRef<HTMLDivElement | null>(null);

  const ayahRefs =
    useRef<Map<number, HTMLSpanElement>>(
      new Map()
    );

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
    playingAyah !== null ||
    surahPlaying;

  /* =========================================================
     AUDIO
  ========================================================= */

  const playAyah = (
    n: number,
    chain: boolean
  ) => {
    const ayah =
      surah.ayahs.find(
        (a) =>
          a.numberInSurah === n
      );

    if (
      !ayah ||
      !audioRef.current
    ) {
      return;
    }

    const reciterToUse =
      hasPerAyah(reciter)
        ? reciter
        : perAyahFallback();

    const url = ayahUrl(
      reciterToUse,
      surahNum,
      ayah.numberInSurah,
      ayah.globalNumber
    );

    if (!url) {
      return;
    }

    if (!chain) {
      setSurahPlaying(false);
    }

    setContinuous(chain);
    setPlayingAyah(n);
    setActiveWord(-1);

    const audio =
      audioRef.current;

    audio.pause();
    audio.src = url;
    audio.currentTime = 0;

    audio.play().catch(() => {
      setPlayingAyah(null);
    });
  };

  const playFullSurah = () => {
    const firstAyah =
      surah.ayahs[0];

    if (!firstAyah) {
      return;
    }

    setSurahPlaying(true);

    playAyah(
      firstAyah.numberInSurah,
      true
    );
  };

  const stopAudio = () => {
    const audio =
      audioRef.current;

    if (audio) {
      audio.pause();
      audio.currentTime = 0;
      audio.removeAttribute("src");
      audio.load();
    }

    setPlayingAyah(null);
    setSurahPlaying(false);
    setContinuous(false);
    setActiveWord(-1);
  };

  /* =========================================================
     WORD HIGHLIGHT
  ========================================================= */

  const onTimeUpdate = () => {
    const audio =
      audioRef.current;

    if (
      !audio ||
      !highlight ||
      playingAyah == null ||
      !audio.duration ||
      Number.isNaN(audio.duration)
    ) {
      return;
    }

    const ayah =
      surah.ayahs.find(
        (x) =>
          x.numberInSurah ===
          playingAyah
      );

    if (
      !ayah ||
      ayah.words.length === 0
    ) {
      return;
    }

    const duration =
      audio.duration;

    const time = Math.max(
      0,
      audio.currentTime -
        duration * 0.02
    );

    const weights =
      ayah.words.map(
        (word) =>
          Math.max(
            2,
            word.t.replace(
              /[^\u0600-\u06FF]/g,
              ""
            ).length
          )
      );

    const total =
      weights.reduce(
        (sum, value) =>
          sum + value,
        0
      );

    if (total <= 0) {
      return;
    }

    const target =
      (time /
        (duration * 0.96)) *
      total;

    let accumulated = 0;
    let index = 0;

    for (
      let i = 0;
      i < weights.length;
      i++
    ) {
      accumulated +=
        weights[i];

      if (
        target <= accumulated
      ) {
        index = i;
        break;
      }

      index = i;
    }

    setActiveWord(
      Math.min(
        ayah.words.length - 1,
        index
      )
    );
  };

  const seekToWord = (
    ayah: (typeof surah.ayahs)[number],
    wordIndex: number
  ) => {
    const audio =
      audioRef.current;

    if (
      !audio ||
      playingAyah !==
        ayah.numberInSurah ||
      !audio.duration ||
      Number.isNaN(audio.duration)
    ) {
      return;
    }

    const weights =
      ayah.words.map(
        (word) =>
          Math.max(
            2,
            word.t.replace(
              /[^\u0600-\u06FF]/g,
              ""
            ).length
          )
      );

    const total =
      weights.reduce(
        (sum, value) =>
          sum + value,
        0
      );

    if (total <= 0) {
      return;
    }

    let before = 0;

    for (
      let i = 0;
      i < wordIndex;
      i++
    ) {
      before +=
        weights[i];
    }

    audio.currentTime =
      (before / total) *
      audio.duration *
      0.96;

    setActiveWord(
      wordIndex
    );

    if (audio.paused) {
      audio.play().catch(() => {});
    }
  };

  /* =========================================================
     AUDIO ENDED
  ========================================================= */

  const onEnded = () => {
    setActiveWord(-1);

    if (
      continuous &&
      playingAyah != null
    ) {
      const next =
        playingAyah + 1;

      const exists =
        surah.ayahs.some(
          (a) =>
            a.numberInSurah ===
            next
        );

      if (exists) {
        playAyah(
          next,
          true
        );
        return;
      }
    }

    setPlayingAyah(null);
    setSurahPlaying(false);
    setContinuous(false);
  };

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

  /* =========================================================
     LOAD SETTINGS
  ========================================================= */

  useEffect(() => {
    try {
      const savedReciter =
        localStorage.getItem(
          "hafiz_reciter"
        );

      if (savedReciter) {
        const found =
          RECITERS.find(
            (x) =>
              x.id ===
              savedReciter
          );

        if (found) {
          setReciter(found);
        }
      }

      const savedFont =
        localStorage.getItem(
          "hafiz_font"
        );

      if (
        savedFont &&
        FONTS.some(
          (x) =>
            x.id ===
            savedFont
        )
      ) {
        setFont(savedFont);
      }

      const savedSize =
        localStorage.getItem(
          "hafiz_fontsize"
        );

      if (savedSize) {
        const parsed =
          Number(savedSize);

        if (
          !Number.isNaN(
            parsed
          )
        ) {
          setFontSize(
            Math.max(
              24,
              Math.min(
                64,
                parsed
              )
            )
          );
        }
      }

      const savedHighlight =
        localStorage.getItem(
          "hafiz_highlight"
        );

      if (
        savedHighlight !== null
      ) {
        setHighlight(
          savedHighlight ===
            "1"
        );
      }

      const savedColor =
        localStorage.getItem(
          "hafiz_hlcolor"
        );

      if (savedColor) {
        setHlColor(
          savedColor
        );
      }

      const savedPaper =
        localStorage.getItem(
          "hafiz_paper"
        );

      if (
        savedPaper &&
        PAPERS.some(
          (p) =>
            p.id ===
            savedPaper
        )
      ) {
        setPaper(savedPaper);
      }
    } catch {
      // localStorage unavailable
    }
  }, []);

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

  const changeSize = (
    delta: number
  ) => {
    setFontSize(
      (current) => {
        const next =
          Math.max(
            24,
            Math.min(
              64,
              current + delta
            )
          );

        try {
          localStorage.setItem(
            "hafiz_fontsize",
            String(next)
          );
        } catch {}

        return next;
      }
    );
  };

  const resetFontSize = () => {
    setFontSize(34);

    try {
      localStorage.setItem(
        "hafiz_fontsize",
        "34"
      );
    } catch {}
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

  const onAyahClick = (
    event: MouseEvent,
    n: number
  ) => {
    event.stopPropagation();

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

      setTafsirAyah(null);

      setSelected(
        (current) =>
          current === n
            ? null
            : n
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
      "--mushaf-font-size":
        `${fontSize}px`,
      lineHeight: 2.5,
    };

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <div
      className="relative min-h-screen"
      onClick={closeMenus}
    >
      <audio
        ref={audioRef}
        onEnded={onEnded}
        onTimeUpdate={
          onTimeUpdate
        }
      />

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

          {/* =================================================
              ROW 2
          ================================================= */}

          <div
            className="
              mt-2
              grid
              grid-cols-3
              gap-2
            "
          >
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

              {showAppearance && (
                <div
                  className="
                    absolute
                    right-0
                    top-full
                    z-[200]
                    mt-2
                    w-[min(310px,calc(100vw-24px))]
                    overflow-hidden
                    rounded-3xl
                    border border-slate-100
                    bg-white
                    p-3
                    shadow-[0_20px_60px_rgba(15,23,42,0.18)]
                  "
                  onClick={(e) =>
                    e.stopPropagation()
                  }
                >
                  <div
                    className="
                      mb-3
                      flex
                      items-center
                      justify-between
                    "
                  >
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
                  </div>
                </div>
              )}
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

              {showFonts && (
                <div
                  className="
                    absolute
                    right-0
                    top-full
                    z-[200]
                    mt-2
                    w-[min(280px,calc(100vw-24px))]
                    overflow-hidden
                    rounded-3xl
                    border border-slate-100
                    bg-white
                    shadow-[0_20px_60px_rgba(15,23,42,0.18)]
                  "
                  onClick={(e) =>
                    e.stopPropagation()
                  }
                >
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
                </div>
              )}
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

                <IconChevron className="h-3 w-3" />
              </button>

              {showReciters && (
                <div
                  className="
                    absolute
                    left-0
                    top-full
                    z-[200]
                    mt-2
                    w-[min(300px,calc(100vw-24px))]
                    overflow-hidden
                    rounded-3xl
                    border border-slate-100
                    bg-white
                    shadow-[0_20px_60px_rgba(15,23,42,0.18)]
                  "
                  onClick={(e) =>
                    e.stopPropagation()
                  }
                >
                  <div
                    className="
                      sticky top-0
                      z-10
                      border-b
                      border-slate-100
                      bg-white
                      px-4 py-3
                    "
                  >
                    <div className="text-sm font-black text-slate-900">
                      القارئ
                    </div>

                    <div className="mt-0.5 text-[10px] text-slate-400">
                      اختر القارئ المفضل لديك
                    </div>
                  </div>

                  <div className="max-h-[45vh] overflow-y-auto p-2">
                    {RECITERS.map(
                      (item) => (
                        <button
                          key={
                            item.id
                          }
                          type="button"
                          onClick={() =>
                            chooseReciter(
                              item
                            )
                          }
                          className={`
                            flex w-full
                            items-center
                            justify-between
                            gap-2
                            rounded-2xl
                            px-3 py-3
                            text-right
                            transition
                            ${
                              item.id ===
                              reciter.id
                                ? "bg-emerald-50"
                                : "hover:bg-slate-50"
                            }
                          `}
                        >
                          <span className="font-bold text-slate-800">
                            {item.name}
                          </span>

                          {item.id ===
                            reciter.id && (
                            <span className="grid h-6 w-6 place-items-center rounded-full bg-emerald-500 text-xs font-black text-white">
                              ✓
                            </span>
                          )}
                        </button>
                      )
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* =====================================================
          MUSHAF PAGE
      ===================================================== */}

      <div
        ref={pageRef}
        className={`
          mushaf-page
          paper-${paper}
          relative z-10
          mx-auto
          max-w-5xl
          overflow-hidden
          px-4 py-6
          sm:px-8 sm:py-10
          md:px-12 md:py-14
          lg:px-16 lg:py-16
          ${
            surahPlaying
              ? "ring-2 ring-emerald-500/30"
              : ""
          }
        `}
      >
        {/* WATERMARK */}

        <span className="mushaf-watermark" />

        {/* CORNERS */}

        <span className="mushaf-corner left-3 top-3 rounded-tl-lg border-l-2 border-t-2" />
        <span className="mushaf-corner right-3 top-3 rounded-tr-lg border-r-2 border-t-2" />
        <span className="mushaf-corner bottom-3 left-3 rounded-bl-lg border-b-2 border-l-2" />
        <span className="mushaf-corner bottom-3 right-3 rounded-br-lg border-b-2 border-r-2" />

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
                            ? "ayah-playing"
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

                                seekToWord(
                                  ayah,
                                  wordIndex
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
                      ayah.numberInSurah &&
                      tafsirAyah !==
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

                              setSelected(
                                null
                              );
                            }}
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
                    rounded-2xl
                    border
                    p-4
                    transition-all
                    sm:p-5
                    ${
                      playingAyah ===
                      ayah.numberInSurah
                        ? "border-emerald-400 bg-emerald-50/60 shadow-md"
                        : "border-sand-300/60 bg-white/70"
                    }
                  `}
                >
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
                    <span
                      className="
                        grid
                        h-8 w-8
                        place-items-center
                        rounded-full
                        text-xs
                        font-bold
                        text-white
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
                        🔊 استماع
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
                    {ayah.text}
                  </p>
                </div>
              )
            )}
          </div>
        )}
      </div>

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
    </div>
  );
}