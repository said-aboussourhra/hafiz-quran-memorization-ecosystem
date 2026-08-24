import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.warn("⚠️ DATABASE_URL is not set. Database features will not work.");
}

const globalForDb = globalThis as typeof globalThis & {
  __hafizPostgresqlPool?: Pool;
  __hafizSchemaEnsured?: Promise<boolean>;
};

const isLocalDb =
  !!databaseUrl &&
  (databaseUrl.includes("@localhost") ||
    databaseUrl.includes("@127.0.0.1") ||
    databaseUrl.includes("sslmode=disable"));

export const pool = databaseUrl
  ? (globalForDb.__hafizPostgresqlPool ??
      new Pool({
        connectionString: databaseUrl,
        max: 10,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 10000,
        // Vercel / managed Postgres require SSL; local dev does not.
        ...(isLocalDb ? {} : { ssl: { rejectUnauthorized: false } }),
      }))
  : null;

if (process.env.NODE_ENV !== "production" && pool) {
  globalForDb.__hafizPostgresqlPool = pool;
}

export const db = pool ? drizzle(pool) : null;

/**
 * Idempotent, production-safe schema bootstrap & light migration.
 *
 * Root cause of the Vercel "Server Error" on /dashboard after signup: the shipped
 * Drizzle migration created an OLD shape of `progress` (missing ease / interval_days
 * / due_at) and never created the `activity` table, while the current code queries
 * those columns/tables. On a fresh Vercel Postgres that throws
 * "column/relation does not exist". Locally it works because the dev DB already has
 * the newer shape.
 *
 * This runs `CREATE TABLE IF NOT EXISTS` + `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`
 * once per cold process. It never drops or rewrites data, and no-ops without a DB.
 */
const SCHEMA_STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS "users" (
    "id" serial PRIMARY KEY NOT NULL,
    "name" varchar(120) NOT NULL,
    "email" varchar(200),
    "password_hash" varchar(256),
    "password_salt" varchar(64),
    "birth_date" varchar(10),
    "created_at" timestamp DEFAULT now() NOT NULL
  )`,
  // Evolve older databases toward the current shape (login by name + birth date):
  `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "birth_date" varchar(10)`,
  `ALTER TABLE "users" ALTER COLUMN "email" DROP NOT NULL`,
  `ALTER TABLE "users" ALTER COLUMN "password_hash" DROP NOT NULL`,
  `ALTER TABLE "users" ALTER COLUMN "password_salt" DROP NOT NULL`,
  `DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'users_email_unique') THEN
      ALTER TABLE "users" ADD CONSTRAINT "users_email_unique" UNIQUE ("email");
    END IF;
  END $$`,
  `CREATE TABLE IF NOT EXISTS "progress" (
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
  )`,
  // Backfill columns for databases created from the old migration:
  `ALTER TABLE "progress" ADD COLUMN IF NOT EXISTS "ease" integer DEFAULT 250 NOT NULL`,
  `ALTER TABLE "progress" ADD COLUMN IF NOT EXISTS "interval_days" integer DEFAULT 0 NOT NULL`,
  `ALTER TABLE "progress" ADD COLUMN IF NOT EXISTS "due_at" timestamp`,
  `CREATE TABLE IF NOT EXISTS "activity" (
    "id" serial PRIMARY KEY NOT NULL,
    "user_id" integer NOT NULL,
    "day" varchar(10) NOT NULL,
    "count" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp DEFAULT now() NOT NULL,
    CONSTRAINT "activity_user_day_unique" UNIQUE("user_id","day")
  )`,
  `CREATE INDEX IF NOT EXISTS "progress_user_id_idx" ON "progress"("user_id")`,
  `CREATE INDEX IF NOT EXISTS "activity_user_id_idx" ON "activity"("user_id")`,
];

export function ensureSchema(): Promise<boolean> {
  if (globalForDb.__hafizSchemaEnsured) return globalForDb.__hafizSchemaEnsured;
  if (!pool) return Promise.resolve(false);
  globalForDb.__hafizSchemaEnsured = (async () => {
    const client = await pool.connect();
    try {
      for (const sql of SCHEMA_STATEMENTS) await client.query(sql);
      return true;
    } catch (err) {
      console.error("[db] schema bootstrap failed:", err);
      // Allow retry on a later cold request.
      globalForDb.__hafizSchemaEnsured = undefined;
      return false;
    } finally {
      client.release();
    }
  })();
  return globalForDb.__hafizSchemaEnsured;
}

/**
 * Throws a clear, user-safe error when the database is not configured.
 * Also guarantees the schema exists before first use so pages don't crash on a
 * fresh production database.
 */
export async function requireDb() {
  if (!db) {
    const err = new Error("DATABASE_NOT_CONFIGURED");
    err.name = "DatabaseNotConfiguredError";
    throw err;
  }
  await ensureSchema();
  return db;
}

export function isDbAvailable(): boolean {
  return db !== null;
}
