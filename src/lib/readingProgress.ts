// Per-surah reading progress: which ayahs the reader has actually visited
// (opened a leaf containing them, selected them, or listened to them).
// Stored locally per device — no Quran text is stored, only ayah numbers.

const KEY = "hafiz_reading_progress_v1";

type ProgressMap = Record<number, number[]>;

function load(): ProgressMap {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as ProgressMap;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function save(map: ProgressMap): void {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(map));
  } catch {
    /* storage unavailable */
  }
}

export function getVisited(surah: number): number[] {
  const list = load()[surah];
  return Array.isArray(list) ? list : [];
}

export function markVisited(surah: number, ayah: number): void {
  if (typeof window === "undefined" || !Number.isInteger(ayah) || ayah < 1) return;
  const map = load();
  const list = Array.isArray(map[surah]) ? map[surah] : [];
  if (list.includes(ayah)) return;
  map[surah] = [...list, ayah];
  save(map);
}

export function getProgress(surah: number, totalAyahs: number): { visited: number; pct: number } {
  const visited = getVisited(surah).filter((n) => n >= 1 && n <= totalAyahs).length;
  const pct = totalAyahs > 0 ? Math.round((visited / totalAyahs) * 100) : 0;
  return { visited, pct: Math.min(100, pct) };
}

export function clearProgress(surah: number): void {
  if (typeof window === "undefined") return;
  const map = load();
  delete map[surah];
  save(map);
}
