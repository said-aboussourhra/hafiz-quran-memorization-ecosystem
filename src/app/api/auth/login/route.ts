import { NextResponse } from "next/server";
import { requireDb } from "@/db";
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
    const db = await requireDb();
    const [user] = await db.select().from(users).where(eq(users.email, email));
    if (!user || !verifyPassword(password, user.passwordHash, user.passwordSalt)) {
      return NextResponse.json({ ok: false, error: "البريد أو كلمة المرور غير صحيحة." }, { status: 401 });
    }
    const res = NextResponse.json({ ok: true, user: { id: user.id, name: user.name } });
    res.cookies.set(buildSessionCookie(user.id));
    return res;
  } catch {
    return NextResponse.json({ ok: false, error: "حدث خطأ في الخادم." }, { status: 500 });
  }
}
