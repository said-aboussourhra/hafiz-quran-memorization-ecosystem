"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { SURAHS } from "@/lib/surahs";
import { JUZ_INFO } from "@/lib/plan";

type Prog = Record<number, { status: string; pct: number }>;

const STATUS_META: Record<string, { label: string; color: string }> = {
  mastered: { label: "متقَن", color: "#047857" },
  memorized: { label: "محفوظ", color: "#10b981" },
  learning: { label: "قيد الحفظ", color: "#3b82f6" },
  not_started: { label: "لم يبدأ", color: "#b5c9cc" },
};

function ProgressRing({ pct, num }: { pct: number; num: number }) {
  const r = 22, c = 2 * Math.PI * r;
  const off = c - (Math.min(100, pct) / 100) * c;
  return (
    <span className="relative grid h-14 w-14 place-items-center">
      <svg viewBox="0 0 56 56" className="absolute inset-0 h-14 w-14 -rotate-90">
        <circle cx="28" cy="28" r={r} fill="none" stroke="rgba(16,185,129,0.12)" strokeWidth="4" />
        {pct > 0 && (
          <circle cx="28" cy="28" r={r} fill="none" stroke="url(#ringg)" strokeWidth="4" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={off} />
        )}
        <defs>
          <linearGradient id="ringg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#10b981" /><stop offset="100%" stopColor="#3b82f6" />
          </linearGradient>
        </defs>
      </svg>
      <span className="font-display text-base font-bold text-gold-600">{num.toLocaleString("ar-EG")}</span>
    </span>
  );
}

