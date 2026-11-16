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

export default async function SurahPage({
  params,
  searchParams,
}: {
  params: Promise<{ surah: string }>;
  searchParams?: Promise<{ ayah?: string; page?: string }>;
}) {
  const { surah } = await params;
  const n = Number(surah);
  const meta = getSurah(n);
  if (!meta) notFound();

  const sp = searchParams ? await searchParams : {};
  const ayahParam = sp.ayah ? Number(sp.ayah) : NaN;
  const initialAyah = Number.isInteger(ayahParam) && ayahParam >= 1 && ayahParam <= meta.ayahCount ? ayahParam : undefined;
  const pageParam = sp.page ? Number(sp.page) : NaN;
  const initialPage = Number.isInteger(pageParam) && pageParam >= 1 && pageParam <= 604 ? pageParam : undefined;

  const content = await fetchSurah(n);

  const prev = n > 1 ? n - 1 : null;
  const next = n < 114 ? n + 1 : null;

  return (
    <div className="space-y-4">
      {/* Slim breadcrumb — the reader itself carries the full toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href="/mushaf" className="flex items-center gap-1.5 rounded-xl px-2 py-1.5 text-sm font-bold text-ink-500 transition hover:bg-emerald-50 hover:text-emerald-800">
          <span>›</span> فهرس السور
        </Link>
        <div className="flex items-center gap-2">
          {prev && (
            <Link href={`/mushaf/${prev}`} className="rounded-xl btn-ghost px-3 py-1.5 text-xs font-bold" title="السورة السابقة">
              السابقة
            </Link>
          )}
          <Link href={`/memorize?surah=${meta.number}`} className="rounded-xl btn-primary px-4 py-1.5 text-xs font-bold">
            ابدأ حفظ هذه السورة
          </Link>
          {next && (
            <Link href={`/mushaf/${next}`} className="rounded-xl btn-ghost px-3 py-1.5 text-xs font-bold" title="السورة التالية">
              التالية
            </Link>
          )}
        </div>
      </div>

      {content ? (
        <MushafReader key={meta.number} surah={content} initialAyah={initialAyah} initialPage={initialPage} />
      ) : (
        <div className="rounded-3xl card p-10 text-center">
          <p className="font-arabic text-4xl text-ink-900">{meta.nameAr}</p>
          <p className="mt-4 text-ink-500">تعذّر تحميل نص السورة حالياً. تأكد من الاتصال بالإنترنت وحاول تحديث الصفحة.</p>
        </div>
      )}
    </div>
  );
}
