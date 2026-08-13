"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { Menu, X, BookOpen, Brain, Sparkles, Trophy, Home } from "lucide-react";

const NAV_ITEMS = [
  { href: "/", label: "الرئيسية", icon: Home },
  { href: "/mushaf", label: "المصحف", icon: BookOpen },
  { href: "/memorize", label: "الحفظ", icon: Brain },
  { href: "/universe", label: "كون القرآن", icon: Sparkles },
  { href: "/achievements", label: "إنجازاتي", icon: Trophy },
];

export function SiteChrome({ children, userName }: { children: React.ReactNode; userName?: string | null }) {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  const isAuthPage = pathname === "/login" || pathname === "/signup";

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-green-200/30">
        <div className="container-responsive flex items-center justify-between h-14 md:h-16">
          <Link href="/" className="flex items-center gap-2 font-display text-xl font-bold">
            <span className="text-2xl">📖</span>
            <span className="green-text">حافظ</span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition ${
                    isActive ? "bg-green-100 text-green-700" : "text-gray-600 hover:bg-green-50"
                  }`}
                >
                  <Icon size={16} />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-3">
            {!isAuthPage && (
              <>
                {userName ? (
                  <span className="hidden sm:inline text-sm text-gray-600">👋 {userName}</span>
                ) : (
                  <>
                    <Link href="/login" className="hidden sm:inline text-sm text-gray-600 hover:text-green-600 transition">
                      دخول
                    </Link>
                    <Link href="/signup" className="btn-primary px-4 py-1.5 text-sm hidden sm:inline-flex">
                      إنشاء حساب
                    </Link>
                  </>
                )}
              </>
            )}

            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-green-50 transition"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </header>

      {isMenuOpen && (
        <div className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm" onClick={() => setIsMenuOpen(false)}>
          <div className="absolute left-0 top-0 h-full w-72 bg-white/95 backdrop-blur-lg shadow-xl p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <span className="font-display text-xl font-bold green-text">حافظ</span>
              <button onClick={() => setIsMenuOpen(false)} className="p-2 rounded-lg hover:bg-green-50">
                <X size={24} />
              </button>
            </div>

            <nav className="flex flex-col gap-2">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium transition ${
                      isActive ? "bg-green-100 text-green-700" : "text-gray-600 hover:bg-green-50"
                    }`}
                  >
                    <Icon size={20} />
                    {item.label}
                  </Link>
                );
              })}

              {!userName && !isAuthPage && (
                <div className="mt-4 pt-4 border-t border-gray-100 flex flex-col gap-2">
                  <Link href="/login" className="px-4 py-3 rounded-xl text-center text-gray-600 hover:bg-green-50">
                    دخول
                  </Link>
                  <Link href="/signup" className="px-4 py-3 rounded-xl text-center btn-primary font-medium">
                    إنشاء حساب
                  </Link>
                </div>
              )}
            </nav>
          </div>
        </div>
      )}

      <main className="flex-1 container-responsive py-6 md:py-8">{children}</main>

      <footer className="border-t border-green-100/50 py-6 mt-8 bg-white/50 backdrop-blur-sm">
        <div className="container-responsive text-center text-sm text-gray-500">
          <p>حافظ — رفيقك في حفظ القرآن الكريم</p>
          <p className="text-xs mt-1 text-gray-400">{new Date().getFullYear()} · جميع الحقوق محفوظة</p>
        </div>
      </footer>
    </div>
  );
}