/**
 * ============================================================================
 * HAFIZ — INTRO SPLASH RECITATIONS (تلاوات شاشة البداية)
 * ----------------------------------------------------------------------------
 * عند فتح الموقع تظهر شاشة الترحيب (الشعار + آية كريمة) وتُتلى آية عطرة.
 * في كل فتح تُختار تلاوة جديدة بالتناوب بين نخبة القرّاء:
 *   • الشيخ ياسر الدوسري  • الشيخ إسلام صبحي  • الشيخ حمزة بوديب
 *   • الشيخ محمد عبادة    • الشيخ شريف مصطفى
 *
 * ملاحظات المصادر (موثّقة فقط، لا روابط مُخترعة):
 *   - ياسر الدوسري: آية/آيتان قصيرتان من everyayah.com (مزامنة للنص حرفياً)
 *   - إسلام صبحي:   بث سور كامل من mp3quran.net
 *   - الباقون:      بث سور قصير كامل من archive.org (الملفات 3 خانات: 089.mp3)
 * ===========================================================================
 */

export type IntroVerse = {
  /** النص القرآني المعروض على الشاشة */
  text: string;
  /** موضع النص (سورة · آية) */
  source: string;
  /** اسم القارئ للعرض */
  reciter: string;
  /** رابط MP3 مباشر وموثّق للتلاوة */
  audioUrl: string;
  /** كود everyayah SSSAAA (لدوسري فقط) — يُستخدم مفتاح تناوب */
  audio?: string;
};

const DOSARI = "https://everyayah.com/data/Yasser_Ad-Dussary_128kbps";

/**
 * كل عنصر = تلاوة واحدة لشاشة البداية. القرّاء الأربعة الجُدُد يتلون سورة
 * قصيرة كاملة (الفاتحة/الفجر/النجم) وتُعرض الآية الافتتاحية للسورة على الشاشة.
 */
export const INTRO_VERSES: IntroVerse[] = [
  // ── الشيخ ياسر الدوسري (كل آية قصيرة مزامنة حرفياً) ──
  {
    text: "وَلَقَدْ يَسَّرْنَا الْقُرْآنَ لِلذِّكْرِ فَهَلْ مِن مُّدَّكِرٍ",
    source: "سورة القمر · ١٧",
    reciter: "الشيخ ياسر الدوسري",
    audioUrl: `${DOSARI}/054017.mp3`,
    audio: "054017",
  },
  {
    text: "الَّذِينَ آمَنُوا وَتَطْمَئِنُّ قُلُوبُهُم بِذِكْرِ اللَّهِ ۗ أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ",
    source: "سورة الرعد · ٢٨",
    reciter: "الشيخ ياسر الدوسري",
    audioUrl: `${DOSARI}/013028.mp3`,
    audio: "013028",
  },
  {
    text: "وَلَلْآخِرَةُ خَيْرٌ لَّكَ مِنَ الْأُولَىٰ",
    source: "سورة الضحى · ٤",
    reciter: "الشيخ ياسر الدوسري",
    audioUrl: `${DOSARI}/093004.mp3`,
    audio: "093004",
  },

  // ── الشيخ إسلام صبحي (mp3quran) — سورة الفجر كاملة ──
  {
    text: "وَالْفَجْرِ",
    source: "سورة الفجر · ١",
    reciter: "الشيخ إسلام صبحي",
    audioUrl: "https://server14.mp3quran.net/islam/Rewayat-Hafs-A-n-Assem/089.mp3",
    audio: "sobhi-fajr",
  },

  // ── الشيخ حمزة بوديب (archive) — سورة الفجر كاملة ──
  {
    text: "وَالْفَجْرِ",
    source: "سورة الفجر · ١",
    reciter: "الشيخ حمزة بوديب",
    audioUrl: "https://archive.org/download/Hamza-Boudib/089.mp3",
    audio: "boudib-fajr",
  },

  // ── الشيخ محمد عبادة (archive · مصحف كامل 114 سورة) — الفاتحة كاملة ──
  {
    text: "الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ",
    source: "سورة الفاتحة · ٢",
    reciter: "الشيخ محمد عبادة",
    audioUrl: `https://archive.org/download/z02402xxxxxxxxxxx/${encodeURIComponent(
      "تلاوة محمد عبادة سورة 001  الفاتحة  mp3.mp3",
    )}`,
    audio: "abbada-fatiha",
  },

  // ── الشيخ شريف مصطفى (archive) — سورة النجم كاملة ──
  {
    text: "وَالنَّجْمِ إِذَا هَوَىٰ",
    source: "سورة النجم · ١",
    reciter: "الشيخ شريف مصطفى",
    audioUrl: "https://archive.org/download/Sherif-Mostafa/053.mp3",
    audio: "sherif-najm",
  },
];

/** اختيار تلاوة بالتناوب (مع تخزين المؤشر بين الزيارات)؛ عشوائي عند الفشل. */
export function pickIntroVerse(): IntroVerse {
  if (typeof window === "undefined") return INTRO_VERSES[0];
  let n = 0;
  try {
    n = parseInt(localStorage.getItem("hafiz_intro_verse_idx") || "0", 10);
    if (Number.isNaN(n)) n = 0;
    localStorage.setItem("hafiz_intro_verse_idx", String((n + 1) % INTRO_VERSES.length));
  } catch {
    n = Math.floor(Math.random() * INTRO_VERSES.length);
  }
  return INTRO_VERSES[n % INTRO_VERSES.length];
}
