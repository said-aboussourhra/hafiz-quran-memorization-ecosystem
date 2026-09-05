"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  authenticateAdmin,
  storeAdminSession,
  hasAdminSession,
  getAdminUsername,
  ADMIN_USERNAME,
} from "@/lib/adminAuth";
import { useAdminLogin } from "./AdminLoginProvider";

/**
 * نموذج دخول سينمائي للوحة تحكم
 * يغطي الشاشة كاملة عند فتحه
 * عند النجاح، يتم تحويل المستخدم إلى /admin
 */
export function AdminLogin() {
  const router = useRouter();
  const { closeAdminLogin } = useAdminLogin();
  const [isOpen, setIsOpen] = useState(true);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [shake, setShake] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);

  // التحقق من جلسة موجودة عند تحميل المكون
  useEffect(() => {
    if (hasAdminSession()) {
      router.push("/admin");
    }
  }, [router]);

  // إغلاق النموذج
  const closeLogin = useCallback(() => {
    setIsOpen(false);
    closeAdminLogin();
  }, [closeAdminLogin]);

  // إغلاق النموذج عند الضغط خارجه
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dialogRef.current && !dialogRef.current.contains(event.target as Node)) {
        closeLogin();
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        closeLogin();
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, closeLogin]);

  // التعامل مع تقديم النموذج
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    // تأخير طفيف للأنيميشن
    await new Promise((resolve) => setTimeout(resolve, 300));

    if (authenticateAdmin(username, password)) {
      storeAdminSession();
      setIsLoading(false);
      // إغلاق النموذج وتحويل المستخدم
      closeLogin();
      router.push("/admin");
    } else {
      setIsLoading(false);
      setShake(true);
      setError("اسم المستخدم أو كلمة السر غير صحيحة");
      setTimeout(() => setShake(false), 500);
    }
  };

  // إذا لم يكن النموذج مفتوحاً، عرض زر فتح
  if (!isOpen) {
    return null;
  }

  return (
    <>
      {/* خلفية مظلمة */}
      <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-xl flex items-center justify-center p-4" />

      {/* نموذج الدخول */}
      <div
        ref={dialogRef}
        className={`fixed inset-0 z-[201] flex items-center justify-center p-4 ${shake ? "shake" : ""}`}
      >
        <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden animate-fadeIn" style={{
          boxShadow: "0 30px 80px -20px rgba(0,0,0,0.5), 0 0 0 1px rgba(16,185,129,0.2)",
        }}>
          {/* رأس النموذج */}
          <div className="relative p-6 pb-4 text-center border-b border-emerald-500/20" style={{
            background: "linear-gradient(135deg, rgba(16,185,129,0.08), rgba(37,99,235,0.06))",
          }}>
            <button
              onClick={closeLogin}
              className="absolute top-4 left-4 grid h-8 w-8 place-items-center rounded-xl text-ink-500 hover:bg-cream-100 hover:text-emerald-700 transition"
              aria-label="إغلاق"
            >
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>

            <div className="flex flex-col items-center gap-2">
              <div className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-emerald-500 to-ocean-600 text-white text-2xl font-bold shadow-lg">
                S
              </div>
              <h2 className="font-display text-xl font-bold shine-text">دخول لوحة التحكم</h2>
              <p className="text-sm text-ink-500">
                مسجل دخول: <span className="font-semibold text-emerald-700">{getAdminUsername()}</span>
              </p>
            </div>
          </div>

          {/* محتوى النموذج */}
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {error && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50/80 border border-red-200 text-red-700 text-sm font-medium">
                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            {/* حقل اسم المستخدم */}
            <div className="space-y-2">
              <label htmlFor="admin-username" className="block text-sm font-semibold text-ink-700">
                اسم المستخدم
              </label>
              <input
                id="admin-username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={ADMIN_USERNAME}
                className="w-full px-4 py-3 rounded-xl border border-emerald-200 bg-white/80 text-ink-900 placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition"
                autoComplete="username"
                autoFocus
              />
            </div>

            {/* حقل كلمة السر */}
            <div className="space-y-2">
              <label htmlFor="admin-password" className="block text-sm font-semibold text-ink-700">
                كلمة السر
              </label>
              <input
                id="admin-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 rounded-xl border border-emerald-200 bg-white/80 text-ink-900 placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition"
                autoComplete="current-password"
              />
            </div>

            {/* زر الدخول */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 rounded-xl btn-primary text-white font-bold text-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  جاري التحقق...
                </>
              ) : (
                <>
                  <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M15 6l3 3m0 0l-3 3m3-3H6" />
                    <path d="M3 12h18M3 12a9 9 0 1118 0 9 9 0 01-18 0z" />
                  </svg>
                  دخول
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* أنيميشن خلفية */}
      <div className="fixed inset-0 z-[199] pointer-events-none" style={{
        background: "radial-gradient(circle at 50% 50%, rgba(16,185,129,0.05), transparent 70%)",
      }} />
    </>
  );
}

// أنيميشن اهتزاز
const shakeStyles = `
  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
    20%, 40%, 60%, 80% { transform: translateX(5px); }
  }
  .shake { animation: shake 0.5s ease-in-out; }
  @keyframes fadeIn {
    from { opacity: 0; transform: scale(0.95) translateY(10px); }
    to { opacity: 1; transform: scale(1) translateY(0); }
  }
  .animate-fadeIn { animation: fadeIn 0.3s ease-out; }
`;

// إضافة أنيميشن إلى document
if (typeof document !== "undefined") {
  const style = document.createElement("style");
  style.textContent = shakeStyles;
  document.head.appendChild(style);
}
