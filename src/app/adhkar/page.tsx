import { AdhkarView } from "@/components/AdhkarView";

export const dynamic = "force-static";

export default function AdhkarPage() {
  return (
    <div className="space-y-8">
      <header className="text-center">
        <p className="text-xs tracking-[0.3em] text-gold-600">حصن المسلم</p>
        <h1 className="mt-3 font-display text-3xl font-bold text-ink-900 sm:text-5xl"><span className="shine-text">الأذكار</span></h1>
        <p className="mx-auto mt-4 max-w-xl text-ink-500">أذكار الصباح والمساء وبعد الصلاة — رفيقك اليومي في ذكر الله.</p>
      </header>
      <AdhkarView />
    </div>
  );
}
