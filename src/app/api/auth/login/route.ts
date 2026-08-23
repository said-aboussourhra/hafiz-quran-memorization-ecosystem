import { NextResponse } from "next/server";
import { requireDb } from "@/db";
import { ensureSchema } from "@/db/ensure";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { buildSessionCookie, verifyPassword } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const email = String(body.email ?? "").trim().toLowerCase();
    const password = String(body.password ?? "");
    if (!email || !password) {
      return NextResponse.json({ ok: false, error: "يرجى إدخال البريد وكلمة المرور." }, { status: 400 });
    }
    await ensureSchema();
    const db = await requireDb();
    const [user] = await db.select().from(users).where(eq(users.email, email));
    if (!user || !verifyPassword(password, user.passwordHash, user.passwordSalt)) {
      return NextResponse.json({ ok: false, error: "البريد أو كلمة المرور غير صحيحة." }, { status: 401 });
    }
    const res = NextResponse.json({ ok: true, user: { id: user.id, name: user.name } });
    res.cookies.set(buildSessionCookie(user.id));
    return res;
  } catch (err) {
    console.error("[login] failed:", err);
    return NextResponse.json({ ok: false, error: "تعذّر تسجيل الدخول الآن. حاول مجددًا بعد قليل." }, { status: 500 });
  }
}
