"use client";

/**
 * HAFIZ — Spaced-repetition scheduler + honest state machine.
 *
 * Review grades (recall quality):
 *   0 = forgot / blank (text was hidden, learner could not recall)
 *   1 = wrong recall with errors
 *   2 = hard recall (hesitant, some prompting)
 *   3 = good recall
 *   4 = perfect / effortless
 *
 * Rules:
 *  - MASTERY is NEVER granted from opening an ayah, playing audio, or
 *    completing a session. It requires correct HIDDEN recall (grade >= 3)
 *    across 3+ distinct sessions and a passing last-test score.
 *  - Forgetting resets the interval and increments lapses (WEAK/LEARNING).
 *  - Scheduling follows a conservative SM-2 variant, adapted for Quran
 *    memorization (shorter early intervals, longer stable intervals).
 */

import type { AyahProgress, AyahState, HafizProfile, ReviewEvent } from "./profile";
import { getOrCreateAyah, appendReview, recordWeakWord } from "./profile";

const DAY = 24 * 60 * 60 * 1000;

/** Minimum distinct sessions with correct hidden recall before MASTERED. */
const MIN_MASTERY_SESSIONS = 3;
/** Required best hidden-test score to claim mastery. */
const MASTERY_SCORE = 0.8;
/** Hidden-correct streak required. */
const MIN_STREAK = 3;

export interface GradeResult {
  state: AyahState;
  dueAt: number;
  intervalDays: number;
}

export function applyGrade(
  ap: AyahProgress,
  grade: 0 | 1 | 2 | 3 | 4,
  hidden: boolean,
  sessionToken: string,
  method: string,
): GradeResult {
  const now = Date.now();
  const ev: ReviewEvent = { at: now, grade, hidden, method };
  appendReview(ap, ev);

  // Hidden recall is the ONLY signal that updates the mastery streak.
  if (hidden) {
    if (grade >= 3) {
      ap.hiddenCorrectStreak += 1;
      if (!ap.masteredSessionTokens.includes(sessionToken)) {
        ap.masteredSessionTokens.push(sessionToken);
      }
    } else {
      ap.hiddenCorrectStreak = 0;
      // A wrong hidden recall invalidates the session mastery claim.
      ap.masteredSessionTokens = ap.masteredSessionTokens.filter(
        (t) => t !== sessionToken,
      );
    }
  }

  // SM-2 style update (only meaningful for real recalls).
  let ef = ap.easiness;
  ef = ef + (0.1 - (4 - grade) * (0.08 + (4 - grade) * 0.02));
  if (ef < 1.3) ef = 1.3;
  if (ef > 3.0) ef = 3.0;
  ap.easiness = ef;

  let interval: number;
  if (grade < 2) {
    // Forgetting: reset.
    ap.reps = 0;
    ap.lapses += 1;
    interval = grade === 0 ? 0 : 1; // relearn immediately or tomorrow
  } else if (grade === 2) {
    ap.reps = Math.max(1, ap.reps);
    interval = Math.max(1, Math.round((ap.intervalDays || 1) * 0.6));
  } else {
    // good or perfect
    ap.reps += 1;
    if (ap.reps === 1) interval = 1;
    else if (ap.reps === 2) interval = 3;
    else interval = Math.round((ap.intervalDays || 1) * ef);
    // Cap stable intervals at 60 days for active review.
    if (interval > 60) interval = 60;
  }

  ap.intervalDays = interval;
  const dueAt = interval > 0 ? now + interval * DAY : now + 10 * 60 * 1000; // relearn in 10 min
  ap.dueAt = dueAt;

  // Derive honest state.
  ap.state = deriveState(ap, now);
  return { state: ap.state, dueAt, intervalDays: interval };
}

function deriveState(ap: AyahProgress, now: number): AyahState {
  const due = ap.dueAt != null && ap.dueAt <= now;
  const mastered =
    ap.masteredSessionTokens.length >= MIN_MASTERY_SESSIONS &&
    ap.hiddenCorrectStreak >= MIN_STREAK &&
    ap.bestHiddenScore >= MASTERY_SCORE;

  if (mastered) return due ? "NEEDS_REVIEW" : "MASTERED";
  if (ap.lapses >= 2 || ap.hiddenCorrectStreak === 0) {
    if (ap.totalReviews > 0) return due ? "NEEDS_REVIEW" : "WEAK";
    return "NEW";
  }
  if (ap.hiddenCorrectStreak >= 1) {
    if (due) return "NEEDS_REVIEW";
    return ap.intervalDays >= 7 ? "STABLE" : "LEARNING";
  }
  return "LEARNING";
}

/**
 * Record a hidden recall test result for an ayah as a score 0..1 (fraction of
 * key words/segments recalled correctly), plus optional per-word misses.
 */
export function recordTestScore(
  p: HafizProfile,
  surah: number,
  ayah: number,
  score: number,
  opts: {
    hidden: boolean;
    sessionToken: string;
    method: string;
    missedWordIndices?: number[];
  },
): GradeResult {
  const ap = getOrCreateAyah(p, surah, ayah);
  if (opts.hidden && score > ap.bestHiddenScore) {
    ap.bestHiddenScore = Math.min(1, score);
  }
  if (opts.missedWordIndices) {
    for (const idx of opts.missedWordIndices) {
      recordWeakWord(ap, idx, true);
    }
  }
  // Convert score to a grade.
  let grade: 0 | 1 | 2 | 3 | 4;
  if (score >= 0.95) grade = 4;
  else if (score >= 0.8) grade = 3;
  else if (score >= 0.6) grade = 2;
  else if (score > 0) grade = 1;
  else grade = 0;
  return applyGrade(ap, grade, opts.hidden, opts.sessionToken, opts.method);
}

export function isDue(ap: AyahProgress, now: number = Date.now()): boolean {
  return ap.dueAt != null && ap.dueAt <= now;
}
