import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { db, ensureSchema, isDbAvailable } from "@/db";
import { users, type User } from "@/db/schema";
import { eq } from "drizzle-orm";

const SECRET = process.env.SESSION_SECRET || "hafiz-noor-secret-key-2026";
const COOKIE = "hafiz_session";

export function hashPassword(password: string): { hash: string; salt: string } {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return { hash, salt };
}

export function verifyPassword(password: string, hash: string, salt: string): boolean {
  const candidate = scryptSync(password, salt, 64);
  const original = Buffer.from(hash, "hex");
  if (candidate.length !== original.length) return false;
  return timingSafeEqual(candidate, original);
}

function sign(userId: number): string {
  const payload = String(userId);
  const sig = createHmac("sha256", SECRET).update(payload).digest("hex");
  return `${payload}.${sig}`;
}

function verifyToken(token: string): number | null {
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return null;
  const expected = createHmac("sha256", SECRET).update(payload).digest("hex");
  if (expected.length !== sig.length) return null;
  if (!timingSafeEqual(Buffer.from(expected), Buffer.from(sig))) return null;
  const id = Number(payload);
  return Number.isInteger(id) ? id : null;
}

export function buildSessionCookie(userId: number) {
  return {
    name: COOKIE,
    value: sign(userId),
    httpOnly: true,
    sameSite: "lax" as const,
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
    secure: process.env.NODE_ENV === "production",
  };
}

export function clearSessionCookie() {
  return { name: COOKIE, value: "", httpOnly: true, path: "/", maxAge: 0 };
}

export async function getCurrentUser(): Promise<User | null> {
  const store = await cookies();
  const token = store.get(COOKIE)?.value;
  if (!token) return null;
  const id = verifyToken(token);
  if (!id) return null;
  // Cookie is valid. Do NOT treat a transient DB error (or first-run missing
  // tables) as "logged out" — that would bounce valid users back to /login.
  if (!isDbAvailable() || !db) return null;
  try {
    // Ensure tables exist on first hit (idempotent), then look the user up.
    await ensureSchema();
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user ?? null;
  } catch (err) {
    console.error("[auth] getCurrentUser lookup failed:", err);
    return null;
  }
}
