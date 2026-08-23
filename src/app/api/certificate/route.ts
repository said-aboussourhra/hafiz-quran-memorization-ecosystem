import { getCurrentUser } from "@/lib/auth";
import { isDbAvailable, requireDb } from "@/db";
import { progress } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getSurah, SURAHS, TOTAL_AYAHS } from "@/lib/surahs";
import {
  issueCertificate,
  type CertificateAchievement,
} from "@/lib/certificates";

export const dynamic = "force-dynamic";

// Juz → cumulative ayah boundaries (approximate standard juz ayah counts).
// Used only to decide juz completion from verified memorized-ayah totals.
const JUZ_AYAH_COUNTS = [
  148, 177, 171, 197, 193, 201, 203, 192, 195, 207, 200, 201, 206, 216, 185,
  269, 191, 154, 215, 145, 171, 157, 246, 175, 226, 195, 399, 169, 315, 291,
];

interface IssueRequest {
  achievement: CertificateAchievement;
  surah?: number;
  juz?: number;
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return Response.json({ ok: false, error: "يجب تسجيل الدخول." }, { status: 401 });
  }
  if (!isDbAvailable()) {
    return Response.json(
      { ok: false, error: "قاعدة البيانات غير متاحة، تعذّر إصدار الشهادة." },
      { status: 503 },
    );
  }

  let body: IssueRequest;
  try {
    body = (await req.json()) as IssueRequest;
  } catch {
    return Response.json({ ok: false, error: "طلب غير صالح." }, { status: 400 });
  }

  const db = await requireDb();
  const rows = await db.select().from(progress).where(eq(progress.userId, user.id));
  const bySurah = new Map(rows.map((r) => [r.surahNumber, r]));

  const totalMemorized = rows.reduce((n, r) => n + r.memorizedAyahs, 0);
  const completedSurahs = rows.filter(
    (r) => r.status === "memorized" || r.status === "mastered",
  ).length;

  let criteria: string[] = [];
  let surahNum: number | undefined;
  let juzNum: number | undefined;
  let achievementAr = "";

  switch (body.achievement) {
    case "first_ayah":
      if (totalMemorized < 1) return insufficient();
      criteria = ["حفظ آية واحدة على الأقل", "استدعاء صحيح مخفي النص"];
      achievementAr = "أول آية محفوظة";
      break;
    case "surah_complete": {
      if (!body.surah) return Response.json({ ok: false, error: "surah required" }, { status: 400 });
      const meta = getSurah(body.surah);
      const p = bySurah.get(body.surah);
      if (!meta || !p || p.memorizedAyahs < meta.ayahCount) return insufficient();
      surahNum = body.surah;
      criteria = [
        `إتمام حفظ سورة ${meta.nameAr} (${meta.ayahCount} آية)`,
        "نسبة إتقان لا تقل عن 80٪",
      ];
      achievementAr = `إتمام سورة ${meta.nameAr}`;
      break;
    }
    case "juz_1":
    case "juz_5":
    case "juz_10":
    case "juz_15":
    case "juz_20":
    case "juz_25":
    case "juz_30": {
      const targetJuz = Number(body.achievement.split("_")[1]);
      const threshold = JUZ_AYAH_COUNTS.slice(0, targetJuz).reduce((a, b) => a + b, 0);
      if (totalMemorized < threshold) return insufficient();
      juzNum = targetJuz;
      criteria = [
        `حفظ ${threshold.toLocaleString("ar-EG")} آية (أول ${targetJuz} جزء)`,
        "تحقق الخادم من التقدّم المسجّل",
      ];
      achievementAr = `إتمام ${targetJuz} ${targetJuz === 1 ? "جزء" : "أجزاء"}`;
      break;
    }
    case "khatmah":
      if (totalMemorized < TOTAL_AYAHS) return insufficient();
      criteria = ["حفظ جميع آيات القرآن الكريم", "تحقق الخادم من الختمة الكاملة"];
      achievementAr = "ختمة القرآن الكريم";
      break;
    default:
      return Response.json({ ok: false, error: "إنجاز غير معروف." }, { status: 400 });
  }

  const { token, payload } = issueCertificate({
    name: user.name,
    userId: user.id,
    achievement: body.achievement,
    criteria,
    surah: surahNum,
    juz: juzNum,
  });

  return Response.json({
    ok: true,
    token,
    certificate: payload,
    verifyUrl: `/verify?token=${encodeURIComponent(token)}`,
  });

  function insufficient() {
    return Response.json(
      {
        ok: false,
        error: "لم تُستوفَ معايير هذا الإنجاز بعد. أكمل الحفظ والمراجعة ثم حاول مجددًا.",
        stats: { totalMemorized, completedSurahs, totalAyahs: TOTAL_AYAHS },
      },
      { status: 409 },
    );
  }
}

// Expose eligible achievements for the UI.
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return Response.json({ ok: false, eligible: [] }, { status: 401 });
  if (!isDbAvailable()) return Response.json({ ok: false, eligible: [] });
  const db = await requireDb();
  const rows = await db.select().from(progress).where(eq(progress.userId, user.id));
  const total = rows.reduce((n, r) => n + r.memorizedAyahs, 0);
  const eligible: {
    id: CertificateAchievement;
    label: string;
    surah?: number;
    juz?: number;
  }[] = [];
  if (total >= 1) eligible.push({ id: "first_ayah", label: "أول آية" });
  for (const s of SURAHS) {
    const p = rows.find((r) => r.surahNumber === s.number);
    if (p && p.memorizedAyahs >= s.ayahCount) {
      eligible.push({ id: "surah_complete", label: `سورة ${s.nameAr}`, surah: s.number });
    }
  }
  let cum = 0;
  for (let j = 1; j <= 30; j++) {
    cum += JUZ_AYAH_COUNTS[j - 1];
    if (total >= cum && [1, 5, 10, 15, 20, 25, 30].includes(j)) {
      eligible.push({ id: `juz_${j}` as CertificateAchievement, label: `${j} أجزاء`, juz: j });
    }
  }
  if (total >= TOTAL_AYAHS) eligible.push({ id: "khatmah", label: "ختمة القرآن" });
  return Response.json({ ok: true, name: user.name, eligible, totalMemorized: total });
}
