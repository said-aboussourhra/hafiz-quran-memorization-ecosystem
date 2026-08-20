"use client";

import Link from "next/link";
import { useState } from "react";

const TYPES = ["مشكلة في الصوت", "مشكلة في المصحف", "مشكلة في الحفظ", "مشكلة في الحساب", "اقتراح تحسين", "أخرى"];

export function ReportProblem() {
  const [open, setOpen] = useState(false);
  const [sent, setSent] = useState(false);
  const [type, setType] = useState(TYPES[0]);
  const [desc, setDesc] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    // Compose a mail draft to the developer (no backend needed, always works).
    const body = encodeURIComponent(`نوع المشكلة: ${type}\n\nالوصف:\n${desc}\n\n— أُرسلت من منصة حافظ`);
    window.open(`mailto:s01said@outlook.fr?subject=${encodeURIComponent("بلاغ من منصة حافظ")}&body=${body}`, "_blank");
    setSent(true);
  };

  const close = () => {
    setOpen(false);
    setTimeout(() => { setSent(false); setDesc(""); }, 300);
  };

  return (
    <>
      {/* Floating side button */}
      <button
        onClick={() => setOpen(true)}
        aria-label="الإبلاغ عن مشكلة"
        title="الإبلاغ عن مشكلة"
        className="fixed left-0 top-1/2 z-40 hidden -translate-y-1/2 items-center gap-2 rounded-l-none rounded-r-2xl border border-l-0 border-emerald-500/25 bg-white/85 py-3 pl-2.5 pr-3 text-ink-700 shadow-md backdrop-blur transition hover:bg-white hover:pl-4 lg:flex"
        style={{ writingMode: "vertical-rl" }}
      >
        <span className="text-sm font-semibold tracking-wide">الإبلاغ عن مشكلة</span>
      </button>
      {/* Mobile: small round button above bottom nav */}
      <button
        onClick={() => setOpen(true)}
        aria-label="الإبلاغ عن مشكلة"
        className="fixed bottom-24 right-4 z-40 grid h-11 w-11 place-items-center rounded-full border border-emerald-500/25 bg-white/90 text-lg shadow-lg backdrop-blur transition active:scale-95 lg:hidden"
      >
        ⚠️
      </button>

      {/* Premium modal */}
      {open && (
        <div className="sheet-backdrop fixed inset-0 z-[90] flex items-end justify-center bg-ink-900/40 backdrop-blur-sm sm:items-center sm:p-6" onClick={close}>
          <div className="sheet-panel w-full max-w-md rounded-t-3xl bg-white p-6 shadow-2xl sm:rounded-3xl" onClick={(e) => e.stopPropagation()}>
            <div className="accent-bar mb-5 w-16" />
            {!sent ? (
              <>
                <h3 className="font-display text-xl font-black text-ink-900">هل واجهت مشكلة؟</h3>
                <p className="mt-1 text-sm text-ink-500">أخبرنا وسنصلحها بإذن الله في أقرب وقت.</p>
                <form onSubmit={submit} className="mt-5 space-y-4">
                  <div>
                    <label className="mb-1.5 block text-sm font-semibold text-ink-700">نوع المشكلة</label>
                    <div className="flex flex-wrap gap-2">
                      {TYPES.map((t) => (
                        <button key={t} type="button" onClick={() => setType(t)} className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${type === t ? "btn-primary" : "btn-ghost"}`}>
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-semibold text-ink-700">وصف المشكلة</label>
                    <textarea value={desc} onChange={(e) => setDesc(e.target.value)} rows={4} required placeholder="صف ما حدث بإيجاز…" className="field resize-none" />
                  </div>
                  <div className="flex gap-2">
                    <button type="submit" className="flex-1 rounded-2xl btn-primary py-3 font-semibold">إرسال البلاغ</button>
                    <button type="button" onClick={close} className="rounded-2xl btn-ghost px-5 py-3 font-semibold">إلغاء</button>
                  </div>
                </form>
              </>
            ) : (
              <div className="py-4 text-center">
                <div className="mx-auto grid h-16 w-16 place-items-center rounded-full text-3xl" style={{ background: "var(--grad-brand-soft)" }}>✓</div>
                <h3 className="mt-4 font-display text-xl font-black text-ink-900">جزاك الله خيراً</h3>
                <p className="mt-2 text-sm text-ink-500">وصلنا بلاغك وسنعمل عليه قريباً بإذن الله.</p>
                <div className="mt-5 flex flex-col gap-2">
                  <Link href="/developer" onClick={close} className="rounded-2xl btn-primary py-3 text-center text-sm font-semibold">تواصل مع المطوّر مباشرة ←</Link>
                  <button onClick={close} className="rounded-2xl btn-ghost py-3 text-sm font-semibold">إغلاق</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
