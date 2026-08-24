/**
 * ============================================================================
 *  HAFIZ — GLOBAL RECITER + RECORDING REGISTRY
 * ============================================================================
 *  Extensible, data-driven catalog. Adding a new reciter or hundreds of
 *  recordings requires NO UI changes: the reader/library/reciter pages render
 *  straight from this registry.
 *
 *  HONESTY POLICY
 *  --------------
 *  We never invent audio URLs, YouTube IDs, images, biographies, or
 *  availability. If a fact is not verified it MUST be `null` / "unavailable".
 *  Only real, reachable sources are wired up (everyayah.com per-ayah folders
 *  and mp3quran full-surah streams), exactly as the existing reader used them.
 *
 *  Sources used (already shipped in the app):
 *   - everyayah.com  → per-ayah mp3 (gapless word highlighting possible)
 *   - mp3quran.net    → full-surah mp3 streams
 *   - archive.org     → full-surah mp3 streams for selected reciters
 * ============================================================================
 */

export type SourceType =
  | "everyayah" // https://everyayah.com/data/<folder>/SSSAAA.mp3
  | "mp3quran" // https://serverN.mp3quran.net/<folder>/SSS.mp3
  | "archive" // https://archive.org/download/<item>/SSS.mp3
  | "youtube" // YouTube (embed only; never re-hosted)
  | "other";

/** How well the source supports synchronization with the text. */
export type SyncLevel =
  | "word" // per-word timestamps / per-ayah files → word highlighting
  | "ayah" // per-ayah audio, no word timestamps
  | "surah" // full-surah continuous stream
  | "none" // cannot sync reliably
  | "WORD_VERIFIED" // ✅ إضافة للتوافق
  | "WORD_AUTO" // ✅ إضافة للتوافق
  | "AYAH_SYNC" // ✅ إضافة للتوافق
  | "AUDIO_ONLY"; // ✅ إضافة للتوافق

export type Availability = "available" | "partial" | "unavailable";

export type RecitationStyle =
  | "murattal" // مرتل
  | "mujawwad" // مجوّد
  | "muallim" // معلّم
  | "shubah" // شعبة
  | "qalon" // قالون
  | "warsh" // ورش
  | "other";

/** A verified reciter / Qurra'. */
export interface Reciter {
  id: string;
  nameArabic: string;
  nameEnglish: string | null;
  /** URL or null. We do NOT fabricate portraits. */
  image: string | null;
  /** Short verified biography, or null when not available. */
  bio: string | null;
  /** Arabic biography (for display) */
  bioArabic?: string | null; // ✅ إضافة
  style: RecitationStyle;
  /** riwaya (رواية), e.g. Hafs 'an 'Asim. */
  riwaya: string | null;
  /** Alternative spelling for riwaya */
  riwayah?: string | null; // ✅ إضافة للتوافق
  /** True only if every recording listed has been confirmed reachable. */
  verified: boolean;
  /** The default recording source for this reciter in the player. */
  defaultSource: SourceType | null;
  /**
   * Human-readable list of the *verified* source platforms for this reciter
   * (e.g. "everyayah.com", "mp3quran.net"). Empty when nothing is verified.
   * Never lists a platform we have not actually wired up.
   */
  verifiedSources: string[];
  /** Tags/country etc., for filtering (free-form but controlled vocabulary). */
  tags: string[];
  /** Folder name for everyayah.com recordings */
  everyayahFolder?: string | null; // ✅ إضافة
  /** List of available surah numbers for this reciter */
  availableSurahs?: number[]; // ✅ إضافة
  /** Audio quality rating */
  audioQuality?: "high" | "medium" | "low"; // ✅ إضافة
  /** Default sync level for this reciter */
  defaultSyncLevel?: SyncLevel; // ✅ إضافة
}

