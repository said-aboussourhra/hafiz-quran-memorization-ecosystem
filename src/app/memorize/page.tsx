import Link from "next/link";
import { MemorizeFlow } from "@/components/MemorizeFlow";
import { getCurrentUser } from "@/lib/auth";
import { fetchSurah } from "@/lib/quran";
import { SURAHS, getSurah } from "@/lib/surahs";
import { virtueOfDay } from "@/lib/virtues";

export const dynamic = "force-dynamic";

// Short surahs recommended for memorization start
const SUGGESTED = [1, 112, 113, 114, 108, 110, 103, 111, 109, 107, 106, 105, 104, 102, 101, 100];

export default async function MemorizePage({ searchParams }: { searchParams: Promise<{ surah?: string }> }) {
  const { surah } = await searchParams;
  const user = await getCurrentUser();

  if (surah) {
    const n = Number(surah);
    const meta = getSurah(n);
    const content = meta ? await fetchSurah(n) : null;
    if (meta && content) {
      return (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <Link href="/memorize" className="text-sm text-ink-500 hover:text-ink-900">← اختيار سورة أخرى</Link>
            <Link href={`/mushaf/${n}`} className="text-sm text-gold-600">اقرأ في المصحف ←</Link>
          </div>
          <header className="text-center">
            <p className="text-xs tracking-[0.3em] text-gold-600">جلسة حفظ</p>
            <h1 className="mt-2 font-arabic text-4xl text-ink-900">{meta.nameAr}</h1>
          </header>
          <MemorizeFlow surah={content} isLoggedIn={!!user} />
        </div>
      );
    }
  }

  return (
    <div className="space-y-8">
      <header className="text-center">
        <p className="text-xs tracking-[0.3em] text-gold-600">طرق الحفظ الذهنية</p>
        <h1 className="mt-3 font-display text-3xl font-bold text-ink-900 sm:text-5xl">احفظ كتاب الله</h1>
        <p className="mx-auto mt-4 max-w-2xl text-ink-500">
          منهج تلقين بالتكرار «كرّر معي»، يتبعه اختبار ذكي بثلاث طرق: استرجاع بالنطق، كتابة الآية،
          أو ترتيب الكلمات. اختر سورة لتبدأ.
        </p>
      </header>

      {(() => {
        const v = virtueOfDay();
        return (
          <section className="relative overflow-hidden rounded-3xl card-warm p-7 text-center">
            <div className="shimmer absolute inset-x-0 top-0 h-px" />
            <p className="text-xs tracking-[0.3em] text-gold-600">فضل قراءة القرآن · تذكير اليوم</p>
            <p className="mx-auto mt-4 max-w-2xl text-xl leading-loose text-ink-900" style={{ fontFamily: "var(--font-quran)" }}>{v.text}</p>
            <p className="mt-3 text-sm text-ink-500">{v.source}</p>
          </section>
        );
      })()}

      <section>
        <h2 className="font-display text-lg font-bold text-ink-900">طرق الحفظ الستّ</h2>
        <p className="mt-1 text-sm text-ink-500">نهج متكامل يبدأ بالاستماع والتكرار، ثم يختبر حفظك بأربع طرق</p>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {[
            { icon: "🔊", label: "استماع", desc: "اسمع التلاوة" },
            { icon: "🔁", label: "تكرار", desc: "كرّر معي" },
            { icon: "🙈", label: "إخفاء", desc: "استرجع واكشف" },
            { icon: "✍️", label: "كتابة", desc: "تصحيح كلمة بكلمة" },
            { icon: "🧩", label: "ترتيب", desc: "رتّب الكلمات" },
            { icon: "⬚", label: "إكمال", desc: "أكمل الناقص" },
          ].map((m) => (
            <div key={m.label} className="rounded-2xl card p-4 text-center">
              <div className="text-3xl">{m.icon}</div>
              <div className="mt-2 font-display text-sm font-bold text-ink-900">{m.label}</div>
              <div className="mt-0.5 text-[10px] text-ink-500">{m.desc}</div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="font-display text-lg font-bold text-ink-900">سور مقترحة للبدء</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {SUGGESTED.map((n) => {
            const s = getSurah(n)!;
            return (
              <Link key={n} href={`/memorize?surah=${n}`} className="flex items-center gap-3 rounded-2xl card p-4 transition hover:-translate-y-0.5 hover:shadow-lg">
                <span className="grid h-10 w-10 place-items-center rounded-xl card-warm font-display text-sm font-bold text-gold-600">{n}</span>
                <div>
                  <div className="font-arabic text-lg text-ink-900">{s.nameAr}</div>
                  <div className="text-[11px] text-ink-500">{s.ayahCount} آية</div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      <section>
        <h2 className="font-display text-lg font-bold text-ink-900">أو اختر أي سورة</h2>
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
          {SURAHS.map((s) => (
            <Link key={s.number} href={`/memorize?surah=${s.number}`} className="flex items-center justify-between rounded-xl card px-3 py-2.5 text-sm transition hover:bg-cream-100">
              <span className="font-arabic text-base text-ink-900">{s.nameAr}</span>
              <span className="text-[10px] text-ink-500">{s.number}</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
