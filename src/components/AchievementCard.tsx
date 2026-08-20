"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

interface AchievementCardProps {
  name?: string;
  surah?: string;
  verseNumber?: number;
  percentage?: number;
  date?: string;
  title?: string;
  subtitle?: string;
  description?: string;
  source?: string;
  dua?: string;
  variant?: "default" | "compact" | "full";
}

export function AchievementCard({
  name,
  surah,
  verseNumber,
  percentage,
  date,
  title = "شهادة تقدير",
  subtitle = "❤️ إتمام حفظ",
  description,
  source,
  dua,
  variant = "default",
}: AchievementCardProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 480);
      setIsTablet(window.innerWidth >= 480 && window.innerWidth < 768);
    };
    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  const displayTitle = title || "شهادة تقدير";
  const displaySubtitle = subtitle || "❤️ إتمام حفظ";
  const displayDescription = description || "نشهد أن الأخ/الأخت قد أتمّ بفضل الله حفظ";
  const displaySurah = surah || "آل عمران";
  const displayVerse = verseNumber || 173;
  const displayDua = dua || "حسبنا الله ونعم الوكيل";
  const displaySource = source || "كلمة قالها إبراهيم والنبي ﷺ عند الله";

  // تحديد حجم الخط بناءً على الجهاز
  const getFontSize = () => {
    if (isMobile) return "text-lg";
    if (isTablet) return "text-2xl";
    return "text-3xl";
  };

  const getDuaSize = () => {
    if (isMobile) return "text-xl";
    if (isTablet) return "text-2xl";
    return "text-3xl";
  };

  const getNameSize = () => {
    if (isMobile) return "text-xl";
    if (isTablet) return "text-2xl";
    return "text-3xl";
  };

  const getPadding = () => {
    if (isMobile) return "p-4";
    if (isTablet) return "p-6";
    return "p-8";
  };

  return (
    <div 
      className={`achievement-card relative max-w-full mx-auto ${getPadding()} ${variant === "compact" ? "max-w-sm" : "max-w-md"}`}
      style={{ 
        width: "100%",
        minHeight: isMobile ? "320px" : "400px",
      }}
    >
      {/* الخلفية */}
      <div className="absolute inset-0 bg-white/95 backdrop-blur-sm rounded-3xl border-2 border-gold-500/30 shadow-2xl" />
      
      {/* الإطار الداخلي */}
      <div className="absolute inset-2 sm:inset-3 rounded-2xl border border-gold-500/20 pointer-events-none" />
      
      {/* الزخارف - تختفي على الهواتف الصغيرة */}
      {!isMobile && (
        <>
          <div className="absolute top-4 right-4 text-gold-500/10 text-4xl sm:text-6xl font-arabic">﷽</div>
          <div className="absolute bottom-4 left-4 text-gold-500/10 text-4xl sm:text-6xl font-arabic">﷽</div>
        </>
      )}
      
      <div className="relative z-10 text-center h-full flex flex-col justify-between">
        {/* البسملة */}
        <div className="mb-2 sm:mb-3">
          <p className="font-arabic text-xs sm:text-sm text-ink-500">بسم الله الرحمن الرحيم</p>
        </div>

        {/* الدعاء الأساسي */}
        <div className="mb-1 sm:mb-2">
          <p className={`font-arabic ${getDuaSize()} font-bold text-emerald-700 leading-relaxed`}>
            {displayDua}
          </p>
        </div>

        {/* السورة والآية */}
        <div className="flex items-center justify-center gap-1 sm:gap-2 text-xs sm:text-sm text-ink-700">
          <span>سورة {displaySurah}</span>
          <span className="text-gold-500">·</span>
          <span>{displayVerse}</span>
        </div>

        <div className="divider-ornament my-2 sm:my-4" />

        {/* النص الأساسي */}
        <div className="space-y-1 sm:space-y-2 flex-1">
          <p className="text-xs sm:text-sm text-ink-700 leading-relaxed">
            {displayDescription}
          </p>
          {name && (
            <h2 className={`font-display ${getNameSize()} font-bold text-emerald-700`}>
              {name}
            </h2>
          )}
        </div>

        <div className="divider-ornament my-2 sm:my-4" />

        {/* النسبة */}
        {percentage && (
          <div className="flex items-center justify-center gap-1 sm:gap-2">
            <span className={`font-bold text-emerald-600 ${isMobile ? "text-xl" : "text-2xl"}`}>
              {percentage}%
            </span>
            <span className="text-[10px] sm:text-sm text-ink-500">نسبة إتقان</span>
          </div>
        )}

        {/* المصدر */}
        {source && (
          <div className={`mt-2 sm:mt-4 p-2 sm:p-4 bg-cream-50/80 rounded-xl border border-gold-500/10`}>
            <p className={`font-arabic leading-relaxed text-ink-700 ${isMobile ? "text-xs" : "text-sm"}`}>
              {displaySource}
            </p>
          </div>
        )}

        {date && (
          <p className="text-[10px] sm:text-xs text-ink-500 mt-2 sm:mt-4">{date}</p>
        )}

        {/* الشعار */}
        <div className="mt-3 sm:mt-6 flex items-center justify-center gap-1 sm:gap-2">
          <Image 
            src="/HAFIZ.jpg" 
            alt="حافظ" 
            width={isMobile ? 24 : 32} 
            height={isMobile ? 24 : 32}
            className={`rounded-full object-cover ${isMobile ? "w-6 h-6" : "w-8 h-8"}`}
          />
          <span className={`font-bold text-ink-500 ${isMobile ? "text-[10px]" : "text-xs"}`}>حافظ</span>
        </div>
      </div>
    </div>
  );
}