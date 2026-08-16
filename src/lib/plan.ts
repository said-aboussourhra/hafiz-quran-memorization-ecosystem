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
