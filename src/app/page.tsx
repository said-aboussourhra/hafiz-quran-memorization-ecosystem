import Link from "next/link";
import { QuranUniverse } from "@/components/QuranUniverse";
import { getCurrentUser } from "@/lib/auth";
import { getUniverseData, getProgressStats } from "@/lib/progress";
import { TOTAL_AYAHS } from "@/lib/surahs";
import { VIRTUES } from "@/lib/virtues";
import { AyahOfDayCard } from "@/components/AyahOfDayCard";
import { DailyPlanCard } from "@/components/hafiz/DailyPlanCard";
import { ayahOfToday } from "@/lib/ayahOfDay";

export const dynamic = "force-dynamic";

const FEATURES = [
  { glyph: "۝", title: "المصحف كاملاً", body: "القرآن الكريم كله بالرسم العثماني، يُفتح على هيئة مصحف أنيق، مع تلاوة صوتية لكل آية." },
  { glyph: "كتاب", title: "التفسير الميسّر", body: "انقر على أي كلمة أو آية ليظهر تفسيرها الميسّر فوراً، فتقرأ وتفهم في آنٍ واحد." },
  { glyph: "↻", title: "كرّر معي", body: "منهج تلقين بالتكرار: تستمع للآية وتكرّرها حتى ترسخ، آيةً آيةً، بهدوء وتركيز." },
  { glyph: "؟", title: "اختبارات ذكية", body: "أربع طرق للاختبار: استرجاع بالنطق، كتابة الآية مع تصحيح كلمة بكلمة، ترتيب الكلمات، وملء الفراغات." },
  { glyph: "✦", title: "كون القرآن", body: "رحلتك تتجسّد نجوماً متلألئة، تتابع تقدّمك بصرياً في سماءٍ من نور." },
  { glyph: "🏆", title: "إنجازات وتحفيز", body: "تحفيزات مستمرة، فضائل قراءة القرآن، ومحطّات إنجاز تُفتح مع تقدّمك المحفوظ في حسابك." },
];

