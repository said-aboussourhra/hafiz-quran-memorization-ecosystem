// HAFIZ Mutashabihat (Similar Verses) Knowledge Base
// Helps memorizers distinguish and master verses with subtle differences across the Quran.

export interface MutashabihVerse {
  surahNumber: number;
  surahNameAr: string;
  ayahNumber: number;
  fullText: string;
  keyWordDiff: string; // The distinct phrase/word in this ayah
  diffStartIndex?: number;
}

export interface MutashabihGroup {
  id: string;
  titleAr: string;
  theme: string;
  mnemonicHint: string; // ضابط الحفظ وقاعدة التمييز
  verses: MutashabihVerse[];
}

export const MUTASHABIHAT_CATALOG: MutashabihGroup[] = [
  {
    id: "huda_wa_bushra",
    titleAr: "هُدًى وَبُشْرَىٰ vs هُدًى وَرَحْمَةً",
    theme: "وصف القرآن للمؤمنين والمحسنين",
    mnemonicHint: "سورة البقرة والنمل: «هُدًى وَبُشْرَىٰ لِلْمُؤْمِنِينَ» · سورة لقمان: «هُدًى وَرَحْمَةً لِّلْمُحْسِنِينَ»",
    verses: [
      {
        surahNumber: 27,
        surahNameAr: "النمل",
        ayahNumber: 2,
        fullText: "هُدًى وَبُشْرَىٰ لِلْمُؤْمِنِينَ",
        keyWordDiff: "وَبُشْرَىٰ لِلْمُؤْمِنِينَ",
      },
      {
        surahNumber: 31,
        surahNameAr: "لقمان",
        ayahNumber: 3,
        fullText: "هُدًى وَرَحْمَةً لِّلْمُحْسِنِينَ",
        keyWordDiff: "وَرَحْمَةً لِّلْمُحْسِنِينَ",
      },
    ],
  },
  {
    id: "fadhkuruni_washkuru",
    titleAr: "فَاذْكُرُونِي vs وَاشْكُرُوا لِي",
    theme: "الذكر والشكر في سورة البقرة",
    mnemonicHint: "الآية ١٥٢ من البقرة تجمع بين الذكر أولاً ثم الشكر والنهي عن الكفران.",
    verses: [
      {
        surahNumber: 2,
        surahNameAr: "البقرة",
        ayahNumber: 152,
        fullText: "فَاذْكُرُونِي أَذْكُرْكُمْ وَاشْكُرُوا لِي وَلَا تَكْفُرُونِ",
        keyWordDiff: "فَاذْكُرُونِي أَذْكُرْكُمْ",
      },
      {
        surahNumber: 2,
        surahNameAr: "البقرة",
        ayahNumber: 172,
        fullText: "يَا أَيُّهَا الَّذِينَ آمَنُوا كُلُوا مِن طَيِّبَاتِ مَا رَزَقْنَاكُمْ وَاشْكُرُوا لِلَّهِ إِن كُنتُمْ إِيَّاهُ تَعْبُدُونَ",
        keyWordDiff: "وَاشْكُرُوا لِلَّهِ",
      },
    ],
  },
  {
    id: "sari_wa_sabiqu",
    titleAr: "وَسَارِعُوا vs سَابِقُوا",
    theme: "المسارعة إلى مغفرة الله",
    mnemonicHint: "في آل عمران جاءت بـ «وَسَارِعُوا» مع الواو · وفي الحديد جاءت بـ «سَابِقُوا» بدون واو وبزيادة «وَرِضْوَانٍ».",
    verses: [
      {
        surahNumber: 3,
        surahNameAr: "آل عمران",
        ayahNumber: 133,
        fullText: "وَسَارِعُوا إِلَىٰ مَغْفِرَةٍ مِّن رَّبِّكُمْ وَجَنَّةٍ عَرْضُهَا السَّمَاوَاتُ وَالْأَرْضُ أُعِدَّتْ لِلْمُتَّقِينَ",
        keyWordDiff: "وَسَارِعُوا ... أُعِدَّتْ لِلْمُتَّقِينَ",
      },
      {
        surahNumber: 57,
        surahNameAr: "الحديد",
        ayahNumber: 21,
        fullText: "سَابِقُوا إِلَىٰ مَغْفِرَةٍ مِّن رَّبِّكُمْ وَجَنَّةٍ عَرْضُهَا كَعَرْضِ السَّمَاءِ وَالْأَرْضِ أُعِدَّتْ لِلَّذِينَ آمَنُوا بِاللَّهِ وَرُسُلِهِ",
        keyWordDiff: "سَابِقُوا ... كَعَرْضِ السَّمَاءِ ... لِلَّذِينَ آمَنُوا",
      },
    ],
  },
  {
    id: "fabiayyi_ala",
    titleAr: "فَبِأَيِّ آلَاءِ رَبِّكُمَا تُكَذِّبَانِ",
    theme: "فواصل سورة الرحمن",
    mnemonicHint: "تكررت ٣١ مرة في سورة الرحمن بعد ذكر نعم الله الدنيوية والبرزخية ونعيم الجنان وعقاب النار.",
    verses: [
      {
        surahNumber: 55,
        surahNameAr: "الرحمن",
        ayahNumber: 13,
        fullText: "فَبِأَيِّ آلَاءِ رَبِّكُمَا تُكَذِّبَانِ",
        keyWordDiff: "فَبِأَيِّ آلَاءِ رَبِّكُمَا تُكَذِّبَانِ",
      },
      {
        surahNumber: 55,
        surahNameAr: "الرحمن",
        ayahNumber: 16,
        fullText: "فَبِأَيِّ آلَاءِ رَبِّكُمَا تُكَذِّبَانِ",
        keyWordDiff: "فَبِأَيِّ آلَاءِ رَبِّكُمَا تُكَذِّبَانِ",
      },
    ],
  },
  {
    id: "in_tubdu_wa_in_tukhfu",
    titleAr: "إِن تُبْدُوا مَا فِي أَنفُسِكُمْ أَوْ تُخْفُوهُ",
    theme: "ما في النفوس في البقرة وآل عمران",
    mnemonicHint: "في البقرة: «يُحَاسِبْكُم بِهِ اللَّهُ» · في آل عمران: «يَعْلَمْهُ اللَّهُ»",
    verses: [
      {
        surahNumber: 2,
        surahNameAr: "البقرة",
        ayahNumber: 284,
        fullText: "وَإِن تُبْدُوا مَا فِي أَنفُسِكُمْ أَوْ تُخْفُوهُ يُحَاسِبْكُم بِهِ اللَّهُ",
        keyWordDiff: "يُحَاسِبْكُم بِهِ اللَّهُ",
      },
      {
        surahNumber: 3,
        surahNameAr: "آل عمران",
        ayahNumber: 29,
        fullText: "قُلْ إِن تُخْفُوا مَا فِي صُدُورِكُمْ أَوْ تُبْدُوهُ يَعْلَمْهُ اللَّهُ",
        keyWordDiff: "يَعْلَمْهُ اللَّهُ",
      },
    ],
  },
];

export function getMutashabihatForSurah(surahNumber: number): MutashabihGroup[] {
  return MUTASHABIHAT_CATALOG.filter((group) =>
    group.verses.some((v) => v.surahNumber === surahNumber)
  );
}

export function getRandomMutashabih(): MutashabihGroup {
  const idx = Math.floor(Math.random() * MUTASHABIHAT_CATALOG.length);
  return MUTASHABIHAT_CATALOG[idx];
}