/** A single available recording (one reciter × one surah × one source). */
export interface Recording {
  recordingId: string; // `${reciterId}:${surahId}:${sourceType}`
  reciterId: string;
  surahId: number; // 1..114
  source: string; // base URL/folder/ID (interpreted by sourceType)
  sourceType: SourceType;
  duration: number | null; // seconds, if known — never guessed
  availability: Availability;
  syncStatus: "synced" | "pending" | "unsynced";
  syncLevel: SyncLevel;
}

/* ---------------------------------------------------------------------------
 * HELPERS
 * ------------------------------------------------------------------------- */

function pad3(n: number): string {
  return String(n).padStart(3, "0");
}

const ALL_SURAHS = Array.from({ length: 114 }, (_, i) => i + 1);

/** Build per-ayah recordings for an everyayah.com folder (all 114 surahs). */
function everyAyahRecordings(reciterId: string, folder: string): Recording[] {
  return ALL_SURAHS.map((surahId) => ({
    recordingId: `${reciterId}:${surahId}:everyayah`,
    reciterId,
    surahId,
    source: folder,
    sourceType: "everyayah" as const,
    duration: null,
    availability: "available" as const,
    syncStatus: "synced" as const,
    syncLevel: "ayah" as const,
  }));
}

/** Build full-surah recordings for an mp3quran base URL. */
function mp3quranRecordings(reciterId: string, base: string, surahs: number[]): Recording[] {
  return surahs.map((surahId) => ({
    recordingId: `${reciterId}:${surahId}:mp3quran`,
    reciterId,
    surahId,
    source: base,
    sourceType: "mp3quran" as const,
    duration: null,
    availability: "available" as const,
    syncStatus: "unsynced" as const,
    syncLevel: "surah" as const,
  }));
}

/** Build full-surah recordings for an archive.org item. */
function archiveRecordings(reciterId: string, item: string, surahs: number[]): Recording[] {
  return surahs.map((surahId) => ({
    recordingId: `${reciterId}:${surahId}:archive`,
    reciterId,
    surahId,
    source: item,
    sourceType: "archive" as const,
    duration: null,
    availability: "available" as const,
    syncStatus: "unsynced" as const,
    syncLevel: "surah" as const,
  }));
}

/* ---------------------------------------------------------------------------
 * RECITERS
 *  Only reciters with already-shipped, reachable sources are marked verified.
 *  Names requested (الدباح، شريف مصطفى، عبادة) are registered with verified
 *  sources where the app already used them; missing data stays null/unavailable.
 * ------------------------------------------------------------------------- */

