/**
 * ============================================================================
 * HAFIZ — LOCAL QURAN TEXT (offline-ready)
 * ----------------------------------------------------------------------------
 * The complete Uthmani Quran text is bundled from the open-source
 * `quran-json` package (CC-BY-4.0). This guarantees the Mushaf renders REAL
 * Quranic text even when the external alquran.cloud API is unreachable
 * (restricted build environments, offline preview); online reads still fill
 * in real Madani page numbers and the Tafsir Al-Muyassar.
 *
 * The local dataset has no Madani page numbers and no tafsir. Offline we
 * synthesise stable reading leaves so the "open book" still turns page by page.
 * ============================================================================
 */

import type { SurahContent, QuranAyah } from "./quran";
import { getSurah } from "./surahs";
import { LOCAL_QURAN } from "@/data/quranText";

/** Global ayah number of the last ayah before this surah (sum of prior). */
function ayahsBefore(surahNumber: number): number {
  let total = 0;
  for (const item of LOCAL_QURAN) {
    if (item.s >= surahNumber) break;
    total += item.n;
  }
  return total;
}

/**
 * Build a SurahContent from the bundled local dataset.
 * `apiAyahs` — optional live-API ayahs (real page + tafsir); we adopt their
 *              page/tafsir/audio while keeping the local Uthmani string.
 */
export async function fetchSurahLocal(
  surahNumber: number,
  apiAyahs?: QuranAyah[] | null
): Promise<SurahContent | null> {
  const meta = getSurah(surahNumber);
  const local = LOCAL_QURAN.find((c) => c.s === surahNumber);
  if (!meta || !local) return null;

  const offset = ayahsBefore(surahNumber);
  const hasBasmala = surahNumber !== 1 && surahNumber !== 9;

  // Synthetic leaf length when no real Madani page numbers are available.
  const LEAF = surahNumber === 2 ? 18 : surahNumber > 70 ? 14 : 16;

  const ayahs: QuranAyah[] = local.v.map((text, idx) => {
    const nInSurah = idx + 1;
    const globalNumber = offset + nInSurah;
    const api = apiAyahs?.[idx] ?? null;
    const clean = (text ?? "").trim();
    const words = clean
      .split(/\s+/)
      .filter(Boolean)
      .map((t, i) => ({ t, i }));

    // Real Madani page when online; otherwise a stable pseudo-page so the
    // book still paginates. Pseudo-pages are >= 1000 (see isSyntheticPage).
    const page =
      api?.page ?? Math.floor((nInSurah - 1) / LEAF) + 1000 + surahNumber * 50;

    return {
      numberInSurah: nInSurah,
      globalNumber,
      text: clean,
      words,
      tafsir: api?.tafsir?.trim() || "",
      audioUrl:
        api?.audioUrl ??
        `https://cdn.islamic.network/quran/audio/128/ar.alafasy/${globalNumber}.mp3`,
      page,
    };
  });

  return { meta, basmala: hasBasmala, ayahs };
}

/** True for the offline pseudo-pages (>= 1000) so the UI labels them. */
export function isSyntheticPage(pageNo: number): boolean {
  return pageNo >= 1000;
}
