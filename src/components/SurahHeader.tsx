export function SurahHeader({
  nameAr,
  revelation,
  ayahCount,
  juz,
}: {
  nameAr: string;
  revelation: string;
  ayahCount: number;
  juz: number;
}) {
  return (
    <div className="relative mx-auto mb-9 max-w-xl">
      {/* Ornamental frame */}
      <svg viewBox="0 0 600 120" className="w-full" preserveAspectRatio="none" aria-hidden>
        <defs>
          <linearGradient id="shGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#047857" />
            <stop offset="50%" stopColor="#059669" />
            <stop offset="100%" stopColor="#2563eb" />
          </linearGradient>
          <linearGradient id="shFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#eafaf6" />
            <stop offset="100%" stopColor="#dff1f4" />
          </linearGradient>
        </defs>
        {/* outer decorative shape */}
        <path
          d="M40 12 H560 Q588 12 588 40 V80 Q588 108 560 108 H40 Q12 108 12 80 V40 Q12 12 40 12 Z"
          fill="url(#shFill)"
          stroke="url(#shGrad)"
          strokeWidth="2.5"
        />
        <path
          d="M48 22 H552 Q576 22 576 46 V74 Q576 98 552 98 H48 Q24 98 24 74 V46 Q24 22 48 22 Z"
          fill="none"
          stroke="url(#shGrad)"
          strokeWidth="1"
          strokeOpacity="0.5"
        />
        {/* side rosettes */}
        <circle cx="300" cy="6" r="5" fill="#059669" />
        <circle cx="300" cy="114" r="5" fill="#2563eb" />
      </svg>

      {/* Text overlay */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="flex items-center gap-3">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
          <span className="text-3xl sm:text-4xl" style={{ fontFamily: "var(--font-quran)", color: "#0f2a2c" }}>
            سورة {nameAr}
          </span>
          <span className="h-1.5 w-1.5 rounded-full bg-ocean-600" />
        </div>
        <div className="mt-1 text-[11px] tracking-wide text-ink-500">
          {revelation === "meccan" ? "مكية" : "مدنية"} · {ayahCount.toLocaleString("ar-EG")} آية · الجزء {juz.toLocaleString("ar-EG")}
        </div>
      </div>
    </div>
  );
}
