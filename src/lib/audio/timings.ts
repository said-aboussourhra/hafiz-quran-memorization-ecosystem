/**
 * Exact word-timing providers for one specific reciter × surah recording.
 *
 * Quran.com chapter-recitation timestamps are paired with the exact audio URL
 * returned by the same endpoint. Two additional full-surah recordings use the
 * CC BY 4.0 forced-alignment corpus documented in public/audio-timings.
 * Everything else falls back to per-ayah recordings with clearly-labelled
 * duration-based word estimates; timing maps are never shared between voices.
 */
import type { AyahTimings, RecordingTimings, SyncStatus, WordTiming } from "./types";
import { getRecordings } from "../reciterRegistry";

export type TimingSource =
  | { kind: "qdc"; chapterReciterId: number; label: string }
  | { kind: "bundled"; slug: "islam-sobhi" | "maher-muaiqly"; label: string };

const TIMING_SOURCE_MAP: Record<string, TimingSource> = {
  // Quran.com recording IDs (not the separate EveryAyah IDs).
  abdulbasit: { kind: "qdc", chapterReciterId: 1, label: "عبد الباسط · Quran.com" },
  sudais: { kind: "qdc", chapterReciterId: 3, label: "السديس · Quran.com" },
  shatri: { kind: "qdc", chapterReciterId: 4, label: "الشاطري · Quran.com" },
  husary: { kind: "qdc", chapterReciterId: 6, label: "الحصري · Quran.com" },
  afasy: { kind: "qdc", chapterReciterId: 7, label: "العفاسي · Quran.com" },
  minshawi: { kind: "qdc", chapterReciterId: 8, label: "المنشاوي · Quran.com" },
  shuraim: { kind: "qdc", chapterReciterId: 9, label: "الشريم · Quran.com" },
  islam_sobhi: { kind: "bundled", slug: "islam-sobhi", label: "إسلام صبحي · محاذاة صوتية" },
  maher: { kind: "bundled", slug: "maher-muaiqly", label: "ماهر المعيقلي · محاذاة صوتية" },
};

type QdcSegment = number[];
type QdcTimestamp = {
  verse_key?: string;
  timestamp_from?: number;
  timestamp_to?: number;
  segments?: QdcSegment[];
  left_out?: boolean;
};
type TimingPayload = {
  reciter?: string;
  chapter?: number;
  audio_file?: { audio_url?: string; timestamps?: QdcTimestamp[] };
};

export function getTimingSource(reciterId: string): TimingSource | null {
  return TIMING_SOURCE_MAP[reciterId] ?? null;
}

export function baseSyncStatus(
  reciterId: string,
  surahId: number,
  granularity: "ayah" | "surah",
): SyncStatus {
  const recordings = getRecordings(reciterId).filter((r) => r.surahId === surahId);
  if (recordings.length === 0) return "NOT_AVAILABLE";
  return granularity === "ayah" ? "VERSE_ONLY" : "AUDIO_ONLY";
}

function parsePayload(
  payload: TimingPayload,
  expectedWordCounts?: ReadonlyMap<number, number>,
): { timings: RecordingTimings; complete: boolean; audioUrl: string } | null {
  const rows = payload.audio_file?.timestamps ?? [];
  const audioUrl = payload.audio_file?.audio_url ?? null;
  if (!audioUrl || !audioUrl.startsWith("https://") || rows.length === 0) return null;

  const map: RecordingTimings = new Map();
  for (const row of rows) {
    const match = row.verse_key?.match(/^(\d+):(\d+)$/);
    if (!match || row.left_out) continue;
    const ayah = Number(match[2]);
    const segments: WordTiming[] = (row.segments ?? [])
      .filter((segment) => segment.length >= 3 && segment.slice(0, 3).every(Number.isFinite))
      .map(([wordNumber, startMs, endMs]) => ({
        wordNumber,
        start: Math.max(0, startMs / 1000),
        end: Math.max(0, endMs / 1000),
      }))
      .filter((word) => Number.isInteger(word.wordNumber) && word.wordNumber > 0 && word.end > word.start)
      .sort((a, b) => a.start - b.start);
    if (!segments.length) continue;
    const start = typeof row.timestamp_from === "number" ? row.timestamp_from / 1000 : segments[0].start;
    const end = typeof row.timestamp_to === "number" ? row.timestamp_to / 1000 : segments[segments.length - 1].end;
    map.set(ayah, { ayah, start, end, words: segments });
  }
  if (!map.size) return null;

  let complete = true;
  if (expectedWordCounts) {
    for (const [ayah, count] of expectedWordCounts) {
      const timing = map.get(ayah);
      if (!timing) { complete = false; break; }
      const covered = new Set(timing.words.map((word) => word.wordNumber));
      for (let word = 1; word <= count; word++) {
        if (!covered.has(word)) { complete = false; break; }
      }
      if (!complete) break;
    }
  }
  return { timings: map, complete, audioUrl };
}

/** Load timings and the matching full-surah URL for a supported recording. */
export async function loadTimings(
  reciterId: string,
  surahId: number,
  expectedWordCounts?: ReadonlyMap<number, number>,
 ): Promise<{ timings: RecordingTimings; status: SyncStatus; audioUrl: string; complete: boolean } | null> {
  const source = getTimingSource(reciterId);
  if (!source) return null;

  try {
    let url: string;
    if (source.kind === "qdc") {
      url = `https://api.quran.com/api/v4/chapter_recitations/${source.chapterReciterId}/${surahId}?segments=true`;
    } else {
      url = `/audio-timings/${source.slug}/${surahId}.json`;
    }
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12_000);
    let res: Response;
    try {
      res = await fetch(url, { cache: "force-cache", signal: controller.signal });
    } finally {
      clearTimeout(timeout);
    }
    if (!res.ok) return null;
    const payload = (await res.json()) as TimingPayload;
    const parsed = parsePayload(payload, expectedWordCounts);
    if (!parsed) return null;
    // Complete coverage means every expected word has a time range, not that
    // a human audited the timestamps. Keep that distinction explicit in UI.
    const status: SyncStatus = "WORD_AUTO";
    return { timings: parsed.timings, status, audioUrl: parsed.audioUrl, complete: parsed.complete };
  } catch {
    return null;
  }
}
