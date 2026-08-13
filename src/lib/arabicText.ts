// Arabic text utilities for memorization correction.

export function normalizeArabic(text: string): string {
  return text
    .replace(/[\u064B-\u065F\u0670\u0640\u06D6-\u06ED]/g, "") // harakat, tatweel, small marks
    .replace(/[إأآٱ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/\s+/g, " ")
    .trim();
}

export function normalizeWord(w: string): string {
  return normalizeArabic(w);
}

export type WordStatus = "ok" | "wrong";

export type DiffResult = {
  expected: { word: string; status: WordStatus }[];
  extras: string[]; // words the user wrote that weren't matched
  accuracy: number; // 0..1
};

// LCS-based word alignment that is forgiving of skipped/extra words.
export function diffAyah(expectedRaw: string, writtenRaw: string): DiffResult {
  const expWords = expectedRaw.trim().split(/\s+/).filter(Boolean);
  const writtenWords = writtenRaw.trim().split(/\s+/).filter(Boolean);
  const a = expWords.map(normalizeWord);
  const b = writtenWords.map(normalizeWord);

  const n = a.length;
  const m = b.length;
  const dp: number[][] = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }

  const matchedExp = new Set<number>();
  const matchedWritten = new Set<number>();
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (a[i] === b[j]) {
      matchedExp.add(i);
      matchedWritten.add(j);
      i++;
      j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      i++;
    } else {
      j++;
    }
  }

  const expected = expWords.map((word, idx) => ({
    word,
    status: (matchedExp.has(idx) ? "ok" : "wrong") as WordStatus,
  }));
  const extras = writtenWords.filter((_, idx) => !matchedWritten.has(idx));
  const accuracy = n === 0 ? 0 : matchedExp.size / n;

  return { expected, extras, accuracy };
}
