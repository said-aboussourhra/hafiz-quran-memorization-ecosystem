"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  emptyProfile,
  getOrCreateAyah,
  loadProfile,
  recordError,
  saveProfile,
  summarizeSurah,
  type AyahProgress,
  type AyahState,
  type HafizProfile,
  type MistakeType,
  type SurahSummary,
} from "./profile";
import { applyGrade, recordTestScore } from "./srs";
import {
  planSession,
  type SessionItem,
  type SessionPlan,
} from "./session";
import type { SurahMeta } from "@/lib/surahs";

/**
 * React binding for the HAFIZ teacher. Owns the persistent profile and the
 * active session. All mutations are persisted to localStorage.
 */
export function useHafiz() {
  // Lazy init from localStorage (client-only; SSR uses empty profile).
  const [profile, setProfile] = useState<HafizProfile>(() =>
    typeof window === "undefined" ? emptyProfile() : loadProfile(),
  );
  const [session, setSession] = useState<SessionPlan | null>(null);
  const [itemIndex, setItemIndex] = useState(0);
  const [stepIndex, setStepIndex] = useState(0);
  // A slowly ticking clock so "due" counts refresh without Date.now() in render.
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(id);
  }, []);

  const hydrated = true;

  const persist = useCallback((next: HafizProfile) => {
    next.updatedAt = Date.now();
    saveProfile(next);
    setProfile(next);
  }, []);

  const startSession = useCallback(
    (surah: SurahMeta, opts?: { focusAyah?: number; availableMinutes?: number }) => {
      // Always work on a fresh load to avoid stale tabs.
      const fresh = loadProfile();
      const plan = planSession(fresh, surah, opts);
      setSession(plan);
      setItemIndex(0);
      setStepIndex(0);
      // Mark a session occurrence.
      fresh.sessionCount += 1;
      fresh.lastSessionAt = Date.now();
      persist(fresh);
      return plan;
    },
    [persist],
  );

  const endSession = useCallback(() => {
    setSession(null);
    setItemIndex(0);
    setStepIndex(0);
  }, []);

  const currentItem: SessionItem | null = session?.items[itemIndex] ?? null;
  const currentStep = currentItem?.steps[stepIndex] ?? null;

  /** Record a recall grade for the current step's ayah. */
  const gradeCurrent = useCallback(
    (grade: 0 | 1 | 2 | 3 | 4, hidden: boolean) => {
      if (!session || !currentItem) return;
      const fresh = loadProfile();
      const ap = getOrCreateAyah(fresh, currentItem.surah, currentItem.ayah);
      applyGrade(ap, grade, hidden, session.token, currentItem.method);
      persist(fresh);
    },
    [session, currentItem, persist],
  );

  /** Record a 0..1 score for a test step, with optional missed word indices. */
  const scoreCurrentTest = useCallback(
    (score: number, missedWordIndices?: number[]) => {
      if (!session || !currentItem || !currentStep) return;
      const fresh = loadProfile();
      recordTestScore(fresh, currentItem.surah, currentItem.ayah, score, {
        hidden: currentStep.hidden,
        sessionToken: session.token,
        method: currentItem.method,
        missedWordIndices,
      });
      persist(fresh);
    },
    [session, currentItem, currentStep, persist],
  );

  const advance = useCallback(() => {
    if (!session || !currentItem) return;
    if (stepIndex < currentItem.steps.length - 1) {
      setStepIndex((i) => i + 1);
      return;
    }
    if (itemIndex < session.items.length - 1) {
      setItemIndex((i) => i + 1);
      setStepIndex(0);
      return;
    }
    endSession();
  }, [session, currentItem, stepIndex, itemIndex, endSession]);

  const summary = useCallback(
    (surah: number, total: number): SurahSummary =>
      summarizeSurah(profile, surah, total),
    [profile],
  );

  const ayahProgress = useCallback(
    (surah: number, ayah: number): AyahProgress | null =>
      profile.perAyah[`${surah}:${ayah}`] ?? null,
    [profile],
  );

  const resetProfile = useCallback(() => {
    const fresh = emptyProfile();
    persist(fresh);
  }, [persist]);

  const recordMistake = useCallback(
    (surah: number, ayah: number, type: MistakeType, wordIndex: number | null) => {
      const fresh = loadProfile();
      const ap = getOrCreateAyah(fresh, surah, ayah);
      recordError(ap, type, wordIndex);
      persist(fresh);
    },
    [persist],
  );

  const recordLink = useCallback(
    (surah: number, ayah: number, correct: boolean) => {
      const fresh = loadProfile();
      const ap = getOrCreateAyah(fresh, surah, ayah);
      if (correct) ap.linkHits += 1;
      else ap.linkMisses += 1;
      persist(fresh);
    },
    [persist],
  );

  const addStudySeconds = useCallback(
    (seconds: number) => {
      const fresh = loadProfile();
      fresh.totalSeconds += seconds;
      persist(fresh);
    },
    [persist],
  );

  const stats = useMemo(() => {
    const all = Object.values(profile.perAyah);
    const byState: Record<AyahState, number> = {
      NEW: 0, LEARNING: 0, WEAK: 0, STABLE: 0, MASTERED: 0, NEEDS_REVIEW: 0,
    };
    let due = 0;
    for (const ap of all) {
      byState[ap.state] += 1;
      if (ap.dueAt && ap.dueAt <= now) due += 1;
    }
    return {
      total: all.length,
      byState,
      due,
      sessionCount: profile.sessionCount,
      totalMinutes: Math.round(profile.totalSeconds / 60),
    };
  }, [profile, now]);

  return {
    profile,
    hydrated,
    session,
    itemIndex,
    stepIndex,
    currentItem,
    currentStep,
    stats,
    startSession,
    endSession,
    gradeCurrent,
    scoreCurrentTest,
    advance,
    summary,
    ayahProgress,
    resetProfile,
    addStudySeconds,
    recordMistake,
    recordLink,
  };
}

export type HafizTeacher = ReturnType<typeof useHafiz>;
