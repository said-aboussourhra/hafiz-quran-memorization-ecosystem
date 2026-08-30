import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { PWARegister } from "@/components/PWARegister";
import { IdleDhikr } from "@/components/IdleDhikr";
import { MagneticCards } from "@/components/MagneticCards";
import { AdminLoginProvider } from "@/components/AdminLoginProvider";

import "./globals.css";
import "./fonts.css";
import { SiteChrome } from "@/components/SiteChrome";
import { Intro } from "@/components/Intro";
import { getCurrentUser } from "@/lib/auth";

export const metadata: Metadata = {
  title: "حافظ — رحلتك مع القرآن الكريم",
  description:
    "حافظ منصة حفظ القرآن الكريم: المصحف كاملاً بالرسم العثماني مع التفسير الميسر، وطرق حفظ ذهنية واختبارات ذكية.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "حافظ",
  },
  icons: {
    icon: [{ url: "/icon-192.png", sizes: "192x192", type: "image/png" }],
    apple: [{ url: "/icon-512.png", sizes: "512x512", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#059669",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

/**
 * Fonts: we expose the same CSS variable contract the app already uses
 * (--font-arabic / --font-quran / --font-display / --font-ui …).
 *
 * The Arabic web fonts are loaded progressively via a <link> to Google
 * Fonts CDN (added in <head> below). System Arabic serif/sans stacks are
 * used as fallbacks, so the UI NEVER depends on a font network fetch at
 * build or runtime — this keeps `next build` hermetic and resilient.
 */
const fontVars =
  "font-arabic font-quran font-quran-kfgqpc font-quran-naskh font-quran-markazi font-display font-ui";

export default async function RootLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser();
  return (
    <html lang="ar" dir="rtl" className={fontVars}>
      <head>
        {/* Progressive enhancement: load real Arabic web fonts from CDN.
            If the network is unavailable (offline / restricted build env),
            the system fallbacks defined in fonts.css take over seamlessly. */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&family=Amiri+Quran&family=Scheherazade+New:wght@400;700&family=Noto+Naskh+Arabic:wght@400;700&family=Markazi+Text:wght@400;500;600;700&family=Reem+Kufi:wght@400;500;600;700&family=Tajawal:wght@300;400;500;700&display=swap"
        />
      </head>
      <body className="min-h-screen antialiased">
        <PWARegister />
        <MagneticCards />
        <AdminLoginProvider>
          <Intro />
          <SiteChrome userName={user?.name ?? null}>{children}</SiteChrome>
        </AdminLoginProvider>
        <IdleDhikr name={user?.name ?? null} />
      </body>
    </html>
  );
}
