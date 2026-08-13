import { db } from "@/db";
import { progress, type Progress } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { SURAHS, TOTAL_AYAHS, getSurah } from "./surahs";

export async function getUserProgress(userId: number): Promise<Map<number, Progress>> {
  const rows = await db.select().from(progress).where(eq(progress.userId, userId));
  const map = new Map<number, Progress>();
  for (const r of rows) map.set(r.surahNumber, r);
  return map;
}

export type UniverseSurah = {
  number: number;
  nameAr: string;
  nameLatin: string;
  meaning: string;
  ayahCount: number;
  juz: number;
  revelation: string;
  status: string;
  retention: number;
  memorizedAyahs: number;
};

export async function getUniverseData(userId: number | null): Promise<UniverseSurah[]> {
  const map = userId ? await getUserProgress(userId) : new Map<number, Progress>();
  return SURAHS.map((s) => {
    const p = map.get(s.number);
    return {
      number: s.number,
      nameAr: s.nameAr,
      nameLatin: s.nameLatin,
      meaning: s.meaning,
      ayahCount: s.ayahCount,
      juz: s.juz,
      revelation: s.revelation,
      status: p?.status ?? "not_started",
      retention: p?.retention ?? 0,
      memorizedAyahs: p?.memorizedAyahs ?? 0,
    };
  });
}

export async function getProgressStats(userId: number | null) {
  const map = userId ? await getUserProgress(userId) : new Map<number, Progress>();
  let memorizedAyahs = 0;
  let completedSurahs = 0;
  let retentionSum = 0;
  let retentionCount = 0;
  for (const p of map.values()) {
    memorizedAyahs += p.memorizedAyahs;
    if (p.status === "memorized" || p.status === "mastered") completedSurahs += 1;
    if (p.memorizedAyahs > 0) {
      retentionSum += p.retention;
      retentionCount += 1;
    }
  }
  const completionPct = Math.round((memorizedAyahs / TOTAL_AYAHS) * 1000) / 10;
  const memoryHealth = retentionCount > 0 ? Math.round(retentionSum / retentionCount) : 0;
  return { memorizedAyahs, completedSurahs, completionPct, memoryHealth, totalAyahs: TOTAL_AYAHS };
}

export async function recordSurahMemorized(input: {
  userId: number;
  surahNumber: number;
  memorizedAyahs: number;
  retention: number;
}) {
  const meta = getSurah(input.surahNumber);
  if (!meta) throw new Error("invalid surah");
  const now = new Date();
  const full = input.memorizedAyahs >= meta.ayahCount;
  const status = input.retention >= 90 && full ? "mastered" : full ? "memorized" : "learning";

  const [existing] = await db
    .select()
    .from(progress)
    .where(and(eq(progress.userId, input.userId), eq(progress.surahNumber, input.surahNumber)));

  if (existing) {
    const newRetention = Math.min(100, Math.round(existing.retention * 0.4 + input.retention * 0.6));
    await db
      .update(progress)
      .set({
        memorizedAyahs: Math.max(existing.memorizedAyahs, input.memorizedAyahs),
        retention: newRetention,
        reviewCount: existing.reviewCount + 1,
        status,
        lastReviewedAt: now,
        updatedAt: now,
      })
      .where(eq(progress.id, existing.id));
  } else {
    await db.insert(progress).values({
      userId: input.userId,
      surahNumber: input.surahNumber,
      status,
      memorizedAyahs: input.memorizedAyahs,
      retention: input.retention,
      reviewCount: 1,
      lastReviewedAt: now,
    });
  }
  return { ok: true, status };
}

export type AchievementDef = {
  key: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
};

export async function getAchievements(userId: number | null): Promise<AchievementDef[]> {
  const map = userId ? await getUserProgress(userId) : new Map<number, Progress>();
  const completed = [...map.values()].filter((p) => p.status === "memorized" || p.status === "mastered");
  const memorizedSurahNumbers = new Set(completed.map((p) => p.surahNumber));
  const memorizedAyahs = [...map.values()].reduce((s, p) => s + p.memorizedAyahs, 0);

  // Juz Amma = surahs 78..114
  const juzAmma = Array.from({ length: 114 - 78 + 1 }, (_, i) => 78 + i);
  const juzAmmaDone = juzAmma.every((n) => memorizedSurahNumbers.has(n));

  const defs: AchievementDef[] = [
    { key: "first_ayah", title: "أول آية", description: "حفظت أول آية في رحلتك المباركة", icon: "✨", unlocked: memorizedAyahs >= 1 },
    { key: "first_surah", title: "أول سورة", description: "أتممت حفظ أول سورة كاملة", icon: "📖", unlocked: completed.length >= 1 },
    { key: "five_surah", title: "خمس سور", description: "أتممت حفظ خمس سور", icon: "⭐", unlocked: completed.length >= 5 },
    { key: "ten_surah", title: "عشر سور", description: "أتممت حفظ عشر سور", icon: "🌟", unlocked: completed.length >= 10 },
    { key: "juz_amma", title: "جزء عمّ", description: "أتممت حفظ جزء عمّ كاملاً", icon: "🌙", unlocked: juzAmmaDone },
    { key: "quarter", title: "ربع القرآن", description: "حفظت ربع آيات القرآن", icon: "💎", unlocked: memorizedAyahs >= TOTAL_AYAHS / 4 },
    { key: "half", title: "نصف القرآن", description: "حفظت نصف آيات القرآن", icon: "👑", unlocked: memorizedAyahs >= TOTAL_AYAHS / 2 },
    { key: "full", title: "القرآن كاملاً", description: "أصبحت حافظاً لكتاب الله كاملاً", icon: "🏆", unlocked: memorizedAyahs >= TOTAL_AYAHS },
  ];
  return defs;
}
