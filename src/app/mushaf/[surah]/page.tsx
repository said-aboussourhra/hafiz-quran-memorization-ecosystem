import Link from "next/link";
import { notFound } from "next/navigation";
import { MushafReader } from "@/components/MushafReader";
import { fetchSurah } from "@/lib/quran";
import { getSurah } from "@/lib/surahs";

// ISR: cache each surah page; revalidate daily for top performance.
export const revalidate = 86400;
export const dynamicParams = true;

export function generateStaticParams() {
  // Pre-render the most-visited short surahs for instant loads.
  return [1, 36, 55, 67, 112, 113, 114].map((n) => ({ surah: String(n) }));
}

export function generateMetadata({ params }: { params: Promise<{ surah: string }> }) {
  return params.then(({ surah }) => {
    const meta = getSurah(Number(surah));
    return { title: meta ? `سورة ${meta.nameAr} — حافظ` : "المصحف — حافظ" };
  });
}

export default async function SurahPage({ params }: { params: Promise<{ surah: string }> }) {
  const { surah } = await params;
  const n = Number(surah);
  const meta = getSurah(n);
  if (!meta) notFound();

  const content = await fetchSurah(n);

  const prev = n > 1 ? n - 1 : null;
  const next = n < 114 ? n + 1 : null;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3 rounded-2xl card px-4 py-3">
        <Link href="/mushaf" className="flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-900">
          <span>الفهرس</span>
        </Link>
        <div className="text-center">
          <div className="font-arabic text-xl text-ink-900">{meta.nameAr}</div>
          <div className="text-[10px] text-ink-500">{meta.ayahCount.toLocaleString("ar-EG")} آية · {meta.revelation === "meccan" ? "مكية" : "مدنية"} · جزء {meta.juz}</div>
        </div>
        <div className="flex gap-1.5">
          {next && <Link href={`/mushaf/${next}`} className="grid h-9 w-9 place-items-center rounded-lg btn-ghost text-sm" title="التالية">›</Link>}
          {prev && <Link href={`/mushaf/${prev}`} className="grid h-9 w-9 place-items-center rounded-lg btn-ghost text-sm" title="السابقة">‹</Link>}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <Link href={`/memorize?surah=${meta.number}`} className="rounded-xl btn-primary px-6 py-2.5 text-sm font-semibold">
          ابدأ حفظ هذه السورة
        </Link>
        <span className="text-sm text-ink-500">{meta.meaning}</span>
      </div>

      {content ? (
        <MushafReader surah={content} />
      ) : (
        <div className="rounded-3xl card p-10 text-center">
          <p className="font-arabic text-4xl text-ink-900">{meta.nameAr}</p>
          <p className="mt-4 text-ink-500">تعذّر تحميل نص السورة حالياً. تأكد من الاتصال بالإنترنت وحاول تحديث الصفحة.</p>
        </div>
      )}
    </div>
  );
}
