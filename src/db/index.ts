import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.warn("⚠️ DATABASE_URL is not set. Database features will not work.");
}

const globalForDb = globalThis as typeof globalThis & {
  __hafizPostgresqlPool?: Pool;
};

export const pool = databaseUrl
  ? (globalForDb.__hafizPostgresqlPool ??
      new Pool({ 
        connectionString: databaseUrl,
        max: 10,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 10000,
      }))
  : null;

if (process.env.NODE_ENV !== "production" && pool) {
  globalForDb.__hafizPostgresqlPool = pool;
}

export const db = pool ? drizzle(pool) : null;

/**
 * Throws a clear, user-safe error when the database is not configured.
 * Use this at the top of any server action / route / data function that needs
 * a live connection so we never crash with a raw "Cannot read properties of null".
 */
export async function requireDb() {
  if (!db) {
    const err = new Error("DATABASE_NOT_CONFIGURED");
    err.name = "DatabaseNotConfiguredError";
    throw err;
  }
  return db;
}

export function isDbAvailable(): boolean {
  return db !== null;
}