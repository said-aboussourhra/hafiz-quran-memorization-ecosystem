"use client";

/**
 * HAFIZ — User Memorization Profile
 *
 * Immutable Quran data is NEVER modified here. This module stores ONLY the
 * learner's progress (per-ayah memory state, review history, weak words) in
 * localStorage. All Quran text is read from the existing verified data layer.
 *
 * Mastery is earned through REAL recall performance across separate sessions
 * and spaced review — opening an ayah, playing audio, or finishing a session
 * never counts as memorization.
 */

export type AyahState =
  | "NEW"
  | "LEARNING"
  | "WEAK"
  | "STABLE"
  | "MASTERED"
  | "NEEDS_REVIEW";

export interface ReviewEvent {
  /** ISO timestamp of the review. */
  at: number;
  /** 0 = forgot, 1 = wrong, 2 = hard, 3 = good, 4 = perfect/effortless. */
  grade: 0 | 1 | 2 | 3 | 4;
  /** Whether the text was hidden during recall (only hidden recalls count). */
  hidden: boolean;
  /** Teaching method that produced this review. */
  method: string;
}

export type MistakeType =
  | "WRONG_WORD"
  | "MISSING_WORD"
  | "EXTRA_WORD"
  | "WORD_ORDER"
  | "REPETITION"
  | "HESITATION"
  | "LONG_PAUSE"
  | "UNCERTAIN";

export const MISTAKE_META: Record<MistakeType, { ar: string; tone: string }> = {
  WRONG_WORD: { ar: "كلمة خاطئة", tone: "red" },
  MISSING_WORD: { ar: "كلمة ناقصة", tone: "orange" },
  EXTRA_WORD: { ar: "كلمة زائدة", tone: "amber" },
  WORD_ORDER: { ar: "تقديم وتأخير", tone: "yellow" },
  REPETITION: { ar: "تكرار", tone: "sky" },
  HESITATION: { ar: "تردد", tone: "violet" },
  LONG_PAUSE: { ar: "وقف طويل", tone: "slate" },
  UNCERTAIN: { ar: "غير متأكد", tone: "zinc" },
};

export interface ErrorRecord {
  id: string;
  surah: number;
  ayah: number;
  wordIndex: number | null;
  type: MistakeType;
  frequency: number;
  firstAt: number;
  lastAt: number;
  corrections: number; // successful recitations since last mistake
  resolved: boolean;
}

export interface WeakWord {
  /** 0-based word index within the ayah. */
  index: number;
  /** Times this word was missed. */
  misses: number;
  /** Times this word was answered correctly. */
  hits: number;
  lastSeen: number;
}

export interface AyahProgress {
  surah: number;
  ayah: number;
  state: AyahState;

  // SM-2-like spaced repetition fields.
  easiness: number; // EF, starts 2.5
  intervalDays: number;
  reps: number; // successful repetitions
  lapses: number; // times it dropped back to learning

  dueAt: number | null; // epoch ms; null = not yet scheduled
  lastReviewedAt: number | null;
  firstSeenAt: number | null;

  // Honest mastery evidence.
  hiddenCorrectStreak: number; // consecutive correct recalls WITH text hidden
  bestHiddenScore: number; // 0..1, best last-test score
  totalReviews: number;
  history: ReviewEvent[]; // capped
  weakWords: WeakWord[];
  /** Permanent personal error memory for this ayah. */
  errors: ErrorRecord[];
  /** Times the learner forgot the link FROM this ayah to the next one. */
  linkMisses: number;
  linkHits: number;
  /** Distinct session ids in which the ayah was correctly recalled hidden. */
  masteredSessionTokens: string[];
}

export interface SurahSummary {
  surah: number;
  total: number;
  byState: Record<AyahState, number>;
  masteredPercent: number;
  state: AyahState; // surah-level aggregate
  dueCount: number;
  nextDueAt: number | null;
}

export interface HafizProfile {
  version: 1;
  perAyah: Record<string, AyahProgress>;
  sessionCount: number;
  lastSessionAt: number | null;
  /** total study seconds */
  totalSeconds: number;
  createdAt: number;
  updatedAt: number;
}

const STORAGE_KEY = "hafiz_profile_v1";
const HISTORY_CAP = 50;

export function ayahKey(surah: number, ayah: number): string {
  return `${surah}:${ayah}`;
}

export function emptyProfile(): HafizProfile {
  const now = Date.now();
  return {
    version: 1,
    perAyah: {},
    sessionCount: 0,
    lastSessionAt: null,
    totalSeconds: 0,
    createdAt: now,
    updatedAt: now,
  };
}

export function loadProfile(): HafizProfile {
  if (typeof window === "undefined") return emptyProfile();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyProfile();
    const parsed = JSON.parse(raw) as HafizProfile;
    if (!parsed || parsed.version !== 1 || !parsed.perAyah) return emptyProfile();
    return parsed;
  } catch {
    return emptyProfile();
  }
}

export function saveProfile(p: HafizProfile): void {
  if (typeof window === "undefined") return;
  p.updatedAt = Date.now();
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
  } catch {
    /* storage full / unavailable — non-fatal */
  }
}

export function getOrCreateAyah(
  p: HafizProfile,
  surah: number,
  ayah: number,
): AyahProgress {
  const k = ayahKey(surah, ayah);
  const existing = p.perAyah[k];
  if (existing) return existing;
  const now = Date.now();
  const created: AyahProgress = {
    surah,
    ayah,
    state: "NEW",
    easiness: 2.5,
    intervalDays: 0,
    reps: 0,
    lapses: 0,
    dueAt: null,
    lastReviewedAt: null,
    firstSeenAt: now,
    hiddenCorrectStreak: 0,
    bestHiddenScore: 0,
    totalReviews: 0,
    history: [],
    weakWords: [],
    errors: [],
    linkMisses: 0,
    linkHits: 0,
    masteredSessionTokens: [],
  };
  p.perAyah[k] = created;
  return created;
}

