"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Item = { surahNumber: number; nameAr: string; retention: number };

export function ReviewGrader({ items }: { items: Item[] }) {
  const router = useRouter();
  const [idx, setIdx] = useState(0);
  const [busy, setBusy] = useState(false);
  const [doneCount, setDoneCount] = useState(0);

  if (items.length === 0) return null;
  const cur = items[idx];

  const grade = async (quality: number) => {
    if (busy) return;
    setBusy(true);
    try {
      await fetch("/api/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ surahNumber: cur.surahNumber, quality }),
      });
      setDoneCount((c) => c + 1);
      if (idx + 1 < items.length) {
        setIdx(idx + 1);
      } else {
        router.refresh();
      }
    } finally {
      setBusy(false);
    }
  };

  const finished = doneCount >= items.length;

  if (finished) {
    return (
      <div className="card rounded-3xl p-8 text-center">
        <div className="mx-auto grid h-20 w-20 place-items-center rounded-full text-4xl" style={{ background: "linear-gradient(135deg,rgba(16,185,129,0.14),rgba(37,99,235,0.14))" }}>🌿</div>
        <h3 className="mt-5 font-display text-2xl font-black shine-text">أتممت مراجعة اليوم!</h3>
        <p className="mt-2 text-ink-500">راجعت {items.length.toLocaleString("ar-EG")} سورة — جدّد النظام مواعيدها القادمة تلقائياً.</p>
      </div>
    );
  }

  return (
    <div className="card relative overflow-hidden rounded-3xl p-6 sm:p-8">
      <div className="mb-5 flex items-center justify-between text-sm">
        <span className="text-ink-500">مراجعة {(idx + 1).toLocaleString("ar-EG")} من {items.length.toLocaleString("ar-EG")}</span>
        <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">قوة الحفظ {cur.retention}٪</span>
      </div>

      <div className="rounded-2xl border-2 border-emerald-200 bg-white p-8 text-center">
        <p className="text-xs tracking-[0.2em] text-gold-600">سمّع من حفظك</p>
        <h3 className="mt-3 text-4xl text-ink-900" style={{ fontFamily: "var(--font-quran)" }}>سورة {cur.nameAr}</h3>
        <p className="mt-4 text-sm text-ink-500">استرجع السورة كاملة من ذاكرتك، ثم قيّم أداءك بصدق</p>
        <div className="mt-4 flex justify-center gap-2">
          <a href={`/mushaf/${cur.surahNumber}`} className="rounded-xl btn-ghost px-4 py-2 text-xs font-semibold">افتح في المصحف ↗</a>
        </div>
      </div>

      <p className="mt-6 text-center text-sm font-semibold text-ink-700">كيف كان استرجاعك؟</p>
      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { q: 0, label: "نسيت", sub: "غداً", color: "#c0392b", bg: "#fef2f2" },
          { q: 3, label: "صعب", sub: "بعد أيام", color: "#b45309", bg: "#fffbeb" },
          { q: 4, label: "جيد", sub: "أطول", color: "#059669", bg: "#ecfdf5" },
          { q: 5, label: "متقن", sub: "الأطول", color: "#2563eb", bg: "#eff6ff" },
        ].map((g) => (
          <button
            key={g.q}
            disabled={busy}
            onClick={() => grade(g.q)}
            className="rounded-2xl border-2 p-4 text-center transition hover:-translate-y-0.5 disabled:opacity-50"
            style={{ borderColor: `${g.color}44`, background: g.bg }}
          >
            <div className="font-display text-lg font-black" style={{ color: g.color }}>{g.label}</div>
            <div className="mt-0.5 text-[11px] text-ink-500">يعود {g.sub}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
