import { QuranSearch } from "@/components/QuranSearch";

export const dynamic = "force-dynamic";

export default function SearchPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <header className="text-center">
        <p className="text-xs tracking-[0.3em] text-gold-600">بحث</p>
        <h1 className="mt-3 font-display text-3xl font-bold text-ink-900 sm:text-5xl">ابحث في القرآن</h1>
        <p className="mx-auto mt-4 max-w-xl text-ink-500">
          ابحث عن أي كلمة أو عبارة في القرآن الكريم كاملاً، وانتقل مباشرةً إلى موضعها في المصحف.
        </p>
      </header>
      <QuranSearch />
    </div>
  );
}