export default async function HomePage() {
  const user = await getCurrentUser();
  const [universe, stats] = await Promise.all([
    getUniverseData(user?.id ?? null),
    getProgressStats(user?.id ?? null),
  ]);

  return (
    <div className="space-y-24">
      {/* HERO */}
      <section className="relative -mx-5 overflow-hidden px-5 pt-6">
        {/* aurora background blobs */}
        <div className="aurora breathe" style={{ top: "-60px", right: "10%", width: "320px", height: "320px", background: "radial-gradient(circle,#10b981,transparent 70%)" }} />
        <div className="aurora" style={{ top: "40px", left: "8%", width: "280px", height: "280px", background: "radial-gradient(circle,#3b82f6,transparent 70%)", animationDelay: "3s" }} />

        <div className="mx-auto max-w-3xl pt-10 text-center">
          <div className="rise relative mx-auto inline-grid h-28 w-28 place-items-center">
            <span className="orbit absolute inset-0 rounded-full border border-dashed border-emerald-500/30" />
            <span className="absolute inset-3 rounded-full border border-ocean-500/20" />
            <span className="pointer-events-none absolute -inset-4 -z-10 rounded-full breathe" style={{ background: "radial-gradient(circle, rgba(16,185,129,0.22), transparent 70%)" }} />
            <span className="font-arabic text-4xl shine-text">﷽</span>
          </div>
          <div className="rise mx-auto mt-6 flex max-w-xs items-center justify-center gap-3" style={{ animationDelay: "40ms" }}>
            <span className="h-px flex-1 bg-gradient-to-l from-emerald-500/50 to-transparent" />
            <span className="h-2 w-2 rounded-full" style={{ background: "linear-gradient(135deg,#10b981,#2563eb)" }} />
            <span className="h-px flex-1 bg-gradient-to-r from-ocean-500/50 to-transparent" />
          </div>
          <h1 className="rise mt-6 font-display text-4xl font-bold leading-[1.4] text-ink-900 sm:text-6xl" style={{ animationDelay: "80ms" }}>
            رحلتك مع القرآن
            <br />
            <span className="shine-text">تبدأ بآية</span>
          </h1>
          <p className="rise mx-auto mt-6 max-w-xl text-base leading-relaxed text-ink-700 sm:text-lg" style={{ animationDelay: "160ms" }}>
            مصحفٌ كامل بالتفسير الميسّر، وطرق حفظ ذهنية مع اختبارات ذكية — رفيقك لحفظ كتاب الله ومراجعته.
          </p>
          <div className="rise mt-9 flex flex-wrap items-center justify-center gap-3" style={{ animationDelay: "240ms" }}>
            <Link href="/mushaf" className="rounded-2xl btn-primary px-7 py-3.5 font-semibold">افتح المصحف</Link>
            <Link href="/memorize" className="rounded-2xl btn-ghost px-7 py-3.5 font-semibold">ابدأ الحفظ</Link>
          </div>
          {!user && (
            <p className="rise mt-4 text-sm text-ink-500" style={{ animationDelay: "300ms" }}>
              <Link href="/signup" className="font-semibold text-emerald-600">أنشئ حساباً</Link> لحفظ تقدّمك ومتابعة إنجازاتك.
            </p>
          )}
          <div className="rise mt-7 flex flex-wrap items-center justify-center gap-2.5" style={{ animationDelay: "360ms" }}>
            {[
              { i: "📖", t: "المصحف كاملاً" },
              { i: "🎙️", t: "١٧ قارئاً" },
              { i: "🧠", t: "مراجعة ذكية" },
              { i: "📴", t: "بدون إنترنت" },
            ].map((f) => (
              <span key={f.t} className="chip"><span className="text-sm">{f.i}</span>{f.t}</span>
            ))}
          </div>
        </div>

        <div className="rise mx-auto mt-12 max-w-5xl" style={{ animationDelay: "320ms" }}>
          <QuranUniverse surahs={universe} height={480} />
        </div>
      </section>

      {/* STATS */}
      <section className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { v: "١١٤", l: "سورة كاملة", icon: "📖" },
          { v: TOTAL_AYAHS.toLocaleString("ar-EG"), l: "آية بالرسم العثماني", icon: "۝" },
          { v: "٣٠", l: "جزءاً", icon: "✦" },
          { v: user ? `${stats.completionPct}٪` : "ابدأ", l: user ? "نسبة إتمامك" : "رحلتك الآن", icon: "🌙" },
        ].map((s, i) => (
          <div key={s.l} className="pop lift card relative overflow-hidden rounded-2xl p-5 text-center" style={{ animationDelay: `${i * 90}ms` }}>
            <div className="absolute inset-x-0 top-0 h-1" style={{ background: "linear-gradient(90deg,#10b981,#3b82f6)" }} />
            <div className="mb-1 text-lg opacity-60">{s.icon}</div>
            <div className="font-display text-2xl font-bold shine-text sm:text-3xl">{s.v}</div>
            <div className="mt-1 text-xs text-ink-500">{s.l}</div>
          </div>
        ))}
      </section>

      {/* DAILY PLAN — HAFIZ smart session entry */}
      <section>
        <DailyPlanCard />
      </section>

      {/* AYAH OF THE DAY — shareable */}
      <section>
        <AyahOfDayCard ayah={ayahOfToday()} />
      </section>

      {/* VIRTUES OF READING QURAN */}
      <section>
        <div className="text-center">
          <p className="eyebrow justify-center">فضل قراءة القرآن</p>
          <h2 className="mt-3 font-display text-2xl font-bold text-ink-900 sm:text-3xl">ثمارٌ لا تنقطع لحامل القرآن</h2>
          <p className="mx-auto mt-3 max-w-xl text-ink-500">آيات وأحاديث صحيحة تذكّرك بعظيم الأجر في كل حرف تقرؤه.</p>
        </div>
        <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {VIRTUES.slice(0, 6).map((v, i) => (
            <div key={i} className="lift relative overflow-hidden rounded-3xl card p-7">
              <span className="absolute -left-3 -top-5 text-7xl text-emerald-500/10">”</span>
              <span className={`inline-block rounded-full px-3 py-1 text-[11px] font-semibold ${v.kind === "ayah" ? "bg-emerald-700/10 text-emerald-700" : "bg-ocean-600/10 text-ocean-700"}`}>
                {v.kind === "ayah" ? "آية كريمة" : "حديث شريف"}
              </span>
              <p className="mt-4 text-xl leading-loose text-ink-900" style={{ fontFamily: "var(--font-quran)" }}>{v.text}</p>
              <p className="mt-4 text-sm text-ink-500">{v.source}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section>
        <div className="text-center">
          <p className="eyebrow justify-center">لماذا حافظ</p>
          <h2 className="mt-3 font-display text-2xl font-bold text-ink-900 sm:text-3xl">كل ما تحتاجه لحفظ القرآن في مكان واحد</h2>
        </div>
        <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.title} className="lift group relative overflow-hidden rounded-3xl card p-7">
              <div className="absolute -left-6 -top-6 font-arabic text-7xl text-emerald-500/10 transition group-hover:text-ocean-500/15">{f.glyph}</div>
              <div className="grid h-12 w-12 place-items-center rounded-2xl text-2xl text-white shadow-md" style={{ background: "linear-gradient(135deg,#10b981,#3b82f6)" }}>{f.glyph}</div>
              <h3 className="mt-4 font-display text-xl font-bold text-ink-900">{f.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-ink-700">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* QUICK ACCESS */}
      <section>
        <div className="text-center">
          <p className="eyebrow justify-center">أدوات إضافية</p>
          <h2 className="mt-3 font-display text-2xl font-bold text-ink-900 sm:text-3xl">المزيد في رحلتك القرآنية</h2>
        </div>
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {[
            { href: "/plan", icon: "🗓", title: "خطة الحفظ", body: "خطّط لختم القرآن حفظاً بإيقاعك المناسب" },
            { href: "/review", icon: "🔁", title: "المراجعة الذكية", body: "تذكير بالتكرار المتباعد قبل النسيان" },
            { href: "/search", icon: "🔍", title: "البحث في القرآن", body: "ابحث عن أي كلمة وانتقل لموضعها في المصحف" },
            { href: "/names", icon: "✦", title: "أسماء الله الحسنى", body: "التسعة والتسعون اسماً بمعانيها" },
            { href: "/adhkar", icon: "📿", title: "الأذكار", body: "أذكار الصباح والمساء وبعد الصلاة" },
            { href: "/universe", icon: "✺", title: "كون القرآن", body: "تابع رحلتك بصرياً في سماءٍ من نور" },
          ].map((c) => (
            <Link key={c.href} href={c.href} className="lift group rounded-3xl card p-7 text-center">
              <div className="mx-auto grid h-16 w-16 place-items-center rounded-full text-3xl text-white shadow-lg transition group-hover:scale-110" style={{ background: "linear-gradient(135deg,#10b981,#3b82f6)" }}>{c.icon}</div>
              <h3 className="mt-4 font-display text-lg font-bold text-ink-900">{c.title}</h3>
              <p className="mt-2 text-sm text-ink-500">{c.body}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden rounded-3xl card-warm p-10 text-center sm:p-16">
        <div className="aurora breathe" style={{ top: "-80px", left: "20%", width: "300px", height: "300px", background: "radial-gradient(circle,#10b981,transparent 70%)" }} />
        <div className="aurora" style={{ bottom: "-90px", right: "15%", width: "280px", height: "280px", background: "radial-gradient(circle,#3b82f6,transparent 70%)", animationDelay: "2s" }} />
        <div className="shimmer absolute inset-x-0 top-0 h-px" />
        <h2 className="relative font-display text-3xl font-bold text-ink-900 sm:text-4xl">
          ابدأ اليوم رحلة <span className="shine-text">حفظ كتاب الله</span>
        </h2>
        <p className="relative mx-auto mt-4 max-w-lg text-ink-700">اقرأ المصحف كاملاً بالتفسير الميسّر، واحفظ بطرق ذهنية مع اختبارات تثبّت حفظك.</p>
        <div className="relative mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/mushaf" className="rounded-2xl btn-primary px-8 py-4 font-bold">تصفّح المصحف</Link>
          {!user && <Link href="/signup" className="rounded-2xl btn-ghost px-8 py-4 font-bold">إنشاء حساب</Link>}
        </div>
      </section>

      <div className="divider-ornament" />
      <div className="-mt-16 pb-6 text-center text-xs text-ink-500">حافظ — رفيقك في حفظ القرآن الكريم</div>
    </div>
  );
}
