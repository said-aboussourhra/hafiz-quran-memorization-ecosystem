import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getProgressStats, getUserProgress, getReviewQueue } from "@/lib/progress";
import { planForRemaining, PACES } from "@/lib/plan";
import { getSurah } from "@/lib/surahs";
import { PersonalDhikr } from "@/components/PersonalDhikr";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, string> = {
  mastered: "متقَن",
  memorized: "محفوظ",
  learning: "قيد الحفظ",
};
const STATUS_COLOR: Record<string, string> = {
  mastered: "#047857",
  memorized: "#10b981",
  learning: "#3b82f6",
};

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [stats, map, review] = await Promise.all([
    getProgressStats(user.id),
    getUserProgress(user.id),
    getReviewQueue(user.id),
  ]);

  const remaining = stats.totalAyahs - stats.memorizedAyahs;
  const plan = planForRemaining(remaining, PACES[1].ayahsPerDay);
  const dueReviews = review.filter((r) => r.dueIn <= 0);

  const inProgress = [...map.values()]
    .filter((p) => p.memorizedAyahs > 0)
    .sort((a, b) => b.surahNumber - a.surahNumber);

  const ringPct = Math.min(100, stats.completionPct);

  return (
    <div className="space-y-8">
      <header className="text-center">
        <p className="text-xs tracking-[0.3em] text-gold-600">حسابي</p>
        <h1 className="mt-3 font-display text-3xl font-bold text-ink-900 sm:text-5xl">
          أهلاً، <span className="shine-text">{user.name}</span>
        </h1>
        <p className="mt-3 text-ink-500">تابع رحلتك في حفظ كتاب الله</p>
      </header>

      <PersonalDhikr name={user.name} />

      {/* Guiding "start here" for beginners */}
      {inProgress.length === 0 && (
        <section className="relative overflow-hidden rounded-3xl border border-white/60 p-8" style={{ background: "linear-gradient(160deg,#f0faf8,#e6f2f8)" }}>
          <div className="aurora breathe" style={{ top: "-60px", right: "10%", width: "220px", height: "220px", background: "radial-gradient(circle,#10b981,transparent 70%)" }} />
          <div className="relative">
            <h2 className="font-display text-2xl font-black text-ink-900">يا {user.name}، هيّا نبدأ من هنا 🌱</h2>
            <p className="mt-2 text-ink-700">إليك خطة بسيطة مضمونة لبدء رحلتك في حفظ كتاب الله:</p>
            <ol className="mt-5 space-y-3">
              {[
                { t: "ابدأ بالسور القصيرة", d: "سورة الإخلاص، الفلق، الناس — اختر مقطعاً صغيراً (٣–٥ آيات)." },
                { t: "استمع ثم كرّر", d: "استمع للآيات بصوت الشيخ، ثم كرّرها معه حتى ترسخ." },
                { t: "اختبر نفسك", d: "جرّب طرق: اقرأ بصوتك، الإخفاء، والإكمال حتى تتقن المقطع." },
                { t: "راجع يومياً", d: "عُد كل يوم لمراجعة ما حفظت — الاستمرار سرّ الإتقان." },
              ].map((s, i) => (
                <li key={i} className="flex gap-3 rounded-2xl bg-white/70 p-4">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-sm font-bold text-white" style={{ background: "linear-gradient(135deg,#10b981,#3b82f6)" }}>{(i + 1).toLocaleString("ar-EG")}</span>
                  <div>
                    <div className="font-bold text-ink-900">{s.t}</div>
                    <div className="text-sm text-ink-700">{s.d}</div>
                  </div>
                </li>
              ))}
            </ol>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/memorize?surah=112" className="rounded-2xl btn-primary px-7 py-3.5 font-bold">ابدأ بسورة الإخلاص ←</Link>
              <Link href="/plan" className="rounded-2xl btn-ghost px-6 py-3.5 font-semibold">اختر خطة أطول</Link>
            </div>
          </div>
        </section>
      )}

      {/* Hero progress */}
      <section className="grid gap-4 lg:grid-cols-3">
        <div className="lift card-warm relative flex items-center gap-6 overflow-hidden rounded-3xl p-7 lg:col-span-2">
          <div className="relative grid h-32 w-32 shrink-0 place-items-center">
            <svg className="h-32 w-32 -rotate-90" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(16,185,129,0.15)" strokeWidth="12" />
              <circle cx="60" cy="60" r="52" fill="none" stroke="url(#grad)" strokeWidth="12" strokeLinecap="round"
                strokeDasharray={`${(ringPct / 100) * 327} 327`} />
              <defs>
                <linearGradient id="grad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#10b981" />
                  <stop offset="100%" stopColor="#3b82f6" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute text-center">
              <div className="font-display text-2xl font-bold text-ink-900">{stats.completionPct}٪</div>
              <div className="text-[10px] text-ink-500">من القرآن</div>
            </div>
          </div>
          <div className="min-w-0">
            <div className="text-sm text-ink-500">أنجزت حتى الآن</div>
            <div className="font-display text-3xl font-bold shine-text">{stats.memorizedAyahs.toLocaleString("ar-EG")} آية</div>
            <div className="mt-1 text-sm text-ink-700">من أصل {stats.totalAyahs.toLocaleString("ar-EG")} آية · بقي {remaining.toLocaleString("ar-EG")}</div>
            <div className="mt-3 rounded-xl bg-white/60 px-4 py-2 text-sm text-ink-700">
              بمعدّل ١٠ آيات يومياً ستختم بإذن الله خلال <span className="font-bold text-emerald-700">{plan.human}</span>
            </div>
          </div>
        </div>

        <div className="lift card flex flex-col justify-center gap-3 rounded-3xl p-7 text-center">
          <div className="text-4xl">📊</div>
          <div className="grid grid-cols-3 gap-2">
            <div><div className="font-display text-2xl font-bold text-ink-900">{stats.completedSurahs.toLocaleString("ar-EG")}</div><div className="text-[10px] text-ink-500">سورة</div></div>
            <div><div className="font-display text-2xl font-bold text-ink-900">{stats.memoryHealth}</div><div className="text-[10px] text-ink-500">صحة الحفظ</div></div>
            <div><div className="font-display text-2xl font-bold text-ink-900">{dueReviews.length.toLocaleString("ar-EG")}</div><div className="text-[10px] text-ink-500">مراجعة مستحقة</div></div>
          </div>
        </div>
      </section>

      {/* Review queue */}
      <section>
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-bold text-ink-900">المراجعة اليوم</h2>
          <Link href="/review" className="text-sm font-semibold text-emerald-700">كل المراجعات ←</Link>
        </div>
        {dueReviews.length === 0 ? (
          <div className="mt-4 rounded-2xl card p-6 text-center text-ink-500">
            {review.length === 0 ? "ابدأ بحفظ أول سورة لتظهر هنا مراجعاتك." : "لا توجد مراجعات مستحقّة اليوم — أحسنت! 🌿"}
          </div>
        ) : (
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {dueReviews.slice(0, 6).map((r) => (
              <Link key={r.surahNumber} href={`/mushaf/${r.surahNumber}`} className="lift card flex items-center justify-between rounded-2xl p-4">
                <div className="flex items-center gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-xl text-xs font-bold text-white" style={{ background: "linear-gradient(135deg,#10b981,#3b82f6)" }}>{r.surahNumber.toLocaleString("ar-EG")}</span>
                  <div>
                    <div className="text-lg text-ink-900" style={{ fontFamily: "var(--font-quran)" }}>{r.nameAr}</div>
                    <div className="text-[11px] text-ink-500">آخر مراجعة قبل {r.daysSince.toLocaleString("ar-EG")} يوم</div>
                  </div>
                </div>
                <span className="rounded-full bg-red-50 px-2 py-1 text-[11px] font-semibold text-red-600">مستحقّة</span>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* In-progress surahs */}
      <section>
        <h2 className="font-display text-xl font-bold text-ink-900">سوري المحفوظة</h2>
        {inProgress.length === 0 ? (
          <div className="mt-4 rounded-2xl card p-6 text-center text-ink-500">
            لم تبدأ الحفظ بعد. <Link href="/memorize" className="font-semibold text-emerald-700">ابدأ الآن ←</Link>
          </div>
        ) : (
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {inProgress.map((p) => {
              const meta = getSurah(p.surahNumber)!;
              const pct = Math.round((p.memorizedAyahs / meta.ayahCount) * 100);
              return (
                <div key={p.surahNumber} className="card rounded-2xl p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xl text-ink-900" style={{ fontFamily: "var(--font-quran)" }}>{meta.nameAr}</span>
                    <span className="rounded-full px-2 py-0.5 text-[11px] font-semibold" style={{ background: `${STATUS_COLOR[p.status]}18`, color: STATUS_COLOR[p.status] }}>{STATUS_LABEL[p.status] ?? "قيد الحفظ"}</span>
                  </div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-cream-200">
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, background: "linear-gradient(90deg,#10b981,#3b82f6)" }} />
                  </div>
                  <div className="mt-2 flex items-center justify-between text-[11px] text-ink-500">
                    <span>{p.memorizedAyahs.toLocaleString("ar-EG")} / {meta.ayahCount.toLocaleString("ar-EG")} آية</span>
                    <Link href={`/memorize?surah=${p.surahNumber}`} className="font-semibold text-emerald-700">متابعة ←</Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <div className="flex flex-wrap justify-center gap-3">
        <Link href="/plan" className="rounded-2xl btn-primary px-6 py-3 font-semibold">خطة الحفظ</Link>
        <Link href="/memorize" className="rounded-2xl btn-ghost px-6 py-3 font-semibold">جلسة حفظ جديدة</Link>
      </div>
    </div>
  );
}
