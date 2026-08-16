export type IntroVerse = {
  text: string;
  source: string;
  audio: string; // everyayah SSSAAA code (Al-Dosari) — matches the FULL ayah text
};

// Each entry is a COMPLETE ayah whose text exactly matches its recitation audio.
export const INTRO_VERSES: IntroVerse[] = [
  { text: "وَلَقَدْ يَسَّرْنَا الْقُرْآنَ لِلذِّكْرِ فَهَلْ مِن مُّدَّكِرٍ", source: "سورة القمر · 17", audio: "054017" },
  { text: "الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ", source: "سورة الفاتحة · 2", audio: "001002" },
  { text: "فَإِنَّ مَعَ الْعُسْرِ يُسْرًا", source: "سورة الشرح · 5", audio: "094005" },
  { text: "إِنَّ مَعَ الْعُسْرِ يُسْرًا", source: "سورة الشرح · 6", audio: "094006" },
  { text: "وَلَلْآخِرَةُ خَيْرٌ لَّكَ مِنَ الْأُولَىٰ", source: "سورة الضحى · 4", audio: "093004" },
  { text: "الَّذِينَ آمَنُوا وَتَطْمَئِنُّ قُلُوبُهُم بِذِكْرِ اللَّهِ ۗ أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ", source: "سورة الرعد · 28", audio: "013028" },
];

export function pickIntroVerse(): IntroVerse {
  if (typeof window === "undefined") return INTRO_VERSES[0];
  let n = 0;
  try {
    n = parseInt(localStorage.getItem("hafiz_intro_verse_idx") || "0", 10);
    if (Number.isNaN(n)) n = 0;
    localStorage.setItem("hafiz_intro_verse_idx", String((n + 1) % INTRO_VERSES.length));
  } catch {
    n = Math.floor(Math.random() * INTRO_VERSES.length);
  }
  return INTRO_VERSES[n % INTRO_VERSES.length];
}
