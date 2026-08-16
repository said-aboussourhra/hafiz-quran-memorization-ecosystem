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
      new Pool({ connectionString: databaseUrl }))
  : null;

if (process.env.NODE_ENV !== "production" && pool) {
  globalForDb.__hafizPostgresqlPool = pool;
}

export const db = pool ? drizzle(pool) : null;