/**
 * ============================================================================
 * HAFIZ — ADMIN SESSION (جلسة لوحة المطوّر)
 * ----------------------------------------------------------------------------
 * هذه الوحدة تدير حالة الجلسة المحلية فقط (sessionStorage) للسماح بواجهة
 * لوحة التحكم. التحقق من بيانات الدخول يتم حصرياً على الخادم في:
 * src/app/api/admin/login/route.ts
 * لا توجد أي بيانات دخول (اسم مستخدم أو كلمة سر) في هذه الوحدة أو في الواجهة.
 * ============================================================================
 */

// مفتاح التخزين
const ADMIN_SESSION_KEY = "hafiz_admin_auth_v1";

/**
 * تخزين حالة الدخول محلياً بعد نجاح التحقق الخادمي
 */
export function storeAdminSession(): void {
  try {
    window.sessionStorage.setItem(ADMIN_SESSION_KEY, "true");
    // إطلاق حدث مخصص
    const event = new CustomEvent("hafiz:open-admin", {
      detail: {
        timestamp: Date.now(),
      },
    });
    window.dispatchEvent(event);
  } catch {
    // تجاهل الأخطاء (على سبيل المثال في SSR)
  }
}

/**
 * التحقق من وجود جلسة مسجل دخول محلية
 */
export function hasAdminSession(): boolean {
  try {
    return window.sessionStorage.getItem(ADMIN_SESSION_KEY) === "true";
  } catch {
    return false;
  }
}

/**
 * إنهاء جلسة المسئول
 */
export function clearAdminSession(): void {
  try {
    window.sessionStorage.removeItem(ADMIN_SESSION_KEY);
  } catch {
    // تجاهل
  }
}
