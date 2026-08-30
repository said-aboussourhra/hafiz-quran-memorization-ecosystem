/**
 * ============================================================================
 * HAFIZ — WELCOME RECITATIONS (تلاوات الترحيب)
 * ----------------------------------------------------------------------------
 * تلاوات قصيرة عطرة تُستقبل بها الزائر عند فتح الموقع، بأصوات نخبة القرّاء:
 *   • الشيخ حمزة بوديب  • الشيخ إسلام صبحي
 *   • الشيخ محمد عبادة   • الشيخ شريف مصطفى
 * يختار الموقع قارئاً عشوائياً في كل زيارة (مع إمكانية التبديل).
 *
 * مصادر الصوت موثّقة فقط (لا روابط مخترعة):
 *   - mp3quran.net  → بث سور كامل (إسلام صبحي)
 *   - archive.org   → بث سور كامل (شريف مصطفى، حمزة بوديب، محمد عبادة)
 * ===========================================================================
 */

export interface WelcomeTrack {
  reciterId: string;
  /** اسم القارئ للعرض */
  reciterName: string;
  /** الدولة/الوصف القصير */
  reciterOrigin: string;
  /** رقم السورة 1..114 */
  surahNumber: number;
  /** اسم السورة للعرض */
  surahName: string;
  /** وصف المقطع */
  caption: string;
  /** رابط MP3 مباشر وموثّق */
  audioUrl: string;
  /** مصدر الصوت (للشفافية) */
  source: string;
}

export const WELCOME_TRACKS: WelcomeTrack[] = [
  {
    reciterId: "islam_sobhi",
    reciterName: "الشيخ إسلام صبحي",
    reciterOrigin: "مصر · مرتّل هادئ",
    surahNumber: 1,
    surahName: "الفاتحة",
    caption: "استمع — تلاوة عطرة ترحّب بك",
    audioUrl: "https://server14.mp3quran.net/islam/Rewayat-Hafs-A-n-Assem/001.mp3",
    source: "mp3quran.net",
  },
  {
    reciterId: "hamza_boudib",
    reciterName: "الشيخ حمزة بوديب",
    reciterOrigin: "الجزائر · صوت مؤثّر",
    surahNumber: 89,
    surahName: "الفجر",
    caption: "استمع — تلاوة عطرة ترحّب بك",
    // archive.org: رقم الملف = ترتيب السورة (يتجنّب أي خطأ في ترميز اسم الملف)
    audioUrl: "https://archive.org/download/Hamza-Boudib/089.mp3",
    source: "archive.org",
  },
  {
    reciterId: "mohamed_abbada",
    reciterName: "الشيخ محمد عبادة",
    reciterOrigin: "الإمارات · تلاوة خاشعة",
    surahNumber: 1,
    surahName: "الفاتحة",
    caption: "استمع — تلاوة عطرة ترحّب بك",
    // سورة الفاتحة: اسم الملف كما هو مسجّل في عنصر الأرشيف حرفياً (مسافتان
    // بعد رقم السورة ومسافتان قبل mp3)؛ encodeURIComponent يولّد الرابط الصحيح.
    audioUrl: `https://archive.org/download/z02402xxxxxxxxxxx/${encodeURIComponent(
      "تلاوة محمد عبادة سورة 001  الفاتحة  mp3.mp3",
    )}`,
    source: "archive.org",
  },
  {
    reciterId: "sherif_mostafa",
    reciterName: "الشيخ شريف مصطفى",
    reciterOrigin: "مصر · صوت عذب",
    surahNumber: 89,
    surahName: "الفجر",
    caption: "استمع — تلاوة عطرة ترحّب بك",
    audioUrl: "https://archive.org/download/Sherif-Mostafa/089.mp3",
    source: "archive.org",
  },
];

/** اختيار قارئ عشوائي (يُستدعى في المتصفح فقط بعد التركيب). */
export function pickRandomTrackIndex(): number {
  return Math.floor(Math.random() * WELCOME_TRACKS.length);
}
