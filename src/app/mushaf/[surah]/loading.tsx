export default function Loading() {
  return (
    <div className="space-y-5" aria-busy="true" aria-label="جارٍ فتح المصحف">
      <div className="h-12 animate-pulse rounded-2xl bg-cream-100" />
      <div className="book-open mx-auto w-full max-w-5xl">
        <div className="book-open-inner">
          <div className="book-stage">
            <div className="spread-wrap">
              <div className="spread-grid" dir="rtl">
                {[0, 1].map((i) => (
                  <div key={i} className={`spread-leaf ${i === 0 ? "right" : "left"}`}>
                    <span className="leaf-frame" aria-hidden />
                    <div className="relative z-10 mx-auto mb-6 h-14 max-w-xs animate-pulse rounded-2xl bg-amber-100/70" />
                    <div className="relative z-10 space-y-4">
                      {Array.from({ length: 7 }).map((_, j) => (
                        <div key={j} className="h-6 animate-pulse rounded bg-amber-100/60" style={{ width: `${72 + ((j * 17 + i * 9) % 28)}%`, marginInline: "auto" }} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      <p className="text-center text-sm text-ink-500">جارٍ فتح المصحف…</p>
    </div>
  );
}
