import { NextResponse } from "next/server";
import { requireDb } from "@/db";
import { ensureSchema } from "@/db/ensure";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { buildSessionCookie, hashPassword } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const name = String(body.name ?? "").trim().slice(0, 120);
    const email = String(body.email ?? "").trim().toLowerCase().slice(0, 200);
    const password = String(body.password ?? "");

    if (!name || !email || password.length < 6) {
      return NextResponse.json({ ok: false, error: "يرجى إدخال اسم وبريد وكلمة مرور (٦ أحرف على الأقل)." }, { status: 400 });
    }
    if (!/^[\u0600-\u06FF\s]+$/.test(name)) {
      return NextResponse.json({ ok: false, error: "يرجى كتابة الاسم بالحروف العربية فقط." }, { status: 400 });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ ok: false, error: "صيغة البريد الإلكتروني غير صحيحة." }, { status: 400 });
    }

    await ensureSchema();
    const db = await requireDb();
    const [existing] = await db.select().from(users).where(eq(users.email, email));
    if (existing) {
      return NextResponse.json({ ok: false, error: "هذا البريد مسجّل مسبقاً." }, { status: 409 });
    }

    const { hash, salt } = hashPassword(password);
    const [created] = await db
      .insert(users)
      .values({ name, email, passwordHash: hash, passwordSalt: salt })
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
