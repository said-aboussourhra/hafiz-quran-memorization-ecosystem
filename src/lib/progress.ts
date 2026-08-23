import { requireDb } from "@/db";
import { progress, activity, type Progress } from "@/db/schema";
import { and, eq, sql } from "drizzle-orm";
import { SURAHS, TOTAL_AYAHS, getSurah } from "./surahs";

function dayKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

// Record today's activity (upsert count) — called when a memorization session saves.
export async function logActivity(userId: number, amount = 1) {
  const db = await requireDb();
  const day = dayKey(new Date());
  const existing = await db.select().from(activity).where(and(eq(activity.userId, userId), eq(activity.day, day)));
  if (existing.length > 0) {
    await db.update(activity).set({ count: existing[0].count + amount }).where(eq(activity.id, existing[0].id));
  } else {
    await db.insert(activity).values({ userId, day, count: amount });
  }
}

export async function getActivityDays(userId: number): Promise<Map<string, number>> {
  const db = await requireDb();
  const rows = await db.select().from(activity).where(eq(activity.userId, userId));
  const map = new Map<string, number>();
  for (const r of rows) map.set(r.day, r.count);
  return map;
}

// Current & best streak of consecutive active days (ending today or yesterday).
export function computeStreak(days: Map<string, number>): { current: number; best: number; total: number } {
  const set = new Set(days.keys());
  const total = set.size;
  // current streak
  let current = 0;
  const d = new Date();
  // allow today OR yesterday as the anchor (so it doesn't break before today's session)
  if (!set.has(dayKey(d))) d.setDate(d.getDate() - 1);
  while (set.has(dayKey(d))) { current++; d.setDate(d.getDate() - 1); }
  // best streak
  let best = 0;
  const sorted = [...set].sort();
  let run = 0;
  let prev: Date | null = null;
  for (const key of sorted) {
    const cur = new Date(key + "T00:00:00Z");
    if (prev && (cur.getTime() - prev.getTime()) === 86400000) run++;
    else run = 1;
    if (run > best) best = run;
    prev = cur;
  }
  return { current, best, total };
}

// 53-week heatmap grid (like GitHub) of the last ~year.
export function buildHeatmap(days: Map<string, number>): { day: string; count: number }[] {
  const out: { day: string; count: number }[] = [];
  const today = new Date();
  const start = new Date(today);
  start.setDate(start.getDate() - 364);
  for (let i = 0; i < 365; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const key = dayKey(d);
    out.push({ day: key, count: days.get(key) ?? 0 });
  }
  return out;
}

// Last 7 days activity for the weekly bar chart.
export function lastWeek(days: Map<string, number>): { label: string; count: number; isToday: boolean }[] {
  const labels = ["أحد", "إثن", "ثلا", "أرب", "خمي", "جمع", "سبت"];
  const out: { label: string; count: number; isToday: boolean }[] = [];
  const today = new Date();
  const todayKey = dayKey(today);
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = dayKey(d);
    out.push({ label: labels[d.getDay()], count: days.get(key) ?? 0, isToday: key === todayKey });
  }
  return out;
}

export type Badge = {
  id: string;
  title: string;
  desc: string;
  icon: string;
  earned: boolean;
};

export async function getBadges(userId: number | null) {
  const stats = await getProgressStats(userId);
  const days = userId ? await getActivityDays(userId) : new Map<string, number>();
  const streak = computeStreak(days);
  const juz = userId ? await getJuzProgress(userId) : [];
  const completedJuz = juz.filter((j) => j.pct >= 100).length;
  const map = userId ? await getUserProgress(userId) : new Map<number, Progress>();
  const mastered = [...map.values()].filter((p) => p.status === "mastered").length;

  const badges: Badge[] = [
    { id: "first_ayah", title: "أول آية", desc: "احفظ أول آية", icon: "🌱", earned: stats.memorizedAyahs >= 1 },
    { id: "first_surah", title: "أول سورة", desc: "أتمّ حفظ سورة كاملة", icon: "📖", earned: stats.completedSurahs >= 1 },
    { id: "five_surahs", title: "خمس سور", desc: "احفظ خمس سور", icon: "⭐", earned: stats.completedSurahs >= 5 },
    { id: "juz_amma", title: "جزء عمّ", desc: "أتمّ حفظ جزء كامل", icon: "🏅", earned: completedJuz >= 1 },
    { id: "five_juz", title: "خمسة أجزاء", desc: "احفظ خمسة أجزاء", icon: "🥉", earned: completedJuz >= 5 },
    { id: "ten_juz", title: "عشرة أجزاء", desc: "احفظ ثلث القرآن", icon: "🥈", earned: completedJuz >= 10 },
    { id: "half", title: "نصف القرآن", desc: "احفظ خمسة عشر جزءاً", icon: "🥇", earned: completedJuz >= 15 },
    { id: "khatmah", title: "ختمة الحفظ", desc: "احفظ القرآن كاملاً", icon: "👑", earned: completedJuz >= 30 },
    { id: "streak_7", title: "أسبوع مواظبة", desc: "٧ أيام متتالية", icon: "🔥", earned: streak.best >= 7 },
    { id: "streak_30", title: "شهر مواظبة", desc: "٣٠ يوماً متتالية", icon: "💎", earned: streak.best >= 30 },
    { id: "mastered_10", title: "إتقان", desc: "أتقن ١٠ سور", icon: "✨", earned: mastered >= 10 },
    { id: "active_100", title: "مئة يوم", desc: "١٠٠ يوم نشاط", icon: "🌟", earned: streak.total >= 100 },
  ];
  return { badges, streak, completedJuz, stats };
}

