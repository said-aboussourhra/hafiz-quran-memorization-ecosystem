import { SURAHS, TOTAL_AYAHS } from "./surahs";

export type PlanPace = { id: string; label: string; ayahsPerDay: number; desc: string };

export const PACES: PlanPace[] = [
  { id: "light", label: "متأنٍّ", ayahsPerDay: 5, desc: "٥ آيات يومياً — مناسب للمبتدئين والمشغولين" },
  { id: "steady", label: "متوازن", ayahsPerDay: 10, desc: "١٠ آيات يومياً — إيقاع ثابت ومريح" },
  { id: "focused", label: "مجتهد", ayahsPerDay: 20, desc: "٢٠ آية يومياً — لمن أراد التقدّم بسرعة" },
  { id: "hafiz", label: "متفرّغ", ayahsPerDay: 40, desc: "٤٠ آية يومياً — لطلاب التحفيظ المتفرّغين" },
];

export function planForRemaining(remainingAyahs: number, ayahsPerDay: number) {
  const days = Math.max(1, Math.ceil(remainingAyahs / ayahsPerDay));
  const finishDate = new Date(Date.now() + days * 86400000);
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);
  let human: string;
  if (days <= 60) human = `${days.toLocaleString("ar-EG")} يوماً`;
  else if (years >= 1) human = `${years.toLocaleString("ar-EG")} سنة و${Math.round((days % 365) / 30).toLocaleString("ar-EG")} شهراً تقريباً`;
  else human = `${months.toLocaleString("ar-EG")} شهراً تقريباً`;
  return { days, finishDate, human };
}

// Suggest the next surahs to memorize (short surahs first, from the end of the Mushaf)
export function suggestedOrder(): number[] {
  // Classic hifz order: start from Juz Amma (short surahs) then move up.
  return [...SURAHS].sort((a, b) => b.number - a.number).map((s) => s.number);
}

export { TOTAL_AYAHS };

// The 30 Juz with their names and the surahs each mainly covers (by starting surah).
export const JUZ_INFO: { juz: number; name: string; startSurah: number }[] = [
  { juz: 1, name: "الم", startSurah: 1 },
  { juz: 2, name: "سيقول", startSurah: 2 },
  { juz: 3, name: "تلك الرسل", startSurah: 2 },
  { juz: 4, name: "لن تنالوا", startSurah: 3 },
  { juz: 5, name: "والمحصنات", startSurah: 4 },
  { juz: 6, name: "لا يحب الله", startSurah: 4 },
  { juz: 7, name: "وإذا سمعوا", startSurah: 5 },
  { juz: 8, name: "ولو أننا", startSurah: 6 },
  { juz: 9, name: "قال الملأ", startSurah: 7 },
  { juz: 10, name: "واعلموا", startSurah: 8 },
  { juz: 11, name: "يعتذرون", startSurah: 9 },
  { juz: 12, name: "وما من دابة", startSurah: 11 },
  { juz: 13, name: "وما أبرئ", startSurah: 12 },
  { juz: 14, name: "ربما", startSurah: 15 },
  { juz: 15, name: "سبحان الذي", startSurah: 17 },
  { juz: 16, name: "قال ألم", startSurah: 18 },
  { juz: 17, name: "اقترب للناس", startSurah: 21 },
  { juz: 18, name: "قد أفلح", startSurah: 23 },
  { juz: 19, name: "وقال الذين", startSurah: 25 },
  { juz: 20, name: "أمّن خلق", startSurah: 27 },
  { juz: 21, name: "اتل ما أوحي", startSurah: 29 },
  { juz: 22, name: "ومن يقنت", startSurah: 33 },
  { juz: 23, name: "وما لي", startSurah: 36 },
  { juz: 24, name: "فمن أظلم", startSurah: 39 },
  { juz: 25, name: "إليه يُردّ", startSurah: 41 },
  { juz: 26, name: "حم", startSurah: 46 },
  { juz: 27, name: "قال فما خطبكم", startSurah: 51 },
  { juz: 28, name: "قد سمع الله", startSurah: 58 },
  { juz: 29, name: "تبارك الذي", startSurah: 67 },
  { juz: 30, name: "عمّ", startSurah: 78 },
];


