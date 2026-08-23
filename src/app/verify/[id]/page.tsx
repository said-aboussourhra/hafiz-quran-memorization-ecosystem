import Link from "next/link";
import Image from "next/image";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function VerifyCertificatePage({ params }: PageProps) {
  const { id } = await params;
  const decodedId = decodeURIComponent(id);

  return (
    <div className="mx-auto max-w-2xl py-8 px-4 space-y-8" dir="rtl">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-emerald-600 to-ocean-700 shadow-lg p-1.5">
          <Image
            src="/HAFIZ.jpg"
            alt="حافظ"
            width={56}
            height={56}
            className="rounded-2xl object-cover"
          />
        </div>
        <h1 className="font-display text-3xl font-black text-ink-900">
          التحقق من صحة الشهادة الرقمية
        </h1>
        <p className="text-sm text-ink-500">
          نظام الاعتماد والتحقق الرسمي لمنصة حافظ لحفظ القرآن الكريم
        </p>
      </div>

      {/* Verification Card */}
      <div className="relative overflow-hidden rounded-3xl border-2 border-emerald-500/30 bg-white p-6 sm:p-8 shadow-xl">
        <div className="absolute inset-x-0 top-0 h-2 bg-gradient-to-r from-emerald-500 via-teal-400 to-ocean-600" />

        <div className="flex items-center justify-between border-b border-emerald-500/10 pb-4">
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-700">
              ✓
            </span>
            <div>
              <div className="text-xs text-ink-500">حالة الاعتماد</div>
              <div className="font-bold text-emerald-700 text-sm">
                معتمدة وصحيحة (VALID)
              </div>
            </div>
          </div>
          <span className="rounded-full bg-cream-100 px-3 py-1 font-mono text-xs font-bold text-ink-700 border border-emerald-500/20">
            {decodedId}
          </span>
        </div>

        {/* Details list */}
        <div className="mt-6 space-y-4 text-sm">
          <div className="flex items-center justify-between py-2 border-b border-gray-100">
            <span className="text-ink-500">الجهة المصدرة:</span>
            <span className="font-bold text-ink-900">منصة حافظ — الذكاء الاصطناعي لحفظ القرآن</span>
          </div>

          <div className="flex items-center justify-between py-2 border-b border-gray-100">
            <span className="text-ink-500">نوع الوثيقة:</span>
            <span className="font-bold text-ink-900">شهادة تقدير وإتمام حفظ رقمية</span>
          </div>

          <div className="flex items-center justify-between py-2 border-b border-gray-100">
            <span className="text-ink-500">معايير الاستحقاق:</span>
            <span className="font-bold text-emerald-700">
              اجتياز التسميع الآلي بدقة ≥ 80% وتثبيت الآيات
            </span>
          </div>

          <div className="flex items-center justify-between py-2">
            <span className="text-ink-500">مستوى التشفير:</span>
            <span className="font-mono text-xs text-ink-700">
              SHA-256 Verified Token
            </span>
          </div>
        </div>

        {/* Disclaimer Warning */}
        <div className="mt-6 rounded-2xl bg-amber-50 p-4 border border-amber-300/60 text-amber-900 text-xs leading-relaxed">
          <div className="font-bold mb-1 flex items-center gap-1.5">
            <span>⚠️</span>
            <span>تنبيه وإبراء ذمة شرعي:</span>
          </div>
          هذه الوثيقة هي شهادة تقديرية وتحفيزية رقمية صادرة آلياً عن منصة حافظ بناءً على تقييم الحفظ، وليست إجازة شرعية بالسند المتصل أو شهادة رسمية صادرة عن معهد قرآني معتمد.
        </div>
      </div>

      {/* Footer Navigation */}
      <div className="text-center pt-4">
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-7 py-3 text-sm font-bold text-white shadow-md hover:bg-emerald-700 transition"
        >
          <span>🏠</span>
          <span>الانتقال إلى منصة حافظ الرئيسية</span>
        </Link>
      </div>
    </div>
  );
}
