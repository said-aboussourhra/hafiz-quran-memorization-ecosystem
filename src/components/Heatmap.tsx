export function Heatmap({ data }: { data: { day: string; count: number }[] }) {
  // group into weeks (columns of 7)
  const weeks: { day: string; count: number }[][] = [];
  for (let i = 0; i < data.length; i += 7) weeks.push(data.slice(i, i + 7));

  const level = (c: number) => {
    if (c <= 0) return 0;
    if (c < 3) return 1;
    if (c < 7) return 2;
    if (c < 15) return 3;
    return 4;
  };
  const colors = [
    "rgba(16,185,129,0.08)",
    "rgba(16,185,129,0.35)",
    "rgba(16,185,129,0.6)",
    "rgba(37,99,235,0.7)",
    "rgba(37,99,235,0.95)",
  ];
  const months = ["ي", "ف", "م", "أ", "م", "ن", "ل", "غ", "س", "ك", "ب", "د"];

  return (
    <div className="overflow-x-auto pb-2" dir="ltr">
      <div className="inline-flex gap-[3px]">
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-[3px]">
            {week.map((d) => (
              <span
                key={d.day}
                title={`${d.day} · ${d.count} آية`}
                className="h-[11px] w-[11px] rounded-[3px] transition hover:scale-125"
                style={{ background: colors[level(d.count)] }}
              />
            ))}
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-center justify-end gap-1.5 text-[10px] text-ink-500" dir="rtl">
        <span>أقل</span>
        {colors.map((c, i) => <span key={i} className="h-[11px] w-[11px] rounded-[3px]" style={{ background: c }} />)}
        <span>أكثر</span>
      </div>
    </div>
  );
}
