export function WeeklyBars({ data }: { data: { label: string; count: number; isToday: boolean }[] }) {
  const max = Math.max(1, ...data.map((d) => d.count));
  return (
    <div className="flex items-end justify-between gap-2" style={{ height: 130 }} dir="rtl">
      {data.map((d, i) => {
        const h = Math.max(6, Math.round((d.count / max) * 100));
        return (
          <div key={i} className="flex flex-1 flex-col items-center gap-2">
            <div className="relative flex w-full flex-1 items-end justify-center">
              <div
                className="w-full max-w-[26px] rounded-t-lg transition-all"
                style={{
                  height: `${h}%`,
                  background: d.count > 0 ? "linear-gradient(180deg,#10b981,#3b82f6)" : "rgba(16,185,129,0.12)",
                  boxShadow: d.isToday && d.count > 0 ? "0 0 0 2px rgba(37,99,235,0.35)" : undefined,
                }}
                title={`${d.count} آية`}
              />
              {d.count > 0 && <span className="absolute -top-5 text-[10px] font-bold text-emerald-700">{d.count.toLocaleString("ar-EG")}</span>}
            </div>
            <span className={`text-[11px] ${d.isToday ? "font-bold text-emerald-700" : "text-ink-500"}`}>{d.label}</span>
          </div>
        );
      })}
    </div>
  );
}
