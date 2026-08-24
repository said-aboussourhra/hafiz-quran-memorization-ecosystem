// Local bookmarks + last-reading-position for the Mushaf.
// Stored in localStorage (per device). No Quran text is stored — only stable
// references (surah number, ayah number, page), so the verified source remains
// the single source of truth for any text/audio.

export type Bookmark = {
  surah: number;
  ayah: number; // numberInSurah, 1-based
  page?: number;
  createdAt: number;
  note?: string;
};

export type ReadingPosition = {
  surah: number;
  ayah: number;
  page?: number;
  updatedAt: number;
};

const BOOKMARKS_KEY = "hafiz_bookmarks_v1";
const POSITION_KEY = "hafiz_position_v1";

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function getBookmarks(): Bookmark[] {
  if (typeof window === "undefined") return [];
  try {
    const list = safeParse<Bookmark[]>(window.localStorage.getItem(BOOKMARKS_KEY), []);
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

export function isBookmarked(surah: number, ayah: number): boolean {
  return getBookmarks().some((b) => b.surah === surah && b.ayah === ayah);
}

export function toggleBookmark(input: Omit<Bookmark, "createdAt">): { added: boolean; bookmarks: Bookmark[] } {
  const existing = getBookmarks();
  const idx = existing.findIndex((b) => b.surah === input.surah && b.ayah === input.ayah);
  let next: Bookmark[];
  let added: boolean;
  if (idx >= 0) {
    next = existing.filter((_, i) => i !== idx);
    added = false;
  } else {
    next = [{ ...input, createdAt: Date.now() }, ...existing];
    added = true;
  }
  try {
    window.localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(next));
  } catch {
    /* storage unavailable */
  }
  return { added, bookmarks: next };
}

export function removeBookmark(surah: number, ayah: number): Bookmark[] {
  const next = getBookmarks().filter((b) => !(b.surah === surah && b.ayah === ayah));
  try {
    window.localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
  return next;
}

export function savePosition(pos: Omit<ReadingPosition, "updatedAt">): void {
  if (typeof window === "undefined") return;
  try {
    const full: ReadingPosition = { ...pos, updatedAt: Date.now() };
    window.localStorage.setItem(POSITION_KEY, JSON.stringify(full));
  } catch {
    /* ignore */
  }
}

export function getPosition(): ReadingPosition | null {
  if (typeof window === "undefined") return null;
  try {
    return safeParse<ReadingPosition | null>(window.localStorage.getItem(POSITION_KEY), null);
  } catch {
    return null;
  }
}

/** Copy a verse to the clipboard with a clean, respectful citation. */
export async function copyAyah(text: string, surahNameAr: string, ayahNumber: number): Promise<boolean> {
  if (typeof navigator === "undefined" || !navigator.clipboard) return false;
  const payload = `${text}\n﴿${surahNameAr} - آية ${ayahNumber}﴾`;
  try {
    await navigator.clipboard.writeText(payload);
    return true;
  } catch {
    return false;
  }
}
