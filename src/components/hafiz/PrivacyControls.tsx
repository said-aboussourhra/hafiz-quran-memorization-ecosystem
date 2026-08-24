"use client";

import { useState } from "react";

const STORAGE_KEY = "hafiz_profile_v1";

/**
 * Privacy controls for the local HAFIZ memorization profile:
 * export (JSON download) and delete. The profile lives only in this browser;
 * no voice data is ever recorded or transmitted by this client.
 */
export function PrivacyControls() {
  const [confirming, setConfirming] = useState(false);
  const [done, setDone] = useState<string | null>(null);

  const exportData = () => {
    if (typeof window === "undefined") return;
    const raw = window.localStorage.getItem(STORAGE_KEY) ?? "{}";
    const blob = new Blob([raw], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `hafiz-profile-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setDone("تم تصدير بياناتك.");
  };

  const deleteData = () => {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(STORAGE_KEY);
    setConfirming(false);
    setDone("تم حذف بيانات الحفظ المحلية. ستُحدّث الصفحة.");
    setTimeout(() => window.location.reload(), 900);
  };

  return (
    <section className="rounded-3xl border border-sand-200 bg-white p-6 shadow-sm" dir="rtl">
      <h3 className="font-display text-lg font-bold text-ink-900">الخصوصية والبيانات</h3>
      <p className="mt-1 text-xs leading-relaxed text-ink-500">
        بيانات حفظك محفوظة محليًا في متصفحك فقط. لا نُسجّل صوتك ولا نُرسله لأي طرف ثالث،
        ولا نستخدمه لتدريب أي نموذج.
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={exportData}
          className="rounded-xl border border-sand-300 bg-cream-50 px-4 py-2 text-sm font-semibold text-ink-700 hover:bg-cream-100"
        >
          تصدير البيانات
        </button>
        {!confirming ? (
          <button
            type="button"
            onClick={() => setConfirming(true)}
            className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-100"
          >
            حذف البيانات
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-xs text-red-700">تأكيد الحذف؟</span>
            <button
              type="button"
              onClick={deleteData}
              className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-red-700"
            >
              نعم، احذف
            </button>
            <button
              type="button"
              onClick={() => setConfirming(false)}
              className="rounded-lg border border-sand-300 px-3 py-1.5 text-xs text-ink-600"
            >
              إلغاء
            </button>
          </div>
        )}
      </div>
      {done && <p className="mt-3 text-xs text-emerald-700">{done}</p>}
    </section>
  );
}
