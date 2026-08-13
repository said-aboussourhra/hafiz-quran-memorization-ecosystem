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
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser();
  return (
    <html lang="ar" dir="rtl" className={`${amiri.variable} ${amiriQuran.variable} ${reem.variable} ${tajawal.variable}`}>
      <body className="min-h-screen antialiased">
        <Intro />
        <SiteChrome userName={user?.name ?? null}>{children}</SiteChrome>
      </body>
    </html>
  );
}
