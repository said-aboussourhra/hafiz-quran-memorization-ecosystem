import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required");
}

const globalForDb = globalThis as typeof globalThis & {
  __hafizPostgresqlPool?: Pool;
};

const pool = globalForDb.__hafizPostgresqlPool ?? new Pool({
  connectionString: databaseUrl,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

if (process.env.NODE_ENV !== "production") {
  globalForDb.__hafizPostgresqlPool = pool;
}

const db = drizzle(pool);

export { pool, db };