export function recordWeakWord(
  ap: AyahProgress,
  index: number,
  missed: boolean,
): void {
  let w = ap.weakWords.find((x) => x.index === index);
  if (!w) {
    w = { index, misses: 0, hits: 0, lastSeen: Date.now() };
    ap.weakWords.push(w);
  }
  w.lastSeen = Date.now();
  if (missed) w.misses += 1;
  else w.hits += 1;
  // keep only meaningful weak words
  ap.weakWords = ap.weakWords
    .filter((x) => x.misses > 0)
    .sort((a, b) => b.misses - a.misses)
    .slice(0, 20);
}

export function appendReview(ap: AyahProgress, ev: ReviewEvent): void {
  ap.history.push(ev);
  if (ap.history.length > HISTORY_CAP) {
    ap.history.splice(0, ap.history.length - HISTORY_CAP);
  }
  ap.totalReviews += 1;
  ap.lastReviewedAt = ev.at;
}

/** How many ayat in a surah must be MASTERED for the surah to read MASTERED. */
const SURAH_MASTERED_RATIO = 0.9;

export function summarizeSurah(
  p: HafizProfile,
  surah: number,
  totalAyat: number,
): SurahSummary {
  const byState: Record<AyahState, number> = {
    NEW: 0,
    LEARNING: 0,
    WEAK: 0,
    STABLE: 0,
    MASTERED: 0,
    NEEDS_REVIEW: 0,
  };
  let mastered = 0;
  let due = 0;
  let nextDue: number | null = null;
  const now = Date.now();

  for (let a = 1; a <= totalAyat; a++) {
    const ap = p.perAyah[ayahKey(surah, a)];
    if (!ap) {
      byState.NEW += 1;
      continue;
    }
    byState[ap.state] += 1;
    if (ap.state === "MASTERED") mastered += 1;
    if (ap.dueAt && ap.dueAt <= now) due += 1;
    if (ap.dueAt && (nextDue === null || ap.dueAt < nextDue)) nextDue = ap.dueAt;
  }

  const ratio = totalAyat > 0 ? mastered / totalAyat : 0;
  let state: AyahState = "NEW";
  if (ratio >= SURAH_MASTERED_RATIO) state = "MASTERED";
  else if (byState.MASTERED > 0 || byState.STABLE > 0) state = "STABLE";
  else if (byState.LEARNING > 0 || byState.WEAK > 0) state = "LEARNING";
  if (due > 0 && state !== "MASTERED" && state !== "NEW") state = "NEEDS_REVIEW";

  return {
    surah,
    total: totalAyat,
    byState,
    masteredPercent: Math.round(ratio * 100),
    state,
    dueCount: due,
    nextDueAt: nextDue,
  };
}

/** Record (or bump) a mistake in the permanent personal error memory. */
export function recordError(
  ap: AyahProgress,
  type: MistakeType,
  wordIndex: number | null,
): void {
  const now = Date.now();
  const id = `${type}:${wordIndex ?? "-"}`;
  let e = ap.errors.find((x) => x.id === id);
  if (!e) {
    e = {
      id,
      surah: ap.surah,
      ayah: ap.ayah,
      wordIndex,
      type,
      frequency: 0,
      firstAt: now,
      lastAt: now,
      corrections: 0,
      resolved: false,
    };
    ap.errors.push(e);
  }
  e.frequency += 1;
  e.lastAt = now;
  e.corrections = 0;
  e.resolved = false;
  if (wordIndex != null) recordWeakWord(ap, wordIndex, true);
  // cap error memory
  if (ap.errors.length > 40) {
    ap.errors.sort((a, b) => b.lastAt - a.lastAt);
    ap.errors.splice(40);
  }
}

/** Mark that the learner correctly recited a previously-error spot. */
export function markErrorCorrected(ap: AyahProgress, errorId: string): void {
  const e = ap.errors.find((x) => x.id === errorId);
  if (!e) return;
  e.corrections += 1;
  if (e.corrections >= 2) e.resolved = true;
  if (e.wordIndex != null) recordWeakWord(ap, e.wordIndex, false);
}

export function topErrors(ap: AyahProgress, limit = 5): ErrorRecord[] {
  return [...ap.errors]
    .filter((e) => !e.resolved)
    .sort((a, b) => b.frequency - a.frequency)
    .slice(0, limit);
}

export const STATE_META: Record<
  AyahState,
  { label: string; color: string; dot: string; ar: string }
> = {
  NEW: { label: "جديد", color: "#94a3b8", dot: "bg-slate-400", ar: "لم يُدرس بعد" },
  LEARNING: { label: "يتعلّم", color: "#38bdf8", dot: "bg-sky-400", ar: "في طور الحفظ" },
  WEAK: { label: "ضعيف", color: "#f97316", dot: "bg-orange-500", ar: "يحتاج تركيزاً" },
  STABLE: { label: "مستقر", color: "#22c55e", dot: "bg-emerald-500", ar: "حفظ راسخ" },
  MASTERED: { label: "متقن", color: "#059669", dot: "bg-emerald-700", ar: "إتقان مُثبت" },
  NEEDS_REVIEW: { label: "مراجعة", color: "#eab308", dot: "bg-yellow-500", ar: "حان وقت المراجعة" },
};
