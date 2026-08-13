"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import type { ReactNode } from "react";

const NAV = [
  { href: "/", label: "الرئيسية" },
  { href: "/mushaf", label: "المصحف" },
  { href: "/memorize", label: "الحفظ" },
  { href: "/universe", label: "كون القرآن" },
  { href: "/achievements", label: "إنجازاتي" },
];

const MOBILE = [
  { href: "/", label: "الرئيسية", icon: "home" },
  { href: "/mushaf", label: "المصحف", icon: "quran" },
  { href: "/memorize", label: "الحفظ", icon: "book" },
  { href: "/universe", label: "الكون", icon: "stars" },
  { href: "/achievements", label: "إنجازاتي", icon: "trophy" },
];

function Icon({ name, active }: { name: string; active: boolean }) {
  const c = active ? "#b8902f" : "#9a948880";
  const stroke = active ? "#b8902f" : "#9a9488";
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
    default:
      return null;
  }
}

export function SiteChrome({ children, userName }: { children: ReactNode; userName: string | null }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.refresh();
    router.push("/");
  };

  return (
    <>
      <header className="sticky top-0 z-50 border-b hairline bg-cream-50/85 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3">
          <Link href="/" className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl card-warm">
              <span className="font-arabic text-lg gold-text">ح</span>
            </span>
            <span className="font-display text-xl font-bold gold-text">حافظ</span>
          </Link>

          <nav className="hidden items-center gap-1 lg:flex">
            {NAV.map((item) => {
              const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-lg px-4 py-2 text-sm transition ${
                    active ? "card-warm text-gold-600" : "text-ink-700 hover:bg-cream-200"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            {userName ? (
              <div className="hidden items-center gap-2 sm:flex">
                <span className="flex items-center gap-2 rounded-xl card px-3 py-2 text-sm text-ink-700">
                  <span className="grid h-6 w-6 place-items-center rounded-full bg-emerald-700 text-xs text-white">{userName.charAt(0)}</span>
                  {userName}
                </span>
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

      <main className="mx-auto w-full max-w-7xl px-5 pb-28 pt-6 lg:pb-12">{children}</main>

      <nav className="fixed inset-x-0 bottom-0 z-50 border-t hairline bg-cream-50/95 backdrop-blur lg:hidden">
        <div className="mx-auto flex max-w-md items-stretch justify-between px-2 py-1.5">
          {MOBILE.map((item) => {
            const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
            return (
              <Link key={item.href} href={item.href} className="flex flex-1 flex-col items-center gap-1 rounded-lg py-1.5">
                <Icon name={item.icon} active={active} />
                <span className={`text-[10px] ${active ? "text-gold-600" : "text-ink-500"}`}>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
