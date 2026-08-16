import { getSurah } from "./surahs";

export type SearchMatch = {
  surahNumber: number;
  surahNameAr: string;
  numberInSurah: number;
  text: string;
};

type ApiMatch = {
  numberInSurah: number;
  text: string;
  surah: { number: number };
};

export async function searchQuran(query: string): Promise<SearchMatch[]> {
  const q = query.trim();
  if (q.length < 2) return [];
  const url = `https://api.alquran.cloud/v1/search/${encodeURIComponent(q)}/all/quran-simple-clean`;
  try {
    const res = await fetch(url, { next: { revalidate: 60 * 60 * 24 } });
    if (!res.ok) return [];
    const json = (await res.json()) as { data?: { matches?: ApiMatch[] } };
    const matches = json?.data?.matches ?? [];
    return matches.slice(0, 60).map((m) => {
      const meta = getSurah(m.surah.number);
      return {
        surahNumber: m.surah.number,
        surahNameAr: meta?.nameAr ?? "",
        numberInSurah: m.numberInSurah,
        text: m.text,
      };
    });
  } catch {
    return [];
  }
}