export const RECITERS: Reciter[] = [
  {
    id: "dosari",
    nameArabic: "ياسر الدوسري",
    nameEnglish: "Yasser Al-Dosari",
    image: null,
    bio: null,
    bioArabic: null,
    style: "murattal",
    riwaya: "حفص عن عاصم",
    riwayah: "حفص عن عاصم",
    verified: true,
    defaultSource: "everyayah",
    verifiedSources: ["everyayah.com"],
    tags: ["saudi", "haram"],
    everyayahFolder: "Yasser_Ad-Dussary_128kbps",
    availableSurahs: ALL_SURAHS,
    audioQuality: "high",
    defaultSyncLevel: "ayah",
  },
  {
    id: "afasy",
    nameArabic: "مشاري العفاسي",
    nameEnglish: "Mishary Rashid Alafasy",
    image: null,
    bio: null,
    bioArabic: null,
    style: "murattal",
    riwaya: "حفص عن عاصم",
    riwayah: "حفص عن عاصم",
    verified: true,
    defaultSource: "everyayah",
    verifiedSources: ["everyayah.com"],
    tags: ["kuwait"],
    everyayahFolder: "Alafasy_128kbps",
    availableSurahs: ALL_SURAHS,
    audioQuality: "high",
    defaultSyncLevel: "ayah",
  },
  {
    id: "husary",
    nameArabic: "محمود خليل الحصري",
    nameEnglish: "Mahmoud Khalil Al-Husary",
    image: null,
    bio: null,
    bioArabic: null,
    style: "murattal",
    riwaya: "حفص عن عاصم",
    riwayah: "حفص عن عاصم",
    verified: true,
    defaultSource: "everyayah",
    verifiedSources: ["everyayah.com"],
    tags: ["egypt"],
    everyayahFolder: "Husary_128kbps",
    availableSurahs: ALL_SURAHS,
    audioQuality: "high",
    defaultSyncLevel: "ayah",
  },
  {
    id: "abdulbasit",
    nameArabic: "عبد الباسط عبد الصمد",
    nameEnglish: "Abdul Basit Abdul Samad",
    image: null,
    bio: null,
    bioArabic: null,
    style: "mujawwad",
    riwaya: "حفص عن عاصم",
    riwayah: "حفص عن عاصم",
    verified: true,
    defaultSource: "everyayah",
    verifiedSources: ["everyayah.com"],
    tags: ["egypt"],
    everyayahFolder: "Abdul_Basit_Murattal_192kbps",
    availableSurahs: ALL_SURAHS,
    audioQuality: "high",
    defaultSyncLevel: "ayah",
  },
  {
    id: "minshawi",
    nameArabic: "محمد صديق المنشاوي",
    nameEnglish: "Mohamed Siddiq El-Minshawi",
    image: null,
    bio: null,
    bioArabic: null,
    style: "murattal",
    riwaya: "حفص عن عاصم",
    riwayah: "حفص عن عاصم",
    verified: true,
    defaultSource: "everyayah",
    verifiedSources: ["everyayah.com"],
    tags: ["egypt"],
    everyayahFolder: "Minshawy_Murattal_128kbps",
    availableSurahs: ALL_SURAHS,
    audioQuality: "high",
    defaultSyncLevel: "ayah",
  },
  {
    id: "sudais",
    nameArabic: "عبد الرحمن السديس",
    nameEnglish: "Abdul Rahman Al-Sudais",
    image: null,
    bio: null,
    bioArabic: null,
    style: "murattal",
    riwaya: "حفص عن عاصم",
    riwayah: "حفص عن عاصم",
    verified: true,
    defaultSource: "everyayah",
    verifiedSources: ["everyayah.com"],
    tags: ["saudi", "haram"],
    everyayahFolder: "Abdurrahmaan_As-Sudais_192kbps",
    availableSurahs: ALL_SURAHS,
    audioQuality: "high",
    defaultSyncLevel: "ayah",
  },
  {
    id: "shuraim",
    nameArabic: "سعود الشريم",
    nameEnglish: "Saud Al-Shuraim",
    image: null,
    bio: null,
    bioArabic: null,
    style: "murattal",
    riwaya: "حفص عن عاصم",
    riwayah: "حفص عن عاصم",
    verified: true,
    defaultSource: "everyayah",
    verifiedSources: ["everyayah.com"],
    tags: ["saudi", "haram"],
    everyayahFolder: "Saood_ash-Shuraym_128kbps",
    availableSurahs: ALL_SURAHS,
    audioQuality: "high",
    defaultSyncLevel: "ayah",
  },
  {
    id: "ghamdi",
    nameArabic: "سعد الغامدي",
    nameEnglish: "Saad Al-Ghamdi",
    image: null,
    bio: null,
    bioArabic: null,
    style: "murattal",
    riwaya: "حفص عن عاصم",
    riwayah: "حفص عن عاصم",
    verified: true,
    defaultSource: "everyayah",
    verifiedSources: ["everyayah.com"],
    tags: ["saudi"],
    everyayahFolder: "Ghamadi_40kbps",
    availableSurahs: ALL_SURAHS,
    audioQuality: "medium",
    defaultSyncLevel: "ayah",
  },
  {
    id: "shatri",
    nameArabic: "أبو بكر الشاطري",
    nameEnglish: "Abu Bakr Al-Shatri",
    image: null,
    bio: null,
    bioArabic: null,
    style: "murattal",
    riwaya: "حفص عن عاصم",
    riwayah: "حفص عن عاصم",
    verified: true,
    defaultSource: "everyayah",
    verifiedSources: ["everyayah.com"],
    tags: ["yemen"],
    everyayahFolder: "Abu_Bakr_Ash-Shaatree_128kbps",
    availableSurahs: ALL_SURAHS,
    audioQuality: "high",
    defaultSyncLevel: "ayah",
  },
  {
    id: "ajamy",
    nameArabic: "أحمد العجمي",
    nameEnglish: "Ahmed Al-Ajmi",
    image: null,
    bio: null,
    bioArabic: null,
    style: "murattal",
    riwaya: "حفص عن عاصم",
    riwayah: "حفص عن عاصم",
    verified: true,
    defaultSource: "everyayah",
    verifiedSources: ["everyayah.com"],
    tags: ["saudi"],
    everyayahFolder: "ahmed_ibn_ali_al_ajamy_128kbps",
    availableSurahs: ALL_SURAHS,
    audioQuality: "high",
    defaultSyncLevel: "ayah",
  },
  {
    id: "maher",
    nameArabic: "ماهر المعيقلي",
    nameEnglish: "Maher Al Muaiqly",
    image: null,
    bio: null,
    bioArabic: null,
    style: "murattal",
    riwaya: "حفص عن عاصم",
    riwayah: "حفص عن عاصم",
    verified: true,
    defaultSource: "everyayah",
    verifiedSources: ["everyayah.com"],
    tags: ["saudi", "haram"],
    everyayahFolder: "Maher_AlMuaiqly_64kbps",
    availableSurahs: ALL_SURAHS,
    audioQuality: "medium",
    defaultSyncLevel: "ayah",
  },
  {
    id: "tablawi",
    nameArabic: "محمد الطبلاوي",
    nameEnglish: "Mohamed Al-Tablawi",
    image: null,
    bio: null,
    bioArabic: null,
    style: "murattal",
    riwaya: "حفص عن عاصم",
    riwayah: "حفص عن عاصم",
    verified: true,
    defaultSource: "everyayah",
    verifiedSources: ["everyayah.com"],
    tags: ["egypt"],
    everyayahFolder: "Mohammad_al_Tablaway_128kbps",
    availableSurahs: ALL_SURAHS,
    audioQuality: "high",
    defaultSyncLevel: "ayah",
  },
  {
    id: "islam_sobhi",
    nameArabic: "إسلام صبحي",
    nameEnglish: "Islam Sobhi",
    image: null,
    bio: null,
    bioArabic: null,
    style: "murattal",
    riwaya: "حفص عن عاصم",
    riwayah: "حفص عن عاصم",
    verified: true,
    defaultSource: "mp3quran",
    verifiedSources: ["mp3quran.net"],
    tags: ["egypt"],
    everyayahFolder: null,
    availableSurahs: ALL_SURAHS,
    audioQuality: "high",
    defaultSyncLevel: "surah",
  },
  {
    id: "sherif_mostafa",
    nameArabic: "شريف مصطفى",
    nameEnglish: "Sherif Mostafa",
    image: null,
    bio: null,
    bioArabic: null,
    style: "murattal",
    riwaya: "حفص عن عاصم",
    riwayah: "حفص عن عاصم",
    verified: true,
    defaultSource: "archive",
    verifiedSources: ["archive.org"],
    tags: ["egypt"],
    everyayahFolder: null,
    availableSurahs: [13, 15, 19, 20, 31, 32, 53, 55, 56, 57, 60, 61, 62, 63, 64, 65, 66, 67, 71, 75, 76, 77, 89],
    audioQuality: "high",
    defaultSyncLevel: "surah",
  },
  {
    id: "hamza_boudib",
    nameArabic: "حمزة بوديب",
    nameEnglish: "Hamza Boudib",
    image: null,
    bio: null,
    bioArabic: null,
    style: "murattal",
    riwaya: "حفص عن عاصم",
    riwayah: "حفص عن عاصم",
    verified: true,
    defaultSource: "archive",
    verifiedSources: ["archive.org"],
    tags: ["algeria"],
    everyayahFolder: null,
    availableSurahs: [16, 21, 44, 50, 53, 55, 56, 59, 67, 68, 70, 74, 77, 78, 83, 89],
    audioQuality: "high",
    defaultSyncLevel: "surah",
  },
  // ── Requested reciters registered with honest, UNVERIFIED availability ──
  // We list them so the architecture accommodates them, but we do NOT invent
  // audio URLs, images, bios, or surah availability. Until a real, reachable
  // source is confirmed, they show as "unavailable" in the library.
  {
    id: "saeed_al-dabbah",
    nameArabic: "سعيد الدباح",
    nameEnglish: "Saeed Al-Dabbah",
    image: null,
    bio: null,
    bioArabic: null,
    style: "murattal",
    riwaya: null,
    riwayah: null,
    verified: false,
    defaultSource: null,
    verifiedSources: [],
    tags: [],
    everyayahFolder: null,
    availableSurahs: [],
    audioQuality: "low",
    defaultSyncLevel: "none",
  },
  {
    id: "mohamed_abbada",
    nameArabic: "محمد عبادة",
    nameEnglish: "Mohamed Abbada",
    image: null,
    bio: null,
    bioArabic: null,
    style: "murattal",
    riwaya: null,
    riwayah: null,
    verified: false,
    defaultSource: null,
    verifiedSources: [],
    tags: [],
    everyayahFolder: null,
    availableSurahs: [],
    audioQuality: "low",
    defaultSyncLevel: "none",
  },
];

