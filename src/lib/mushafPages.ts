import { SURAHS } from "./surahs";

/** First printed page of each surah in the standard 604-page Madinah Mushaf.
 * The page numbers follow the published 15-line Madinah index. */
export const SURAH_START_PAGES = [
  1, 2, 50, 77, 106, 128, 151, 177, 187, 208, 221, 235, 249, 255, 262, 267,
  282, 293, 305, 312, 322, 332, 342, 350, 359, 367, 377, 385, 396, 404, 411,
  415, 418, 428, 434, 440, 446, 453, 458, 467, 477, 483, 489, 496, 499, 502,
  507, 511, 515, 518, 520, 523, 526, 528, 531, 534, 537, 542, 545, 549, 551,
  553, 554, 556, 558, 560, 562, 564, 566, 568, 570, 572, 574, 575, 577, 578,
  580, 582, 583, 585, 586, 587, 587, 589, 590, 591, 591, 592, 593, 594, 595,
  595, 596, 596, 597, 597, 598, 598, 599, 599, 600, 600, 601, 601, 601, 602,
  602, 602, 603, 603, 603, 604, 604, 604,
] as const;

export const JUZ_START_PAGES = [1, 22, 42, 62, 82, 102, 121, 142, 162, 182, 201, 222, 242, 262, 282, 302, 322, 342, 362, 382, 402, 422, 442, 462, 482, 502, 522, 542, 562, 582] as const;

export function getJuzForPage(page: number): number {
  const safe = Math.max(1, Math.min(604, Math.trunc(page)));
  let juz = 1;
  for (let i = 0; i < JUZ_START_PAGES.length; i++) {
    if (JUZ_START_PAGES[i] > safe) break;
    juz = i + 1;
  }
  return juz;
}

export function getSurahStartPage(surahNumber: number): number {
  return SURAH_START_PAGES[surahNumber - 1] ?? 1;
}

/** The surah whose opening is the latest at or before this printed page. */
export function getSurahForPage(page: number) {
  const safe = Math.max(1, Math.min(604, Math.trunc(page)));
  let index = 0;
  for (let i = 0; i < SURAH_START_PAGES.length; i++) {
    if (SURAH_START_PAGES[i] > safe) break;
    index = i;
  }
  return SURAHS[index];
}
