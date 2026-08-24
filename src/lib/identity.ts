/**
 * Helpers for the simplified sign-in model:
 * a user is identified by their full Arabic name + date of birth.
 */

const ARABIC_DIACRITICS = /[\u064B-\u0652\u0670\u0640]/g;
const EXTRA_WHITESPACE = /\s+/g;

/** Collapse diacritics / tatweel and whitespace so names match consistently. */
export function normalizeName(input: unknown): string {
  return String(input ?? "")
    .normalize("NFKC")
    .replace(ARABIC_DIACRITICS, "")
    .replace(EXTRA_WHITESPACE, " ")
    .trim()
    .slice(0, 120);
}

/** Strict YYYY-MM-DD check that also rejects impossible calendar dates. */
export function isValidBirthDate(input: unknown): input is string {
  const value = String(input ?? "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [yearStr, monthStr, dayStr] = value.split("-");
  const year = Number(yearStr);
  const month = Number(monthStr);
  const day = Number(dayStr);
  if (month < 1 || month > 12 || day < 1) return false;
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return false;
  }
  // Must be in the past and a plausible human age (< 130 years).
  const now = Date.now();
  const thisYear = new Date().getUTCFullYear();
  const earliest = Date.UTC(thisYear - 130, 0, 1);
  const t = date.getTime();
  return t < now && t > earliest;
}
