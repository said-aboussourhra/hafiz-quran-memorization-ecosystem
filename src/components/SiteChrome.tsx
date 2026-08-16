"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import type { ReactNode } from "react";
import { ScrollTop } from "@/components/ScrollTop";

const NAV = [
  { href: "/", label: "الرئيسية" },
  { href: "/mushaf", label: "المصحف" },
  { href: "/memorize", label: "الحفظ" },
  { href: "/review", label: "المراجعة" },
  { href: "/plan", label: "خطة الحفظ" },
  { href: "/search", label: "بحث" },
  { href: "/names", label: "أسماء الله" },
  { href: "/adhkar", label: "الأذكار" },
  { href: "/universe", label: "كون القرآن" },
  { href: "/dashboard", label: "حسابي" },
];

const MOBILE = [
  { href: "/", label: "الرئيسية", icon: "home" },
  { href: "/mushaf", label: "المصحف", icon: "quran" },
  { href: "/memorize", label: "الحفظ", icon: "book" },
  { href: "/review", label: "المراجعة", icon: "search" },
  { href: "/dashboard", label: "حسابي", icon: "trophy" },
];

function Icon({ name, active }: { name: string; active: boolean }) {
  const c = active ? "#059669" : "#7c9b9880";
  const stroke = active ? "#059669" : "#7c9b98";
  const common = { width: 22, height: 22, fill: "none", stroke, strokeWidth: 1.7, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  switch (name) {
    case "home":
      return <svg {...common} viewBox="0 0 24 24"><path d="M3 10.5 12 3l9 7.5" /><path d="M5 9.5V21h14V9.5" /></svg>;
    case "book":
      return <svg {...common} viewBox="0 0 24 24"><path d="M4 5a2 2 0 0 1 2-2h12v16H6a2 2 0 0 0-2 2z" /><path d="M18 17H6" /></svg>;
    case "quran":
      return <svg {...common} viewBox="0 0 24 24"><path d="M12 6c-2-2-5-2-7-1v13c2-1 5-1 7 1 2-2 5-2 7-1V5c-2-1-5-1-7 1z" /><path d="M12 6v13" /></svg>;
    case "stars":
      return <svg {...common} viewBox="0 0 24 24"><path d="M12 3l1.8 4.6L18 9l-4.2 1.4L12 15l-1.8-4.6L6 9l4.2-1.4z" /><circle cx="18" cy="17" r="1" fill={c} /><circle cx="6" cy="16" r="1" fill={c} /></svg>;
    case "trophy":
      return <svg {...common} viewBox="0 0 24 24"><path d="M7 4h10v4a5 5 0 0 1-10 0z" /><path d="M5 5H3v2a3 3 0 0 0 3 3M19 5h2v2a3 3 0 0 1-3 3M9 20h6M12 13v7" /></svg>;
    case "search":
      return <svg {...common} viewBox="0 0 24 24"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>;
    default:
      return null;
  }
}

export function SiteChrome({ children, userName }: { children: ReactNode; userName: string | null }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.assign("/");
  };

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-emerald-500/15 bg-white/80 shadow-[0_4px_20px_-12px_rgba(37,99,235,0.25)] backdrop-blur-xl">
        <div className="h-1 w-full" style={{ background: "linear-gradient(90deg, #10b981, #059669, #3b82f6)" }} />
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3">
          <Link href="/" className="group flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-2xl text-white shadow-md transition group-hover:scale-105" style={{ background: "linear-gradient(135deg,#10b981,#3b82f6)" }}>
              <span className="text-xl" style={{ fontFamily: "var(--font-quran)" }}>ح</span>
            </span>
            <span className="flex flex-col leading-none">
              <span className="font-display text-2xl font-black shine-text">حافظ</span>
              <span className="mt-0.5 text-[10px] font-semibold tracking-[0.2em] text-ink-500">رحلتك مع القرآن</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-0.5 lg:flex">
            {NAV.map((item) => {
              const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`relative rounded-xl px-3.5 py-2 text-sm font-semibold transition ${
                    active ? "text-emerald-700" : "text-ink-700 hover:bg-emerald-50 hover:text-emerald-700"
                  }`}
                >
                  {item.label}
                  {active && (
                    <span className="absolute inset-x-2 -bottom-0.5 h-[3px] rounded-full" style={{ background: "linear-gradient(90deg,#10b981,#3b82f6)" }} />
                  )}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            <Link
              href="/developer"
              aria-label="المطوّر"
              title="عن المطوّر"
              className="grid h-10 w-10 place-items-center rounded-full text-sm font-black text-white shadow-md transition hover:scale-105"
              style={{ background: "linear-gradient(135deg,#10b981,#3b82f6)" }}
            >
              S
            </Link>
            {userName ? (
              <div className="hidden items-center gap-2 sm:flex">
                <Link href="/dashboard" className="flex items-center gap-2 rounded-xl card px-3 py-2 text-sm text-ink-700 transition hover:bg-cream-100">
                  <span className="grid h-6 w-6 place-items-center rounded-full bg-emerald-700 text-xs text-white">{userName.charAt(0)}</span>
                  {userName}
                </Link>
                <button onClick={logout} className="rounded-xl btn-ghost px-3 py-2 text-sm">خروج</button>
              </div>
            ) : (
              <div className="hidden items-center gap-2 sm:flex">
                <Link href="/login" className="rounded-xl btn-ghost px-4 py-2 text-sm">دخول</Link>
                <Link href="/signup" className="rounded-xl btn-primary px-4 py-2 text-sm font-semibold">إنشاء حساب</Link>
              </div>
            )}
            <button
              onClick={() => setOpen((v) => !v)}
              className="grid h-10 w-10 place-items-center rounded-lg card lg:hidden"
              aria-label="القائمة"
            >
              <svg width="20" height="20" fill="none" stroke="#4a463e" strokeWidth="1.8" strokeLinecap="round">
                <path d="M3 6h14M3 10h14M3 14h14" />
              </svg>
            </button>
          </div>
        </div>

        {open && (
          <div className="border-t hairline px-5 py-3 lg:hidden">
            <div className="grid grid-cols-2 gap-2">
              {NAV.map((item) => (
                <Link key={item.href} href={item.href} onClick={() => setOpen(false)} className="rounded-lg card px-3 py-2.5 text-sm text-ink-700">
                  {item.label}
                </Link>
              ))}
            </div>
            <div className="mt-3 flex gap-2">
              {userName ? (
                <button onClick={() => { setOpen(false); logout(); }} className="flex-1 rounded-lg btn-ghost px-3 py-2.5 text-sm">تسجيل الخروج ({userName})</button>
              ) : (
                <>
                  <Link href="/login" onClick={() => setOpen(false)} className="flex-1 rounded-lg btn-ghost px-3 py-2.5 text-center text-sm">دخول</Link>
                  <Link href="/signup" onClick={() => setOpen(false)} className="flex-1 rounded-lg btn-primary px-3 py-2.5 text-center text-sm font-semibold">إنشاء حساب</Link>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      <main key={pathname} className="page-enter mx-auto w-full max-w-7xl px-5 pb-8 pt-6">{children}</main>

      {/* Luxurious footer */}
      <footer className="relative mt-8 overflow-hidden border-t hairline bg-white/60 pb-28 pt-12 backdrop-blur lg:pb-12">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-1" style={{ background: "linear-gradient(90deg,#10b981,#059669,#3b82f6)" }} />
        <div className="mx-auto grid max-w-7xl gap-8 px-5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="sm:col-span-2 lg:col-span-1">
            <Link href="/" className="flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-xl text-white shadow-md" style={{ background: "linear-gradient(135deg,#10b981,#3b82f6)" }}>
                <span className="text-lg" style={{ fontFamily: "var(--font-quran)" }}>ح</span>
              </span>
              <span className="font-display text-2xl font-bold shine-text">حافظ</span>
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-ink-500">
              منصة عالمية لحفظ القرآن الكريم: مصحف كامل بالتفسير الميسّر، وطرق حفظ ذكية، وتلاوات لأشهر القرّاء.
            </p>
          </div>

          <div>
            <h4 className="font-display text-sm font-bold text-ink-900">القرآن</h4>
            <ul className="mt-3 space-y-2 text-sm text-ink-500">
              <li><Link href="/mushaf" className="transition hover:text-emerald-700">المصحف</Link></li>
              <li><Link href="/memorize" className="transition hover:text-emerald-700">الحفظ</Link></li>
              <li><Link href="/review" className="transition hover:text-emerald-700">المراجعة</Link></li>
              <li><Link href="/search" className="transition hover:text-emerald-700">بحث</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-display text-sm font-bold text-ink-900">المزيد</h4>
            <ul className="mt-3 space-y-2 text-sm text-ink-500">
              <li><Link href="/names" className="transition hover:text-emerald-700">أسماء الله الحسنى</Link></li>
              <li><Link href="/adhkar" className="transition hover:text-emerald-700">الأذكار</Link></li>
              <li><Link href="/plan" className="transition hover:text-emerald-700">خطة الحفظ</Link></li>
              <li><Link href="/universe" className="transition hover:text-emerald-700">كون القرآن</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-display text-sm font-bold text-ink-900">المطوّر</h4>
            <Link href="/developer" className="mt-3 flex items-center gap-3 rounded-2xl card p-3 transition hover:-translate-y-0.5 hover:shadow-md">
              <span className="grid h-10 w-10 place-items-center rounded-xl text-lg font-bold text-white" style={{ background: "linear-gradient(135deg,#10b981,#3b82f6)" }}>S</span>
              <div>
                <div className="font-display text-sm font-bold shine-text">SAID</div>
                <div className="text-[11px] text-ink-500">تواصل معي ←</div>
              </div>
            </Link>
            <div className="mt-3 flex gap-2">
              <a href="https://wa.me/212719274535" target="_blank" rel="noopener noreferrer" aria-label="واتساب" className="grid h-9 w-9 place-items-center rounded-lg card text-sm transition hover:-translate-y-0.5">💬</a>
              <a href="mailto:s01said@outlook.fr" aria-label="البريد" className="grid h-9 w-9 place-items-center rounded-lg card text-sm transition hover:-translate-y-0.5">✉️</a>
              <a href="https://instagram.com/s_a_id_9" target="_blank" rel="noopener noreferrer" aria-label="إنستغرام" className="grid h-9 w-9 place-items-center rounded-lg card text-sm transition hover:-translate-y-0.5">📸</a>
            </div>
          </div>
        </div>

        <div className="mx-auto mt-10 max-w-7xl px-5">
          <div className="divider-ornament" />
          <p className="mt-5 text-center text-xs text-ink-500">
            حافظ © {new Date().getFullYear().toLocaleString("ar-EG", { useGrouping: false })} — طوّره بحبٍّ <span className="font-bold shine-text">SAID</span> · لخدمة كتاب الله
          </p>
        </div>
      </footer>

      <ScrollTop />

      <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-emerald-500/15 bg-white/90 shadow-[0_-4px_20px_-12px_rgba(37,99,235,0.3)] backdrop-blur-xl lg:hidden">
        <div className="mx-auto flex max-w-md items-stretch justify-between px-2 py-1.5">
          {MOBILE.map((item) => {
            const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
            return (
              <Link key={item.href} href={item.href} className="flex flex-1 flex-col items-center gap-1 rounded-xl py-1.5 transition">
                <span className={`grid h-9 w-14 place-items-center rounded-full transition ${active ? "" : ""}`} style={active ? { background: "linear-gradient(135deg,rgba(16,185,129,0.15),rgba(59,130,246,0.15))" } : undefined}>
                  <Icon name={item.icon} active={active} />
                </span>
                <span className={`text-[10px] font-semibold ${active ? "text-emerald-700" : "text-ink-500"}`}>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