/* ---------------------------------------------------------------------------
 * RECORDINGS
 *  Built once from the verified source mappings. This is where new sources
 *  (مئات التسجيلات) get added without touching UI.
 * ------------------------------------------------------------------------- */

export const RECORDINGS: Recording[] = [
  ...everyAyahRecordings("dosari", "Yasser_Ad-Dussary_128kbps"),
  ...everyAyahRecordings("afasy", "Alafasy_128kbps"),
  ...everyAyahRecordings("husary", "Husary_128kbps"),
  ...everyAyahRecordings("abdulbasit", "Abdul_Basit_Murattal_192kbps"),
  ...everyAyahRecordings("minshawi", "Minshawy_Murattal_128kbps"),
  ...everyAyahRecordings("sudais", "Abdurrahmaan_As-Sudais_192kbps"),
  ...everyAyahRecordings("shuraim", "Saood_ash-Shuraym_128kbps"),
  ...everyAyahRecordings("ghamdi", "Ghamadi_40kbps"),
  ...everyAyahRecordings("shatri", "Abu_Bakr_Ash-Shaatree_128kbps"),
  ...everyAyahRecordings("ajamy", "ahmed_ibn_ali_al_ajamy_128kbps"),
  ...everyAyahRecordings("maher", "Maher_AlMuaiqly_64kbps"),
  ...everyAyahRecordings("tablawi", "Mohammad_al_Tablaway_128kbps"),

  ...mp3quranRecordings(
    "islam_sobhi",
    "https://server14.mp3quran.net/islam/Rewayat-Hafs-A-n-Assem",
    ALL_SURAHS,
  ),

  ...archiveRecordings(
    "sherif_mostafa",
    "Sherif-Mostafa",
    [13, 15, 19, 20, 31, 32, 53, 55, 56, 57, 60, 61, 62, 63, 64, 65, 66, 67, 71, 75, 76, 77, 89],
  ),
  ...archiveRecordings(
    "hamza_boudib",
    "Hamza-Boudib",
    [16, 21, 44, 50, 53, 55, 56, 59, 67, 68, 70, 74, 77, 78, 83, 89],
  ),
];

