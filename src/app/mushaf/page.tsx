import { MushafIndex } from "@/components/MushafIndex";
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
      <header className="text-center">
        <p className="text-xs tracking-[0.3em] text-gold-600">المصحف الشريف</p>
        <h1 className="mt-3 font-display text-3xl font-bold text-ink-900 sm:text-5xl">المصحف كاملاً</h1>
        <p className="mx-auto mt-3 max-w-xl text-ink-500">
          القرآن الكريم كاملاً بالرسم العثماني مع التفسير الميسّر — اختر سورة لتُفتح على هيئة مصحف.
        </p>
      </header>
      <MushafIndex prog={prog} loggedIn={!!user} />
    </div>
  );
}
