export type Reciter = {
  id: string;
  name: string;
  style: string;
  cdnEdition?: string; // cdn.islamic.network edition (uses global ayah number)
  everyayahFolder?: string; // everyayah.com folder (uses surah:ayah)
  surahBase?: string; // full-surah audio base
  surahList?: number[]; // surahs available for full-surah reciters
};

const ALL_SURAHS = Array.from({ length: 114 }, (_, i) => i + 1);

export const DOSARI_FOLDER = "Yasser_Ad-Dussary_128kbps";
export const DOSARI_SURAH_BASE = "https://server11.mp3quran.net/yasser";

const ISLAM_SOBHI_SURAHS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89, 90, 91, 92, 93, 94, 95, 96, 97, 98, 99, 100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114];

// All reciters below use everyayah.com per-ayah folders (verified, CORS-enabled),
// so every ayah in every surah works reliably.
export const RECITERS: Reciter[] = [
  { id: "dosari", name: "ياسر الدوسري", style: "مرتل · خاشع مؤثّر", everyayahFolder: DOSARI_FOLDER, surahBase: DOSARI_SURAH_BASE, surahList: ALL_SURAHS },
  { id: "islam_sobhi", name: "إسلام صبحي", style: "مرتل · هادئ مؤثّر", surahBase: "https://server14.mp3quran.net/islam/Rewayat-Hafs-A-n-Assem", surahList: ISLAM_SOBHI_SURAHS },
  { id: "sherif_mostafa", name: "شريف مصطفى", style: "مرتل · عذب (سور مختارة)", surahBase: "https://ia601502.us.archive.org/1/items/Sherif-Mostafa", surahList: [13, 15, 19, 20, 31, 32, 53, 55, 56, 57, 60, 61, 62, 63, 64, 65, 66, 67, 71, 75, 76, 77, 89] },
  { id: "hamza_boudib", name: "حمزة بوديب", style: "مرتل · مؤثّر (سور مختارة)", surahBase: "https://ia601502.us.archive.org/15/items/Hamza-Boudib", surahList: [16, 21, 44, 50, 53, 55, 56, 59, 67, 68, 70, 74, 77, 78, 83, 89] },
  { id: "afasy", name: "مشاري العفاسي", style: "مرتل · نديّ", everyayahFolder: "Alafasy_128kbps" },
  { id: "husary", name: "محمود الحصري", style: "مرتل · كلاسيكي", everyayahFolder: "Husary_128kbps" },
  { id: "abdulbasit", name: "عبد الباسط عبد الصمد", style: "مرتل · مجوّد", everyayahFolder: "Abdul_Basit_Murattal_192kbps" },
  { id: "minshawi", name: "محمد صديق المنشاوي", style: "مرتل · خاشع", everyayahFolder: "Minshawy_Murattal_128kbps" },
  { id: "sudais", name: "عبد الرحمن السديس", style: "إمام الحرم", everyayahFolder: "Abdurrahmaan_As-Sudais_192kbps" },
  { id: "shuraim", name: "سعود الشريم", style: "إمام الحرم", everyayahFolder: "Saood_ash-Shuraym_128kbps" },
  { id: "ghamdi", name: "سعد الغامدي", style: "مرتل · عذب", everyayahFolder: "Ghamadi_40kbps" },
  { id: "shatri", name: "أبو بكر الشاطري", style: "مرتل · عذب", everyayahFolder: "Abu_Bakr_Ash-Shaatree_128kbps" },
  { id: "ajamy", name: "أحمد العجمي", style: "مرتل · خاشع", everyayahFolder: "ahmed_ibn_ali_al_ajamy_128kbps" },
  { id: "maher", name: "ماهر المعيقلي", style: "إمام الحرم · هادئ", everyayahFolder: "Maher_AlMuaiqly_64kbps" },
  { id: "tablawi", name: "محمد الطبلاوي", style: "مرتل · مصري", everyayahFolder: "Mohammad_al_Tablaway_128kbps" },
];

export const DEFAULT_RECITER = RECITERS[0];

function pad3(n: number): string {
  return String(n).padStart(3, "0");
}

export function ayahUrl(r: Reciter, surahNumber: number, numberInSurah: number, globalNumber: number): string | null {
  if (r.everyayahFolder) {
    return `https://everyayah.com/data/${r.everyayahFolder}/${pad3(surahNumber)}${pad3(numberInSurah)}.mp3`;
  }
  if (r.cdnEdition) {
    return `https://cdn.islamic.network/quran/audio/128/${r.cdnEdition}/${globalNumber}.mp3`;
  }
  return null;
}

export function surahUrl(r: Reciter, surahNumber: number): string | null {
  if (r.surahBase && (!r.surahList || r.surahList.includes(surahNumber))) {
    return `${r.surahBase}/${pad3(surahNumber)}.mp3`;
  }
  return null;
}

export function hasPerAyah(r: Reciter): boolean {
  return !!(r.everyayahFolder || r.cdnEdition);
}

export function perAyahFallback(): Reciter {
  return RECITERS.find((r) => hasPerAyah(r))!;
}
