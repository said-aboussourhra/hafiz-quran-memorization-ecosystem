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

  // ✅ تحسين حجم النص ليكون أكثر توازناً
  const textSize = {
    dua: isSmall ? "text-base" : isMedium ? "text-lg" : "text-xl",
    name: isSmall ? "text-lg" : isMedium ? "text-xl" : "text-2xl",
    surah: isSmall ? "text-xs" : isMedium ? "text-sm" : "text-base",
    desc: isSmall ? "text-[10px]" : isMedium ? "text-xs" : "text-sm",
    source: isSmall ? "text-[8px]" : isMedium ? "text-[10px]" : "text-xs",
  };

  // ✅ تحسين الهوامش لتكون مناسبة للجميع
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
      className={`achievement-card ${padding} relative mx-auto w-full`}
      style={{ 
        minHeight: isSmall ? "260px" : isMedium ? "320px" : "380px",
        maxWidth: "100%",
        width: "100%",
      }}
    >
      {/* ✅ خلفية محسنة */}
      <div className="absolute inset-0 bg-white/95 backdrop-blur-sm rounded-2xl sm:rounded-3xl border-2 border-gold-500/30 shadow-xl" />
      
      {/* ✅ إطار داخلي محسن */}
      <div className="absolute inset-2 sm:inset-3 rounded-xl sm:rounded-2xl border border-gold-500/20 pointer-events-none" />
      
      {/* ✅ زخارف - تظهر فقط على الشاشات الكبيرة */}
      {!isSmall && !isMedium && (
        <>
          <div className="absolute top-3 right-3 text-gold-500/10 text-3xl font-arabic">﷽</div>
          <div className="absolute bottom-3 left-3 text-gold-500/10 text-3xl font-arabic">﷽</div>
        </>
      )}
      
      <div className="relative z-10 text-center h-full flex flex-col justify-between">
        {/* البسملة */}
        <div className="mb-1">
          <p className={`font-arabic ${isSmall ? "text-[8px]" : "text-[10px]"} text-ink-500`}>
            بسم الله الرحمن الرحيم
          </p>
        </div>

        {/* ✅ الدعاء - حجم مناسب */}
        <div className="mb-1">
          <p className={`font-arabic ${textSize.dua} font-bold text-emerald-700 leading-relaxed`}>
            {displayDua}
          </p>
        </div>

        {/* السورة والآية */}
        <div className={`flex items-center justify-center gap-1 ${textSize.surah} text-ink-700`}>
          <span>سورة {displaySurah}</span>
          <span className="text-gold-500">·</span>
          <span>{displayVerse}</span>
        </div>

        <div className="divider-ornament my-1 sm:my-2 w-2/3 mx-auto" />

        {/* ✅ النص الأساسي */}
        <div className="space-y-1 flex-1">
          <p className={`${textSize.desc} text-ink-700 leading-relaxed`}>
            {displayDescription}
          </p>
          {name && (
            <h2 className={`font-display ${textSize.name} font-bold text-emerald-700`}>
              {name}
            </h2>
          )}
        </div>

        <div className="divider-ornament my-1 sm:my-2 w-2/3 mx-auto" />

        {/* ✅ النسبة */}
        {percentage && (
          <div className="flex items-center justify-center gap-1">
            <span className={`font-bold text-emerald-600 ${isSmall ? "text-base" : "text-xl"}`}>
              {percentage}%
            </span>
            <span className={`${isSmall ? "text-[8px]" : "text-[10px]"} text-ink-500`}>
              نسبة إتقان
            </span>
          </div>
        )}

        {/* ✅ المصدر */}
        {source && (
          <div className={`mt-1 sm:mt-2 p-1.5 sm:p-2 bg-cream-50/80 rounded-xl border border-gold-500/10`}>
            <p className={`font-arabic leading-relaxed text-ink-700 ${isSmall ? "text-[8px]" : "text-[10px]"}`}>
              {displaySource}
            </p>
          </div>
        )}

        {date && (
          <p className={`${isSmall ? "text-[8px]" : "text-[10px]"} text-ink-500 mt-1`}>
            {date}
          </p>
        )}

        {/* ✅ الشعار */}
        <div className="mt-2 flex items-center justify-center gap-1">
          <Image 
            src="/HAFIZ.jpg" 
            alt="حافظ" 
            width={isSmall ? 18 : isMedium ? 22 : 26} 
            height={isSmall ? 18 : isMedium ? 22 : 26} 
            className={`rounded-full object-cover ${isSmall ? "w-[18px] h-[18px]" : "w-[22px] h-[22px]"}`} 
          />
          <span className={`font-bold text-ink-500 ${isSmall ? "text-[7px]" : "text-[9px]"}`}>
            حافظ
          </span>
        </div>
      </div>
    </div>
  );
}