import { getSurah, type SurahMeta } from "./surahs";
import { fetchSurahLocal } from "./quranLocal";

export type QuranWord = { t: string; i: number };

export type QuranAyah = {
  numberInSurah: number;
  globalNumber: number;
  text: string;
  words: QuranWord[];
  tafsir: string;
  audioUrl: string;
  page: number;
};

export type SurahContent = {
  meta: SurahMeta;
  basmala: boolean;
  ayahs: QuranAyah[];
};

const BASMALA_WORDS = 4; // بسم الله الرحمن الرحيم

type ApiAyah = {
  number: number;
  text: string;
  numberInSurah: number;
  page: number;
};

type ApiEdition = {
  edition: { identifier: string };
  ayahs: ApiAyah[];
};

export async function fetchSurah(surahNumber: number): Promise<SurahContent | null> {
  const meta = getSurah(surahNumber);
  if (!meta) return null;

  const url = `https://api.alquran.cloud/v1/surah/${surahNumber}/editions/quran-uthmani,ar.muyassar`;
  let json: { data: ApiEdition[] } | null = null;
  try {
    const res = await fetch(url, { next: { revalidate: 60 * 60 * 24 * 30 } });
    if (!res.ok) return null;
    json = (await res.json()) as { data: ApiEdition[] };
  } catch {
    // Network unavailable → always fall back to the bundled, real Uthmani text.
    return fetchSurahLocal(surahNumber, null);
  }

  const data = json?.data ?? [];
  const quran = data.find((d) => d.edition.identifier === "quran-uthmani");
  const tafsir = data.find((d) => d.edition.identifier === "ar.muyassar");
  if (!quran) {
    // Offline / restricted network → render real text from the bundled dataset.
    return fetchSurahLocal(surahNumber, null);
  }

  const hasBasmala = surahNumber !== 1 && surahNumber !== 9;

  const ayahs: QuranAyah[] = quran.ayahs.map((a, idx) => {
    let text = a.text.trim();
    // The API prepends the basmala to ayah 1 of most surahs; strip it (it's shown as a header).
    if (hasBasmala && a.numberInSurah === 1) {
      const parts = text.split(/\s+/);
      if (parts.length > BASMALA_WORDS + 1) {
        text = parts.slice(BASMALA_WORDS).join(" ");
      }
    }
    const words = text.split(/\s+/).filter(Boolean).map((t, i) => ({ t, i }));
    return {
      numberInSurah: a.numberInSurah,
      globalNumber: a.number,
      text,
      words,
      tafsir: tafsir?.ayahs[idx]?.text?.trim() ?? "",
      audioUrl: `https://cdn.islamic.network/quran/audio/128/ar.alafasy/${a.number}.mp3`,
      page: a.page,
    };
  });

  return { meta, basmala: hasBasmala, ayahs };
}
