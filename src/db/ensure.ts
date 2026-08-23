import { db, pool, isDbAvailable } from ".";

/**
 * Idempotent schema bootstrap.
 *
 * Production (Vercel) may be attached to a fresh Postgres where migrations have
 * not been applied manually. This runs `CREATE TABLE IF NOT EXISTS` on first use
 * so signup/login/progress never 500 because a table is missing. It does NOT
 * drop or alter data, and it never runs when no database is configured.
 */
let ensured: Promise<boolean> | null = null;

const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS "users" (
  "id" serial PRIMARY KEY NOT NULL,
  "name" varchar(120) NOT NULL,
  "email" varchar(200) NOT NULL,
  "password_hash" varchar(256) NOT NULL,
  "password_salt" varchar(64) NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "users_email_unique" UNIQUE("email")
);
CREATE TABLE IF NOT EXISTS "progress" (
  "id" serial PRIMARY KEY NOT NULL,
  "user_id" integer NOT NULL,
  "surah_number" integer NOT NULL,
  "status" varchar(20) DEFAULT 'learning' NOT NULL,
  "memorized_ayahs" integer DEFAULT 0 NOT NULL,
  "retention" integer DEFAULT 0 NOT NULL,
  "review_count" integer DEFAULT 0 NOT NULL,
  "last_reviewed_at" timestamp,
  "ease" integer DEFAULT 250 NOT NULL,
  "interval_days" integer DEFAULT 0 NOT NULL,
  "due_at" timestamp,
  "updated_at" timestamp DEFAULT now() NOT NULL
);
CREATE TABLE IF NOT EXISTS "activity" (
  "id" serial PRIMARY KEY NOT NULL,
  "user_id" integer NOT NULL,
  "day" varchar(10) NOT NULL,
  "count" integer DEFAULT 0 NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "activity_user_day_unique" UNIQUE("user_id","day")
);
CREATE TABLE IF NOT EXISTS "certificates" (
  "id" serial PRIMARY KEY NOT NULL,
  "user_id" integer NOT NULL,
  "cert_id" varchar(40) NOT NULL,
  "achievement" varchar(40) NOT NULL,
  "token_hash" varchar(128) NOT NULL,
  "issued_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "certificates_cert_id_unique" UNIQUE("cert_id")
);
CREATE INDEX IF NOT EXISTS "progress_user_id_idx" ON "progress"("user_id");
CREATE INDEX IF NOT EXISTS "activity_user_id_idx" ON "activity"("user_id");
CREATE INDEX IF NOT EXISTS "certificates_user_id_idx" ON "certificates"("user_id");
`;

export function ensureSchema(): Promise<boolean> {
  if (ensured) return ensured;
  ensured = (async () => {
    if (!isDbAvailable() || !pool) return false;
    try {
      await pool.query(SCHEMA_SQL);
      return true;
    } catch (err) {
      // Reset so a subsequent request can retry; log server-side only.
      console.error("[db] ensureSchema failed:", err);
      ensured = null;
      return false;
    }
  })();
  return ensured;
}

/** Convenience for callers that already imported db. */
export { db };
