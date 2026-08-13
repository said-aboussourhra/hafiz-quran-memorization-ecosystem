import { QuranUniverse } from "@/components/QuranUniverse";
import { getCurrentUser } from "@/lib/auth";
import { getUniverseData } from "@/lib/progress";

export const dynamic = "force-dynamic";

export default async function UniversePage() {
  const user = await getCurrentUser();
  const universe = await getUniverseData(user?.id ?? null);
  const mastered = universe.filter((s) => s.status === "mastered").length;
  const memorized = universe.filter((s) => s.status === "memorized").length;
  const learning = universe.filter((s) => s.status === "learning").length;

  const juzMap = new Map<number, { total: number; done: number }>();
  for (const s of universe) {
    const j = juzMap.get(s.juz) ?? { total: 0, done: 0 };
    j.total += 1;
    if (s.status === "memorized" || s.status === "mastered") j.done += 1;
    juzMap.set(s.juz, j);
  }

  return (
    <div className="space-y-8">
      <header className="text-center">
        <p className="text-xs tracking-[0.3em] text-gold-600">رحلتك المرئية</p>
        <h1 className="mt-3 font-display text-3xl font-bold text-ink-900 sm:text-5xl">كون القرآن</h1>
        <p className="mx-auto mt-4 max-w-xl text-ink-500">
          ١١٤ سورة تتحوّل إلى نجوم. ما حفظتَه يتلألأ، وما تتقنه يشعّ. انقر أي نجمة لتفتح سورتها في المصحف.
        </p>
      </header>

      <div className="grid grid-cols-3 gap-4">
        {[
          { v: mastered, l: "نجوم متقَنة", c: "#1f6f5c" },
          { v: memorized, l: "نجوم محفوظة", c: "#3aa384" },
          { v: learning, l: "نجوم قيد الحفظ", c: "#d4ae54" },
        ].map((s) => (
          <div key={s.l} className="card rounded-2xl p-5 text-center">
            <div className="font-display text-3xl font-bold" style={{ color: s.c }}>{s.v.toLocaleString("ar-EG")}</div>
            <div className="mt-1 text-xs text-ink-500">{s.l}</div>
          </div>
        ))}
      </div>

      <QuranUniverse surahs={universe} height={640} />

      <section>
        <h2 className="font-display text-xl font-bold text-ink-900">الأجزاء الثلاثون</h2>
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {Array.from(juzMap.entries())
            .sort((a, b) => a[0] - b[0])
            .map(([juz, info]) => {
              const pct = Math.round((info.done / info.total) * 100);
              return (
                <div key={juz} className="card rounded-2xl p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-ink-900">الجزء {juz}</span>
                    <span className="text-xs text-gold-600">{pct}٪</span>
                  </div>
                  <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-cream-200">
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, background: "linear-gradient(90deg,#3aa384,#b8902f)" }} />
                  </div>
                </div>
              );
            })}
        </div>
      </section>
    </div>
  );
}
