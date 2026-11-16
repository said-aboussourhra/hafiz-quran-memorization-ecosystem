/**
 * Lightweight tajweed color hints for the bundled Uthmani text.
 * This intentionally labels only patterns that can be recognized in the
 * available spelling; it is an aid, not a substitute for a qualified teacher.
 */
export type TajweedRuleId =
  | "ghunnah"
  | "qalqalah"
  | "ikhfa"
  | "idgham"
  | "izhar"
  | "iqlab"
  | "madd";

export type TajweedRule = {
  id: TajweedRuleId;
  label: string;
  detail: string;
  color: string;
};

export const TAJWEED_RULES: readonly TajweedRule[] = [
  { id: "ikhfa", label: "إخفاء حقيقي / شفوي", detail: "إخفاء النون الساكنة أو التنوين قبل حروف الإخفاء، أو الميم الساكنة قبل الباء.", color: "#c2410c" },
  { id: "idgham", label: "إدغام", detail: "إدغام النون الساكنة أو التنوين في حروف يرملون، أو الميم الساكنة في الميم.", color: "#047857" },
  { id: "izhar", label: "إظهار", detail: "إظهار النون الساكنة أو التنوين عند حروف الحلق، أو الميم الساكنة عند غير الباء والميم.", color: "#1d4ed8" },
  { id: "iqlab", label: "إقلاب", detail: "قلب النون الساكنة أو التنوين ميماً مخفاة عند الباء.", color: "#7e22ce" },
  { id: "ghunnah", label: "غنّة", detail: "غنّة النون أو الميم المشددتين.", color: "#0891b2" },
  { id: "qalqalah", label: "قلقلة", detail: "حروف قطب جد الساكنة.", color: "#be123c" },
  { id: "madd", label: "مدّ ظاهر في الرسم", detail: "موضع يحمل علامة المد في الرسم العثماني.", color: "#a16207" },
] as const;

const RULE_BY_ID = Object.fromEntries(TAJWEED_RULES.map((rule) => [rule.id, rule])) as Record<TajweedRuleId, TajweedRule>;
const ARABIC_LETTER = /[ء-يٱ]/u;

function firstLetter(text: string): string | null {
  for (const char of text) if (ARABIC_LETTER.test(char)) return normalizeLetter(char);
  return null;
}

function nextLetter(text: string, offset: number): string | null {
  const rest = Array.from(text).slice(offset).join("");
  return firstLetter(rest);
}

function normalizeLetter(letter: string): string {
  if ("اأإآٱٲٳٵ".includes(letter)) return "ء";
  return letter;
}

function noonRule(next: string | null): TajweedRuleId | null {
  if (!next) return null;
  if (next === "ب") return "iqlab";
  if ("يرملون".includes(next)) return "idgham";
  if ("ءهعحغخ".includes(next)) return "izhar";
  if ("تثجدذزسشصضطظفقك".includes(next)) return "ikhfa";
  return null;
}

function followingAfterSakin(word: string, markerIndex: number, nextWord?: string): string | null {
  const withinWord = nextLetter(word, markerIndex + 2);
  return withinWord ?? firstLetter(nextWord ?? "");
}

/** Return the clearest recognizable tajweed rule for one word in its ayah. */
export function getTajweedRule(words: readonly string[], index: number): TajweedRule | null {
  const word = words[index] ?? "";
  const nextWord = words[index + 1] ?? "";

  if (/[نم]ّ/u.test(word)) return RULE_BY_ID.ghunnah;
  if (/[قطبجد][ْۡ]/u.test(word)) return RULE_BY_ID.qalqalah;

  const noonSakin = /ن[ْۡ]/u.exec(word);
  if (noonSakin) {
    const next = followingAfterSakin(word, noonSakin.index, nextWord);
    const id = noonRule(next);
    if (id) return RULE_BY_ID[id];
  }

  if (/[ًٌٍ]/u.test(word) && nextWord) {
    const id = noonRule(firstLetter(nextWord));
    if (id) return RULE_BY_ID[id];
  }

  const meemSakin = /م[ْۡ]/u.exec(word);
  if (meemSakin) {
    const next = followingAfterSakin(word, meemSakin.index, nextWord);
    if (next === "م") return RULE_BY_ID.idgham;
    if (next === "ب") return RULE_BY_ID.ikhfa;
    if (next) return RULE_BY_ID.izhar;
  }

  if (/[ٓۤ]/u.test(word)) return RULE_BY_ID.madd;
  return null;
}
