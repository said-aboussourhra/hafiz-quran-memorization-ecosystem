import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

// منع الاتصال بقاعدة البيانات أثناء البناء
const isBuild = process.env.NODE_ENV === 'production' && !process.env.DATABASE_URL;

let pool: Pool | null = null;
let db: any = null;

if (!isBuild && process.env.DATABASE_URL) {
  const globalForDb = globalThis as typeof globalThis & {
    __hafizPostgresqlPool?: Pool;
  };

  pool =
    globalForDb.__hafizPostgresqlPool ??
    new Pool({
      connectionString: process.env.DATABASE_URL,
    });

  if (process.env.NODE_ENV !== "production") {
    globalForDb.__hafizPostgresqlPool = pool;
  }

  db = drizzle(pool);
} else {
  console.log('⚠️ Skipping database connection during build');
}

export { pool, db };