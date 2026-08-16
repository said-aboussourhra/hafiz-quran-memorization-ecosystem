import { MushafIndex } from "@/components/MushafIndex";
import { LastReadCard } from "@/components/LastRead";
import { getCurrentUser } from "@/lib/auth";
import { getUserProgress } from "@/lib/progress";

export const dynamic = "force-dynamic";

export default async function MushafPage() {
  const user = await getCurrentUser();
  const statuses: Record<number, string> = {};
  if (user) {
    const map = await getUserProgress(user.id);
    for (const [num, p] of map) statuses[num] = p.status;
  }

  return (
    <div className="space-y-8">
      <header className="text-center">
        <p className="text-xs tracking-[0.3em] text-gold-600">المصحف الشريف</p>
        <h1 className="mt-3 font-display text-3xl font-bold text-ink-900 sm:text-5xl">المصحف كاملاً</h1>
        <p className="mx-auto mt-4 max-w-xl text-ink-500">
          القرآن الكريم كاملاً بالرسم العثماني، مع التفسير الميسّر عند النقر على أي آية أو كلمة.
          اختر سورة لتُفتح على هيئة مصحف.
        </p>
      </header>
      <LastReadCard />
      <MushafIndex statuses={statuses} />
    </div>
  );
}
