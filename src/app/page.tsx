import Link from "next/link";
import { QuranUniverse } from "@/components/QuranUniverse";
import { getCurrentUser } from "@/lib/auth";
import { getUniverseData, getProgressStats } from "@/lib/progress";
import { TOTAL_AYAHS } from "@/lib/surahs";
import { VIRTUES } from "@/lib/virtues";

export const dynamic = "force-dynamic";

const FEATURES = [
  { glyph: "۝", title: "المصحف كاملاً", body: "القرآن الكريم كله بالرسم العثماني، مع تلاوة صوتية لكل آية." },
  { glyph: "📖", title: "التفسير الميسّر", body: "انقر على أي كلمة أو آية ليظهر تفسيرها الميسّر فوراً." },
  { glyph: "🔄", title: "كرّر معي", body: "منهج تلقين بالتكرار: تستمع للآية وتكرّرها حتى ترسخ." },
  { glyph: "❓", title: "اختبارات ذكية", body: "أربع طرق للاختبار: استرجاع، كتابة، ترتيب، وملء الفراغات." },
  { glyph: "✦", title: "كون القرآن", body: "رحلتك تتجسّد نجوماً متلألئة تتابع تقدّمك بصرياً." },
  { glyph: "🏆", title: "إنجازات وتحفيز", body: "تحفيزات مستمرة ومحطّات إنجاز تُفتح مع تقدّمك." },
];

