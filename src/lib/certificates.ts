import { createHmac, timingSafeEqual } from "crypto";

/**
 * Server-side digital achievement certificates (Phase 9).
 *
 * HONESTY: these are "شهادة إنجاز رقمية صادرة عن منصة حافظ" — they are NOT an
 * ijazah, an official religious certificate, or scholarly authorization. The
 * achievement criteria are embedded in the signed payload, so client-supplied
 * achievement data can never be trusted — the HMAC is verified server-side.
 *
 * The token is self-contained (stateless) and signed with HMAC-SHA256 using
 * CERT_SECRET (falls back to a per-deployment secret when unset, which
 * invalidates tokens across deployments — acceptable for a dev/demo environment
 * and clearly surfaced via `secretConfigured`).
 */

export type CertificateAchievement =
  | "first_ayah"
  | "surah_complete"
  | "juz_1"
  | "juz_5"
  | "juz_10"
  | "juz_15"
  | "juz_20"
  | "juz_25"
  | "juz_30"
  | "khatmah";

export interface CertificatePayload {
  v: 1;
  id: string; // HFZ-YYYYMMDD-XXXXXXX
  name: string;
  userId?: number | null;
  achievement: CertificateAchievement;
  achievementAr: string;
  /** ISO date issued */
  iat: number;
  /** Evidence criteria that were satisfied (human readable, Arabic). */
  criteria: string[];
  /** Optional surah number when achievement is surah-scoped. */
  surah?: number;
  /** Optional juz number when achievement is juz-scoped. */
  juz?: number;
}

export interface VerifiedCertificate extends CertificatePayload {
  valid: true;
  verifiedAt: string;
}

export interface InvalidCertificate {
  valid: false;
  reason: string;
}

const ACHIEVEMENT_AR: Record<CertificateAchievement, string> = {
  first_ayah: "أول آية محفوظة",
  surah_complete: "إتمام حفظ سورة",
  juz_1: "إتمام الجزء الأول",
  juz_5: "إتمام خمسة أجزاء",
  juz_10: "إتمام عشرة أجزاء",
  juz_15: "إتمام خمسة عشر جزءاً",
  juz_20: "إتمام عشرين جزءاً",
  juz_25: "إتمام خمسة وعشرين جزءاً",
  juz_30: "إتمام ثلاثين جزءاً",
  khatmah: "ختمة القرآن الكريم",
};

function getSecret(): string {
  return (
    process.env.CERT_SECRET ??
    process.env.NEXTAUTH_SECRET ??
    "hafiz-dev-cert-secert-change-me"
  );
}

export function isCertSecretConfigured(): boolean {
  return !!process.env.CERT_SECRET;
}

function b64url(input: Buffer | string): string {
  return Buffer.from(input)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function sign(body: string): string {
  return b64url(createHmac("sha256", getSecret()).update(body).digest());
}

function genId(issuedAt: number): string {
  const d = new Date(issuedAt);
  const stamp = d.toISOString().slice(0, 10).replace(/-/g, "");
  const rand = Math.floor(Math.random() * 0x7fffffff)
    .toString(36)
    .toUpperCase()
    .padStart(7, "0")
    .slice(0, 7);
  return `HFZ-${stamp}-${rand}`;
}

export interface IssueInput {
  name: string;
  userId?: number | null;
  achievement: CertificateAchievement;
  criteria: string[];
  surah?: number;
  juz?: number;
  issuedAt?: Date;
}

/** Issue a signed certificate token. Server-only. */
export function issueCertificate(input: IssueInput): { token: string; payload: CertificatePayload } {
  const issuedAt = input.issuedAt ?? new Date();
  const payload: CertificatePayload = {
    v: 1,
    id: genId(issuedAt.getTime()),
    name: input.name,
    userId: input.userId ?? null,
    achievement: input.achievement,
    achievementAr: ACHIEVEMENT_AR[input.achievement],
    iat: issuedAt.getTime(),
    criteria: input.criteria,
    surah: input.surah,
    juz: input.juz,
  };
  const body = b64url(JSON.stringify(payload));
  const sig = sign(body);
  return { token: `${body}.${sig}`, payload };
}

export function verifyCertificate(token: string): VerifiedCertificate | InvalidCertificate {
  try {
    const parts = token.split(".");
    if (parts.length !== 2) return { valid: false, reason: "صيغة الشهادة غير صحيحة." };
    const [body, sig] = parts;
    const expected = sign(body);
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      return { valid: false, reason: "تعذّر التحقق من توقيع الشهادة." };
    }
    const json = Buffer.from(body.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8");
    const payload = JSON.parse(json) as CertificatePayload;
    if (payload.v !== 1) return { valid: false, reason: "إصدار الشهادة غير مدعوم." };
    if (!payload.id || !payload.name || !payload.achievement) {
      return { valid: false, reason: "بيانات الشهادة ناقصة." };
    }
    return { ...payload, valid: true, verifiedAt: new Date().toISOString() };
  } catch {
    return { valid: false, reason: "تعذّر قراءة الشهادة." };
  }
}

export const CERTIFICATE_DISCLAIMER =
  "هذه شهادة إنجاز رقمية صادرة عن منصة حافظ، وليست إجازة شرعية أو شهادة رسمية.";
