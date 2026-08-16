import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { getAchievements, getProgressStats } from "@/lib/progress";

export const dynamic = "force-dynamic";

export default async function AchievementsPage() {
  const user = await getCurrentUser();
  const [achievements, stats] = await Promise.all([
    getAchievements(user?.id ?? null),
    getProgressStats(user?.id ?? null),
  ]);
  const unlocked = achievements.filter((a) => a.unlocked).length;

  return (
    <div className="space-y-8">
      <header className="text-center">
        <p className="text-xs tracking-[0.3em] text-gold-600">إنجازاتي</p>
        <h1 className="mt-3 font-display text-3xl font-bold text-ink-900 sm:text-5xl">محطّات رحلتك</h1>
        <p className="mx-auto mt-4 max-w-xl text-ink-500">
          {user ? `فتحت ${unlocked.toLocaleString("ar-EG")} من ${achievements.length.toLocaleString("ar-EG")} إنجازاً.` : "سجّل الدخول لتتبّع إنجازاتك وحفظ تقدّمك."}
        </p>
        <div className="mx-auto mt-6 h-2 max-w-md overflow-hidden rounded-full bg-cream-200">
          <div className="h-full rounded-full shimmer" style={{ width: `${(unlocked / achievements.length) * 100}%`, background: "linear-gradient(90deg,#10b981,#3b82f6)" }} />
        </div>
      </header>

      {user && (
        <section className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { v: `${stats.completionPct}٪`, l: "نسبة الإتمام" },
            { v: stats.memorizedAyahs.toLocaleString("ar-EG"), l: "آية محفوظة" },
            { v: stats.completedSurahs.toLocaleString("ar-EG"), l: "سورة مكتملة" },
            { v: `${stats.memoryHealth}`, l: "صحة الحفظ" },
          ].map((s) => (
            <div key={s.l} className="card rounded-2xl p-5 text-center">
              <div className="font-display text-2xl font-bold gold-text">{s.v}</div>
              <div className="mt-1 text-xs text-ink-500">{s.l}</div>
            </div>
          ))}
        </section>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {achievements.map((a) => (
          <div key={a.key} className={`rounded-3xl p-6 text-center transition ${a.unlocked ? "card-warm" : "card opacity-70"}`}>
            <div className="mx-auto grid h-20 w-20 place-items-center rounded-full text-4xl" style={a.unlocked ? { background: "linear-gradient(135deg,#fff7e3,#f3e6c2)" } : { background: "#f1ead8", filter: "grayscale(1)", opacity: 0.6 }}>
              {a.icon}
            </div>
            <h3 className={`mt-5 font-display text-lg font-bold ${a.unlocked ? "gold-text" : "text-ink-500"}`}>{a.title}</h3>
            <p className="mt-2 text-sm text-ink-500">{a.description}</p>
            <p className="mt-4 text-[11px]">{a.unlocked ? <span className="text-emerald-700">✓ مفتوح</span> : <span className="text-ink-500">🔒 مقفل</span>}</p>
          </div>
        ))}
      </div>

      {!user && (
        <div className="text-center">
          <Link href="/signup" className="inline-block rounded-2xl btn-primary px-8 py-3.5 font-semibold">أنشئ حساباً لتبدأ</Link>
        </div>
      )}
    </div>
  );
}
