export type Reciter = {
  id: string;
  name: string;
  style: string;
  // per-ayah audio
  cdnEdition?: string; // cdn.islamic.network edition (uses global ayah number)
  everyayahFolder?: string; // everyayah.com folder (uses surah:ayah)
  // full-surah audio
  surahBase?: string;
  surahList?: number[]; // omit = all 114
};

const ALL_SURAHS = Array.from({ length: 114 }, (_, i) => i + 1);

export const DOSARI_FOLDER = "Yasser_Ad-Dussary_128kbps"; // everyayah per-ayah
export const DOSARI_SURAH_BASE = "https://server11.mp3quran.net/yasser"; // full surah
export const SHARIF_SURAHS = [13, 15, 19, 20, 31, 32, 53, 55, 56, 57, 60, 61, 62, 63, 64, 65, 66, 67, 71, 75, 76, 77, 89];
export const SHARIF_BASE = "https://ia801500.us.archive.org/1/items/Sherif-Mostafa";

export const RECITERS: Reciter[] = [
  { id: "dosari", name: "ياسر الدوسري", style: "مرتل · خاشع مؤثّر", everyayahFolder: DOSARI_FOLDER, surahBase: DOSARI_SURAH_BASE, surahList: ALL_SURAHS },
  { id: "sharif", name: "شريف مصطفى", style: "مرتل · عذب", surahBase: SHARIF_BASE, surahList: SHARIF_SURAHS },
  { id: "maher", name: "ماهر المعيقلي", style: "مرتل · هادئ", cdnEdition: "ar.mahermuaiqly" },
  { id: "ajamy", name: "أحمد العجمي", style: "مرتل · خاشع", cdnEdition: "ar.ahmedajamy" },
  { id: "shatri", name: "أبو بكر الشاطري", style: "مرتل · عذب", cdnEdition: "ar.shaatree" },
  { id: "afasy", name: "مشاري العفاسي", style: "مرتل · نديّ", cdnEdition: "ar.alafasy" },
];

export const DEFAULT_RECITER = RECITERS[0];

function pad3(n: number): string {
  return String(n).padStart(3, "0");
}

// Per-ayah URL. Needs surahNumber + numberInSurah for everyayah, globalNumber for CDN.
export function ayahUrl(r: Reciter, surahNumber: number, numberInSurah: number, globalNumber: number): string | null {
  if (r.everyayahFolder) {
    return `https://everyayah.com/data/${r.everyayahFolder}/${pad3(surahNumber)}${pad3(numberInSurah)}.mp3`;
  }
  if (r.cdnEdition) {
    return `https://cdn.islamic.network/quran/audio/128/${r.cdnEdition}/${globalNumber}.mp3`;
  }
  return null; // full-surah-only reciter
}

export function surahUrl(r: Reciter, surahNumber: number): string | null {
  if (r.surahBase && (!r.surahList || r.surahList.includes(surahNumber))) {
    return `${r.surahBase}/${pad3(surahNumber)}.mp3`;
  }
  return null;
}

// Can this reciter play an individual ayah?
export function hasPerAyah(r: Reciter): boolean {
  return !!(r.everyayahFolder || r.cdnEdition);
}

// Fallback per-ayah reciter when the chosen one is full-surah only.
export function perAyahFallback(): Reciter {
  return RECITERS.find((r) => hasPerAyah(r))!;
}
