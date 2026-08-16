import { NamesGrid } from "@/components/NamesGrid";

export const dynamic = "force-static";

export default function NamesPage() {
  return (
    <div className="space-y-8">
      <header className="text-center">
        <p className="text-xs tracking-[0.3em] text-gold-600">أسماء الله الحسنى</p>
        <h1 className="mt-3 font-display text-3xl font-bold text-ink-900 sm:text-5xl">
          <span className="shine-text">التسعة والتسعون اسماً</span>
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-2xl text-ink-900" style={{ fontFamily: "var(--font-quran)" }}>
          ﴿ وَلِلَّهِ الْأَسْمَاءُ الْحُسْنَىٰ فَادْعُوهُ بِهَا ﴾
        </p>
        <p className="mt-2 text-sm text-ink-500">قال ﷺ: «إن لله تسعةً وتسعين اسماً، مَن أحصاها دخل الجنة»</p>
      </header>
      <NamesGrid />
    </div>
  );
}
