// HAFIZ Certificate Verification & Generation Engine

export interface VerifiedCertificate {
  id: string; // e.g. "HFZ-2026-9A82B1"
  recipientName: string;
  surahNumber: number;
  surahNameAr: string;
  ayahCount: number;
  accuracyScore: number;
  issuedAt: string; // ISO string
  criteriaPassed: string[];
  status: "VALID" | "REVOKED";
  disclaimer: string;
}

export function generateCertificateId(surahNumber: number, recipientName: string): string {
  const year = new Date().getFullYear();
  const raw = `${surahNumber}_${recipientName}_${Date.now()}`;
  let hash = 0;
  for (let i = 0; i < raw.length; i++) {
    hash = (hash << 5) - hash + raw.charCodeAt(i);
    hash |= 0;
  }
  const hex = Math.abs(hash).toString(16).toUpperCase().padStart(6, "0").slice(0, 6);
  return `HFZ-${year}-${hex}`;
}

const LOCAL_CERTS_KEY = "hafiz_verified_certificates_v1";

export function saveLocalCertificate(cert: VerifiedCertificate): void {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(LOCAL_CERTS_KEY);
    const map: Record<string, VerifiedCertificate> = raw ? JSON.parse(raw) : {};
    map[cert.id] = cert;
    localStorage.setItem(LOCAL_CERTS_KEY, JSON.stringify(map));
  } catch {
    // quota safe
  }
}

export function getLocalCertificate(id: string): VerifiedCertificate | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(LOCAL_CERTS_KEY);
    if (!raw) return null;
    const map: Record<string, VerifiedCertificate> = JSON.parse(raw);
    return map[id] || null;
  } catch {
    return null;
  }
}
