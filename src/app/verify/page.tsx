import { verifyCertificate, CERTIFICATE_DISCLAIMER } from "@/lib/certificates";
import Link from "next/link";
import { Suspense } from "react";
import { VerifyClient } from "@/components/verify/VerifyClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "التحقق من الشهادة — حافظ",
};

function formatDate(ts: number): string {
  try {
    return new Date(ts).toLocaleDateString("ar-EG", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return "—";
  }
}

export default async function VerifyPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  let result: ReturnType<typeof verifyCertificate> | null = null;
  if (token) result = verifyCertificate(token);

  return (
    <main className="mx-auto w-full max-w-2xl px-5 py-10">
      <div className="rounded-3xl border border-emerald-100 bg-white p-6 shadow-sm sm:p-10" dir="rtl">
        <div className="text-center">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-emerald-50 text-2xl">
            🔐
          </div>
          <h1 className="mt-4 font-display text-2xl font-bold text-ink-900">
            التحقق من شهادة حافظ
          </h1>
          <p className="mt-2 text-sm text-ink-500">
            أدخل رمز الشهادة (HFZ-…) للتحقق من صحته.
          </p>
        </div>

        <Suspense>
          <VerifyClient initialToken={token ?? ""} />
        </Suspense>

        {result && result.valid && (
          <div className="mt-8 rounded-2xl border border-emerald-200 bg-emerald-50/60 p-5">
            <div className="flex items-center gap-2 text-emerald-700">
              <span className="grid h-7 w-7 place-items-center rounded-full bg-emerald-600 text-white">✓</span>
              <span className="font-bold">شهادة صالحة — VALID</span>
            </div>
            <dl className="mt-4 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
              <Row label="الاسم" value={result.name} />
              <Row label="الإنجاز" value={result.achievementAr} />
              <Row label="معرّف الشهادة" value={result.id} mono />
              <Row label="تاريخ الإصدار" value={formatDate(result.iat)} />
              {result.surah != null && <Row label="السورة" value={String(result.surah)} />}
              {result.juz != null && <Row label="الجزء" value={String(result.juz)} />}
            </dl>
            {result.criteria.length > 0 && (
              <div className="mt-4">
                <p className="text-xs font-semibold text-ink-500">معايير التقييم</p>
                <ul className="mt-1 list-inside list-disc space-y-1 text-sm text-ink-700">
                  {result.criteria.map((c, i) => (
                    <li key={i}>{c}</li>
                  ))}
                </ul>
              </div>
            )}
            <p className="mt-5 rounded-xl bg-white/70 p-3 text-center text-[11px] leading-relaxed text-ink-500">
              {CERTIFICATE_DISCLAIMER}
            </p>
          </div>
        )}

        {result && !result.valid && (
          <div className="mt-8 rounded-2xl border border-red-200 bg-red-50/60 p-5 text-center">
            <div className="mx-auto grid h-10 w-10 place-items-center rounded-full bg-red-500 text-white">✕</div>
            <p className="mt-3 font-bold text-red-700">شهادة غير صالحة</p>
            <p className="mt-1 text-sm text-red-600">{result.reason}</p>
          </div>
        )}

        {!result && (
          <p className="mt-6 text-center text-xs text-ink-400">
            <Link href="/" className="text-emerald-700 hover:underline">
              العودة إلى حافظ
            </Link>
          </p>
        )}
      </div>
    </main>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="rounded-xl bg-white/70 px-3 py-2">
      <dt className="text-[11px] text-ink-400">{label}</dt>
      <dd className={`mt-0.5 font-semibold text-ink-800 ${mono ? "font-mono text-xs" : ""}`} dir={mono ? "ltr" : "rtl"}>
        {value}
      </dd>
    </div>
  );
}
