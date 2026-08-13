import Link from "next/link";
import { QuranUniverse } from "@/components/QuranUniverse";
import { getCurrentUser } from "@/lib/auth";
import { getUniverseData, getProgressStats } from "@/lib/progress";
import { TOTAL_AYAHS } from "@/lib/surahs";
import { VIRTUES } from "@/lib/virtues";

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
      <section className="relative -mx-5 px-5 pt-6">
        <div className="mx-auto max-w-3xl pt-8 text-center">
          <div className="rise relative inline-block">
            <span className="font-arabic text-4xl gold-text">﷽</span>
            <span className="pointer-events-none absolute -inset-8 -z-10 rounded-full" style={{ background: "radial-gradient(circle, rgba(212,174,84,0.18), transparent 70%)" }} />
          </div>
          <div className="rise mx-auto mt-5 flex max-w-xs items-center justify-center gap-3 text-gold-500" style={{ animationDelay: "40ms" }}>
            <span className="h-px flex-1 bg-gradient-to-l from-gold-500/50 to-transparent" />
            <span className="text-sm">۞</span>
            <span className="h-px flex-1 bg-gradient-to-r from-gold-500/50 to-transparent" />
          </div>
          <h1 className="rise mt-6 font-display text-4xl font-bold leading-[1.4] text-ink-900 sm:text-6xl" style={{ animationDelay: "80ms" }}>
            رحلتك مع القرآن
            <br />
            <span className="gold-text">تبدأ بآية</span>
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
              <Link href="/signup" className="font-semibold text-gold-600">أنشئ حساباً</Link> لحفظ تقدّمك ومتابعة إنجازاتك.
            </p>
          )}
        </div>

        <div className="rise mx-auto mt-12 max-w-5xl" style={{ animationDelay: "320ms" }}>
          <QuranUniverse surahs={universe} height={480} />
        </div>
      </section>

      {/* STATS */}
      <section className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { v: "١١٤", l: "سورة كاملة" },
          { v: TOTAL_AYAHS.toLocaleString("ar-EG"), l: "آية بالرسم العثماني" },
          { v: "٣٠", l: "جزءاً" },
          { v: user ? `${stats.completionPct}٪` : "ابدأ", l: user ? "نسبة إتمامك" : "رحلتك الآن" },
        ].map((s) => (
          <div key={s.l} className="card rounded-2xl p-5 text-center">
            <div className="font-display text-2xl font-bold gold-text sm:text-3xl">{s.v}</div>
            <div className="mt-1 text-xs text-ink-500">{s.l}</div>
          </div>
        ))}
      </section>

      {/* INSPIRATION */}
      <section className="relative overflow-hidden rounded-3xl card-warm p-8 text-center sm:p-12">
        <div className="shimmer absolute inset-x-0 top-0 h-px" />
        <p className="text-xs tracking-[0.3em] text-gold-600">آية وتدبّر</p>
        <p className="mx-auto mt-6 max-w-2xl font-arabic text-2xl leading-[2] text-ink-900 sm:text-3xl">
          وَلَقَدْ يَسَّرْنَا الْقُرْآنَ لِلذِّكْرِ فَهَلْ مِن مُّدَّكِرٍ
        </p>
        <p className="mt-4 text-sm text-ink-500">سورة القمر · الآية ١٧</p>
      </section>

      {/* VIRTUES OF READING QURAN */}
      <section>
        <div className="text-center">
          <p className="text-xs tracking-[0.3em] text-gold-600">فضل قراءة القرآن</p>
          <h2 className="mt-3 font-display text-2xl font-bold text-ink-900 sm:text-3xl">ثمارٌ لا تنقطع لحامل القرآن</h2>
          <p className="mx-auto mt-3 max-w-xl text-ink-500">آيات وأحاديث صحيحة تذكّرك بعظيم الأجر في كل حرف تقرؤه.</p>
        </div>
        <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {VIRTUES.slice(0, 6).map((v, i) => (
            <div key={i} className="relative overflow-hidden rounded-3xl card p-7">
              <span className="absolute -left-3 -top-5 text-7xl text-gold-500/10">”</span>
              <span className={`inline-block rounded-full px-3 py-1 text-[11px] font-semibold ${v.kind === "ayah" ? "bg-emerald-700/10 text-emerald-700" : "bg-gold-500/10 text-gold-600"}`}>
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
          <p className="text-xs tracking-[0.3em] text-gold-600">لماذا حافظ</p>
          <h2 className="mt-3 font-display text-2xl font-bold text-ink-900 sm:text-3xl">كل ما تحتاجه لحفظ القرآن في مكان واحد</h2>
        </div>
        <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.title} className="group relative overflow-hidden rounded-3xl card p-7 transition hover:-translate-y-1 hover:shadow-lg">
              <div className="absolute -left-4 -top-4 font-arabic text-6xl text-gold-500/10">{f.glyph}</div>
              <h3 className="font-display text-xl font-bold text-ink-900">{f.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-ink-700">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden rounded-3xl card-warm p-10 text-center sm:p-16">
        <h2 className="font-display text-3xl font-bold text-ink-900 sm:text-4xl">
          ابدأ اليوم رحلة <span className="gold-text">حفظ كتاب الله</span>
        </h2>
        <p className="mx-auto mt-4 max-w-lg text-ink-700">اقرأ المصحف كاملاً بالتفسير الميسّر، واحفظ بطرق ذهنية مع اختبارات تثبّت حفظك.</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/mushaf" className="rounded-2xl btn-primary px-8 py-4 font-bold">تصفّح المصحف</Link>
          {!user && <Link href="/signup" className="rounded-2xl btn-ghost px-8 py-4 font-bold">إنشاء حساب</Link>}
        </div>
      </section>

      <div className="divider-ornament" />
      <div className="-mt-16 pb-6 text-center text-xs text-ink-500">حافظ — رفيقك في حفظ القرآن الكريم</div>
    </div>
  );
}
