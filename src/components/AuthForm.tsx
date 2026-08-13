"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const endpoint = mode === "signup" ? "/api/auth/signup" : "/api/auth/login";
      const payload = mode === "signup" ? { name, email, password } : { email, password };
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
      router.refresh();
      router.push("/mushaf");
    } catch {
      setError("تعذّر الاتصال بالخادم.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-md">
      <div className="card-warm rounded-3xl p-8">
        <div className="text-center">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl card-warm font-arabic text-2xl gold-text">ح</span>
          <h1 className="mt-4 font-display text-2xl font-bold text-ink-900">
            {mode === "signup" ? "إنشاء حساب جديد" : "تسجيل الدخول"}
          </h1>
          <p className="mt-2 text-sm text-ink-500">
            {mode === "signup" ? "ابدأ رحلتك في حفظ كتاب الله" : "أهلاً بعودتك، واصل رحلتك المباركة"}
          </p>
        </div>

        <form onSubmit={submit} className="mt-7 space-y-4">
          {mode === "signup" && (
            <div>
              <label className="mb-1.5 block text-sm text-ink-700">الاسم</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="اسمك الكريم"
                className="w-full rounded-xl border border-sand-300 bg-white px-4 py-3 text-sm text-ink-900 outline-none focus:border-gold-500"
                required
              />
            </div>
          )}
          <div>
            <label className="mb-1.5 block text-sm text-ink-700">البريد الإلكتروني</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@email.com"
              dir="ltr"
              className="w-full rounded-xl border border-sand-300 bg-white px-4 py-3 text-sm text-ink-900 outline-none focus:border-gold-500"
              required
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm text-ink-700">كلمة المرور</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-xl border border-sand-300 bg-white px-4 py-3 text-sm text-ink-900 outline-none focus:border-gold-500"
              required
              minLength={6}
            />
          </div>

          {error && <p className="rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-600">{error}</p>}

          <button type="submit" disabled={busy} className="w-full rounded-xl btn-primary py-3 font-semibold disabled:opacity-60">
            {busy ? "جارٍ المعالجة…" : mode === "signup" ? "إنشاء الحساب" : "دخول"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-ink-500">
          {mode === "signup" ? (
            <>لديك حساب؟ <Link href="/login" className="font-semibold text-gold-600">سجّل دخولك</Link></>
          ) : (
            <>ليس لديك حساب؟ <Link href="/signup" className="font-semibold text-gold-600">أنشئ حساباً</Link></>
          )}
        </p>
      </div>
    </div>
  );
}
