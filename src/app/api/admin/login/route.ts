import { NextResponse } from "next/server";

/**
 * HAFIZ — ADMIN LOGIN (تسجيل دخول لوحة المطوّر)
 * ----------------------------------------------------------------------------
 * التحقق من بيانات الدخول يتم حصرياً على الخادم:
 *  - يُقرأ ADMIN_USERNAME و ADMIN_PASSWORD من متغيرات البيئة إن وُجدت.
 *  - وإلا تُستخدم قيم احتياطية ثابتة داخل هذا الملف الخادمي فقط.
 * لا تُرسل هذه القيم إلى العميل إطلاقاً ولا تُضمَّن في أي حزمة JS.
 */

const FALLBACK_ADMIN_USERNAME = "SAID-ABOUSSOURHRA";
const FALLBACK_ADMIN_PASSWORD = "HH188218";

function resolveAdminCredentials() {
  return {
    username: process.env.ADMIN_USERNAME || FALLBACK_ADMIN_USERNAME,
    password: process.env.ADMIN_PASSWORD || FALLBACK_ADMIN_PASSWORD,
  };
}

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();
    const payload = (body ?? {}) as { username?: unknown; password?: unknown };
    const username = typeof payload.username === "string" ? payload.username : "";
    const password = typeof payload.password === "string" ? payload.password : "";

    if (!username || !password) {
      return NextResponse.json(
        { ok: false, error: "أدخل اسم المستخدم وكلمة السر" },
        { status: 400 }
      );
    }

    const { username: expectedUsername, password: expectedPassword } =
      resolveAdminCredentials();

    // مقارنة زمنية تقريبية لتقليل تسريب معلومات التحقق
    const userMatches =
      username.length === expectedUsername.length &&
      username
        .split("")
        .every((char, index) => char === expectedUsername[index]);
    const passMatches =
      password.length === expectedPassword.length &&
      password
        .split("")
        .every((char, index) => char === expectedPassword[index]);

    if (userMatches && passMatches) {
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json(
      { ok: false, error: "اسم المستخدم أو كلمة السر غير صحيحة" },
      { status: 401 }
    );
  } catch {
    return NextResponse.json(
      { ok: false, error: "تعذر التحقق من بيانات الدخول" },
      { status: 500 }
    );
  }
}