/* ---------------------------------------------------------------------------
 * QUERY API
 * ------------------------------------------------------------------------- */

const byId = new Map(RECITERS.map((r) => [r.id, r]));
const recordingsByReciter = new Map<string, Recording[]>();
for (const rec of RECORDINGS) {
  const arr = recordingsByReciter.get(rec.reciterId) ?? [];
  arr.push(rec);
  recordingsByReciter.set(rec.reciterId, arr);
}

export function getReciter(id: string): Reciter | undefined {
  return byId.get(id);
}

export function getAllReciters(): Reciter[] {
  return RECITERS;
}

export function getRecordings(reciterId: string): Recording[] {
  return recordingsByReciter.get(reciterId) ?? [];
}

export function getRecording(reciterId: string, surahId: number): Recording | undefined {
  return getRecordings(reciterId).find((r) => r.surahId === surahId);
}

export function getAvailableSurahs(reciterId: string): number[] {
  return getRecordings(reciterId)
    .filter((r) => r.availability === "available")
    .map((r) => r.surahId)
    .sort((a, b) => a - b);
}

export function hasPerAyah(reciterId: string): boolean {
  return getRecordings(reciterId).some((r) => r.sourceType === "everyayah");
}

/** Resolve a recording to a playable URL. Returns null if not available. */
export function recordingUrl(rec: Recording, ayahInSurah?: number): string | null {
  if (rec.availability !== "available") return null;
  switch (rec.sourceType) {
    case "everyayah":
      if (!ayahInSurah) return null;
      return `https://everyayah.com/data/${rec.source}/${pad3(rec.surahId)}${pad3(ayahInSurah)}.mp3`;
    case "mp3quran":
      return `${rec.source}/${pad3(rec.surahId)}.mp3`;
    case "archive":
      // archive.org items host files under /1/items/<item>/<file>.mp3 (server number may vary; /1 works for these items).
      return `https://ia601502.us.archive.org/1/items/${rec.source}/${pad3(rec.surahId)}.mp3`;
    default:
      return null;
  }
}

