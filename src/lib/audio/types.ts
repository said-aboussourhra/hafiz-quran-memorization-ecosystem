/**
 * ============================================================================
 *  HAFIZ — AUDIO ENGINE TYPES
 * ============================================================================
 *  Exact, per-recording synchronization. Timing data is NEVER shared across
 *  reciters or guessed from audio duration / word count. Each recording has
 *  its own timing map; when one is unavailable we report that honestly and
 *  never fake word highlighting.
 * ============================================================================
 */

export type SyncLevel = 1 | 2 | 3;

/**
 * NOT_AVAILABLE : no playable recording
 * AUDIO_ONLY    : continuous full-surah stream, no position data → no highlight
 * VERSE_ONLY    : per-ayah audio (or timestamps) → ayah highlighting only
 * WORD_AUTO     : word timings produced by an automated aligner (may drift)
 * WORD_VERIFIED : word timings verified against the reciter's actual recitation
 */
export type SyncStatus =
  | "NOT_AVAILABLE"
  | "AUDIO_ONLY"
  | "VERSE_ONLY"
  | "WORD_AUTO"
  | "WORD_VERIFIED";

export const SYNC_META: Record<
  SyncStatus,
  { label: string; level: SyncLevel; color: string; canHighlightWord: boolean }
> = {
  NOT_AVAILABLE: { label: "غير متاح", level: 0 as unknown as SyncLevel, color: "#94a3b8", canHighlightWord: false },
  AUDIO_ONLY: { label: "صوت فقط", level: 1, color: "#94a3b8", canHighlightWord: false },
  VERSE_ONLY: { label: "تزامن آلي", level: 2, color: "#f59e0b", canHighlightWord: false },
  WORD_AUTO: { label: "كلمات (تلقائي)", level: 3, color: "#3b82f6", canHighlightWord: true },
  WORD_VERIFIED: { label: "كلمات موثّقة", level: 3, color: "#10b981", canHighlightWord: true },
};

/** One word's timing within a specific recording, in seconds. */
export interface WordTiming {
  /** 1-based word position within the ayah. */
  wordNumber: number;
  /** Start time in seconds. */
  start: number;
  /** End time in seconds. */
  end: number;
}

/** All timings for one ayah in a specific recording. */
export interface AyahTimings {
  /** numberInSurah, 1-based. */
  ayah: number;
  /** Time the ayah begins within the audio, in seconds. */
  start: number;
  /** Time the ayah ends, in seconds. */
  end: number;
  /** Per-word timings; empty when no word data for this recording. */
  words: WordTiming[];
}

/**
 * The complete timing map for ONE specific recording (one reciter × one surah
 * × one source). Keyed by numberInSurah. This is the exact sync map that gets
 * reloaded when reciter/source changes — it is never shared.
 */
export type RecordingTimings = Map<number, AyahTimings>;

export type RepeatMode = "off" | "ayah" | "segment";

export type EngineStatus = "idle" | "loading" | "ready" | "playing" | "paused" | "ended" | "error";

export interface EngineState {
  status: EngineStatus;
  /** Current playback position in seconds. */
  currentTime: number;
  /** Known duration in seconds (0 until metadata loads). */
  duration: number;
  playbackRate: number;
  /** 1-based ayah currently under the playhead (null if unknown). */
  currentAyah: number | null;
  /** 1-based word currently under the playhead (null if no word sync). */
  currentWord: number | null;
  syncStatus: SyncStatus;
  sourceGranularity: "ayah" | "surah";
  repeatMode: RepeatMode;
  /** Whether repeat-one-ayah is armed. */
  repeatAyah: boolean;
  sleepTimerMinutes: number | null;
  sleepEndsAt: number | null;
  autoScroll: boolean;
  error: string | null;
}

export interface SegmentRange {
  fromAyah: number;
  toAyah: number;
}

/** A resolvable audio source for the engine. */
export interface AudioSource {
  reciterId: string;
  surahId: number;
  /**
   * For per-ayah recordings this returns the URL for a given ayah; for a
   * full-surah stream it returns the single stream URL.
   */
  getUrl: (ayah: number) => string | null;
  /** "ayah" = one file per ayah (VERSE_ONLY); "surah" = one file (AUDIO_ONLY unless timings supplied). */
  granularity: "ayah" | "surah";
  /** Exact timings for this recording, if available. */
  timings: RecordingTimings | null;
  syncStatus: SyncStatus;
  /** Internal: currently-loaded ayah for per-ayah granularity. */
  currentAyahForGranularity?: number;
}