export default async function HomePage() {
  const user = await getCurrentUser();
  
  let universe = [];
  let stats = { completionPct: 0 };
  
  try {
    const [universeData, progressStats] = await Promise.all([
      getUniverseData(user?.id ?? null),
      getProgressStats(user?.id ?? null),
    ]);
    universe = universeData || [];
    stats = progressStats || { completionPct: 0 };
  } catch (error) {
    console.error("Error loading data:", error);
  }

  return (
    <div className="space-y-12 md:space-y-20 pb-8">
      {/* ===== HERO ===== */}
      <section className="text-center pt-4 md:pt-8">
        {/* البسملة */}
        <div className="inline-block relative">
          <span className="font-arabic text-3xl md:text-4xl gold-text">﷽</span>
        </div>

        {/* العنوان */}
        <h1 className="mt-4 font-display text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-[1.3] text-ink-900">
          رحلتك مع القرآن
          <br />
          <span className="gold-text">تبدأ بآية</span>
        </h1>

        {/* الوصف */}
        <p className="mt-4 mx-auto max-w-md text-sm sm:text-base text-ink-700 leading-relaxed px-4">
          مصحفٌ كامل بالتفسير الميسّر، وطرق حفظ ذهنية مع اختبارات ذكية — رفيقك لحفظ كتاب الله ومراجعته.
        </p>

        {/* الأزرار */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Link href="/mushaf" className="btn-primary px-6 py-3 rounded-2xl font-semibold text-sm sm:text-base">
            افتح المصحف
          </Link>
          <Link href="/memorize" className="btn-ghost px-6 py-3 rounded-2xl font-semibold text-sm sm:text-base">
            ابدأ الحفظ
          </Link>
        </div>

        {/* دعوة التسجيل */}
        {!user && (
          <p className="mt-4 text-xs sm:text-sm text-ink-500">
            <Link href="/signup" className="font-semibold text-gold-600">أنشئ حساباً</Link> لحفظ تقدّمك ومتابعة إنجازاتك.
          </p>
        )}

        {/* كون القرآن */}
        <div className="mt-8 md:mt-12">
          <QuranUniverse surahs={universe} height={300} />
        </div>
      </section>

      {/* ===== STATS ===== */}
      <section className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {[
          { v: "١١٤", l: "سورة كاملة" },
          { v: TOTAL_AYAHS?.toLocaleString("ar-EG") || "٦٢٣٦", l: "آية" },
          { v: "٣٠", l: "جزءاً" },
          { v: user ? `${stats.completionPct || 0}٪` : "ابدأ", l: user ? "نسبة إتمامك" : "رحلتك" },
        ].map((s) => (
          <div key={s.l} className="card rounded-2xl p-4 sm:p-5 text-center">
            <div className="font-display text-xl sm:text-2xl md:text-3xl font-bold gold-text">{s.v}</div>
            <div className="mt-1 text-[10px] sm:text-xs text-ink-500">{s.l}</div>
          </div>
        ))}
      </section>

      {/* ===== INSPIRATION ===== */}
      <section className="relative overflow-hidden rounded-3xl card-warm p-6 sm:p-8 md:p-12 text-center">
        <p className="text-[10px] sm:text-xs tracking-[0.3em] text-gold-600">آية وتدبّر</p>
        <p className="mx-auto mt-4 font-arabic text-xl sm:text-2xl md:text-3xl leading-[2.2] text-ink-900">
          وَلَقَدْ يَسَّرْنَا الْقُرْآنَ لِلذِّكْرِ فَهَلْ مِن مُّدَّكِرٍ
        </p>
        <p className="mt-3 text-xs sm:text-sm text-ink-500">سورة القمر · الآية ١٧</p>
      </section>

      {/* ===== VIRTUES ===== */}
      <section>
        <div className="text-center">
          <p className="text-[10px] sm:text-xs tracking-[0.3em] text-gold-600">فضل قراءة القرآن</p>
          <h2 className="mt-2 font-display text-xl sm:text-2xl md:text-3xl font-bold text-ink-900">
            ثمارٌ لا تنقطع
          </h2>
        </div>
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {VIRTUES && VIRTUES.slice(0, 6).map((v, i) => (
            <div key={i} className="card rounded-2xl p-5 sm:p-6">
              <span className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${
                v.kind === "ayah" ? "bg-emerald-700/10 text-emerald-700" : "bg-gold-500/10 text-gold-600"
              }`}>
                {v.kind === "ayah" ? "آية" : "حديث"}
              </span>
              <p className="mt-3 font-arabic text-base sm:text-lg leading-[1.9] text-ink-900">
                {v.text}
              </p>
              <p className="mt-3 text-[11px] sm:text-sm text-ink-500">{v.source}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ===== FEATURES ===== */}
      <section>
        <div className="text-center">
          <p className="text-[10px] sm:text-xs tracking-[0.3em] text-gold-600">لماذا حافظ</p>
          <h2 className="mt-2 font-display text-xl sm:text-2xl md:text-3xl font-bold text-ink-900">
            كل ما تحتاجه في مكان واحد
          </h2>
        </div>
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map((f) => (
            <div key={f.title} className="card rounded-2xl p-5 sm:p-6">
              <div className="text-3xl sm:text-4xl mb-2">{f.glyph}</div>
              <h3 className="font-display text-lg sm:text-xl font-bold text-ink-900">{f.title}</h3>
              <p className="mt-2 text-sm text-ink-700 leading-relaxed">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ===== CTA ===== */}
      <section className="relative overflow-hidden rounded-3xl card-warm p-8 sm:p-12 text-center">
        <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold text-ink-900">
          ابدأ اليوم رحلة <span className="gold-text">حفظ كتاب الله</span>
        </h2>
        <p className="mx-auto mt-3 max-w-md text-sm sm:text-base text-ink-700">
          اقرأ المصحف كاملاً، واحفظ بطرق ذهنية مع اختبارات تثبّت حفظك.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link href="/mushaf" className="btn-primary px-6 sm:px-8 py-3 sm:py-4 rounded-2xl font-bold text-sm sm:text-base">
            تصفّح المصحف
          </Link>
          {!user && (
            <Link href="/signup" className="btn-ghost px-6 sm:px-8 py-3 sm:py-4 rounded-2xl font-bold text-sm sm:text-base">
              إنشاء حساب
            </Link>
          )}
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <div className="divider-ornament" />
      <p className="text-center text-xs text-ink-500">حافظ — رفيقك في حفظ القرآن الكريم</p>
    </div>
  );
}