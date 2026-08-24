import { verifyCertificate, isCertSecretConfigured, CERTIFICATE_DISCLAIMER } from "@/lib/certificates";

export const dynamic = "force-dynamic";

// GET /api/verify?token=... — server-side certificate verification.
export async function GET(req: Request) {
  const url = new URL(req.url);
  const token = (url.searchParams.get("token") ?? "").trim();
  if (!token) {
    return Response.json(
      { valid: false, reason: "لم يتم إرفاق رمز الشهادة." },
      { status: 400 },
    );
  }
  const result = verifyCertificate(token);
  if (!result.valid) {
    return Response.json(result, { status: 400 });
  }
  const { valid: _valid, verifiedAt, ...payload } = result;
  return Response.json({
    valid: true,
    certificate: payload,
    verifiedAt,
    disclaimer: CERTIFICATE_DISCLAIMER,
    secretConfigured: isCertSecretConfigured(),
  });
}
