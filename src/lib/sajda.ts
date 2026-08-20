// The 15 places of prostration (سجدات التلاوة) — surah:ayah pairs.
export const SAJDA_AYAHS: Record<string, boolean> = {
  "7:206": true,
  "13:15": true,
  "16:50": true,
  "17:109": true,
  "19:58": true,
  "22:18": true,
  "22:77": true,
  "25:60": true,
  "27:26": true,
  "32:15": true,
  "38:24": true,
  "41:38": true,
  "53:62": true,
  "84:21": true,
  "96:19": true,
};

export function isSajda(surah: number, ayah: number): boolean {
  return !!SAJDA_AYAHS[`${surah}:${ayah}`];
}

// The recommended supplication said during the prostration of recitation.
export const SAJDA_DUA =
  "سَجَدَ وَجْهِيَ لِلَّذِي خَلَقَهُ وَصَوَّرَهُ، وَشَقَّ سَمْعَهُ وَبَصَرَهُ بِحَوْلِهِ وَقُوَّتِهِ، فَتَبَارَكَ اللَّهُ أَحْسَنُ الْخَالِقِينَ";
export const SAJDA_DUA_SOURCE = "رواه الترمذي";