export async function getUserProgress(userId: number): Promise<Map<number, Progress>> {
  const db = await requireDb();
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

// Spaced-repetition interval (days) based on retention strength.
function reviewIntervalDays(retention: number): number {
  if (retention >= 90) return 14;
  if (retention >= 75) return 7;
  if (retention >= 60) return 3;
  return 1;
}

export type ReviewItem = {
  surahNumber: number;
  nameAr: string;
  retention: number;
  daysSince: number;
  dueIn: number; // negative = overdue
  priority: number; // higher = more urgent
};

export async function getReviewQueue(userId: number): Promise<ReviewItem[]> {
  const map = await getUserProgress(userId);
  const now = Date.now();
  const items: ReviewItem[] = [];
  for (const p of map.values()) {
    if (p.status !== "memorized" && p.status !== "mastered") continue;
    const meta = getSurah(p.surahNumber);
    if (!meta) continue;
    const last = p.lastReviewedAt ? new Date(p.lastReviewedAt).getTime() : now;
    const daysSince = Math.floor((now - last) / 86400000);
    // Prefer the precise SM-2 due date if set; else fall back to retention-based interval.
    let dueIn: number;
    if (p.dueAt) {
      dueIn = Math.ceil((new Date(p.dueAt).getTime() - now) / 86400000);
    } else {
      dueIn = reviewIntervalDays(p.retention) - daysSince;
    }
    const priority = Math.max(0, -dueIn) * 10 + (100 - p.retention);
    items.push({ surahNumber: p.surahNumber, nameAr: meta.nameAr, retention: p.retention, daysSince, dueIn, priority });
  }
  return items.sort((a, b) => b.priority - a.priority);
}

// Compute completion percentage per Juz based on memorized surahs.
export async function getJuzProgress(userId: number | null) {
  const map = userId ? await getUserProgress(userId) : new Map<number, Progress>();
  // Build juz -> list of surahs (by each surah's starting juz)
  const juzSurahs = new Map<number, number[]>();
  for (const s of SURAHS) {
    const arr = juzSurahs.get(s.juz) ?? [];
    arr.push(s.number);
    juzSurahs.set(s.juz, arr);
  }
  const result: { juz: number; total: number; done: number; pct: number }[] = [];
  for (let j = 1; j <= 30; j++) {
    const surahs = juzSurahs.get(j) ?? [];
    let total = 0;
    let done = 0;
    for (const n of surahs) {
      const meta = SURAHS.find((s) => s.number === n)!;
      total += meta.ayahCount;
      const p = map.get(n);
      done += p ? p.memorizedAyahs : 0;
    }
    const pct = total > 0 ? Math.round((done / total) * 100) : 0;
    result.push({ juz: j, total, done, pct });
  }
  return result;
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
  const db = await requireDb();
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
  await logActivity(input.userId, Math.max(1, input.memorizedAyahs));
  return { ok: true, status };
}

// SM-2 spaced-repetition grading. quality: 0=again, 3=hard, 4=good, 5=easy
export async function gradeReview(userId: number, surahNumber: number, quality: number) {
  const db = await requireDb();
  const [p] = await db
    .select()
    .from(progress)
    .where(and(eq(progress.userId, userId), eq(progress.surahNumber, surahNumber)));
  if (!p) return { ok: false };

  let ease = p.ease || 250;
  let interval = p.intervalDays || 0;

  if (quality < 3) {
    interval = 1; // failed → review tomorrow
  } else {
    if (interval === 0) interval = 1;
    else if (interval === 1) interval = quality === 5 ? 4 : 3;
    else interval = Math.round(interval * (ease / 100));
    // adjust ease factor
    ease = ease + (quality === 5 ? 15 : quality === 4 ? 0 : -20);
    if (ease < 130) ease = 130;
    if (quality === 5 && interval < 4) interval = 4;
  }
  // cap growth reasonably
  if (interval > 180) interval = 180;

  const now = new Date();
  const due = new Date(now.getTime() + interval * 86400000);
  // strengthen retention on good recall
  const retDelta = quality >= 4 ? 6 : quality === 3 ? 2 : -8;
  const newRet = Math.max(10, Math.min(100, p.retention + retDelta));
  const status = newRet >= 90 ? "mastered" : p.status;

  await db.update(progress).set({
    ease,
    intervalDays: interval,
    dueAt: due,
    retention: newRet,
    status,
    reviewCount: p.reviewCount + 1,
    lastReviewedAt: now,
    updatedAt: now,
  }).where(eq(progress.id, p.id));

  await logActivity(userId, 1);
  return { ok: true, interval, due: due.toISOString() };
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
