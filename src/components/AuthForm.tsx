"use client";

import Image from "next/image";
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

        {/* تنبيه مهم لتجنّب مشاكل الدخول */}
        <div className="hafiz-hint mt-5" role="note">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white/80 text-lg shadow-sm">💡</span>
          <p className="pt-1">
            <strong className="font-bold">قبل أن تبدأ:</strong> اكتب{" "}
            <strong className="font-bold">اسمك الكامل</strong> (الاسم واللقب) و{" "}
            <strong className="font-bold">تاريخ الازدياد</strong> الصحيحين، ولا تغيّرهما لاحقاً —
            فهما مفتاح حسابك الوحيد{mode === "signup" ? "، وستحتاجهما بنفس الشكل عند كل دخول." : " عند كل دخول."}
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
