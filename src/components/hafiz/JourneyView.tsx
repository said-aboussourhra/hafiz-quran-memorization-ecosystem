"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useHafiz } from "@/lib/hafiz/useHafiz";
import { STATE_META } from "@/lib/hafiz/profile";
import { SURAHS } from "@/lib/surahs";
import { PrivacyControls } from "./PrivacyControls";

/**
 * "رحلة الحفظ" — progress + retention view powered by the local HAFIZ engine.
 * Honest: retention is heuristic (adaptive scheduler), not scientific certainty.
 */
export function JourneyView() {
  const teacher = useHafiz();
  const { stats } = teacher;

  const rows = useMemo(() => {
    return SURAHS.map((s) => {
      const sum = teacher.summary(s.number, s.ayahCount);
      const studied = s.ayahCount - sum.byState.NEW;
      return { meta: s, sum, studied };
    }).filter((r) => r.studied > 0 || r.sum.dueCount > 0);
  }, [teacher]);

  const health =
    stats.total === 0
      ? 0
      : Math.round(
          ((stats.byState.MASTERED * 100 +
            stats.byState.STABLE * 70 +
            stats.byState.LEARNING * 40) /
            Math.max(1, stats.total)) *
            10,
        ) / 10;

  // Retention buckets: heuristic based on state + due status.
  const retention = {
    solid: stats.byState.MASTERED + stats.byState.STABLE,
    review: stats.byState.NEEDS_REVIEW,
    weak: stats.byState.WEAK + stats.byState.LEARNING,
  };

  const dueSurahs = rows
    .filter((r) => r.sum.dueCount > 0)
    .sort((a, b) => b.sum.dueCount - a.sum.dueCount)
    .slice(0, 6);

  const weakPoints = useMemo(() => {
    const out: { surah: number; name: string; ayah: number; misses: number }[] = [];
    for (const ap of Object.values(teacher.profile.perAyah)) {
      if (ap.weakWords.length === 0) continue;
      const meta = SURAHS.find((s) => s.number === ap.surah);
      const misses = ap.weakWords.reduce((n, w) => n + w.misses, 0);
      out.push({ surah: ap.surah, name: meta?.nameAr ?? `سورة ${ap.surah}`, ayah: ap.ayah, misses });
    }
    return out.sort((a, b) => b.misses - a.misses).slice(0, 8);
  }, [teacher.profile]);

  if (stats.total === 0) {
    return (
      <div className="rounded-3xl border border-emerald-100 bg-white p-10 text-center shadow-sm">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-emerald-50 text-3xl">🌱</div>
        <h2 className="mt-4 font-display text-2xl font-bold text-ink-900">لم تبدأ الحفظ بعد</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-ink-500">
          ابدأ أول جلسة ذكية، وسيساعدك حافظ في بناء خطتك وتتبع تقدمك ومراجعة ما حفظت في وقته.
        </p>
        <Link
          href="/mushaf/1"
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-gradient-to-l from-emerald-500 to-ocean-500 px-6 py-3 text-sm font-bold text-white"
        >
          ابدأ الآن
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      {/* Health hero */}
      <section className="relative overflow-hidden rounded-3xl border border-emerald-100 bg-gradient-to-bl from-white to-emerald-50/50 p-6 shadow-sm sm:p-8">
        <p className="text-xs font-semibold tracking-wider text-ocean-600">رحلة الحفظ</p>
        <h2 className="mt-1 font-display text-2xl font-bold text-ink-900 sm:text-3xl">
          صحة حفظك
        </h2>
        <div className="mt-6 flex items-center gap-6">
          <div className="relative grid h-28 w-28 place-items-center">
            <svg viewBox="0 0 36 36" className="h-28 w-28 -rotate-90">
              <circle cx="18" cy="18" r="15.9" fill="none" stroke="#e2e8f0" strokeWidth="3" />
              <circle
                cx="18"
                cy="18"
                r="15.9"
                fill="none"
                stroke="url(#g)"
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray={`${health} 100`}
              />
              <defs>
                <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#10b981" />
                  <stop offset="100%" stopColor="#0ea5e9" />
                </linearGradient>
              </defs>
            </svg>
            <span className="absolute text-xl font-black text-ink-900">
              {health.toLocaleString("ar-EG", { maximumFractionDigits: 0 })}٪
            </span>
          </div>
          <div className="grid flex-1 grid-cols-3 gap-2">
            <HealthStat label="متقن" value={stats.byState.MASTERED} dot="bg-emerald-600" />
            <HealthStat label="مستقر" value={stats.byState.STABLE} dot="bg-green-500" />
            <HealthStat label="للمراجعة" value={stats.byState.NEEDS_REVIEW + stats.due} dot="bg-yellow-500" />
            <HealthStat label="يتعلّم" value={stats.byState.LEARNING} dot="bg-sky-400" />
            <HealthStat label="ضعيف" value={stats.byState.WEAK} dot="bg-orange-500" />
            <HealthStat label="جديد" value={stats.byState.NEW} dot="bg-slate-400" />
          </div>
        </div>
      </section>

      {/* Retention */}
      <section className="rounded-3xl border border-sand-200 bg-white p-6 shadow-sm">
        <h3 className="font-display text-lg font-bold text-ink-900">الاحتفاظ (تقديري)</h3>
        <p className="mt-1 text-xs text-ink-400">
          تقدير تجريبي يعتمد على جدول المراجعة التكيفي، وليس قياسًا علميًا دقيقًا.
        </p>
        <div className="mt-5 space-y-3">
          <RetentionBar label="🟢 ثابت" value={retention.solid} total={stats.total} color="bg-emerald-500" />
          <RetentionBar label="🟡 يحتاج مراجعة" value={retention.review} total={stats.total} color="bg-yellow-500" />
          <RetentionBar label="🔴 يحتاج تثبيت" value={retention.weak} total={stats.total} color="bg-orange-500" />
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Due for review */}
        <section className="rounded-3xl border border-sand-200 bg-white p-6 shadow-sm">
          <h3 className="font-display text-lg font-bold text-ink-900">حان وقت مراجعتها</h3>
          {dueSurahs.length === 0 ? (
            <p className="mt-4 text-sm text-ink-400">لا توجد آيات مستحقة الآن. أحسنت!</p>
          ) : (
            <ul className="mt-4 space-y-2">
              {dueSurahs.map((r) => (
                <li key={r.meta.number}>
                  <Link
                    href={`/mushaf/${r.meta.number}`}
                    className="flex items-center justify-between rounded-2xl border border-sand-200 bg-cream-50/50 px-4 py-3 transition hover:border-emerald-300 hover:bg-emerald-50/40"
                  >
                    <span className="font-semibold text-ink-800">{r.meta.nameAr}</span>
                    <span className="rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-bold text-yellow-700">
                      {r.sum.dueCount.toLocaleString("ar-EG")} آية
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Weak points */}
        <section className="rounded-3xl border border-sand-200 bg-white p-6 shadow-sm">
          <h3 className="font-display text-lg font-bold text-ink-900">نقاط تحتاج تثبيت</h3>
          {weakPoints.length === 0 ? (
            <p className="mt-4 text-sm text-ink-400">لا توجد كلمات ضعيفة مسجّلة بعد.</p>
          ) : (
            <ul className="mt-4 space-y-2">
              {weakPoints.map((w, i) => (
                <li
                  key={`${w.surah}-${w.ayah}-${i}`}
                  className="flex items-center justify-between rounded-2xl border border-sand-200 bg-cream-50/50 px-4 py-3"
                >
                  <span className="text-sm text-ink-700">
                    {w.name} · آية {w.ayah.toLocaleString("ar-EG")}
                  </span>
                  <span className="rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-bold text-orange-700">
                    {w.misses.toLocaleString("ar-EG")} خطأ
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {/* Surah list */}
      <section className="rounded-3xl border border-sand-200 bg-white p-6 shadow-sm">
        <h3 className="font-display text-lg font-bold text-ink-900">السور</h3>
        <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((r) => {
            const meta = STATE_META[r.sum.state];
            const pct = Math.round((r.studied / r.meta.ayahCount) * 100);
            return (
              <Link
                key={r.meta.number}
                href={`/mushaf/${r.meta.number}`}
                className="rounded-2xl border border-sand-200 p-4 transition hover:border-emerald-300 hover:shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-ink-800">{r.meta.nameAr}</span>
                  <span className="flex items-center gap-1 text-[11px]" style={{ color: meta.color }}>
                    <span className={`h-2 w-2 rounded-full ${meta.dot}`} />
                    {meta.label}
                  </span>
                </div>
                <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-sand-200">
                  <div
                    className="h-full rounded-full bg-gradient-to-l from-emerald-500 to-ocean-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <p className="mt-1.5 text-[11px] text-ink-400">
                  {r.studied.toLocaleString("ar-EG")} / {r.meta.ayahCount.toLocaleString("ar-EG")} آية
                </p>
              </Link>
            );
          })}
        </div>
      </section>

      <p className="text-center text-xs text-ink-400">
        {stats.sessionCount.toLocaleString("ar-EG")} جلسة · {stats.totalMinutes.toLocaleString("ar-EG")} دقيقة دراسة
      </p>

      <PrivacyControls />
    </div>
  );
}

function HealthStat({ label, value, dot }: { label: string; value: number; dot: string }) {
  return (
    <div className="rounded-2xl bg-white/70 px-3 py-2 text-center">
      <div className="flex items-center justify-center gap-1.5">
        <span className={`h-2 w-2 rounded-full ${dot}`} />
        <span className="text-[11px] text-ink-500">{label}</span>
      </div>
      <div className="mt-0.5 text-lg font-black tabular-nums text-ink-900">
        {value.toLocaleString("ar-EG")}
      </div>
    </div>
  );
}

function RetentionBar({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-ink-700">{label}</span>
        <span className="font-bold text-ink-900">{pct.toLocaleString("ar-EG")}٪</span>
      </div>
      <div className="mt-1.5 h-2.5 w-full overflow-hidden rounded-full bg-sand-200">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
