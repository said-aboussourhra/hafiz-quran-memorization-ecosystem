"use client";

/**
 * HAFIZ — Smart Session planner.
 *
 * The teacher decides WHAT / WHEN / HOW / HOW MUCH / WHICH METHOD based on the
 * learner's real profile (history, errors, mastery, retention, available time,
 * prior performance). It never equates opening an ayah or playing audio with
 * memorization — the plan only includes ayat that actually need work, and
 * every teachable step ends in a hidden recall that feeds the SRS.
 */

import type { HafizProfile, AyahProgress, AyahState } from "./profile";
import { ayahKey, getOrCreateAyah } from "./profile";
import { isDue } from "./srs";
import type { SurahMeta } from "@/lib/surahs";

export type TeachMethod =
  | "ayah_by_ayah"
  | "chunking"
  | "active_recall"
  | "gradual_hiding"
  | "listen_read_hide_recite"
  | "repetition"
  | "linking"
  | "random_recall"
  | "weak_word_training"
  | "mutashabihat"
  | "interleaved_review"
  | "interruption_test";

export interface MethodInfo {
  id: TeachMethod;
  label: string;
  ar: string;
  desc: string;
  /** Minimum ayah count within a unit for this method to apply. */
  minAyat?: number;
}

export const METHODS: Record<TeachMethod, MethodInfo> = {
  ayah_by_ayah: { id: "ayah_by_ayah", label: "Ayah by Ayah", ar: "آيةً آية", desc: "تعلّم آية واحدة حتى ترسخ قبل الانتقال." },
  chunking: { id: "chunking", label: "Chunking", ar: "التقسيم", desc: "قسّم الآية الطويلة إلى مقاطع قصيرة.", minAyat: 1 },
  active_recall: { id: "active_recall", label: "Active Recall", ar: "الاستدعاء النشط", desc: "حاول أن تسترجع النص قبل رؤيته." },
  gradual_hiding: { id: "gradual_hiding", label: "Gradual Hiding", ar: "الإخفاء التدريجي", desc: "أخفِ الكلمات واحدةً واحدة.", minAyat: 1 },
  listen_read_hide_recite: { id: "listen_read_hide_recite", label: "Listen → Read → Hide → Recite", ar: "استمع · اقرأ · أخفِ · سمّع", desc: "الحلقة الكبرى للتثبيت." },
  repetition: { id: "repetition", label: "Repetition", ar: "التكرار", desc: "كرر الآية عددًا محسوبًا.", minAyat: 1 },
  linking: { id: "linking", label: "Linking", ar: "الربط", desc: "اربط آخر الآية بأول التي تليها.", minAyat: 2 },
  random_recall: { id: "random_recall", label: "Random Recall", ar: "استدعاء عشوائي", desc: "اختبار آية عشوائية من المحفوظ." },
  weak_word_training: { id: "weak_word_training", label: "Weak Word Training", ar: "تدريب الكلمات الضعيفة", desc: "ركّز على أكثر كلماتك خطأً.", minAyat: 1 },
  mutashabihat: { id: "mutashabihat", label: "Mutashabihat", ar: "المتشابهات", desc: "ميّز الآيات المتشابهة لفظًا.", minAyat: 2 },
  interleaved_review: { id: "interleaved_review", label: "Interleaved Review", ar: "المراجعة المتداخلة", desc: "راجع سورًا مختلفة في جلسة واحدة.", minAyat: 2 },
  interruption_test: { id: "interruption_test", label: "Interruption Test", ar: "اختبار الانقطاع", desc: "أكمل الآية بعد توقف مفاجئ.", minAyat: 1 },
};

export type StepKind =
  | "listen"
  | "read"
  | "repeat"
  | "hide"
  | "recite"
  | "correct"
  | "retry"
  | "test";

export interface SessionStep {
  kind: StepKind;
  ayah: number;
  /** Optional word range for chunking/weak-word/gradual-hiding. */
  wordStart?: number;
  wordEnd?: number;
  method: TeachMethod;
  prompt: string;
  /** The text is hidden during recite/test steps — only the prompt shows. */
  hidden: boolean;
  /** Recitation 0..1 the learner self-reports / the test computes. */
  expectsScore?: boolean;
  /**
   * Gradual-hiding level 1..5:
   * 1 = full text, 2 = partial, 3 = selected words, 4 = most words, 5 = none.
   * Drives progressive word masking based on real performance.
   */
  hideLevel?: 1 | 2 | 3 | 4 | 5;
}

export interface SessionItem {
  surah: number;
  ayah: number;
  state: AyahState;
  method: TeachMethod;
  steps: SessionStep[];
}

export interface SessionPlan {
  token: string;
  items: SessionItem[];
  focus: string;
  minutes: number;
  createdAt: number;
}

const MINUTES_PER_ITEM = 2.2;

/**
 * Build a session for a given surah scope. If availableMinutes is provided,
 * the plan is sized to fit; otherwise it uses a sensible default.
 */
