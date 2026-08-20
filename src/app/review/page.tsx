import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getReviewQueue } from "@/lib/progress";
import { ReviewGrader } from "@/components/ReviewGrader";

export const dynamic = "force-dynamic";

export default async function ReviewPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const queue = await getReviewQueue(user.id);
  const due = queue.filter((r) => r.dueIn <= 0);
  const upcoming = queue.filter((r) => r.dueIn > 0);

  return (
    <div className="space-y-8">
      <header className="text-center">
        <p className="text-xs tracking-[0.3em] text-gold-600">المراجعة الذكية</p>
        <h1 className="mt-3 font-display text-3xl font-bold text-ink-900 sm:text-5xl">التكرار المتباعد</h1>
        <p className="mx-auto mt-4 max-w-xl text-ink-500">
          يذكّرك النظام بمراجعة ما حفظت في الوقت المناسب — قبل أن تنساه — بناءً على قوة حفظك لكل سورة.
        </p>
      </header>

      {queue.length === 0 ? (
        <div className="rounded-3xl card p-10 text-center">
          <div className="text-5xl">🌱</div>
          <p className="mt-4 text-ink-500">لم تُتمّ حفظ أي سورة بعد. عند إتمامك سورة ستظهر هنا في جدول المراجعة.</p>
          <Link href="/memorize" className="mt-6 inline-block rounded-2xl btn-primary px-6 py-3 font-semibold">ابدأ الحفظ</Link>
        </div>
      ) : (
        <>
          <section>
            <h2 className="font-display text-xl font-bold text-ink-900">مستحقّة الآن ({due.length.toLocaleString("ar-EG")})</h2>
            {due.length === 0 ? (
              <div className="mt-4 rounded-2xl card p-6 text-center text-ink-500">لا مراجعات مستحقّة — ممتاز! راجعت كل شيء في وقته 🌿</div>
            ) : (
              <div className="mt-4">
                <ReviewGrader items={due.map((r) => ({ surahNumber: r.surahNumber, nameAr: r.nameAr, retention: r.retention }))} />
              </div>
            )}
          </section>

          {upcoming.length > 0 && (
            <section>
              <h2 className="font-display text-xl font-bold text-ink-900">قادمة</h2>
              <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {upcoming.map((r) => (
                  <div key={r.surahNumber} className="flex items-center justify-between rounded-xl card px-4 py-3">
                    <span className="text-lg text-ink-900" style={{ fontFamily: "var(--font-quran)" }}>{r.nameAr}</span>
                    <span className="text-[11px] text-ink-500">بعد {r.dueIn.toLocaleString("ar-EG")} يوم</span>
                  </div>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
