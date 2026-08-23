"use client";

import { MISTAKE_META, type MistakeType } from "@/lib/hafiz/profile";

/**
 * Beautiful, encouraging contextual correction panel.
 * Never shames the learner — frames mistakes as points to strengthen.
 */
export function CorrectionPanel({
  word,
  mistakeType,
  onListen,
  onRetry,
  onDrill,
  onDismiss,
}: {
  word: string | null;
  mistakeType: MistakeType;
  onListen?: () => void;
  onRetry?: () => void;
  onDrill?: () => void;
  onDismiss: () => void;
}) {
  const meta = MISTAKE_META[mistakeType];
  return (
    <div
      className="fixed inset-x-0 bottom-24 z-[180] mx-auto w-[min(420px,calc(100vw-24px))] overflow-hidden rounded-2xl border border-orange-200 bg-white shadow-[0_20px_60px_-12px_rgba(234,88,12,0.35)]"
      role="alertdialog"
      aria-live="polite"
    >
      <div className="flex items-center justify-between bg-orange-50 px-4 py-2.5">
        <span className="flex items-center gap-2 text-sm font-bold text-orange-700">
          <span className="grid h-6 w-6 place-items-center rounded-full bg-orange-100">🔴</span>
          تحتاج إلى تثبيت
        </span>
        <button
          type="button"
          onClick={onDismiss}
          className="text-orange-500/70 hover:text-orange-700"
          aria-label="إغلاق"
        >
          ✕
        </button>
      </div>
      <div className="px-4 py-4" dir="rtl">
        {word ? (
          <>
            <p className="text-[11px] text-ink-500">الكلمة الصحيحة</p>
            <p className="mt-1 text-center text-3xl font-bold text-ink-900">{word}</p>
          </>
        ) : (
          <p className="text-center text-sm text-ink-600">راجع موضع {meta.ar} في الآية.</p>
        )}
        <div className="mt-4 grid grid-cols-3 gap-2">
          <ActionBtn label="🎧 استمع" onClick={onListen} />
          <ActionBtn label="🎙️ أعد" onClick={onRetry} />
          <ActionBtn label="🔁 تدرب" onClick={onDrill} />
        </div>
        <p className="mt-3 text-center text-[11px] leading-relaxed text-ink-400">
          كل خطأ يقربك من الإتقان. لا بأس — الْقلب يثبت بالتكرار.
        </p>
      </div>
    </div>
  );
}

function ActionBtn({ label, onClick }: { label: string; onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      className="rounded-xl border border-sand-300 bg-cream-50 py-2 text-xs font-semibold text-ink-700 transition hover:bg-cream-100 disabled:opacity-40"
    >
      {label}
    </button>
  );
}
