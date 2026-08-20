"use client";

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent,
} from "react";

import type { SurahContent } from "@/lib/quran";
import { AyahMarker } from "@/components/AyahMarker";
import { SurahHeader } from "@/components/SurahHeader";
import { saveLastRead } from "@/components/LastRead";

import {
  isSajda,
  SAJDA_DUA,
  SAJDA_DUA_SOURCE,
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

function toDigits(n: number): string {
  return String(n);
}

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
  const [showSettings, setShowSettings] = useState(false);

  const [view, setView] = useState<ViewMode>("mushaf");

  const [selected, setSelected] = useState<number | null>(null);
  const [tafsirAyah, setTafsirAyah] = useState<number | null>(null);

  const [sajdaOpen, setSajdaOpen] = useState(false);

  const [playingAyah, setPlayingAyah] = useState<number | null>(null);
  const [surahPlaying, setSurahPlaying] = useState(false);
  const [continuous, setContinuous] = useState(false);

  const [reciter, setReciter] =
    useState<Reciter>(DEFAULT_RECITER);

  const [progress, setProgress] = useState(0);

  const [highlight, setHighlight] = useState(true);
  const [hlColor, setHlColor] = useState("#10b981");

  const [paper, setPaper] = useState("ivory");

  const [activeWord, setActiveWord] = useState(-1);

  /* =========================================================
     REFS
     ========================================================= */

  const audioRef = useRef<HTMLAudioElement | null>(null);

  const pageRef = useRef<HTMLDivElement | null>(null);

  const ayahRefs = useRef<
    Map<number, HTMLSpanElement>
  >(new Map());

  /* =========================================================
     DATA
     ========================================================= */

  const surahNum = surah.meta.number;

  const tafsir =
    tafsirAyah != null
      ? surah.ayahs.find(
          (a) => a.numberInSurah === tafsirAyah
        ) ?? null
      : null;

  const isPlaying =
    playingAyah !== null || surahPlaying;

  /* =========================================================
     AUDIO
     ========================================================= */

  const playAyah = (
    n: number,
    chain: boolean
  ) => {
    const ayah = surah.ayahs.find(
      (a) => a.numberInSurah === n
    );

    if (!ayah || !audioRef.current) {
      return;
    }

    const reciterToUse = hasPerAyah(reciter)
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

    const audio = audioRef.current;

    audio.pause();
    audio.src = url;
    audio.currentTime = 0;

    audio.play().catch(() => {
      setPlayingAyah(null);
    });
  };

  const playFullSurah = () => {
    const firstAyah = surah.ayahs[0];

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
    const audio = audioRef.current;

    if (audio) {
      audio.pause();
      audio.currentTime = 0;
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
    const audio = audioRef.current;

    if (
      !audio ||
      !highlight ||
      playingAyah == null ||
      !audio.duration ||
      Number.isNaN(audio.duration)
    ) {
      return;
    }

    const ayah = surah.ayahs.find(
      (x) => x.numberInSurah === playingAyah
    );

    if (!ayah || ayah.words.length === 0) {
      return;
    }

    const duration = audio.duration;

    const time = Math.max(
      0,
      audio.currentTime - duration * 0.02
    );

    const weights = ayah.words.map((word) =>
      Math.max(
        2,
        word.t.replace(
          /[^\u0600-\u06FF]/g,
          ""
        ).length
      )
    );

    const total = weights.reduce(
      (sum, value) => sum + value,
      0
    );

    if (total <= 0) {
      return;
    }

    const target =
      (time / (duration * 0.96)) * total;

    let accumulated = 0;
    let index = 0;

    for (let i = 0; i < weights.length; i++) {
      accumulated += weights[i];

      if (target <= accumulated) {
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
    const audio = audioRef.current;

    if (
      !audio ||
      playingAyah !== ayah.numberInSurah ||
      !audio.duration ||
      Number.isNaN(audio.duration)
    ) {
      return;
    }

    const weights = ayah.words.map((word) =>
      Math.max(
        2,
        word.t.replace(
          /[^\u0600-\u06FF]/g,
          ""
        ).length
      )
    );

    const total = weights.reduce(
      (sum, value) => sum + value,
      0
    );

    if (total <= 0) {
      return;
    }

    let before = 0;

    for (let i = 0; i < wordIndex; i++) {
      before += weights[i];
    }

    audio.currentTime =
      (before / total) *
      audio.duration *
      0.96;

    setActiveWord(wordIndex);

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
            a.numberInSurah === next
        );

      if (exists) {
        playAyah(next, true);
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
              x.id === savedReciter
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
          (x) => x.id === savedFont
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

        if (!Number.isNaN(parsed)) {
          setFontSize(
            Math.max(
              24,
              Math.min(64, parsed)
            )
          );
        }
      }

      const savedHighlight =
        localStorage.getItem(
          "hafiz_highlight"
        );

      if (savedHighlight !== null) {
        setHighlight(
          savedHighlight === "1"
        );
      }

      const savedColor =
        localStorage.getItem(
          "hafiz_hlcolor"
        );

      if (savedColor) {
        setHlColor(savedColor);
      }

      const savedPaper =
        localStorage.getItem(
          "hafiz_paper"
        );

      if (savedPaper) {
        setPaper(savedPaper);
      }
    } catch {
      // تجاهل أخطاء localStorage
    }
  }, []);

  /* =========================================================
     FONT
     ========================================================= */

  const chooseFont = (id: string) => {
    setFont(id);
    setShowFonts(false);

    try {
      localStorage.setItem(
        "hafiz_font",
        id
      );
    } catch {
      // ignore
    }
  };

  /* =========================================================
     FONT SIZE — FIXED
     ========================================================= */

  const changeSize = (delta: number) => {
    setFontSize((current) => {
      const next = Math.max(
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
      } catch {
        // ignore
      }

      return next;
    });
  };

  const resetFontSize = () => {
    setFontSize(34);

    try {
      localStorage.setItem(
        "hafiz_fontsize",
        "34"
      );
    } catch {
      // ignore
    }
  };

  /* =========================================================
     RECITER
     ========================================================= */

  const chooseReciter = (
    nextReciter: Reciter
  ) => {
    setReciter(nextReciter);
    setShowReciters(false);

    stopAudio();

    try {
      localStorage.setItem(
        "hafiz_reciter",
        nextReciter.id
      );
    } catch {
      // ignore
    }
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

      const scrolled = Math.min(
        Math.max(-rect.top, 0),
        Math.max(total, 1)
      );

      setProgress(
        total > 0
          ? Math.round(
              (scrolled / total) * 100
            )
          : 0
      );
    };

    window.addEventListener(
      "scroll",
      onScroll,
      { passive: true }
    );

    onScroll();

    return () => {
      window.removeEventListener(
        "scroll",
        onScroll
      );
    };
  }, [view, fontSize]);

  /* =========================================================
     ESC
     ========================================================= */

  useEffect(() => {
    const onKeyDown = (
      event: KeyboardEvent
    ) => {
      if (event.key !== "Escape") {
        return;
      }

      setSelected(null);
      setTafsirAyah(null);
      setShowFonts(false);
      setShowReciters(false);
      setShowSettings(false);
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

    setSelected((current) =>
      current === n
        ? null
        : n
    );
  };

  const openTafsirInline = (
    ayah: number
  ) => {
    setTafsirAyah(ayah);
  };

  const openTafsir = (
    ayah: number
  ) => {
    setSelected(null);
    setTafsirAyah(ayah);
  };

  /* =========================================================
     CLOSE MENUS
     ========================================================= */

  const closeMenus = () => {
    setSelected(null);
    setShowReciters(false);
    setShowFonts(false);
    setShowSettings(false);
    setTafsirAyah(null);
  };

  /* =========================================================
     FONT STYLE
     ========================================================= */

  const mushafTextStyle: MushafTextStyle = {
    "--mushaf-font-size":
      `${fontSize}px`,
    lineHeight: 2.5,
  };

  /* =========================================================
     RENDER
     ========================================================= */

  return (
    <div onClick={closeMenus}>
      <audio
        ref={audioRef}
        onEnded={onEnded}
        onTimeUpdate={onTimeUpdate}
      />

      {/* =====================================================
          PROGRESS
      ===================================================== */}

      <div className="fixed inset-x-0 top-0 z-[60] h-1">
        <div
          className="h-full transition-[width] duration-150"
          style={{
            width: `${progress}%`,
            background:
              "linear-gradient(90deg,#10b981,#3b82f6)",
          }}
        />
      </div>

      {/* =====================================================
          TOOLBAR
      ===================================================== */}

      <div
        className="
          sticky top-16 z-30 mb-4
          flex flex-wrap items-center
          justify-between gap-2
          rounded-2xl
          border border-gold-500/20
          bg-white/95
          p-2
          shadow-lg
          backdrop-blur
        "
      >
        {/* VIEW */}

        <div className="flex items-center gap-1 rounded-xl bg-cream-100 p-1">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setView("mushaf");
            }}
            className={`
              rounded-lg px-3 py-1.5
              text-xs font-semibold
              transition sm:text-sm
              ${
                view === "mushaf"
                  ? "bg-white text-emerald-700 shadow"
                  : "text-ink-500 hover:text-emerald-600"
              }
            `}
          >
            مصحف
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setView("ayah");
            }}
            className={`
              rounded-lg px-3 py-1.5
              text-xs font-semibold
              transition sm:text-sm
              ${
                view === "ayah"
                  ? "bg-white text-emerald-700 shadow"
                  : "text-ink-500 hover:text-emerald-600"
              }
            `}
          >
            آية بآية
          </button>
        </div>

        {/* =================================================
            FONT SIZE
        ================================================= */}

        <div
          className="
            mushaf-size-control
            flex items-center
            gap-1 sm:gap-2
            rounded-xl
            bg-cream-100/60
            px-2 py-1
          "
          onClick={(e) =>
            e.stopPropagation()
          }
        >
          <button
            type="button"
            onClick={() =>
              changeSize(-2)
            }
            className="mushaf-control-btn"
            aria-label="تصغير حجم المصحف"
            title="تصغير"
          >
            −
          </button>

          <button
            type="button"
            onClick={resetFontSize}
            className="
              mushaf-font-size
              min-w-[55px]
              cursor-pointer
              rounded-lg
              px-2 py-1
              text-center
              font-bold
            "
            title="إعادة الحجم الافتراضي"
          >
            {fontSize}px
          </button>

          <button
            type="button"
            onClick={() =>
              changeSize(2)
            }
            className="mushaf-control-btn"
            aria-label="تكبير حجم المصحف"
            title="تكبير"
          >
            +
          </button>
        </div>

        {/* =================================================
            FONT SELECTOR
        ================================================= */}

        <div
          className="relative"
          onClick={(e) =>
            e.stopPropagation()
          }
        >
          <button
            type="button"
            onClick={() => {
              setShowFonts(
                (value) => !value
              );
              setShowReciters(false);
            }}
            className="
              flex items-center gap-1
              rounded-lg
              btn-ghost
              px-2 py-1.5
              text-xs sm:text-sm
            "
          >
            <span>خط</span>
            <span className="text-ink-500">
              ▾
            </span>
          </button>

          {showFonts && (
            <div
              className="
                ayah-pop absolute
                left-0 top-full z-50 mt-1
                w-48 overflow-hidden
                rounded-xl
                border border-sand-300
                bg-white
                shadow-xl
              "
            >
              {FONTS.map((item) => (
                <button
                  type="button"
                  key={item.id}
                  onClick={() =>
                    chooseFont(
                      item.id
                    )
                  }
                  className={`
                    flex w-full
                    items-center
                    justify-between
                    px-3 py-2
                    text-right text-xs
                    transition
                    hover:bg-cream-100
                    ${
                      font === item.id
                        ? "bg-cream-100"
                        : ""
                    }
                  `}
                >
                  <span
                    className={`text-lg ${item.id}`}
                    style={{
                      color: "#071a1c",
                    }}
                  >
                    بِسْمِ
                  </span>

                  <span className="text-[10px] text-ink-500">
                    {item.label}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* =================================================
            RECITER
        ================================================= */}

        <div
          className="relative"
          onClick={(e) =>
            e.stopPropagation()
          }
        >
          <button
            type="button"
            onClick={() =>
              setShowReciters(
                (value) => !value
              )
            }
            className="
              flex items-center gap-1
              rounded-lg
              btn-ghost
              px-2 py-1.5
              text-xs sm:text-sm
            "
          >
            <span>🎙</span>

            <span className="hidden max-w-[60px] truncate sm:inline">
              {reciter.name}
            </span>

            <span className="text-ink-500">
              ▾
            </span>
          </button>

          {showReciters && (
            <div
              className="
                ayah-pop absolute
                left-0 top-full z-[60]
                mt-1 max-h-[50vh]
                w-48 overflow-y-auto
                rounded-xl
                border border-sand-300
                bg-white
                shadow-xl
              "
            >
              <div
                className="
                  sticky top-0
                  border-b border-sand-300
                  bg-white
                  px-3 py-1.5
                  text-[10px]
                  font-bold
                  text-emerald-700
                "
              >
                اختر القارئ
              </div>

              {RECITERS.map((item) => (
                <button
                  type="button"
                  key={item.id}
                  onClick={() =>
                    chooseReciter(
                      item
                    )
                  }
                  className={`
                    flex w-full
                    items-center
                    justify-between
                    px-3 py-2
                    text-right text-xs
                    transition
                    hover:bg-cream-100
                    ${
                      item.id ===
                      reciter.id
                        ? "bg-cream-100"
                        : ""
                    }
                  `}
                >
                  <span className="font-semibold text-ink-900">
                    {item.name}
                  </span>

                  {item.id ===
                    reciter.id && (
                    <span className="text-emerald-700">
                      ✓
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* =================================================
            AUDIO
        ================================================= */}

        <div className="flex items-center gap-1">
          {isPlaying ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                stopAudio();
              }}
              className="
                rounded-lg
                bg-red-600
                px-3 py-1.5
                text-xs
                font-semibold
                text-white
                transition
                hover:bg-red-700
              "
            >
              ■ إيقاف
            </button>
          ) : (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                playFullSurah();
              }}
              className="
                rounded-lg
                btn-primary
                px-3 py-1.5
                text-xs
                font-semibold
              "
            >
              ▶ تلاوة
            </button>
          )}
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
        <span className="mushaf-watermark" />

        <span className="mushaf-corner left-3 top-3 rounded-tl-lg border-l-2 border-t-2" />
        <span className="mushaf-corner right-3 top-3 rounded-tr-lg border-r-2 border-t-2" />
        <span className="mushaf-corner bottom-3 left-3 rounded-bl-lg border-b-2 border-l-2" />
        <span className="mushaf-corner bottom-3 right-3 rounded-br-lg border-b-2 border-r-2" />

        <SurahHeader
          nameAr={surah.meta.nameAr}
          revelation={surah.meta.revelation}
          ayahCount={surah.meta.ayahCount}
          juz={surah.meta.juz}
        />

        {/* =================================================
            BASMALA
        ================================================= */}

        {surah.basmala && (
          <div className="mb-6 text-center">
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
                backgroundClip: "text",
                color: "transparent",
              }}
            >
              بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
            </div>

            <div className="basmala-ornament mx-auto mt-4 max-w-sm" />
          </div>
        )}

        {/* =================================================
            MUSHAF VIEW
        ================================================= */}

        {view === "mushaf" && (
          <div className="mushaf-content">
            <p
              className={`mushaf-text ${font}`}
              dir="rtl"
              style={mushafTextStyle}
            >
              {surah.ayahs.map((ayah) => (
                <span
                  key={ayah.numberInSurah}
                >
                  {/* =========================================
                      AYAH
                  ========================================= */}

                  <span
                    ref={(element) => {
                      if (element) {
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
                    onClick={(event) =>
                      onAyahClick(
                        event,
                        ayah.numberInSurah
                      )
                    }
                    onKeyDown={(event) => {
                      if (
                        event.key ===
                          "Enter" ||
                        event.key ===
                          " "
                      ) {
                        event.preventDefault();

                        onAyahClick(
                          event as unknown as MouseEvent,
                          ayah.numberInSurah
                        );
                      }
                    }}
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
                    {/* =======================================
                        WORD HIGHLIGHT
                    ======================================= */}

                    {highlight &&
                    playingAyah ===
                      ayah.numberInSurah ? (
                      ayah.words.map(
                        (word, wordIndex) => (
                          <span
                            key={wordIndex}
                            onClick={(event) => {
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
                            {word.t}{" "}
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

                  {/* =========================================
                      SAJDA
                  ========================================= */}

                  {isSajda(
                    surah.meta.number,
                    ayah.numberInSurah
                  ) && (
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        setSajdaOpen(true);
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

                  {/* =========================================
                      AYAH ACTIONS
                  ========================================= */}

                  {selected ===
                    ayah.numberInSurah &&
                    tafsirAyah !==
                      ayah.numberInSurah && (
                      <span
                        className="ayah-inline-actions"
                        contentEditable={false}
                        onClick={(event) =>
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
                            setSelected(null);
                          }}
                          className="ayah-chip ayah-chip-listen"
                        >
                          🔊 استماع
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            setSelected(null)
                          }
                          className="ayah-chip ayah-chip-close"
                        >
                          ✕
                        </button>
                      </span>
                    )}

                  {/* =========================================
                      INLINE TAFSIR
                  ========================================= */}

                  {tafsirAyah ===
                    ayah.numberInSurah && (
                    <span
                      className="ayah-tafsir-inline"
                      contentEditable={false}
                      onClick={(event) =>
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
              ))}
            </p>
          </div>
        )}

        {/* =================================================
            AYAH BY AYAH VIEW
        ================================================= */}

        {view === "ayah" && (
          <div
            className="space-y-4"
            dir="rtl"
          >
            {surah.ayahs.map((ayah) => (
              <div
                key={ayah.numberInSurah}
                className={`
                  rounded-2xl
                  border
                  p-4
                  transition
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
                        rounded-lg
                        btn-ghost
                        px-3 py-1.5
                        text-xs
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
                        rounded-lg
                        btn-ghost
                        px-3 py-1.5
                        text-xs
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
            ))}
          </div>
        )}
      </div>

      {/* =====================================================
          HELP TEXT
      ===================================================== */}

      <p className="mt-4 text-center text-xs text-ink-500">
        {view === "mushaf" && (
  <div className="mushaf-content">
    <p
      key={`mushaf-${fontSize}-${font}`}
      className={`mushaf-text ${font}`}
      dir="rtl"
      style={{
        fontSize: `${fontSize}px`,
        lineHeight: 2.5,
      }}
    >
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
            <button onClick={(e) => { e.stopPropagation(); setSajdaOpen(true); }} title="موضع سجدة" className="mx-1 inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 align-middle text-[11px] font-bold text-amber-700">۩ سجدة</button>
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