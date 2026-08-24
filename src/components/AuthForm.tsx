"use client";

import Link from "next/link";
import { useState } from "react";

const ARABIC_NAME = /^[\u0600-\u06FF\s]+$/;

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const [name, setName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const nameInvalid = name.length > 0 && !ARABIC_NAME.test(name.trim());
  const nameShort = name.trim().split(/\s+/).length < 2;

  // Reasonable date-of-birth range for the native date picker.
  const today = new Date();
  const maxDate = `${today.getFullYear() - 5}-12-31`;
  const minDate = `${today.getFullYear() - 120}-01-01`;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!ARABIC_NAME.test(name.trim())) {
      setError("يرجى كتابة الاسم بالحروف العربية فقط.");
      return;
    }
    if (nameShort) {
      setError("يرجى إدخال الاسم الكامل (الاسم واللقب على الأقل).");
      return;
    }
    if (!birthDate) {
      setError("يرجى اختيار تاريخ الازدياد.");
      return;
    }

    setBusy(true);
    try {
      const endpoint = mode === "signup" ? "/api/auth/signup" : "/api/auth/login";
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), birthDate }),
      });
      const data = await res.json();
      if (!data.ok) {
        setError(data.error || "حدث خطأ، حاول مجدداً.");
        return;
      }
      // الجلسة محفوظة في كعكة httpOnly، يكفي التوجيه إلى لوحة التحكم.
      window.location.assign("/dashboard");
    } catch {
      setError("تعذّر الاتصال بالخادم.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="relative mx-auto w-full max-w-md">
      <div className="aurora breathe" style={{ top: "-40px", right: "0", width: "220px", height: "220px", background: "radial-gradient(circle,#10b981,transparent 70%)" }} />
      <div className="aurora" style={{ bottom: "-40px", left: "0", width: "200px", height: "200px", background: "radial-gradient(circle,#3b82f6,transparent 70%)", animationDelay: "2s" }} />

      <div className="card-in relative overflow-hidden rounded-3xl border border-white/60 bg-white/85 p-6 shadow-2xl backdrop-blur sm:p-8">
        <div className="absolute inset-x-0 top-0 h-1.5" style={{ background: "linear-gradient(90deg,#10b981,#059669,#3b82f6)" }} />

        <div className="text-center">
          <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl text-white shadow-lg" style={{ background: "linear-gradient(135deg,#10b981,#3b82f6)" }}>
            {mode === "signup" ? (
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="8" r="4" /><path d="M4 21c1.5-4 5-6 8-6s6.5 2 8 6" /><path d="M18 4l1.2 2.4L21.6 7.6 19.2 8.8 18 11.2 16.8 8.8 14.4 7.6 16.8 6.4z" />
              </svg>
            ) : (
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" /><path d="M10 17l5-5-5-5" /><path d="M15 12H3" />
              </svg>
            )}
          </span>
          <h1 className="mt-5 font-display text-2xl font-bold text-ink-900">
            {mode === "signup" ? "إنشاء حساب جديد" : "تسجيل الدخول"}
          </h1>
          <p className="mt-2 text-sm text-ink-500">
            {mode === "signup"
              ? "اسمك الكامل وتاريخ ازديادك يكفيان للدخول — دون بريد أو كلمة مرور."
              : "أدخل اسمك الكامل وتاريخ ازديادك للمتابعة."}
          </p>
        </div>

        <form onSubmit={submit} className="mt-6 space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-ink-700" htmlFor="auth-name">
              الاسم الكامل <span className="text-ink-400">(بالعربية)</span>
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-ink-500">👤</span>
              <input
                id="auth-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="مثال: عبد الله محمد"
                autoComplete="name"
                className={`w-full rounded-xl border bg-white px-4 py-3 pr-11 text-base text-ink-900 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 ${nameInvalid ? "border-red-400" : "border-sand-300"}`}
                required
              />
            </div>
            {nameInvalid && <p className="mt-1.5 text-xs text-red-500">الاسم يجب أن يكون بالحروف العربية فقط.</p>}
            {!nameInvalid && name.length > 0 && nameShort && (
              <p className="mt-1.5 text-xs text-amber-600">أدخل الاسم واللقب على الأقل.</p>
            )}
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-ink-700" htmlFor="auth-dob">
              تاريخ الازدياد
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute right-4 top-1/2 z-10 -translate-y-1/2 text-ink-500">🎂</span>
              <input
                id="auth-dob"
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                min={minDate}
                max={maxDate}
                className="w-full rounded-xl border border-sand-300 bg-white px-4 py-3 pr-11 text-base text-ink-900 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                required
              />
            </div>
            <p className="mt-1.5 text-[11px] text-ink-400">
              يُستخدم للتحقق من حسابك فقط، ولا يُشارك مع أحد.
            </p>
          </div>

          {error && (
            <p className="rounded-xl border border-red-100 bg-red-50 px-4 py-2.5 text-sm text-red-600">{error}</p>
          )}

          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-xl btn-primary py-3.5 text-base font-semibold disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busy ? "جارٍ المعالجة…" : mode === "signup" ? "إنشاء الحساب" : "دخول"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-ink-500">
          {mode === "signup" ? (
            <>لديك حساب؟ <Link href="/login" className="font-semibold text-emerald-600 hover:underline">سجّل دخولك</Link></>
          ) : (
            <>ليس لديك حساب؟ <Link href="/signup" className="font-semibold text-emerald-600 hover:underline">أنشئ حساباً</Link></>
          )}
        </p>
      </div>
    </div>
  );
}
