// HAFIZ AI Quran Recitation Checker
// Analyzes user speech with Quran-aware Arabic phonetics and provides exact mistake categorization.

export type RecitationIssueType =
  | "OK"
  | "WRONG_WORD"
  | "MISSING_WORD"
  | "EXTRA_WORD"
  | "ORDER_ERROR"
  | "UNCERTAIN";

export interface RecitedWordEvaluation {
  expectedIndex: number;
  expectedWord: string;
  spokenWord?: string;
  status: RecitationIssueType;
  confidence: number;
  explanationAr?: string;
}

export interface RecitationCheckResult {
  accuracy: number; // 0..1
  passed: boolean;
  scorePercentage: number;
  evaluations: RecitedWordEvaluation[];
  firstError?: RecitedWordEvaluation;
  wrongCount: number;
  missingCount: number;
  extraWords: string[];
  feedbackMessage: string;
  isConfidenceLow: boolean;
}

/**
 * Robust Quranic Arabic normalization for speech recognition matching.
 */
export function normalizeQuranicSpeech(text: string): string {
  if (!text) return "";
  return text
    // Remove all harakat and Quranic annotation marks
    .replace(/[\u064B-\u065F\u0670\u0640\u06D6-\u06ED\u0610-\u061A]/g, "")
    // Normalize alifs (hamza above, below, madda, wasla)
    .replace(/[إأآٱ]/g, "ا")
    // Normalize yaa forms
    .replace(/[ىي]/g, "ي")
    // Normalize waw forms
    .replace(/[ؤ]/g, "و")
    // Normalize hamza forms
    .replace(/[ئ]/g, "ي")
    .replace(/ء/g, "")
    // Normalize taa marbuta
    .replace(/ة/g, "ه")
    // Remove non-Arabic characters except space
    .replace(/[^\u0600-\u06FF\s]/g, "")
    // Collapse multiple whitespace
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Compare spoken recitation against verified Quran text.
 */
export function evaluateRecitation(
  expectedRawText: string,
  spokenRawText: string,
  confidenceThreshold = 0.6
): RecitationCheckResult {
  const expectedWords = expectedRawText.trim().split(/\s+/).filter(Boolean);
  const spokenWords = spokenRawText.trim().split(/\s+/).filter(Boolean);

  if (spokenWords.length === 0) {
    return {
      accuracy: 0,
      passed: false,
      scorePercentage: 0,
      evaluations: expectedWords.map((w, idx) => ({
        expectedIndex: idx,
        expectedWord: w,
        status: "MISSING_WORD",
        confidence: 0,
        explanationAr: "لم يُسمع نطق لهذه الكلمة",
      })),
      wrongCount: 0,
      missingCount: expectedWords.length,
      extraWords: [],
      feedbackMessage: "لم نتمكن من التقاط صوتك بوضوح، يرجى إعادة التسميع.",
      isConfidenceLow: true,
    };
  }

  const expNorm = expectedWords.map(normalizeQuranicSpeech);
  const spkNorm = spokenWords.map(normalizeQuranicSpeech);

  const n = expNorm.length;
  const m = spkNorm.length;

  // Dynamic programming LCS for optimal alignment
  const dp: number[][] = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      if (expNorm[i] === spkNorm[j]) {
        dp[i][j] = dp[i + 1][j + 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i + 1][j], dp[i][j + 1]);
      }
    }
  }

  const matchedExp = new Map<number, number>(); // expIndex -> spkIndex
  const matchedSpk = new Set<number>();
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (expNorm[i] === spkNorm[j]) {
      matchedExp.set(i, j);
      matchedSpk.add(j);
      i++;
      j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      i++;
    } else {
      j++;
    }
  }

  const evaluations: RecitedWordEvaluation[] = [];
  let wrongCount = 0;
  let missingCount = 0;

  for (let eIdx = 0; eIdx < n; eIdx++) {
    const rawExp = expectedWords[eIdx];
    if (matchedExp.has(eIdx)) {
      const sIdx = matchedExp.get(eIdx)!;
      evaluations.push({
        expectedIndex: eIdx,
        expectedWord: rawExp,
        spokenWord: spokenWords[sIdx],
        status: "OK",
        confidence: 0.95,
      });
    } else {
      // Find if there is an unmatched spoken word near this position
      const nearbySpoken = spokenWords[eIdx] || undefined;
      if (nearbySpoken && !matchedSpk.has(eIdx)) {
        wrongCount++;
        evaluations.push({
          expectedIndex: eIdx,
          expectedWord: rawExp,
          spokenWord: nearbySpoken,
          status: "WRONG_WORD",
          confidence: 0.85,
          explanationAr: `نطقت: "${nearbySpoken}" والصحيح: "${rawExp}"`,
        });
      } else {
        missingCount++;
        evaluations.push({
          expectedIndex: eIdx,
          expectedWord: rawExp,
          status: "MISSING_WORD",
          confidence: 0.8,
          explanationAr: `كلمة ساقطة: "${rawExp}"`,
        });
      }
    }
  }

  const extraWords = spokenWords.filter((_, idx) => !matchedSpk.has(idx));
  const matchedCount = matchedExp.size;
  const accuracy = n > 0 ? matchedCount / n : 0;
  const scorePercentage = Math.round(accuracy * 100);
  const passed = scorePercentage >= 80;

  const firstError = evaluations.find((e) => e.status !== "OK");

  let feedbackMessage = "";
  if (scorePercentage >= 95) {
    feedbackMessage = "ما شاء الله! تلاوة متقنة وممتازة 🌟";
  } else if (scorePercentage >= 80) {
    feedbackMessage = "أحسنت! حفظ جيد مع بعض الملاحظات البسيطة 👍";
  } else if (scorePercentage >= 50) {
    feedbackMessage = "تحتاج إلى تثبيت هذه الآية، راجع الكلمات المحددة باللون الأحمر 🔄";
  } else {
    feedbackMessage = "استمع للشيخ مرة أخرى وكرر الآية لتثبيتها 🎧";
  }

  return {
    accuracy,
    passed,
    scorePercentage,
    evaluations,
    firstError,
    wrongCount,
    missingCount,
    extraWords,
    feedbackMessage,
    isConfidenceLow: false,
  };
}