export function MushafIndex({ prog, loggedIn }: { prog: Prog; loggedIn: boolean }) {
  const [q, setQ] = useState("");
  const [tab, setTab] = useState<"all" | "meccan" | "medinan" | "memorized" | "inprogress" | "favorites">("all");
  const [byJuz, setByJuz] = useState(false);
  const [favs, setFavs] = useState<Set<number>>(new Set());
  const [lastRead, setLastRead] = useState<{ surah: number; name: string } | null>(null);

  useEffect(() => {
    try {
      const f = localStorage.getItem("hafiz_favs");
      if (f) setFavs(new Set(JSON.parse(f)));
      const lr = localStorage.getItem("hafiz_last_read");
      if (lr) setLastRead(JSON.parse(lr));
    } catch { /* ignore */ }
  }, []);

  const toggleFav = (n: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setFavs((prev) => {
      const next = new Set(prev);
      next.has(n) ? next.delete(n) : next.add(n);
      try { localStorage.setItem("hafiz_favs", JSON.stringify([...next])); } catch { /* ignore */ }
      return next;
    });
  };

  const filtered = useMemo(() => {
    const t = q.trim();
    return SURAHS.filter((s) => {
      if (tab === "meccan" && s.revelation !== "meccan") return false;
      if (tab === "medinan" && s.revelation !== "medinan") return false;
      if (tab === "memorized") { const st = prog[s.number]?.status; if (st !== "memorized" && st !== "mastered") return false; }
      if (tab === "inprogress" && prog[s.number]?.status !== "learning") return false;
      if (tab === "favorites" && !favs.has(s.number)) return false;
      if (!t) return true;
      return s.nameAr.includes(t) || s.nameLatin.toLowerCase().includes(t.toLowerCase()) || String(s.number) === t;
    });
  }, [q, tab, prog, favs]);

  // group by juz when byJuz is on
  const juzGroups = useMemo(() => {
    if (!byJuz) return null;
    const groups = new Map<number, typeof SURAHS>();
    for (const s of filtered) {
      const arr = groups.get(s.juz) ?? [];
      arr.push(s);
      groups.set(s.juz, arr);
    }
    return [...groups.entries()].sort((a, b) => a[0] - b[0]);
  }, [filtered, byJuz]);

  const memorizedCount = Object.values(prog).filter((p) => p.status === "memorized" || p.status === "mastered").length;

  const renderCard = (s: typeof SURAHS[number]) => {
    const p = prog[s.number] ?? { status: "not_started", pct: 0 };
    const meta = STATUS_META[p.status] ?? STATUS_META.not_started;
    const isFav = favs.has(s.number);
    return (
      <Link
        key={s.number}
        href={`/mushaf/${s.number}`}
        className="lift group relative flex items-center justify-between rounded-2xl card p-4"
        style={p.status !== "not_started" ? { borderColor: `${meta.color}55` } : undefined}
      >
        {/* status accent bar */}
        {p.status !== "not_started" && <span className="absolute inset-y-3 right-0 w-1 rounded-full" style={{ background: meta.color }} />}
        <div className="flex items-center gap-4">
          <ProgressRing pct={p.pct} num={s.number} />
          <div>
            <div className="text-2xl text-ink-900" style={{ fontFamily: "var(--font-quran)" }}>{s.nameAr}</div>
            <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-ink-500">
              <span className="h-2 w-2 rounded-full" style={{ background: meta.color }} />
              {p.status !== "not_started" ? `${meta.label}${p.pct > 0 && p.pct < 100 ? ` · ${p.pct}٪` : ""}` : `${s.ayahCount.toLocaleString("ar-EG")} آية`}
              <span className="text-ink-400">· جزء {s.juz.toLocaleString("ar-EG")}</span>
            </div>
          </div>
        </div>
        <button onClick={(e) => toggleFav(s.number, e)} aria-label="مفضّلة" className="grid h-9 w-9 place-items-center rounded-full transition hover:bg-cream-100">
          <span className={isFav ? "text-lg text-amber-400" : "text-lg text-ink-300"}>{isFav ? "★" : "☆"}</span>
        </button>
      </Link>
    );
  };

  return (
    <div>
      {/* Continue reading */}
      {lastRead && (
        <Link href={`/mushaf/${lastRead.surah}`} className="lift mb-5 flex items-center justify-between rounded-2xl p-4" style={{ background: "linear-gradient(135deg,#ecfdf5,#eff6ff)", border: "1px solid rgba(16,185,129,0.35)" }}>
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-xl text-white shadow-md" style={{ background: "linear-gradient(135deg,#10b981,#3b82f6)" }}>↩</span>
            <div>
              <div className="text-xs font-semibold text-emerald-700">أكمل من حيث توقفت</div>
              <div className="text-xl text-ink-900" style={{ fontFamily: "var(--font-quran)" }}>سورة {lastRead.name}</div>
            </div>
          </div>
          <span className="text-sm font-semibold text-emerald-700">افتح ←</span>
        </Link>
      )}

      {/* Search + view toggle */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-ink-400">🔍</span>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="اكتب اسم السورة أو رقمها للتصفية الفورية…"
            className="w-full rounded-2xl border border-sand-300 bg-white px-5 py-3 pr-11 text-sm text-ink-900 outline-none focus:border-emerald-500"
          />
        </div>
        <div className="flex gap-1 rounded-2xl bg-cream-100 p-1">
          <button onClick={() => setByJuz(false)} className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${!byJuz ? "bg-white text-emerald-700 shadow" : "text-ink-500"}`}>بالسورة</button>
          <button onClick={() => setByJuz(true)} className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${byJuz ? "bg-white text-emerald-700 shadow" : "text-ink-500"}`}>بالجزء</button>
        </div>
      </div>

      {/* Filters */}
      <div className="mt-3 flex flex-wrap gap-2">
        {([
          ["all", "الكل"],
          ["memorized", "المحفوظ"],
          ["inprogress", "قيد الحفظ"],
          ["favorites", `المفضّلة${favs.size ? ` (${favs.size.toLocaleString("ar-EG")})` : ""}`],
          ["meccan", "مكية"],
          ["medinan", "مدنية"],
        ] as const).map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)} className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${tab === k ? "btn-primary" : "btn-ghost"}`}>{l}</button>
        ))}
      </div>

      {/* Legend */}
      <div className="mt-3 flex flex-wrap items-center gap-4 text-[11px] text-ink-500">
        {loggedIn && <span>محفوظ حتى الآن: <span className="font-bold text-emerald-700">{memorizedCount.toLocaleString("ar-EG")} / ١١٤</span></span>}
        {Object.entries(STATUS_META).map(([k, m]) => (
          <span key={k} className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full" style={{ background: m.color }} />{m.label}</span>
        ))}
      </div>

      {/* Grid */}
      {byJuz && juzGroups ? (
        <div className="mt-6 space-y-8">
          {juzGroups.map(([juz, surahs]) => (
            <div key={juz}>
              <div className="mb-3 flex items-center gap-3">
                <span className="grid h-9 w-9 place-items-center rounded-xl text-sm font-black text-white" style={{ background: "linear-gradient(135deg,#10b981,#3b82f6)" }}>{juz.toLocaleString("ar-EG")}</span>
                <h3 className="font-display text-lg font-bold text-ink-900">جزء {JUZ_INFO[juz - 1]?.name ?? juz}</h3>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{surahs.map(renderCard)}</div>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{filtered.map(renderCard)}</div>
      )}
      {filtered.length === 0 && <p className="mt-10 text-center text-ink-500">لا توجد نتائج مطابقة.</p>}
    </div>
  );
}
