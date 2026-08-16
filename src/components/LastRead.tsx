"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type LastRead = { surah: number; name: string } | null;

export function saveLastRead(surah: number, name: string) {
  try {
    localStorage.setItem("hafiz_last_read", JSON.stringify({ surah, name }));
  } catch {
    /* ignore */
  }
}

export function LastReadCard() {
  const [last, setLast] = useState<LastRead>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("hafiz_last_read");
      if (raw) setLast(JSON.parse(raw));
    } catch {
      setLast(null);
    }
  }, []);

  if (!last) return null;

  return (
    <Link
      href={`/mushaf/${last.surah}`}
      className="card-ocean group flex items-center justify-between rounded-2xl p-4 transition hover:-translate-y-0.5 hover:shadow-lg"
    >
      <div className="flex items-center gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-emerald-500 to-ocean-500 text-white" style={{ background: "linear-gradient(135deg,#10b981,#3b82f6)" }}>
          ↻
        </span>
        <div>
          <div className="text-xs text-ink-500">متابعة القراءة</div>
          <div className="text-xl text-ink-900" style={{ fontFamily: "var(--font-quran)" }}>سورة {last.name}</div>
        </div>
      </div>
      <span className="text-gold-600 transition group-hover:-translate-x-1">‹</span>
    </Link>
  );
}
