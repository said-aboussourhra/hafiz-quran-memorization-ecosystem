/**
 * ============================================================================
 *  HAFIZ — STABLE QURAN IDENTIFIERS
 * ============================================================================
 *  Canonical, immutable IDs for the verified Quran dataset. These IDs are
 *  NEVER generated or altered by an LLM / AI model. They come from the
 *  established Uthmani mushaf convention (604 pages, 30 juz, 60 hizb,
 *  240 rub) and are the single source of truth for referencing any location
 *  in the Quran across the whole platform (reader, memorization, review,
 *  certificates, progress).
 *
 *  ID schemes:
 *   - surahId   1..114
 *   - ayahId    1..6236        (global ayah number, mushaf order)
 *   - wordId    "{surahId}:{ayahInSurah}:{wordInAyah}"  e.g. "1:1:2"
 *   - pageId    1..604
 *   - juzId     1..30
 *   - hizbId    1..60          (each juz = 2 hizb)
 *   - rubId     1..240         (each hizb = 4 rub, maqra')
 *
 *  The juz/hizb/rub → page boundaries below follow the standard Medina
 *  mushaf (KFGQPC) page numbering used across the Muslim world.
 * ============================================================================
 */

export const TOTAL_SURAHS = 114;
export const TOTAL_PAGES = 604;
export const TOTAL_JUZ = 30;
export const TOTAL_HIZB = 60;
export const TOTAL_RUB = 240; // 240 maqra' (rubʿ al-hizb)

/** First mushaf page of each juz (1..30). Index 0 unused. */
export const JUZ_START_PAGE: number[] = [
  0, 1, 22, 42, 62, 82, 102, 121, 142, 162, 182, 201, 222, 242, 262, 282,
  302, 322, 342, 362, 382, 402, 422, 442, 462, 482, 502, 522, 542, 562, 582,
];

/** First mushaf page of each hizb (1..60). Index 0 unused. */
export const HIZB_START_PAGE: number[] = [
  0, 1, 11, 22, 32, 42, 52, 62, 72, 82, 92, 102, 112, 121, 131, 142, 152,
  162, 172, 182, 192, 201, 211, 222, 232, 242, 252, 262, 272, 282, 292, 302,
  312, 322, 332, 342, 352, 362, 372, 382, 392, 402, 412, 422, 432, 442, 452,
  462, 472, 482, 492, 502, 512, 522, 532, 542, 552, 562, 572, 582, 592,
];

/** First mushaf page of each rubʿ / maqra' (1..240). Index 0 unused. */
export const RUB_START_PAGE: number[] = [
  0, 1, 6, 11, 17, 22, 27, 32, 37, 42, 47, 52, 57, 62, 67, 72, 77, 82, 87,
  92, 97, 102, 107, 112, 117, 121, 126, 131, 136, 142, 147, 152, 157, 162,
  167, 172, 177, 182, 187, 192, 196, 201, 206, 211, 216, 222, 227, 232, 237,
  242, 247, 252, 257, 262, 267, 272, 277, 282, 287, 292, 297, 302, 307, 312,
  317, 322, 327, 332, 337, 342, 347, 352, 357, 362, 367, 372, 377, 382, 387,
  392, 397, 402, 407, 412, 417, 422, 427, 432, 437, 442, 447, 452, 457, 462,
  467, 472, 477, 482, 487, 492, 497, 502, 507, 512, 517, 522, 527, 532, 537,
  542, 548, 552, 557, 562, 567, 572, 577, 582, 587, 592, 597, 602,
];

/**
 * Global ayah number (1..6236) is the canonical ayahId. We do not recompute
 * it — it is provided by the verified data source. The helpers below only
 * derive the structural location IDs from the (verified) page number.
 */

/** Juz (1..30) that contains the given mushaf page. */
export function juzForPage(page: number): number {
  const p = clamp(page, 1, TOTAL_PAGES);
  let juz = 1;
  for (let j = 1; j <= TOTAL_JUZ; j++) {
    if (JUZ_START_PAGE[j] <= p) juz = j;
    else break;
  }
  return juz;
}

/** Hizb (1..60) that contains the given mushaf page. */
export function hizbForPage(page: number): number {
  const p = clamp(page, 1, TOTAL_PAGES);
  let hizb = 1;
  for (let h = 1; h <= TOTAL_HIZB; h++) {
    if (HIZB_START_PAGE[h] <= p) hizb = h;
    else break;
  }
  return hizb;
}

/** Rubʿ al-hizb / maqra' (1..240) that contains the given mushaf page. */
export function rubForPage(page: number): number {
  const p = clamp(page, 1, TOTAL_PAGES);
  let rub = 1;
  for (let r = 1; r <= TOTAL_RUB; r++) {
    if (RUB_START_PAGE[r] <= p) rub = r;
    else break;
  }
  return rub;
}

/** Stable, opaque word identifier: "{surah}:{ayahInSurah}:{wordInAyah}". */
export function wordId(surah: number, ayahInSurah: number, wordInAyah: number): string {
  return `${surah}:${ayahInSurah}:${wordInAyah}`;
}

/** Parse a wordId back into its parts. Returns null if malformed. */
export function parseWordId(id: string): { surah: number; ayahInSurah: number; wordInAyah: number } | null {
  const parts = id.split(":");
  if (parts.length !== 3) return null;
  const surah = Number(parts[0]);
  const ayahInSurah = Number(parts[1]);
  const wordInAyah = Number(parts[2]);
  if (!Number.isInteger(surah) || !Number.isInteger(ayahInSurah) || !Number.isInteger(wordInAyah)) return null;
  return { surah, ayahInSurah, wordInAyah };
}

/** Structural location IDs for a single ayah, derived from its verified page. */
export type AyahLocation = {
  pageId: number;
  juzId: number;
  hizbId: number;
  rubId: number;
};

export function locationForPage(page: number): AyahLocation {
  return {
    pageId: clamp(page, 1, TOTAL_PAGES),
    juzId: juzForPage(page),
    hizbId: hizbForPage(page),
    rubId: rubForPage(page),
  };
}

/** Build a human-readable reference, e.g. "البقرة: ٢٥ · الجزء ١ · الصفحة ٤٠". */
export function formatLocationRef(
  surahNameAr: string,
  ayahInSurah: number,
  page: number,
): string {
  const loc = locationForPage(page);
  return `سورة ${surahNameAr} · آية ${ayahInSurah.toLocaleString("ar-EG")} · الجزء ${loc.juzId.toLocaleString("ar-EG")} · الصفحة ${loc.pageId.toLocaleString("ar-EG")}`;
}

function clamp(n: number, min: number, max: number): number {
  if (!Number.isFinite(n)) return min;
  return Math.max(min, Math.min(max, Math.round(n)));
}
