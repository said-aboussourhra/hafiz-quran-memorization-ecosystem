"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useHafiz } from "@/lib/hafiz/useHafiz";
import { SURAHS } from "@/lib/surahs";

/**
 * "خطة اليوم" — premium daily-plan card on the home page.
 * Reads the local HAFIZ profile (no backend required) and routes the learner
 * to the most relevant surah, where the full Smart Session can begin.
 */
export function DailyPlanCard() {
  const teacher = useHafiz();
  const { stats } = teacher;

  const plan = useMemo(() => {
    // Pick the surah with the most due/weak items; default to Al-Fatihah for new users.
    let bestSurah = 1;
    let bestScore = -1;
    for (const s of SURAHS) {
      const sum = teacher.summary(s.number, s.ayahCount);
      const score = sum.dueCount * 10 + sum.byState.WEAK * 6 + sum.byState.LEARNING * 3 + sum.byState.NEEDS_REVIEW * 8;
      if (score > bestScore) {
        bestScore = score;
        bestSurah = s.number;
      }
    }
    const target = SURAHS.find((s) => s.number === bestSurah)!;
    const s = teacher.summary(target.number, target.ayahCount);
    return {
      surah: target,
      newCount: s.byState.NEW,
      reviewCount: s.byState.NEEDS_REVIEW + s.dueCount,
      weakCount: s.byState.WEAK + s.byState.LEARNING,
    };
  }, [teacher]);

  const isNew = stats.total === 0;

  return (
    <section
      className="relative overflow-hidden rounded-3xl border border-emerald-100 bg-gradient-to-bl from-white via-emerald-50/40 to-ocean-50/60 p-6 shadow-[0_20px_60px_-30px_rgba(5,150,105,0.45)] sm:p-8"
      dir="rtl"
    >
      <div className="pointer-events-none absolute -left-16 -top-16 h-48 w-48 rounded-full bg-emerald-200/30 blur-3xl" />
      <div className="relative">
        <p className="text-xs font-semibold tracking-wider text-ocean-600">خطة اليوم</p>
        <h2 className="mt-1 font-display text-2xl font-bold text-ink-900 sm:text-3xl">
          {isNew ? "ابدأ أول جلسة حفظ" : `جلسة ${plan.surah.nameAr}`}
        </h2>
        <p className="mt-2 max-w-md text-sm leading-relaxed text-ink-600">
          {isNew
            ? "يحدّد حافظ خطتك بناءً على أدائك، ويركّز على نقاط ضعفك، ويراجع في الوقت المناسب."
            : `سورة ${plan.surah.nameAr} · ${plan.reviewCount > 0 ? `${plan.reviewCount} آيات للمراجعة` : "تثبيت المحفوظ"}`}
        </p>

        {!isNew && (
          <div className="mt-5 grid grid-cols-3 gap-2">
            <PlanStat emoji="🆕" value={plan.newCount} label="جديد" />
            <PlanStat emoji="🔄" value={plan.reviewCount} label="مراجعة" />
            <PlanStat emoji="🔴" value={plan.weakCount} label="تثبيت" />
          </div>
        )}

        <Link
          href={`/mushaf/${plan.surah.number}`}
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-gradient-to-l from-emerald-500 to-ocean-500 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-600/20 transition hover:shadow-xl active:scale-[0.99]"
        >
          ابدأ جلسة ذكية
          <svg viewBox="0 0 24 24" className="h-4 w-4 rotate-180" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="M12 5l7 7-7 7" /></svg>
        </Link>
      </div>
    </section>
  );
}

function PlanStat({ emoji, value, label }: { emoji: string; value: number; label: string }) {
  return (
    <div className="rounded-2xl border border-white/60 bg-white/70 px-3 py-2.5 text-center backdrop-blur">
      <div className="text-base">{emoji}</div>
      <div className="mt-0.5 text-lg font-black tabular-nums text-ink-900">{value.toLocaleString("ar-EG")}</div>
      <div className="text-[10px] text-ink-500">{label}</div>
    </div>
  );
}
