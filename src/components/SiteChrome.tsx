"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";

interface SiteChromeProps {
  children: React.ReactNode;
  userName?: string | null;
}

const NAV_ITEMS = [
  { href: "/mushaf", label: "المصحف" },
  { href: "/memorize", label: "الحفظ" },
  { href: "/universe", label: "كون القرآن" },
  { href: "/achievements", label: "إنجازاتي" },
];

export function SiteChrome({ children, userName }: SiteChromeProps) {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // إغلاق القائمة عند تغيير الصفحة
  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  const isAuthPage = pathname === "/login" || pathname === "/signup";

  return (
    <div className="min-h-screen flex flex-col">
      {/* الشريط العلوي */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gold-500/20">
        <div className="container-responsive flex items-center justify-between h-16">
          {/* الشعار */}
          <Link href="/" className="flex items-center gap-2 font-display text-xl font-bold gold-text">
            <span className="text-2xl">۞</span>
            حافظ
          </Link>

          {/* التنقل - سطح المكتب */}
          <nav className="hidden md:flex items-center gap-1">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                  pathname === item.href
                    ? "bg-gold-500/10 text-gold-600"
                    : "text-ink-700 hover:bg-cream-100"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* المستخدم / الأزرار */}
          <div className="flex items-center gap-3">
            {!isAuthPage && (
              <>
                {userName ? (
                  <span className="hidden sm:inline text-sm text-ink-700">
                    👋 {userName}
                  </span>
                ) : (
                  <>
                    <Link
                      href="/login"
                      className="hidden sm:inline text-sm text-ink-700 hover:text-gold-600 transition"
                    >
                      دخول
                    </Link>
                    <Link
                      href="/signup"
                      className="hidden sm:inline btn-primary px-4 py-1.5 rounded-full text-sm font-medium"
                    >
                      إنشاء حساب
                    </Link>
                  </>
                )}
              </>
            )}

            {/* زر القائمة للهواتف */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-cream-100 transition"
              aria-label={isMenuOpen ? "إغلاق القائمة" : "فتح القائمة"}
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </header>

      {/* القائمة الجانبية للهواتف */}
      {isClient && isMenuOpen && (
        <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm" onClick={() => setIsMenuOpen(false)}>
          <div
            className="absolute left-0 top-0 h-full w-72 bg-white shadow-xl p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <span className="font-display text-xl gold-text">حافظ</span>
              <button onClick={() => setIsMenuOpen(false)} className="p-2 rounded-lg hover:bg-cream-100">
                <X size={24} />
              </button>
            </div>

            <nav className="flex flex-col gap-2">
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-4 py-3 rounded-xl text-base font-medium transition ${
                    pathname === item.href
                      ? "bg-gold-500/10 text-gold-600"
                      : "text-ink-700 hover:bg-cream-100"
                  }`}
                >
                  {item.label}
                </Link>
              ))}

              {!userName && !isAuthPage && (
                <div className="mt-4 pt-4 border-t border-cream-200 flex flex-col gap-2">
                  <Link
                    href="/login"
                    className="px-4 py-3 rounded-xl text-center text-ink-700 hover:bg-cream-100"
                  >
                    دخول
                  </Link>
                  <Link
                    href="/signup"
                    className="px-4 py-3 rounded-xl text-center btn-primary font-medium"
                  >
                    إنشاء حساب
                  </Link>
                </div>
              )}
            </nav>
          </div>
        </div>
      )}

      {/* المحتوى الرئيسي */}
      <main className="flex-1 container-responsive py-6 md:py-8">
        {children}
      </main>

      {/* التذييل */}
      <footer className="border-t border-cream-200 py-6 mt-8">
        <div className="container-responsive text-center text-sm text-ink-500">
          <p>حافظ — رفيقك في حفظ القرآن الكريم</p>
          <p className="text-xs mt-1 text-ink-400">
            {new Date().getFullYear()} · جميع الحقوق محفوظة
          </p>
        </div>
      </footer>
    </div>
  );
}