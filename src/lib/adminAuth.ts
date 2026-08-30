/**
 * ============================================================================
 * HAFIZ — ADMIN AUTHENTICATION (مصادقة لوحة المطوّر)
 * ----------------------------------------------------------------------------
 * مصادقة بسيطة لصفحة الإدارة باستخدام بيانات ثابته (لا تتطلب قاعدة بيانات).
 * عند النجاح، يُطلق حدث مخصص hafiz:open-admin ويخزن الحالة في sessionStorage.
 * ===========================================================================
 */

// بيانات الدخول الثابتة
const ADMIN_USERNAME = "SAID-ABOUSSOURHRA";
const ADMIN_PASSWORD = "HH188218";

// مفتاح التخزين
const ADMIN_SESSION_KEY = "hafiz_admin_auth_v1";

/**
 * التحقق من مصادقة المسئول
 */
export function authenticateAdmin(username: string, password: string): boolean {
  return username === ADMIN_USERNAME && password === ADMIN_PASSWORD;
}

/**
 * تخزين حالة الدخول
 */
export function storeAdminSession(): void {
  try {
    window.sessionStorage.setItem(ADMIN_SESSION_KEY, "true");
    // إطلاق حدث مخصص
    const event = new CustomEvent("hafiz:open-admin", {
      detail: {
        timestamp: Date.now(),
        user: ADMIN_USERNAME,
      },
    });
    window.dispatchEvent(event);
  } catch {
    // تجاهل الأخطاء (على سبيل المثال في SSR)
  }
}

/**
 * التحقق من وجود جلسة مسجل دخول
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

/**
 * الحصول على اسم المسئول
 */
export function getAdminUsername(): string {
  return ADMIN_USERNAME;
}

// تصدير البيانات الثابتة للاستخدام في الواجهة
export { ADMIN_USERNAME, ADMIN_PASSWORD };
