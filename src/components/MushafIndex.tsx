"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { SURAHS } from "@/lib/surahs";

const STATUS_DOT: Record<string, string> = {
  mastered: "#047857",
  memorized: "#10b981",
  learning: "#3b82f6",
  not_started: "#b5c9cc",
};
const STATUS_LABEL: Record<string, string> = {
  mastered: "متقَن",
  memorized: "محفوظ",
  learning: "قيد الحفظ",
  not_started: "",
};

export function MushafIndex({ statuses }: { statuses: Record<number, string> }) {
  const [q, setQ] = useState("");
  const [tab, setTab] = useState<"all" | "meccan" | "medinan">("all");

  const filtered = useMemo(() => {
    return SURAHS.filter((s) => {
      if (tab !== "all" && s.revelation !== tab) return false;
      if (!q.trim()) return true;
      const t = q.trim();
      return (
        s.nameAr.includes(t) ||
        s.nameLatin.toLowerCase().includes(t.toLowerCase()) ||
        String(s.number) === t
      );
    });
  }, [q, tab]);

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="ابحث عن سورة بالاسم أو الرقم…"
          className="flex-1 min-w-[220px] rounded-2xl border border-sand-300 bg-white px-5 py-3 text-sm text-ink-900 outline-none focus:border-gold-500"
        />
        <div className="flex gap-2">
          {([
            ["all", "الكل"],
            ["meccan", "مكية"],
            ["medinan", "مدنية"],
          ] as const).map(([k, l]) => (
            <button
              key={k}
              onClick={() => setTab(k)}
              className={`rounded-2xl px-4 py-3 text-sm transition ${tab === k ? "btn-primary font-semibold" : "btn-ghost"}`}
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((s) => {
          const status = statuses[s.number] ?? "not_started";
          return (
            <Link
              key={s.number}
              href={`/mushaf/${s.number}`}
              className="group flex items-center justify-between rounded-2xl card p-4 transition hover:-translate-y-1 hover:border-gold-500/40 hover:shadow-xl"
            >
              <div className="flex items-center gap-4">
                <span className="relative grid h-14 w-14 place-items-center">
                  <svg viewBox="0 0 56 56" className="absolute inset-0 h-14 w-14 text-gold-500/40 transition group-hover:text-gold-500/70">
                    <path fill="none" stroke="currentColor" strokeWidth="1.3" d="M28 4l5.5 4 6.8-1.5 2.2 6.6 6.6 2.2-1.5 6.8 4 5.7-4 5.7 1.5 6.8-6.6 2.2-2.2 6.6-6.8-1.5-5.5 4-5.5-4-6.8 1.5-2.2-6.6-6.6-2.2 1.5-6.8-4-5.7 4-5.7-1.5-6.8 6.6-2.2 2.2-6.6 6.8 1.5z" />
                  </svg>
                  <span className="font-display text-base font-bold text-gold-600">{s.number.toLocaleString("ar-EG")}</span>
                </span>
                <div>
                  <div className="text-2xl text-ink-900" style={{ fontFamily: "var(--font-quran)" }}>{s.nameAr}</div>
                  <div className="mt-0.5 text-[11px] text-ink-500">{s.meaning} · {s.ayahCount.toLocaleString("ar-EG")} آية · {s.revelation === "meccan" ? "مكية" : "مدنية"}</div>
                </div>
              </div>
              <div className="text-end">
                <span className="flex items-center justify-end gap-1.5 text-[11px] text-ink-500">
                  {STATUS_LABEL[status] && (
                    <span className="h-2 w-2 rounded-full" style={{ background: STATUS_DOT[status], boxShadow: `0 0 6px ${STATUS_DOT[status]}` }} />
                  )}
                  {STATUS_LABEL[status]}
                </span>
                <span className="mt-1 block text-[10px] text-ink-500">جزء {s.juz.toLocaleString("ar-EG")}</span>
              </div>
            </Link>
          );
        })}
      </div>
      {filtered.length === 0 && <p className="mt-10 text-center text-ink-500">لا توجد نتائج مطابقة.</p>}
    </div>
  );
}
