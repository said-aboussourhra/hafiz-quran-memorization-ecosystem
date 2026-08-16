"use client";

import Link from "next/link";
import { useState } from "react";

const ARABIC_NAME = /^[\u0600-\u06FF\s]+$/;

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const nameInvalid = mode === "signup" && name.length > 0 && !ARABIC_NAME.test(name.trim());

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (mode === "signup" && !ARABIC_NAME.test(name.trim())) {
      setError("يرجى كتابة الاسم بالحروف العربية فقط.");
      return;
    }
    setBusy(true);
    try {
      const endpoint = mode === "signup" ? "/api/auth/signup" : "/api/auth/login";
      const payload = mode === "signup" ? { name: name.trim(), email, password } : { email, password };
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!data.ok) {
        setError(data.error || "حدث خطأ، حاول مجدداً.");
        return;
      }
      // hard navigation guarantees the server layout re-reads the session
      // so the guest buttons disappear and the account view appears.
      window.location.assign("/dashboard");
    } catch {
      setError("تعذّر الاتصال بالخادم.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="relative mx-auto max-w-md">
      <div className="aurora breathe" style={{ top: "-40px", right: "0", width: "220px", height: "220px", background: "radial-gradient(circle,#10b981,transparent 70%)" }} />
      <div className="aurora" style={{ bottom: "-40px", left: "0", width: "200px", height: "200px", background: "radial-gradient(circle,#3b82f6,transparent 70%)", animationDelay: "2s" }} />

      <div className="card-in relative overflow-hidden rounded-3xl border border-white/60 bg-white/80 p-8 shadow-2xl backdrop-blur">
        <div className="absolute inset-x-0 top-0 h-1.5" style={{ background: "linear-gradient(90deg,#10b981,#3b82f6)" }} />

        <div className="text-center">
          <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl text-3xl text-white shadow-lg" style={{ background: "linear-gradient(135deg,#10b981,#3b82f6)" }}>
            <span style={{ fontFamily: "var(--font-quran)" }}>ح</span>
          </span>
          <h1 className="mt-5 font-display text-2xl font-bold text-ink-900">
            {mode === "signup" ? "إنشاء حساب جديد" : "تسجيل الدخول"}
          </h1>
          <p className="mt-2 text-sm text-ink-500">
            {mode === "signup" ? "ابدأ رحلتك في حفظ كتاب الله" : "أهلاً بعودتك، واصل رحلتك المباركة"}
          </p>
        </div>

        <form onSubmit={submit} className="mt-7 space-y-4">
          {mode === "signup" && (
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-ink-700">الاسم (بالعربية)</label>
              <div className="relative">
                <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-ink-500">👤</span>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="مثال: عبد الله"
                  className={`w-full rounded-xl border bg-white px-4 py-3 pr-11 text-sm text-ink-900 outline-none transition focus:border-emerald-500 ${nameInvalid ? "border-red-400" : "border-sand-300"}`}
                  required
                />
              </div>
              {nameInvalid && <p className="mt-1.5 text-xs text-red-500">الاسم يجب أن يكون بالحروف العربية فقط.</p>}
            </div>
          )}
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-ink-700">البريد الإلكتروني</label>
            <div className="relative">
              <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-ink-500">✉️</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@email.com"
                dir="ltr"
                className="w-full rounded-xl border border-sand-300 bg-white px-4 py-3 pr-11 text-sm text-ink-900 outline-none transition focus:border-emerald-500"
                required
              />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-ink-700">كلمة المرور</label>
            <div className="relative">
              <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-ink-500">🔒</span>
              <input
                type={showPw ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-sand-300 bg-white px-4 py-3 pr-11 pl-11 text-sm text-ink-900 outline-none transition focus:border-emerald-500"
                required
                minLength={6}
              />
              <button type="button" onClick={() => setShowPw((v) => !v)} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-500">
                {showPw ? "🙈" : "👁"}
              </button>
            </div>
          </div>

          {error && <p className="rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-600">{error}</p>}

          <button type="submit" disabled={busy} className="w-full rounded-xl btn-primary py-3.5 font-semibold disabled:opacity-60">
            {busy ? "جارٍ المعالجة…" : mode === "signup" ? "إنشاء الحساب" : "دخول"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-ink-500">
          {mode === "signup" ? (
            <>لديك حساب؟ <Link href="/login" className="font-semibold text-emerald-600">سجّل دخولك</Link></>
          ) : (
            <>ليس لديك حساب؟ <Link href="/signup" className="font-semibold text-emerald-600">أنشئ حساباً</Link></>
          )}
        </p>
      </div>
    </div>
  );
}