export function planSession(
  profile: HafizProfile,
  surah: SurahMeta,
  opts: {
    focusAyah?: number;
    availableMinutes?: number;
    includeReview?: boolean;
  } = {},
): SessionPlan {
  const token = `s_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  const minutes = Math.max(3, Math.min(45, opts.availableMinutes ?? 8));
  const capacity = Math.max(2, Math.round(minutes / MINUTES_PER_ITEM));

  const candidates = rankCandidates(profile, surah, opts.focusAyah);
  const chosen = candidates.slice(0, capacity);

  const items: SessionItem[] = chosen.map((ap) => {
    const method = chooseMethod(ap, surah);
    const prev = profile.perAyah[ayahKey(surah.number, Math.max(1, ap.ayah - 1))];
    const linkWeak = !!prev && prev.linkMisses > prev.linkHits;
    const effectiveMethod: TeachMethod =
      linkWeak && surah.ayahCount > 1 ? "linking" : method;
    return {
      surah: surah.number,
      ayah: ap.ayah,
      state: ap.state,
      method: effectiveMethod,
      steps: buildSteps(ap, effectiveMethod, surah),
    };
  });

  const focus = describeFocus(chosen);

  return {
    token,
    items,
    focus,
    minutes,
    createdAt: Date.now(),
  };
}

/** Rank ayat by urgency: due for review > weak > learning > new (sequential). */
function rankCandidates(
  profile: HafizProfile,
  surah: SurahMeta,
  focusAyah?: number,
): AyahProgress[] {
  const now = Date.now();
  const list: { ap: AyahProgress; score: number }[] = [];

  for (let a = 1; a <= surah.ayahCount; a++) {
    const ap = getOrCreateAyah(profile, surah.number, a);
    let score = 0;
    if (focusAyah != null) {
      // neighborhood of the focused ayah first
      const dist = Math.abs(a - focusAyah);
      score += (surah.ayahCount - dist) * 10;
    }
    if (isDue(ap, now)) score += 1000 - ap.intervalDays * 10;
    if (ap.state === "WEAK") score += 500;
    if (ap.state === "LEARNING") score += 300;
    if (ap.state === "NEEDS_REVIEW") score += 800;
    if (ap.state === "STABLE") score += 50;
    if (ap.state === "MASTERED") score -= 50; // rarely re-test mastered
    if (ap.state === "NEW") score += 100 + (surah.ayahCount - a); // learn in order
    if (ap.weakWords.length > 0) score += ap.weakWords.length * 15;
    // freshness: long untouched gets a small boost
    if (ap.lastReviewedAt) {
      const daysSince = (now - ap.lastReviewedAt) / (24 * 3600 * 1000);
      score += Math.min(daysSince * 2, 60);
    }
    list.push({ ap, score });
  }

  list.sort((x, y) => y.score - x.score);
  return list.map((x) => x.ap);
}

/**
 * Derive the gradual-hiding level (1..5) from REAL performance only.
 * No hiding until the learner has demonstrated at least some recall.
 */
export function hideLevelFor(ap: AyahProgress): 1 | 2 | 3 | 4 | 5 {
  const score = ap.bestHiddenScore;
  const streak = ap.hiddenCorrectStreak;
  const weak = ap.weakWords.length;
  if (ap.totalReviews === 0) return 1;        // never studied → full text
  if (score < 0.3 || streak === 0) return 2;  // just starting → partial
  if (score < 0.6 || weak >= 3) return 3;     // selected words hidden
  if (score < 0.85) return 4;                 // most words hidden
  return 5;                                    // solid → no text
}

function chooseMethod(ap: AyahProgress, surah: SurahMeta): TeachMethod {
  if (ap.weakWords.length >= 3) return "weak_word_training";
  if (ap.state === "NEW" || ap.state === "LEARNING") return "listen_read_hide_recite";
  if (ap.state === "WEAK") return "gradual_hiding";
  if (ap.state === "NEEDS_REVIEW") return "active_recall";
  if (ap.state === "STABLE" && surah.ayahCount >= 2) return "interleaved_review";
  if (ap.state === "MASTERED") return "random_recall";
  return "repetition";
}

function buildSteps(
  ap: AyahProgress,
  method: TeachMethod,
  _surah: SurahMeta,
): SessionStep[] {
  const a = ap.ayah;
  const mk = (
    kind: StepKind,
    prompt: string,
    hidden: boolean,
    extra: Partial<SessionStep> = {},
  ): SessionStep => ({ kind, ayah: a, method, prompt, hidden, ...extra });

  switch (method) {
    case "weak_word_training": {
      const weak = ap.weakWords.slice(0, 3);
      const steps: SessionStep[] = [
        mk("listen", "استمع إلى الآية كاملة، وركّز على مواضع الكلمات الضعيفة.", false),
      ];
      for (const w of weak) {
        steps.push(
          mk("hide", `أخفِ النص وردّد الكلمة رقم ${w.index + 1} ثلاث مرات.`, true, {
            wordStart: w.index,
            wordEnd: w.index,
          }),
        );
      }
      steps.push(mk("recite", "سمّع الآية كاملة مع إتقان الكلمات الضعيفة.", true, { expectsScore: true }));
      steps.push(mk("test", "اختبار الكلمات الضعيفة: املأ الفراغات.", true, { expectsScore: true }));
      return steps;
    }
    case "gradual_hiding": {
      // Progress through hiding levels 2→5 based on demonstrated performance.
      const startLevel = hideLevelFor(ap);
      const levels: (1 | 2 | 3 | 4 | 5)[] = [];
      for (let lvl = Math.max(2, startLevel) as 1 | 2 | 3 | 4 | 5; lvl <= 5; lvl = (lvl + 1) as 1 | 2 | 3 | 4 | 5) {
        levels.push(lvl);
      }
      const steps: SessionStep[] = [
        mk("listen", "استمع إلى الآية مرتين.", false, { hideLevel: 1 }),
        mk("read", "اقرأ الآية بالنظر.", false, { hideLevel: 1 }),
        mk("repeat", "كرّر الآية ثلاثًا مع النص.", false, { hideLevel: 1 }),
      ];
      const prompts: Record<number, string> = {
        2: "الإخفاء الجزئي: سمّع الكلمات المخفية.",
        3: "إخفاء كلمات مختارة: ركّز عليها.",
        4: "إخفاء معظم النص: تابع التسميع.",
        5: "النص مخفي كليًا: سمّع من ذاكرتك.",
      };
      for (const lvl of levels) {
        steps.push(
          mk("hide", prompts[lvl], true, { hideLevel: lvl, expectsScore: lvl >= 4 }),
        );
      }
      steps.push(mk("test", "اختبار سريع: أكمل الآية.", true, { hideLevel: 5, expectsScore: true }));
      return steps;
    }
    case "active_recall":
      return [
        mk("read", "راجع الآية مرة واحدة فقط.", false),
        mk("hide", "أخفِ النص فورًا.", true),
        mk("recite", "حاول استرجاع الآية كاملة من الذاكرة.", true, { expectsScore: true }),
        mk("correct", "قارن إجابتك بالنص الأصلي.", false),
        mk("retry", "أعِد التسميع حتى تصيب.", true, { expectsScore: true }),
      ];
    case "interleaved_review":
      return [
        mk("read", "راجع الآية سريعًا.", false),
        mk("recite", "سمّع الآية من الذاكرة.", true, { expectsScore: true }),
      ];
    case "linking":
      return [
        mk("read", "اقرأ الآية السابقة مع هذه الآية لربط أولها بآخر ما قبلها.", false),
        mk("hide", "أخفِ النص، وردّد: آخر السابقة ثم أول هذه الآية.", true),
        mk("recite", "سمّع الآيتين متصلتين من الذاكرة.", true, { expectsScore: true }),
      ];
    case "random_recall":
      return [
        mk("recite", "فاجئ نفسك: سمّع الآية دون تحضير.", true, { expectsScore: true }),
      ];
    case "listen_read_hide_recite":
    default:
      return [
        mk("listen", "استمع إلى التلاوة بتركيز.", false),
        mk("read", "اقرأ الآية وأنت تنظر.", false),
        mk("repeat", "كرّر الآية مع التلاوة.", false),
        mk("hide", "أخفِ النص الآن.", true),
        mk("recite", "سمّع الآية من ذاكرتك.", true, { expectsScore: true }),
        mk("correct", "قارن بما سمعت وقرأت.", false),
        mk("retry", "أعِد المحاولة عند أي خطأ.", true, { expectsScore: true }),
        mk("test", "اختبار التثبيت النهائي.", true, { expectsScore: true }),
      ];
  }
}

function describeFocus(items: AyahProgress[]): string {
  if (items.length === 0) return "لا توجد آيات في هذه السورة.";
  const due = items.filter((a) => a.state === "NEEDS_REVIEW").length;
  const weak = items.filter((a) => a.state === "WEAK").length;
  const fresh = items.filter((a) => a.state === "NEW").length;
  if (due > 0) return `مراجعة ${due} آيات حان وقتها`;
  if (weak > 0) return `تقوية ${weak} آيات ضعيفة`;
  if (fresh > 0) return `حفظ ${fresh} آيات جديدة`;
  return "تثبيت المحفوظ";
}

/** A short test prompt generator for a word-gap quiz (same-surah words). */
export function buildWordGaps(words: string[]): { prompt: string; answerIndex: number }[] {
  // Pick content words (length >= 3) to avoid trivial function words.
  const indices = words
    .map((w, i) => ({ w, i }))
    .filter(({ w }) => w.replace(/[^\u0600-\u06FF]/g, "").length >= 3)
    .map((x) => x.i);
  if (indices.length < 2) return [];
  const pick = indices[Math.floor(Math.random() * indices.length)];
  const masked = words.map((w, i) => (i === pick ? "⋯" : w)).join(" ");
  return [{ prompt: masked, answerIndex: pick }];
}

export { ayahKey };
