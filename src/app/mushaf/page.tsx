import { MushafIndex } from "@/components/MushafIndex";
import { OrnamentStar, OrnamentDivider } from "@/components/Ornament";
import { getCurrentUser } from "@/lib/auth";
import { getUserProgress } from "@/lib/progress";
import { getSurah } from "@/lib/surahs";

export const dynamic = "force-dynamic";

export default async function MushafPage() {
  const user = await getCurrentUser();
  const prog: Record<number, { status: string; pct: number }> = {};
  if (user) {
    const map = await getUserProgress(user.id);
    for (const [num, p] of map) {
      const meta = getSurah(num);
      const pct = meta ? Math.round((p.memorizedAyahs / meta.ayahCount) * 100) : 0;
      prog[num] = { status: p.status, pct };
    }
  }

  return (
    <div className="space-y-6">
      <header className="relative overflow-hidden rounded-[32px] px-6 py-10 text-center sm:px-10 sm:py-14" style={{ background: "linear-gradient(150deg,#0b3d33 0%,#082a22 55%,#051d17 100%)", border: "1px solid rgba(201,164,74,.4)", boxShadow: "0 40px 90px -40px rgba(3,24,19,.7)" }}>
        <OrnamentStar className="pointer-events-none absolute -left-10 -top-10 h-52 w-52 text-emerald-400/10" />
        <OrnamentStar className="pointer-events-none absolute -bottom-12 -right-8 h-56 w-56 text-amber-300/10" />
        <div className="relative">
          <p className="text-xs font-bold tracking-[0.35em] text-amber-300/90">المصحف الشريف</p>
          <h1 className="mt-3 font-display text-4xl font-bold text-white sm:text-6xl">المصحف كاملاً</h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-8 text-emerald-100/80 sm:text-base">
            صفحات مصحف المدينة الأصلية الـ٦٠٤ كما طُبعت، بصفحتين متقابلتين على الحاسوب وصفحة كاملة على الهاتف.
            اقلب الصفحات أو اذهب مباشرةً لرقمها؛ وانتقل للنص التفاعلي للتلاوة والحفظ والتفسير.
          </p>
          <div className="mx-auto mt-6 flex max-w-md items-center justify-center gap-3">
            <span className="h-px flex-1 bg-gradient-to-l from-transparent to-amber-300/60" />
            <OrnamentStar className="h-5 w-5 text-amber-300" />
            <span className="h-px flex-1 bg-gradient-to-r from-transparent to-amber-300/60" />
          </div>
          <p className="mt-4 font-arabic text-lg text-amber-100/90">﴿وَرَتِّلِ الْقُرْآنَ تَرْتِيلًا﴾</p>
        </div>
      </header>
      <OrnamentDivider />
      <MushafIndex prog={prog} loggedIn={!!user} />
    </div>
  );
}
