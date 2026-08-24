import { NextResponse } from "next/server";
import { requireDb, ensureSchema } from "@/db";
import { users } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { buildSessionCookie } from "@/lib/auth";
import { normalizeName, isValidBirthDate } from "@/lib/identity";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const name = normalizeName(body.name);
    const birthDate = String(body.birthDate ?? "").trim();

    if (!name) {
      return NextResponse.json({ ok: false, error: "يرجى إدخال الاسم الكامل." }, { status: 400 });
    }
    if (!/^[\u0600-\u06FF\s]+$/.test(name)) {
      return NextResponse.json({ ok: false, error: "يرجى كتابة الاسم بالحروف العربية فقط." }, { status: 400 });
    }
    if (name.trim().split(/\s+/).length < 2) {
      return NextResponse.json({ ok: false, error: "يرجى إدخال الاسم الكامل (الاسم واللقب على الأقل)." }, { status: 400 });
    }
    if (!isValidBirthDate(birthDate)) {
      return NextResponse.json({ ok: false, error: "تاريخ الازدياد غير صحيح." }, { status: 400 });
    }

    await ensureSchema();
    const db = await requireDb();

    const [existing] = await db
      .select()
      .from(users)
      .where(and(eq(users.name, name), eq(users.birthDate, birthDate)));
    if (existing) {
      return NextResponse.json({ ok: false, error: "يوجد حساب بهذا الاسم وتاريخ الازدياد. يمكنك تسجيل الدخول." }, { status: 409 });
    }

    const [created] = await db
      .insert(users)
      .values({ name, birthDate })
      .returning();

    const res = NextResponse.json({ ok: true, user: { id: created.id, name: created.name } });
    res.cookies.set(buildSessionCookie(created.id));
    return res;
  } catch (err) {
    console.error("[signup] failed:", err);
    const msg =
      err instanceof Error && /relation .* does not exist|Undefined table/i.test(err.message)
        ? "قاعدة البيانات قيد التهيئة، أعد المحاولة بعد لحظات."
        : "تعذّر إنشاء الحساب الآن. حاول مجددًا بعد قليل.";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
