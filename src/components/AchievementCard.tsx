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
  const [screenSize, setScreenSize] = useState<"small" | "medium" | "large">("large");

  useEffect(() => {
    const checkScreen = () => {
      const width = window.innerWidth;
      if (width < 400) setScreenSize("small");
      else if (width < 640) setScreenSize("medium");
      else setScreenSize("large");
    };
    checkScreen();
    window.addEventListener("resize", checkScreen);
    return () => window.removeEventListener("resize", checkScreen);
  }, []);

  const isSmall = screenSize === "small";
  const isMedium = screenSize === "medium";

  const textSize = {
    dua: isSmall ? "text-lg" : isMedium ? "text-xl" : "text-2xl",
    name: isSmall ? "text-xl" : isMedium ? "text-2xl" : "text-3xl",
    surah: isSmall ? "text-sm" : isMedium ? "text-base" : "text-lg",
    desc: isSmall ? "text-xs" : isMedium ? "text-sm" : "text-base",
    source: isSmall ? "text-[10px]" : isMedium ? "text-xs" : "text-sm",
  };

  const padding = isSmall ? "p-3" : isMedium ? "p-4" : "p-6";

  const displayTitle = title || "شهادة تقدير";
  const displaySubtitle = subtitle || "❤️ إتمام حفظ";
  const displayDescription = description || "نشهد أن الأخ/الأخت قد أتمّ بفضل الله حفظ";
  const displaySurah = surah || "آل عمران";
  const displayVerse = verseNumber || 173;
  const displayDua = dua || "حسبنا الله ونعم الوكيل";
  const displaySource = source || "كلمة قالها إبراهيم والنبي ﷺ عند الله";

  return (
    <div 
      className={`achievement-card ${padding} relative mx-auto w-full max-w-md`}
      style={{ 
        minHeight: isSmall ? "280px" : isMedium ? "340px" : "400px",
        maxWidth: "100%",
      }}
    >
      {/* الخلفية */}
      <div className="absolute inset-0 bg-white/95 backdrop-blur-sm rounded-2xl sm:rounded-3xl border-2 border-gold-500/30 shadow-xl" />
      
      {/* الإطار الداخلي */}
      <div className="absolute inset-2 sm:inset-3 rounded-xl sm:rounded-2xl border border-gold-500/20 pointer-events-none" />
      
      {/* الزخارف */}
      {!isSmall && !isMedium && (
        <>
          <div className="absolute top-3 right-3 text-gold-500/10 text-4xl font-arabic">﷽</div>
          <div className="absolute bottom-3 left-3 text-gold-500/10 text-4xl font-arabic">﷽</div>
        </>
      )}
      
      <div className="relative z-10 text-center h-full flex flex-col justify-between">
        {/* البسملة */}
        <div className="mb-1 sm:mb-2">
          <p className={`font-arabic ${isSmall ? "text-[10px]" : "text-xs"} text-ink-500`}>بسم الله الرحمن الرحيم</p>
        </div>

        {/* الدعاء */}
        <div className="mb-1">
          <p className={`font-arabic ${textSize.dua} font-bold text-emerald-700 leading-relaxed`}>{displayDua}</p>
        </div>

        {/* السورة والآية */}
        <div className={`flex items-center justify-center gap-1 ${textSize.surah} text-ink-700`}>
          <span>سورة {displaySurah}</span>
          <span className="text-gold-500">·</span>
          <span>{displayVerse}</span>
        </div>

        <div className="divider-ornament my-1 sm:my-2 w-3/4 mx-auto" />

        {/* النص الأساسي */}
        <div className="space-y-1 flex-1">
          <p className={`${textSize.desc} text-ink-700 leading-relaxed`}>{displayDescription}</p>
          {name && (
            <h2 className={`font-display ${textSize.name} font-bold text-emerald-700`}>{name}</h2>
          )}
        </div>

        <div className="divider-ornament my-1 sm:my-2 w-3/4 mx-auto" />

        {/* النسبة */}
        {percentage && (
          <div className="flex items-center justify-center gap-1 sm:gap-2">
            <span className={`font-bold text-emerald-600 ${isSmall ? "text-lg" : "text-2xl"}`}>{percentage}%</span>
            <span className={`${isSmall ? "text-[10px]" : "text-xs"} text-ink-500`}>نسبة إتقان</span>
          </div>
        )}

        {/* المصدر */}
        {source && (
          <div className={`mt-1 sm:mt-3 p-2 bg-cream-50/80 rounded-xl border border-gold-500/10`}>
            <p className={`font-arabic leading-relaxed text-ink-700 ${isSmall ? "text-[10px]" : "text-xs"}`}>{displaySource}</p>
          </div>
        )}

        {date && <p className={`${isSmall ? "text-[9px]" : "text-xs"} text-ink-500 mt-1`}>{date}</p>}

        {/* الشعار */}
        <div className="mt-2 flex items-center justify-center gap-1 sm:gap-2">
          <Image src="/HAFIZ.jpg" alt="حافظ" width={isSmall ? 20 : isMedium ? 24 : 28} height={isSmall ? 20 : isMedium ? 24 : 28} className={`rounded-full object-cover ${isSmall ? "w-5 h-5" : "w-6 h-6"}`} />
          <span className={`font-bold text-ink-500 ${isSmall ? "text-[8px]" : "text-[10px]"}`}>حافظ</span>
        </div>
      </div>
    </div>
  );
}