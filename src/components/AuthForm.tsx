"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";

const ARABIC_NAME = /^[\u0600-\u06FF\s]+$/;

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const [name, setName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  // Floating hint toast: slides down after 5 seconds, auto-dismisses after 12s or with ✕
  const [showToast, setShowToast] = useState(false);
  const [toastExiting, setToastExiting] = useState(false);

  useEffect(() => {
    // Reveal floating toast after exactly 5 seconds
    const showTimer = window.setTimeout(() => {
      setShowToast(true);
    }, 5000);

    // Auto-dismiss 12 seconds after showing (17s total)
    const autoHideTimer = window.setTimeout(() => {
      setToastExiting(true);
      window.setTimeout(() => {
        setShowToast(false);
        setToastExiting(false);
      }, 400);
    }, 17000);

    return () => {
      window.clearTimeout(showTimer);
      window.clearTimeout(autoHideTimer);
    };
  }, []);

  const dismissToast = () => {
    setToastExiting(true);
    window.setTimeout(() => {
      setShowToast(false);
      setToastExiting(false);
    }, 400);
  };

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
    <>
      {/* ===== البطاقة العائمة المعزولة المنزلقة من الأعلى بعد 5 ثوانٍ ===== */}
      {showToast && (
        <div
          className={`fixed top-4 sm:top-6 inset-x-4 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 z-50 max-w-lg w-auto ${
            toastExiting ? "auth-hint-exit" : "auth-hint-enter"
          }`}
          role="status"
          aria-live="polite"
        >
          <div className="relative flex items-start gap-3.5 rounded-2xl border border-emerald-500/30 bg-white/95 p-4 sm:p-5 shadow-[0_20px_50px_-12px_rgba(6,95,70,0.35)] backdrop-blur-xl ring-1 ring-amber-400/25">
            {/* خط جمالي جانبي متدرج */}
            <span className="absolute inset-y-0 right-0 w-1.5 rounded-r-2xl bg-gradient-to-b from-amber-400 via-emerald-500 to-ocean-500" />

            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-emerald-100 to-amber-100 text-xl shadow-inner">
              💡
            </span>

            <div className="flex-1 pr-1 text-sm leading-relaxed text-ink-800">
              <strong className="font-bold text-emerald-800">قبل أن تبدأ:</strong> اكتب{" "}
              <strong className="font-bold text-ink-900">اسمك الكامل</strong> (الاسم واللقب) و{" "}
              <strong className="font-bold text-ink-900">تاريخ الازدياد</strong> الصحيحين، ولا تغيّرهما لاحقاً —
              فهما مفتاح حسابك الوحيد، وستحتاجهما بنفس الشكل عند كل دخول.
            </div>

            <button
              type="button"
              onClick={dismissToast}
              aria-label="إغلاق التنبيه"
              className="shrink-0 -mt-1 -ml-1 rounded-lg p-1.5 text-ink-400 hover:bg-sand-100 hover:text-ink-700 transition"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      <div className="relative mx-auto w-full max-w-md">
        <div className="aurora breathe" style={{ top: "-40px", right: "0", width: "220px", height: "220px", background: "radial-gradient(circle,#10b981,transparent 70%)" }} />
        <div className="aurora" style={{ bottom: "-40px", left: "0", width: "200px", height: "200px", background: "radial-gradient(circle,#3b82f6,transparent 70%)", animationDelay: "2s" }} />

        <div className="card-premium card-in relative overflow-hidden p-6 sm:p-8">
          <div className="absolute inset-x-0 top-0 h-1.5" style={{ background: "var(--grad-aurora)" }} />
          <span className="ribbon hidden sm:inline-block">{mode === "signup" ? "مجاني" : "أهلاً"}</span>

          <div className="text-center">
            {/* شعار حافظ */}
            <Link href="/" className="group mx-auto inline-flex flex-col items-center" aria-label="حافظ — الصفحة الرئيسية">
              <span className="grid h-20 w-20 place-items-center rounded-3xl bg-gradient-to-br from-emerald-500 to-ocean-600 p-1.5 shadow-lg transition duration-300 group-hover:scale-105 group-hover:shadow-xl">
                <Image
                  src="/HAFIZ.jpg"
                  alt="شعار حافظ"
                  width={64}
                  height={64}
                  priority
                  className="h-full w-full rounded-2xl object-cover"
                />
              </span>
              <span className="mt-3 block font-display text-xl font-black leading-none shine-text">حافظ</span>
              <span className="mt-1 block text-[10px] font-semibold leading-none tracking-[0.15em] text-ink-500">رحلتك مع القرآن</span>
            </Link>
            <h1 className="mt-4 font-display text-2xl font-bold text-ink-900">
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
    </>
  );
}
