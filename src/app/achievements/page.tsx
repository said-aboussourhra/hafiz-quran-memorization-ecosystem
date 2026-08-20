import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { getBadges, getActivityDays, buildHeatmap } from "@/lib/progress";
import { Heatmap } from "@/components/Heatmap";

export const dynamic = "force-dynamic";

export default async function AchievementsPage() {
  const user = await getCurrentUser();
  const { badges, streak, completedJuz, stats } = await getBadges(user?.id ?? null);
  const days = user ? await getActivityDays(user.id) : new Map<string, number>();
  const heatmap = buildHeatmap(days);
  const earned = badges.filter((b) => b.earned).length;

  return (
    <div className="space-y-10">
      <header className="text-center">
        <p className="text-xs tracking-[0.3em] text-gold-600">إنجازاتي</p>
        <h1 className="mt-3 font-display text-3xl font-bold text-ink-900 sm:text-5xl">محطّات رحلتك</h1>
        <p className="mx-auto mt-4 max-w-xl text-ink-500">
          {user ? `فتحت ${earned.toLocaleString("ar-EG")} من ${badges.length.toLocaleString("ar-EG")} وساماً.` : "سجّل الدخول لتتبّع إنجازاتك ومواظبتك."}
        </p>
      </header>

      {/* Stat cards */}
      <section className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { v: `${streak.current.toLocaleString("ar-EG")} 🔥`, l: "أيام متتالية الآن" },
          { v: `${streak.best.toLocaleString("ar-EG")}`, l: "أطول سلسلة" },
          { v: `${completedJuz.toLocaleString("ar-EG")} / ٣٠`, l: "أجزاء مكتملة" },
          { v: `${stats.completionPct}٪`, l: "من القرآن" },
        ].map((s) => (
          <div key={s.l} className="lift card rounded-2xl p-5 text-center">
            <div className="font-display text-2xl font-black shine-text sm:text-3xl">{s.v}</div>
            <div className="mt-1 text-xs text-ink-500">{s.l}</div>
          </div>
        ))}
      </section>

      {/* Heatmap */}
      <section className="card rounded-3xl p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-bold text-ink-900">تقويم المواظبة</h2>
          <span className="text-xs text-ink-500">{streak.total.toLocaleString("ar-EG")} يوم نشاط · آخر سنة</span>
        </div>
        <div className="mt-5">
          <Heatmap data={heatmap} />
        </div>
        {!user && <p className="mt-4 text-center text-xs text-ink-500">سجّل الدخول ليُسجَّل نشاطك اليومي هنا.</p>}
      </section>

      {/* Badges */}
      <section>
        <div className="mb-5 flex items-center justify-between">
          <h2 className="font-display text-lg font-bold text-ink-900">الأوسمة</h2>
          <span className="text-sm text-emerald-700">{earned.toLocaleString("ar-EG")} / {badges.length.toLocaleString("ar-EG")}</span>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {badges.map((b) => (
            <div
              key={b.id}
              className={`lift relative overflow-hidden rounded-2xl border p-5 text-center transition ${b.earned ? "card" : "border-sand-300/50 bg-cream-100/40"}`}
            >
              <div className={`mx-auto grid h-16 w-16 place-items-center rounded-2xl text-3xl transition ${b.earned ? "" : "opacity-30 grayscale"}`} style={b.earned ? { background: "linear-gradient(135deg,rgba(16,185,129,0.14),rgba(37,99,235,0.14))" } : undefined}>
                {b.icon}
              </div>
              <h3 className={`mt-3 font-display text-base font-bold ${b.earned ? "text-ink-900" : "text-ink-500"}`}>{b.title}</h3>
              <p className="mt-1 text-[11px] text-ink-500">{b.desc}</p>
              {b.earned && <span className="absolute right-2 top-2 text-emerald-600">✓</span>}
            </div>
          ))}
        </div>
      </section>

      {!user && (
        <div className="text-center">
          <Link href="/signup" className="rounded-2xl btn-primary px-8 py-3.5 font-semibold">أنشئ حسابك وابدأ رحلتك</Link>
        </div>
      )}
    </div>
  );
}
