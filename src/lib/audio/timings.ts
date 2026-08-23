/**
 * Timing provider for the Audio Engine.
 *
 * HARD RULE (Phase 4): word timings belong to ONE specific recording and are
 * NEVER shared between reciters or guessed. A recording only reaches
 * WORD_VERIFIED / WORD_AUTO status when a real timing map is loaded for it.
 *
 * The provider below can load word timings from a verified API, but it is
 * explicitly gated behind `VERIFIED_RECITATION_MAP` so we never claim word
 * sync for a reciter whose timings we have not actually confirmed.
 */
import type { AyahTimings, RecordingTimings, SyncStatus, WordTiming } from "./types";
import { getRecordings } from "../reciterRegistry";

/**
 * Map of our reciter IDs → verified timing-source keys.
 *
 * To add a reciter's word timings, verify (1) the exact timing dataset and
 * (2) that it corresponds to the same audio files used in `reciterRegistry`,
 * then add an entry here. Until then the reciter stays at VERSE_ONLY/AUDIO_ONLY.
 */
const VERIFIED_RECITATION_MAP: Record<string, TimingSource> = {
  // Example (uncomment ONLY after verifying the dataset matches the audio):
  // afasy: { kind: "qurancom", recitationId: 7, label: "Mishary Alafasy · quran.com" },
};

type TimingSource = {
  kind: "qurancom";
  recitationId: number;
  label: string;
};

export function getVerifiedTimingSource(reciterId: string): TimingSource | null {
  return VERIFIED_RECITATION_MAP[reciterId] ?? null;
}

/**
 * Determine the honest sync status for a recording before any timings load.
 * - per-ayah files  → VERSE_ONLY (ayah-level highlight via file boundaries)
 * - full-surah file → AUDIO_ONLY (no position data without a timing map)
 * - no recording    → NOT_AVAILABLE
 * If a verified timing source exists, it may upgrade to WORD_VERIFIED after
 * `loadTimings` succeeds.
 */
export function baseSyncStatus(
  reciterId: string,
  surahId: number,
  granularity: "ayah" | "surah",
): SyncStatus {
  const recordings = getRecordings(reciterId).filter((r) => r.surahId === surahId);
  if (recordings.length === 0) return "NOT_AVAILABLE";
  if (getVerifiedTimingSource(reciterId)) {
    // We have a verified source; timings still must load to be used, but the
    // *capability* exists. Until loaded we report the underlying granularity.
    return granularity === "ayah" ? "VERSE_ONLY" : "AUDIO_ONLY";
  }
  return granularity === "ayah" ? "VERSE_ONLY" : "AUDIO_ONLY";
}

type QuranComWord = {
  position?: number;
  timestamp?: number;
  audio_url?: string | null;
  verse_key?: string;
  code?: string;
};

type QuranComVerse = {
  id?: number;
  verse_number?: number;
  verse_key?: string;
  words?: QuranComWord[];
  timestamps?: number[];
};

/**
 * Fetch the exact word timings for a reciter × surah. Returns null when:
 *  - no verified source is configured, or
 *  - the network/API fails, or
 *  - the payload contains no usable timestamps.
 *
 * On success the returned map is keyed by numberInSurah.
 */
export async function loadTimings(
  reciterId: string,
  surahId: number,
): Promise<{ timings: RecordingTimings; status: SyncStatus } | null> {
  const source = getVerifiedTimingSource(reciterId);
  if (!source) return null;

  if (source.kind === "qurancom") {
    const url =
      `https://api.quran.com/api/v4/verses/by_chapter/${surahId}` +
      `?words=true&word_fields=text_uthmani,location,timestamp&per_page=300&recitation=${source.recitationId}`;
    try {
      const res = await fetch(url, { next: { revalidate: 60 * 60 * 24 * 30 } });
      if (!res.ok) return null;
      const json = (await res.json()) as { verses?: QuranComVerse[] };
      const verses = json.verses ?? [];
      if (verses.length === 0) return null;

      const map: RecordingTimings = new Map();
      let sawWordTiming = false;

      for (const v of verses) {
        const ayahNum = v.verse_number;
        if (!ayahNum) continue;
        const words: WordTiming[] = [];
        const wordList = v.words ?? [];

        for (let i = 0; i < wordList.length; i++) {
          const w = wordList[i];
          // quran.com timestamps are in milliseconds.
          const ts = typeof w.timestamp === "number" ? w.timestamp / 1000 : null;
          if (ts == null) continue;
          const next = wordList[i + 1];
          const nextTs =
            next && typeof next.timestamp === "number" ? next.timestamp / 1000 : null;
          words.push({
            wordNumber: w.position ?? i + 1,
            start: ts,
            end: nextTs != null && nextTs > ts ? nextTs : ts + 0.6,
          });
          sawWordTiming = true;
        }

        if (words.length > 0) {
          map.set(ayahNum, {
            ayah: ayahNum,
            start: words[0].start,
            end: words[words.length - 1].end,
            words,
          });
        }
      }

      if (!sawWordTiming || map.size === 0) return null;
      return { timings: map, status: "WORD_VERIFIED" };
    } catch {
      return null;
    }
  }

  return null;
}
