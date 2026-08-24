// HAFIZ Personal Error Memory Engine
// Tracks personal weak points and mistaken words across sessions for targeted reinforcement.

export interface WeakWordRecord {
  id: string; // e.g. "s113_a1_w3"
  surahNumber: number;
  ayahNumber: number;
  wordIndex: number;
  wordText: string;
  expectedText: string;
  lastSpokenText?: string;
  mistakeType: "WRONG_WORD" | "MISSING_WORD" | "ORDER_ERROR";
  mistakeCount: number;
  consecutiveSuccesses: number;
  lastOccurredAt: string; // ISO date
  masteryScore: number; // 0..100
  resolved: boolean;
}

const STORAGE_KEY = "hafiz_error_memory_v1";

function makeKey(surah: number, ayah: number, wordIdx: number): string {
  return `s${surah}_a${ayah}_w${wordIdx}`;
}

export function loadErrorMemory(): Record<string, WeakWordRecord> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

export function saveErrorMemory(store: Record<string, WeakWordRecord>): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    // ignore quota
  }
}

/**
 * Record a mistake into Error Memory.
 */
export function recordMistake(
  surahNumber: number,
  ayahNumber: number,
  wordIndex: number,
  wordText: string,
  mistakeType: "WRONG_WORD" | "MISSING_WORD" | "ORDER_ERROR",
  spokenText?: string
): WeakWordRecord {
  const store = loadErrorMemory();
  const key = makeKey(surahNumber, ayahNumber, wordIndex);
  const existing = store[key];

  const now = new Date().toISOString();
  const mistakeCount = (existing?.mistakeCount || 0) + 1;
  const newMastery = Math.max(10, (existing?.masteryScore || 50) - 25);

  const updated: WeakWordRecord = {
    id: key,
    surahNumber,
    ayahNumber,
    wordIndex,
    wordText,
    expectedText: wordText,
    lastSpokenText: spokenText,
    mistakeType,
    mistakeCount,
    consecutiveSuccesses: 0,
    lastOccurredAt: now,
    masteryScore: newMastery,
    resolved: false,
  };

  store[key] = updated;
  saveErrorMemory(store);
  return updated;
}

/**
 * Record successful recitation of a previously mistaken word.
 */
export function recordSuccess(
  surahNumber: number,
  ayahNumber: number,
  wordIndex: number
): void {
  const store = loadErrorMemory();
  const key = makeKey(surahNumber, ayahNumber, wordIndex);
  const existing = store[key];
  if (!existing) return;

  const successes = existing.consecutiveSuccesses + 1;
  const newMastery = Math.min(100, existing.masteryScore + 20);
  const resolved = successes >= 3 || newMastery >= 90;

  store[key] = {
    ...existing,
    consecutiveSuccesses: successes,
    masteryScore: newMastery,
    resolved,
  };
  saveErrorMemory(store);
}

/**
 * Get active weak words that require review and reinforcement.
 */
export function getActiveWeakWords(limit = 10): WeakWordRecord[] {
  const store = loadErrorMemory();
  const list = Object.values(store).filter((w) => !w.resolved);
  // Sort by urgency: lowest mastery score & highest mistake count first
  return list
    .sort((a, b) => a.masteryScore - b.masteryScore || b.mistakeCount - a.mistakeCount)
    .slice(0, limit);
}

/**
 * Get error memory statistics.
 */
export function getErrorMemoryStats(): {
  totalWeakWords: number;
  resolvedWords: number;
  activeCount: number;
  averageMastery: number;
} {
  const store = loadErrorMemory();
  const all = Object.values(store);
  if (all.length === 0) {
    return { totalWeakWords: 0, resolvedWords: 0, activeCount: 0, averageMastery: 100 };
  }
  const resolvedWords = all.filter((w) => w.resolved).length;
  const activeCount = all.length - resolvedWords;
  const avg = Math.round(all.reduce((s, w) => s + w.masteryScore, 0) / all.length);
  return {
    totalWeakWords: all.length,
    resolvedWords,
    activeCount,
    averageMastery: avg,
  };
}
