"use client";

import Image from "next/image";

interface AchievementCardProps {
  name: string;
  surah: string;
  verses: number;
  percentage: number;
  date?: string;
}

export function AchievementCard({ name, surah, verses, percentage, date }: AchievementCardProps) {
  return (
    <div className="achievement-card relative max-w-md mx-auto p-8 md:p-10 lg:p-12">
      {/* الخلفية */}
      <div className="absolute inset-0 bg-white/90 backdrop-blur-sm rounded-3xl border-2 border-gold-500/30 shadow-2xl" />
      
      {/* الإطار الداخلي */}
      <div className="absolute inset-3 rounded-2xl border border-gold-500/20 pointer-events-none" />
      
      {/* الزخارف */}
      <div className="absolute top-4 right-4 text-gold-500/10 text-6xl font-arabic">﷽</div>
      <div className="absolute bottom-4 left-4 text-gold-500/10 text-6xl font-arabic">﷽</div>
      
      <div className="relative z-10 text-center">
        {/* البسملة */}
        <div className="mb-4">
          <p className="font-arabic text-sm text-ink-500">بسم الله الرحمن الرحيم</p>
        </div>

        {/* العنوان */}
        <div className="flex items-center justify-center gap-2 mb-2">
          <span className="text-gold-500">✦</span>
          <h3 className="font-display text-lg md:text-xl font-bold text-ink-900">شهادة تقدير</h3>
          <span className="text-gold-500">✦</span>
        </div>
        <p className="text-xs text-ink-500 tracking-wider mb-6">❤️ إتمام حفظ</p>

        <div className="divider-ornament my-4" />

        {/* النص الأساسي */}
        <p className="text-sm text-ink-700 mb-2">نشهد أن الأخ/الأخت</p>
        <h2 className="font-display text-2xl md:text-3xl lg:text-4xl font-bold text-emerald-700 mb-4">
          {name}
        </h2>

        <div className="divider-ornament my-4" />

        <p className="text-sm text-ink-700 leading-relaxed">
          قد أتمّ بفضل الله حفظ
          <br />
          <span className="font-display text-xl md:text-2xl font-bold gold-text">
            سورة {surah}
          </span>
        </p>

        <div className="mt-4 flex items-center justify-center gap-2">
          <span className="text-2xl font-bold text-emerald-600">{percentage}%</span>
          <span className="text-sm text-ink-500">نسبة إتقان</span>
        </div>

        <div className="divider-ornament my-4" />

        {/* الحديث */}
        <div className="mt-4 p-4 bg-cream-50/50 rounded-xl">
          <p className="text-sm text-ink-700 font-arabic leading-relaxed">
            "خَيْرُكُمْ مَنْ تَعَلَّمَ الْقُرْآنَ وَعَلَّمَهُ"
          </p>
          <p className="text-xs text-ink-500 mt-1">رواه البخاري</p>
        </div>

        {/* التاريخ */}
        {date && (
          <p className="text-xs text-ink-500 mt-4">{date}</p>
        )}

        {/* الشعار */}
        <div className="mt-6 flex items-center justify-center gap-2">
          <Image 
            src="/HAFIZ.jpg" 
            alt="حافظ" 
            width={30} 
            height={30}
            className="rounded-full w-8 h-8 object-cover"
          />
          <span className="text-xs font-bold text-ink-500">حافظ</span>
        </div>
      </div>
    </div>
  );
}