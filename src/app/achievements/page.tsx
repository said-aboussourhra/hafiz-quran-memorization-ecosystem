import { AchievementCard } from "@/components/AchievementCard";
import { getCurrentUser } from "@/lib/auth";

export default async function AchievementsPage() {
  const user = await getCurrentUser();

  const achievements = [
    {
      name: user?.name || "عبد الله",
      surah: "آل عمران",
      verseNumber: 173,
      percentage: 100,
      date: "20 أغسطس 2026",
      dua: "حسبنا الله ونعم الوكيل",
      description: "كفانا الله ونعم الميتوك عليم",
      source: "كلمة قالها إبراهيم والنبي ﷺ عند الله",
    },
    {
      name: user?.name || "عبد الله",
      surah: "الإخلاص",
      verseNumber: 4,
      percentage: 100,
      dua: "وَلَقَدْ يَسَّرْنَا الْقُرْآنَ لِلذِّكْرِ",
      description: "أتمّ حفظ سورة الإخلاص",
      source: "خيركم من تعلم القرآن وعلمه",
    },
    {
      name: user?.name || "عبد الله",
      surah: "الفاتحة",
      verseNumber: 7,
      percentage: 95,
      dua: "اهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ",
      description: "أتمّ حفظ سورة الفاتحة",
      source: "اللهم اجعل القرآن ربيع قلوبنا",
    },
    {
      name: user?.name || "عبد الله",
      surah: "الفلق",
      verseNumber: 5,
      percentage: 90,
      dua: "وَ مِن شَرِّ حَاسِدٍ إِذَا حَسَدَ",
      description: "أتمّ حفظ سورة الفلق",
      source: "قل أعوذ برب الفلق",
    },
    {
      name: user?.name || "عبد الله",
      surah: "الناس",
      verseNumber: 6,
      percentage: 95,
      dua: "مِنَ الْجِنَّةِ وَ النَّاسِ",
      description: "أتمّ حفظ سورة الناس",
      source: "قل أعوذ برب الناس",
    },
    {
      name: user?.name || "عبد الله",
      surah: "الكوثر",
      verseNumber: 3,
      percentage: 100,
      dua: "إِنَّ شَانِئَكَ هُوَ الْأَبْتَرُ",
      description: "أتمّ حفظ سورة الكوثر",
      source: "إنا أعطيناك الكوثر",
    },
  ];

  return (
    <div className="py-4 sm:py-8 space-y-6 sm:space-y-8 container-responsive">
      <div className="text-center">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold gold-text">🏆 إنجازاتي</h1>
        <p className="text-sm sm:text-base text-ink-500 mt-2">بطاقات التقدير والإنجازات في رحلة حفظ القرآن</p>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {achievements.map((achievement, index) => (
          <AchievementCard
            key={index}
            {...achievement}
            variant={index === 0 ? "default" : "compact"}
          />
        ))}
      </div>
    </div>
  );
}