// Client-side reciter preferences: favorites, recently played, default.
// Stored in localStorage (per device). Reciter IDs reference the registry.
import { readJSON, readString, writeValue } from "./clientSettings";

const FAVS_KEY = "hafiz_reciter_favs";
const RECENT_KEY = "hafiz_reciter_recent";
const DEFAULT_KEY = "hafiz_default_reciter";
const MAX_RECENT = 8;

export function getFavoriteReciters(): string[] {
  const v = readJSON<string[]>(FAVS_KEY, []);
  return Array.isArray(v) ? v.filter((x) => typeof x === "string") : [];
}

export function isFavoriteReciter(id: string): boolean {
  return getFavoriteReciters().includes(id);
}

export function toggleFavoriteReciter(id: string): string[] {
  const favs = getFavoriteReciters();
  const next = favs.includes(id) ? favs.filter((x) => x !== id) : [id, ...favs];
  writeValue(FAVS_KEY, JSON.stringify(next));
  return next;
}

export function getRecentReciters(): string[] {
  const v = readJSON<string[]>(RECENT_KEY, []);
  return Array.isArray(v) ? v.filter((x) => typeof x === "string") : [];
}

export function pushRecentReciter(id: string): string[] {
  const recent = [id, ...getRecentReciters().filter((x) => x !== id)].slice(0, MAX_RECENT);
  writeValue(RECENT_KEY, JSON.stringify(recent));
  return recent;
}

export function getDefaultReciterId(): string {
  return readString(DEFAULT_KEY, "dosari");
}

export function setDefaultReciter(id: string): void {
  writeValue(DEFAULT_KEY, id);
}
