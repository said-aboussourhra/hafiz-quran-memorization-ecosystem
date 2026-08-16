export default function Loading() {
  return (
    <div className="space-y-5">
      <div className="h-14 animate-pulse rounded-2xl bg-cream-100" />
      <div className="mushaf-page px-5 py-9 sm:px-14 sm:py-14">
        <div className="mx-auto mb-8 h-16 max-w-lg animate-pulse rounded-2xl bg-cream-200" />
        <div className="mx-auto mb-8 h-8 max-w-sm animate-pulse rounded-lg bg-cream-100" />
        <div className="space-y-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-6 animate-pulse rounded bg-cream-100" style={{ width: `${70 + ((i * 13) % 30)}%`, marginInline: "auto" }} />
          ))}
        </div>
      </div>
      <p className="text-center text-sm text-ink-500">جارٍ فتح المصحف…</p>
    </div>
  );
}
