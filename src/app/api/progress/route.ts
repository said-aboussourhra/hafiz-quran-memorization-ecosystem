import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { recordSurahMemorized } from "@/lib/progress";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ ok: false, error: "يجب تسجيل الدخول لحفظ تقدّمك." }, { status: 401 });
    }
    const body = await req.json();
    const surahNumber = Number(body.surahNumber);
    const memorizedAyahs = Math.max(0, Number(body.memorizedAyahs) || 0);
    const retention = Math.max(0, Math.min(100, Number(body.retention) || 0));
    if (!surahNumber || surahNumber < 1 || surahNumber > 114) {
      return NextResponse.json({ ok: false, error: "سورة غير صحيحة." }, { status: 400 });
    }
    const result = await recordSurahMemorized({ userId: user.id, surahNumber, memorizedAyahs, retention });
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ ok: false, error: "حدث خطأ في الخادم." }, { status: 500 });
  }
}
