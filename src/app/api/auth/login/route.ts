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

    if (!name || !isValidBirthDate(birthDate)) {
      return NextResponse.json(
        { ok: false, error: "يرجى إدخال الاسم الكامل وتاريخ الازدياد الصحيح." },
        { status: 400 },
      );
    }

    await ensureSchema();
    const db = await requireDb();
    const [user] = await db
      .select()
      .from(users)
      .where(and(eq(users.name, name), eq(users.birthDate, birthDate)));

    if (!user) {
      return NextResponse.json(
        { ok: false, error: "لم نعثر على حساب بهذه البيانات. تأكد من الاسم وتاريخ الازدياد." },
        { status: 401 },
      );
    }

    const res = NextResponse.json({ ok: true, user: { id: user.id, name: user.name } });
    res.cookies.set(buildSessionCookie(user.id));
    return res;
  } catch (err) {
    console.error("[login] failed:", err);
    return NextResponse.json({ ok: false, error: "تعذّر تسجيل الدخول الآن. حاول مجددًا بعد قليل." }, { status: 500 });
  }
}