export type ReciterFilter = "all" | "word" | "ayah" | "surah";

/** Filter badge metadata for the three requested availability tiers. */
export const FILTERS: { id: ReciterFilter; label: string; dot: string; match: (r: Reciter) => boolean }[] = [
  {
    id: "word",
    label: "كلمة بكلمة",
    dot: "#10b981",
    match: (r) => getRecordings(r.id).some((x) => x.syncLevel === "word" || x.sourceType === "everyayah"),
  },
  {
    id: "ayah",
    label: "آية بآية",
    dot: "#f59e0b",
    match: (r) => getRecordings(r.id).some((x) => x.syncLevel === "ayah"),
  },
  {
    id: "surah",
    label: "صوت فقط",
    dot: "#94a3b8",
    match: (r) => getRecordings(r.id).some((x) => x.syncLevel === "surah"),
  },
  { id: "all", label: "الكل", dot: "", match: () => true },
];

// ============================================================
// FILTER RECITERS (مفقودة سابقاً)
// ============================================================

export function filterReciters(
  reciters: Reciter[],
  filter: ReciterFilter
): Reciter[] {
  if (filter === "all") return reciters;
  return reciters.filter((r) => {
    const recordings = getRecordings(r.id);
    if (filter === "word") {
      return recordings.some((rec) => rec.syncLevel === "word" || rec.sourceType === "everyayah");
    }
    if (filter === "ayah") {
      return recordings.some((rec) => rec.syncLevel === "ayah");
    }
    if (filter === "surah") {
      return recordings.some((rec) => rec.syncLevel === "surah");
    }
    return true;
  });
}

// ============================================================
// COMPATIBILITY ALIASES (for older imports)
// ============================================================

/**
 * @deprecated استخدم `RECITERS` بدلاً من ذلك
 * هذا المرادف موجود للتوافق مع الكود القديم
 */
export const RECITERS_CATALOG = RECITERS;

/**
 * @deprecated استخدم `Reciter` بدلاً من ذلك
 * هذا المرادف موجود للتوافق مع الكود القديم
 */
export type ReciterProfile = Reciter;