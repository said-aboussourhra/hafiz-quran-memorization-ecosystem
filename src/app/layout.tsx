import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Amiri, Amiri_Quran, Reem_Kufi, Tajawal } from "next/font/google";
import "./globals.css";
import { SiteChrome } from "@/components/SiteChrome";
import { Intro } from "@/components/Intro";
import { getCurrentUser } from "@/lib/auth";

const amiri = Amiri({
  subsets: ["arabic"],
  weight: ["400", "700"],
  variable: "--font-arabic",
  display: "swap",
});

const amiriQuran = Amiri_Quran({
  subsets: ["arabic"],
  weight: ["400"],
  variable: "--font-quran",
  display: "swap",
});

const reem = Reem_Kufi({
  subsets: ["arabic"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-display",
  display: "swap",
});

const tajawal = Tajawal({
  subsets: ["arabic"],
  weight: ["300", "400", "500", "700"],
  variable: "--font-ui",
  display: "swap",
});

export const metadata: Metadata = {
  title: "حافظ — رحلتك مع القرآن الكريم",
  description:
    "حافظ منصة حفظ القرآن الكريم: المصحف كاملاً بالرسم العثماني مع التفسير الميسر، وطرق حفظ ذهنية واختبارات ذكية.",
  // إضافات PWA
  manifest: "/manifest.json",
  themeColor: "#b8902f",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "حافظ",
  },
  icons: {
    apple: "/icons/icon-192.png",
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  },
  // تحسينات SEO
  openGraph: {
    title: "حافظ — رحلتك مع القرآن الكريم",
    description: "منصة حفظ القرآن الكريم مع التفسير والاختبارات الذكية",
    type: "website",
    url: "https://hafiz-quran.vercel.app",
    images: [
      {
        url: "/icons/icon-512.png",
        width: 512,
        height: 512,
        alt: "حافظ - تطبيق حفظ القرآن",
      },
    ],
  },
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser();
  return (
    <html lang="ar" dir="rtl" className={`${amiri.variable} ${amiriQuran.variable} ${reem.variable} ${tajawal.variable}`}>
      <head>
        {/* PWA Meta Tags */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-touch-fullscreen" content="yes" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        <link rel="apple-touch-icon" sizes="192x192" href="/icons/icon-192.png" />
        <link rel="apple-touch-icon" sizes="512x512" href="/icons/icon-512.png" />
        {/* Service Worker Registration */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                navigator.serviceWorker.register('/sw.js')
                  .then(() => console.log('✅ Service Worker registered'))
                  .catch((err) => console.log('❌ Service Worker error:', err));
              }
            `,
          }}
        />
      </head>
      <body className="min-h-screen antialiased">
        <Intro />
        <SiteChrome userName={user?.name ?? null}>{children}</SiteChrome>
      </body>
    </html>
  );
}