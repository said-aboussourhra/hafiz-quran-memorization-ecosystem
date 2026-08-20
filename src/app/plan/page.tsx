import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { getProgressStats, getJuzProgress } from "@/lib/progress";
import { PACES, planForRemaining, JUZ_INFO } from "@/lib/plan";
import { TOTAL_AYAHS, getSurah } from "@/lib/surahs";
import { ReminderSettings } from "@/components/ReminderSettings";

export const dynamic = "force-dynamic";

export default async function PlanPage() {
  const user = await getCurrentUser();
  const stats = await getProgressStats(user?.id ?? null);
  const remaining = TOTAL_AYAHS - stats.memorizedAyahs;
  const juz = await getJuzProgress(user?.id ?? null);
  const completedJuz = juz.filter((j) => j.pct >= 100).length;

  return (
    <div className="space-y-8">
      <header className="text-center">
        <p className="text-xs tracking-[0.3em] text-gold-600">خطة الحفظ</p>
        <h1 className="mt-3 font-display text-3xl font-bold text-ink-900 sm:text-5xl">خطّط لختم القرآن حفظاً</h1>
        <p className="mx-auto mt-4 max-w-xl text-ink-500">
          اختر إيقاعك اليومي، وسنحسب لك المدّة المتوقّعة لإتمام حفظ القرآن الكريم كاملاً بإذن الله.
        </p>
      </header>

      {user && (
        <div className="mx-auto max-w-md rounded-2xl card-warm p-5 text-center">
          <div className="text-sm text-ink-500">حفظت {stats.memorizedAyahs.toLocaleString("ar-EG")} آية · بقي</div>
          <div className="font-display text-3xl font-bold shine-text">{remaining.toLocaleString("ar-EG")} آية</div>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {PACES.map((p) => {
          const plan = planForRemaining(remaining, p.ayahsPerDay);
          return (
            <div key={p.id} className="lift card rounded-3xl p-7">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-xl font-bold text-ink-900">{p.label}</h3>
                <span className="grid h-12 w-12 place-items-center rounded-2xl text-lg font-bold text-white" style={{ background: "linear-gradient(135deg,#10b981,#3b82f6)" }}>{p.ayahsPerDay.toLocaleString("ar-EG")}</span>
              </div>
              <p className="mt-3 text-sm text-ink-700">{p.desc}</p>
              <div className="mt-5 rounded-2xl bg-cream-100 p-4 text-center">
                <div className="text-xs text-ink-500">المدّة المتوقّعة للختم</div>
                <div className="mt-1 font-display text-2xl font-bold text-emerald-700">{plan.human}</div>
                <div className="mt-1 text-[11px] text-ink-500">
                  بإذن الله في {plan.finishDate.toLocaleDateString("ar-EG", { year: "numeric", month: "long" })}
                </div>
              </div>
              <Link href="/memorize" className="mt-5 block rounded-2xl btn-primary py-3 text-center font-semibold">ابدأ بهذا الإيقاع</Link>
            </div>
          );
        })}
      </div>

      {/* Juz challenges — 30 juz split into visual challenge cards */}
      <section>
        <div className="text-center">
          <p className="text-xs tracking-[0.3em] text-gold-600">تحدّي الأجزاء</p>
          <h2 className="mt-3 font-display text-2xl font-bold text-ink-900 sm:text-3xl">اختم القرآن جزءاً جزءاً</h2>
          <p className="mx-auto mt-3 max-w-xl text-ink-500">
            القرآن ٣٠ جزءاً — كل جزء تحدٍّ. {user ? `أتممت ${completedJuz.toLocaleString("ar-EG")} جزءاً من ٣٠.` : "سجّل الدخول لتتبّع تقدّمك في كل جزء."}
          </p>
        </div>

        {/* overall bar */}
        <div className="mx-auto mt-6 max-w-2xl">
          <div className="flex items-center justify-between text-xs text-ink-500">
            <span>التقدّم الكلي</span>
            <span className="font-bold text-emerald-700">{completedJuz.toLocaleString("ar-EG")} / ٣٠ جزءاً</span>
          </div>
          <div className="mt-2 h-3 overflow-hidden rounded-full bg-cream-200">
            <div className="h-full rounded-full transition-all" style={{ width: `${(completedJuz / 30) * 100}%`, background: "linear-gradient(90deg,#10b981,#3b82f6)" }} />
          </div>
        </div>

        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {JUZ_INFO.map((info) => {
            const jp = juz[info.juz - 1];
            const done = jp.pct >= 100;
            const started = jp.pct > 0;
            const startSurah = getSurah(info.startSurah);
            return (
              <Link
                key={info.juz}
                href={`/memorize?surah=${info.startSurah}`}
                className="lift group relative overflow-hidden rounded-2xl border p-5"
                style={done
                  ? { borderColor: "rgba(16,185,129,0.5)", background: "linear-gradient(135deg,#ecfdf5,#eff6ff)" }
                  : started
                    ? { borderColor: "rgba(59,130,246,0.35)", background: "#fff" }
                    : { borderColor: "rgba(184,144,47,0.2)", background: "#fff" }}
              >
                <div className="flex items-center justify-between">
                  <span className="grid h-12 w-12 place-items-center rounded-2xl text-lg font-black text-white shadow-md" style={{ background: done ? "linear-gradient(135deg,#047857,#059669)" : "linear-gradient(135deg,#10b981,#3b82f6)" }}>
                    {info.juz.toLocaleString("ar-EG")}
                  </span>
                  {done ? <span className="text-2xl">🏅</span> : <span className="text-sm font-bold text-emerald-700">{jp.pct}٪</span>}
                </div>
                <h3 className="mt-3 text-xl text-ink-900" style={{ fontFamily: "var(--font-quran)" }}>جزء {info.name}</h3>
                <p className="mt-1 text-[11px] text-ink-500">يبدأ بسورة {startSurah?.nameAr}</p>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-cream-200">
                  <div className="h-full rounded-full" style={{ width: `${jp.pct}%`, background: done ? "#059669" : "linear-gradient(90deg,#10b981,#3b82f6)" }} />
                </div>
                <span className="mt-3 inline-block text-xs font-semibold text-emerald-700 opacity-0 transition group-hover:opacity-100">
                  {done ? "أتقنته — راجعه ←" : started ? "أكمل هذا الجزء ←" : "ابدأ هذا التحدّي ←"}
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      <ReminderSettings />

      <div className="rounded-3xl card p-7">
        <h2 className="font-display text-lg font-bold text-ink-900">نصائح لحفظ متقن</h2>
        <ul className="mt-4 space-y-3 text-sm leading-relaxed text-ink-700">
          {[
            "احفظ في وقت ثابت يومياً — بعد الفجر أوقات الحفظ الذهبية.",
            "لا تنتقل لآية جديدة قبل إتقان ما قبلها إتقاناً تاماً.",
            "اربط كل آية بمعناها من التفسير الميسّر ليرسخ الحفظ.",
            "راجع محفوظك القديم يومياً — «تعاهدوا هذا القرآن».",
            "استمع لتلاوة شيخك المفضّل وردّد معه لتثبيت النطق.",
          ].map((t, i) => (
            <li key={i} className="flex gap-3">
              <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700">{(i + 1).toLocaleString("ar-EG")}</span>
              <span>{t}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
