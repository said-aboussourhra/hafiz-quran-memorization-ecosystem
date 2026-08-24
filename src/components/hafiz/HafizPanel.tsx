"use client";

import { useState } from "react";
import type { HafizTeacher } from "@/lib/hafiz/useHafiz";
import { STATE_META } from "@/lib/hafiz/profile";
import { SmartSessionRunner } from "./SmartSessionRunner";
import type { SurahContent } from "@/lib/quran";

const TIME_OPTIONS = [5, 10, 15, 20];

/**
 * HAFIZ teacher panel — the "ابدأ جلسة ذكية" entry point. HAFIZ itself is the
 * teacher: it plans WHAT to study, for HOW LONG, and with WHICH METHOD based on
 * the learner's real history, errors, and retention.
 */
export function HafizPanel({
  teacher,
  surah,
  className = "",
  onListenAyah,
}: {
  teacher: HafizTeacher;
  surah: SurahContent;
  className?: string;
  onListenAyah?: (ayah: number) => void;
}) {
  const [minutes, setMinutes] = useState(8);
  const [running, setRunning] = useState(false);

  const summary = teacher.summary(surah.meta.number, surah.ayahs.length);
  const stateMeta = STATE_META[summary.state];

  const start = () => {
    teacher.startSession(surah.meta, {
      focusAyah: 1,
      availableMinutes: minutes,
    });
    setRunning(true);
  };

  if (running && teacher.session) {
    return (
      <SmartSessionRunner
        teacher={teacher}
        surah={surah}
        onListenAyah={onListenAyah}
        onExit={() => {
          teacher.endSession();
          setRunning(false);
        }}
      />
    );
  }

  return (
    <section
      className={`rounded-2xl border border-ocean-200 bg-gradient-to-bl from-white to-ocean-50/60 p-4 shadow-sm sm:p-5 ${className}`}
      aria-labelledby="hafiz-title"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 id="hafiz-title" className="flex items-center gap-2 text-base font-bold text-ocean-800 sm:text-lg">
            <span className="grid h-8 w-8 place-items-center rounded-full bg-ocean-600 text-white" aria-hidden="true">
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a7 7 0 00-7 7c0 3 2 5 2 7h10c0-2 2-4 2-7a7 7 0 00-7-7z" /><path d="M9 21h6" /></svg>
            </span>
            معلّم الحفظ الذكي
          </h2>
          <p className="mt-1 text-xs text-ink-600 sm:text-sm">
            {teacher.session?.focus ?? "يحدّد حافظ ما تحتاج مراجعته بناءً على أدائك الحقيقي."}
          </p>
        </div>
        <span
          className="shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold text-white"
          style={{ background: stateMeta.color }}
        >
          {stateMeta.label}
        </span>
      </div>

      {/* Progress overview */}
      <div className="mt-4 grid grid-cols-4 gap-2 text-center">
        <Stat label="متقن" value={summary.byState.MASTERED} tone="text-emerald-700" />
        <Stat label="مستقر" value={summary.byState.STABLE} tone="text-green-600" />
        <Stat label="ضعيف" value={summary.byState.WEAK + summary.byState.LEARNING} tone="text-orange-600" />
        <Stat label="للمراجعة" value={summary.byState.NEEDS_REVIEW + summary.dueCount} tone="text-yellow-600" />
      </div>

      <div className="mt-3">
        <div className="h-2 w-full overflow-hidden rounded-full bg-sand-300/60">
          <div
            className="h-full rounded-full bg-gradient-to-l from-emerald-500 to-ocean-500 transition-all"
            style={{ width: `${summary.masteredPercent}%` }}
          />
        </div>
        <p className="mt-1 text-[11px] text-ink-500">
          {summary.masteredPercent}% من السورة متقن · {summary.dueCount} آية حان وقت مراجعتها
        </p>
      </div>

      {/* Time picker */}
      <div className="mt-4">
        <p className="mb-1.5 text-xs font-semibold text-ink-600">الوقت المتاح (دقائق)</p>
        <div className="flex gap-2">
          {TIME_OPTIONS.map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMinutes(m)}
              className={`flex-1 rounded-xl border py-2 text-sm font-semibold transition ${
                minutes === m
                  ? "border-ocean-500 bg-ocean-50 text-ocean-800"
                  : "border-sand-400 bg-white text-ink-600 hover:bg-cream-100"
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={start}
        className="mt-4 w-full rounded-xl bg-gradient-to-l from-emerald-500 to-ocean-500 py-3 text-base font-bold text-white shadow-md transition active:scale-[0.99]"
      >
        ابدأ جلسة ذكية
      </button>

      <p className="mt-2 text-center text-[11px] leading-relaxed text-ink-400">
        لا يُحتسب الإتقان بفتح الآية أو تشغيل الصوت — فقط باسترجاعك للنص مخفيًّا عبر جلسات منفصلة.
      </p>
    </section>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className="rounded-xl bg-white/70 py-2">
      <div className={`text-lg font-bold tabular-nums ${tone}`}>{value.toLocaleString("ar-EG")}</div>
      <div className="text-[10px] text-ink-500">{label}</div>
    </div>
  );
}
