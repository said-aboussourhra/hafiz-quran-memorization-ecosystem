"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { UniverseSurah } from "@/lib/progress";

const STATUS = {
  mastered: { label: "متقَن", color: "#047857", glow: "rgba(4,120,87,0.6)" },
  memorized: { label: "محفوظ", color: "#10b981", glow: "rgba(16,185,129,0.55)" },
  learning: { label: "قيد الحفظ", color: "#3b82f6", glow: "rgba(59,130,246,0.55)" },
  not_started: { label: "لم يبدأ", color: "#b5c9cc", glow: "rgba(181,201,204,0.4)" },
} as const;

type Filter = "all" | "memorized" | "learning" | "remaining";

export function QuranUniverse({
  surahs,
  height = 620,
  interactive = true,
}: {
  surahs: UniverseSurah[];
  height?: number;
  interactive?: boolean;
}) {
  const [hover, setHover] = useState<UniverseSurah | null>(null);
  const [filter, setFilter] = useState<Filter>("all");

  const points = useMemo(() => {
    const golden = Math.PI * (3 - Math.sqrt(5));
    const raw = surahs.map((s, i) => {
      const r = Math.sqrt(i + 0.5);
      const theta = i * golden;
      return { s, r, x: r * Math.cos(theta), y: r * Math.sin(theta) };
    });
    const maxR = raw.reduce((m, p) => Math.max(m, p.r), 0) || 1;
    // Keep all points within a safe circle (44% radius) so they never touch the
    // container edges / cause overflow on any viewport.
    return raw.map((p) => ({
      s: p.s,
      left: 50 + (p.x / maxR) * 44,
      top: 50 + (p.y / maxR) * 44,
    }));
  }, [surahs]);

  const hoverPoint = useMemo(
    () => (hover ? points.find((p) => p.s.number === hover.number) : null),
    [hover, points],
  );

  const isDim = (s: UniverseSurah) => {
    if (filter === "all") return false;
    if (filter === "memorized") return !(s.status === "memorized" || s.status === "mastered");
    if (filter === "learning") return s.status !== "learning";
    if (filter === "remaining") return s.status !== "not_started";
    return false;
  };

  // Touch-friendly tap: toggle the info card on mobile (no hover there).
  const onNodeActivate = (s: UniverseSurah) => {
    if (!interactive) return;
    setHover((cur) => (cur?.number === s.number ? null : s));
  };

  return (
    <div>
      {interactive && (
        <div className="mb-4 flex flex-wrap items-center justify-center gap-2">
          {([
            ["all", "الكون كاملاً"],
            ["memorized", "المحفوظ"],
            ["learning", "قيد الحفظ"],
            ["remaining", "المتبقي"],
          ] as [Filter, string][]).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`rounded-full px-4 py-1.5 text-xs transition ${filter === key ? "btn-primary font-semibold" : "btn-ghost"}`}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      <div
        className="sky relative w-full max-w-full overflow-hidden rounded-3xl border hairline"
        style={{ height: "clamp(320px, 70vh, 1000px)", maxHeight: height }}
      >
        <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <div className="animate-spin-slow h-40 w-40 rounded-full border border-gold-500/20" />
          <div className="absolute inset-0 grid place-items-center">
            <span className="font-arabic text-2xl gold-text opacity-80">﷽</span>
          </div>
        </div>

        {points.map(({ s, left, top }) => {
          const conf = STATUS[s.status as keyof typeof STATUS] ?? STATUS.not_started;
          const size = Math.max(8, Math.min(20, 6 + Math.sqrt(s.ayahCount) * 1.1));
          const dim = isDim(s);
          const node = (
            <span
              className={`star-node block ${s.status === "learning" ? "animate-pulse-glow" : ""}`}
              style={{
                width: size,
                height: size,
                background: conf.color,
                color: conf.glow,
                boxShadow: `0 0 ${size}px ${size / 3}px ${conf.glow}`,
                opacity: dim ? 0.18 : 1,
              }}
            />
          );
          return (
            <div
              key={s.number}
              className="absolute -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${left}%`, top: `${top}%` }}
              onMouseEnter={() => interactive && setHover(s)}
              onMouseLeave={() => interactive && setHover(null)}
              onClick={(e) => {
                // On touch devices, show the info card instead of navigating on first tap.
                if (typeof window !== "undefined" && window.matchMedia("(hover: none)").matches) {
                  e.preventDefault();
                  onNodeActivate(s);
                }
              }}
            >
              {interactive ? (
                <Link href={`/mushaf/${s.number}`} aria-label={s.nameAr} className="block touch-manipulation">
                  {node}
                </Link>
              ) : (
                node
              )}
            </div>
          );
        })}

        {hover && hoverPoint && (
          <div
            className="pointer-events-none absolute z-30 w-44 -translate-x-1/2 rounded-2xl bg-white p-3 text-center shadow-lg sm:w-52"
            style={{
              left: `${hoverPoint.left}%`,
              top: `calc(${hoverPoint.top}% - 90px)`,
            }}
          >
            <div className="font-arabic text-lg text-ink-900 sm:text-xl">{hover.nameAr}</div>
            <div className="text-[11px] text-ink-500">{hover.meaning}</div>
            <div className="mt-1 text-[10px] text-ink-400">
              {hover.ayahCount.toLocaleString("ar-EG")} آية · {hover.revelation === "meccan" ? "مكية" : "مدنية"}
            </div>
            <div className="mt-2 text-[11px]">
              <span className="rounded-full px-2 py-0.5" style={{ background: `${(STATUS[hover.status as keyof typeof STATUS] ?? STATUS.not_started).color}22`, color: (STATUS[hover.status as keyof typeof STATUS] ?? STATUS.not_started).color }}>
                {(STATUS[hover.status as keyof typeof STATUS] ?? STATUS.not_started).label}
              </span>
            </div>
            <div className="mt-1 hidden text-[10px] text-emerald-600 sm:block">انقر للفتح في المصحف</div>
          </div>
        )}
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-center gap-4 text-xs text-ink-500">
        {Object.entries(STATUS).map(([k, v]) => (
          <span key={k} className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: v.color }} />
            {v.label}
          </span>
        ))}
      </div>
    </div>
  );
}
