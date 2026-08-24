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
    <div className="space-y-12 sm:space-y-16 lg:space-y-24">
      {/* HERO */}
      <section className="relative -mx-4 overflow-hidden px-4 pt-2 sm:-mx-5 sm:px-5 sm:pt-6">
        {/* aurora background blobs */}
        <div className="aurora breathe" style={{ top: "-60px", right: "10%", width: "320px", height: "320px", background: "radial-gradient(circle,#10b981,transparent 70%)" }} />
        <div className="aurora" style={{ top: "40px", left: "8%", width: "280px", height: "280px", background: "radial-gradient(circle,#3b82f6,transparent 70%)", animationDelay: "3s" }} />

        <div className="mx-auto max-w-3xl pt-6 text-center sm:pt-10">
          <div className="rise relative mx-auto inline-grid h-20 w-20 place-items-center sm:h-28 sm:w-28">
            <span className="orbit absolute inset-0 rounded-full" style={{ border: "1px dashed rgba(201,164,74,.4)" }} />
            <span className="absolute inset-3 rounded-full border border-emerald-500/25" />
            <span className="pointer-events-none absolute -inset-5 -z-10 rounded-full breathe" style={{ background: "radial-gradient(circle, rgba(201,164,74,0.18), rgba(16,185,129,0.12) 50%, transparent 70%)" }} />
            <span className="font-arabic text-3xl text-aurora sm:text-4xl">﷽</span>
          </div>
          <div className="rise mx-auto mt-4 flex max-w-[15rem] items-center justify-center gap-2 sm:mt-6 sm:max-w-xs sm:gap-3" style={{ animationDelay: "40ms" }}>
            <span className="h-px flex-1 bg-gradient-to-l from-emerald-500/50 to-transparent" />
            <span className="h-2 w-2 rounded-full" style={{ background: "linear-gradient(135deg,#10b981,#2563eb)" }} />
            <span className="h-px flex-1 bg-gradient-to-r from-ocean-500/50 to-transparent" />
          </div>
          <h1 className="rise mt-4 font-display text-[1.75rem] font-bold leading-[1.45] text-ink-900 sm:mt-6 sm:text-5xl lg:text-6xl" style={{ animationDelay: "80ms" }}>
            رحلتك مع القرآن
            <br />
            <span className="shine-text">تبدأ بآية</span>
          </h1>
          <p className="rise mx-auto mt-4 max-w-xl px-2 text-sm leading-relaxed text-ink-700 sm:mt-6 sm:px-0 sm:text-lg" style={{ animationDelay: "160ms" }}>
            مصحفٌ كامل بالتفسير الميسّر، وطرق حفظ ذهنية مع اختبارات ذكية — رفيقك لحفظ كتاب الله ومراجعته.
          </p>
          <div className="rise mt-6 flex w-full flex-wrap items-center justify-center gap-2.5 px-4 sm:mt-9 sm:gap-3 sm:px-0" style={{ animationDelay: "240ms" }}>
            <Link href="/mushaf" className="flex-1 basis-full rounded-2xl btn-primary px-6 py-3 text-center text-sm font-semibold sm:basis-auto sm:px-7 sm:py-3.5 sm:text-base">افتح المصحف</Link>
            <Link href="/memorize" className="flex-1 basis-full rounded-2xl btn-ghost px-6 py-3 text-center text-sm font-semibold sm:basis-auto sm:px-7 sm:py-3.5 sm:text-base">ابدأ الحفظ</Link>
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

        <div className="rise mx-auto mt-8 max-w-5xl sm:mt-12" style={{ animationDelay: "320ms" }}>
          <QuranUniverse surahs={universe} height={360} />
          {/* Mobile-tuned height; desktop can scale via the component's own viewBox */}
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
          <div key={s.l} className="pop lift card-premium shine relative overflow-hidden p-5 text-center sm:p-6" style={{ animationDelay: `${i * 90}ms` }}>
            <div className="mx-auto mb-2 grid h-10 w-10 place-items-center rounded-2xl text-lg text-white shadow-md sm:h-11 sm:w-11" style={{ background: i % 2 ? "var(--grad-sapphire)" : "var(--grad-gold)" }}>{s.icon}</div>
            <div className="font-display text-2xl font-extrabold stat-num sm:text-3xl">{s.v}</div>
            <div className="mt-1 text-[11px] font-semibold text-ink-500 sm:text-xs">{s.l}</div>
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
          <h2 className="mt-3 font-display section-title text-ink-900">ثمارٌ لا تنقطع لحامل القرآن</h2>
          <p className="mx-auto mt-3 max-w-xl text-ink-500">آيات وأحاديث صحيحة تذكّرك بعظيم الأجر في كل حرف تقرؤه.</p>
        </div>
        <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {VIRTUES.slice(0, 6).map((v, i) => (
            <div key={i} className="lift group shine card-premium relative overflow-hidden p-5 sm:p-7">
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
          <h2 className="mt-3 font-display section-title text-ink-900">كل ما تحتاجه لحفظ القرآن في مكان واحد</h2>
        </div>
        <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.title} className="lift group shine card-premium relative overflow-hidden p-5 sm:p-7">
              <div className="absolute -left-6 -top-6 font-arabic text-7xl text-emerald-500/10 transition group-hover:text-ocean-500/15">{f.glyph}</div>
              <div className="icon-badge emerald h-12 w-12 text-2xl">{f.glyph}</div>
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
          <h2 className="mt-3 font-display section-title text-ink-900">المزيد في رحلتك القرآنية</h2>
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
            <Link key={c.href} href={c.href} className="lift group shine card-premium rounded-3xl p-5 text-center sm:p-7">
              <div className="icon-badge circle mx-auto h-14 w-14 text-2xl transition group-hover:scale-110 sm:h-16 sm:w-16 sm:text-3xl">{c.icon}</div>
              <h3 className="mt-4 font-display text-lg font-bold text-ink-900">{c.title}</h3>
              <p className="mt-2 text-sm text-ink-500">{c.body}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="card-gold shine relative overflow-hidden rounded-[1.75rem] p-8 text-center sm:rounded-3xl sm:p-16">
        <span className="ribbon hidden sm:inline-block">مجاني</span>
        <div className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full bg-emerald-400/20 blur-3xl" />
        <div className="pointer-events-none absolute -left-10 bottom-0 h-44 w-44 rounded-full bg-blue-400/20 blur-3xl" />
        <div className="shimmer absolute inset-x-0 top-0 h-px" />
        <h2 className="relative font-display text-2xl font-extrabold text-ink-900 sm:text-4xl">
          ابدأ اليوم رحلة <span className="text-aurora">حفظ كتاب الله</span>
        </h2>
        <p className="relative mx-auto mt-4 max-w-lg text-sm leading-relaxed text-ink-700 sm:text-base">اقرأ المصحف كاملاً بالتفسير الميسّر، واحفظ بطرق ذهنية مع اختبارات تثبّت حفظك.</p>
        <div className="relative mt-8 flex w-full flex-col gap-3 px-4 sm:w-auto sm:flex-row sm:justify-center sm:px-0">
          <Link href="/mushaf" className="rounded-2xl btn-primary px-8 py-4 text-sm font-bold sm:text-base">تصفّح المصحف</Link>
          {!user && <Link href="/signup" className="rounded-2xl btn-ghost px-8 py-4 text-sm font-bold sm:text-base">إنشاء حساب</Link>}
        </div>
      </section>

      <div className="divider-ornament" />
      <div className="-mt-16 pb-6 text-center text-xs text-ink-500">حافظ — رفيقك في حفظ القرآن الكريم</div>
    </div>
  );
}
