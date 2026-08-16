import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

// تحقق من وجود DATABASE_URL
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.warn("⚠️ DATABASE_URL is not set. Database features will not work.");
}

// منع الاتصال أثناء البناء
const isBuild = process.env.NODE_ENV === 'production' && !databaseUrl;

let pool: Pool | null = null;
let db: any = null;

if (!isBuild && databaseUrl) {
  try {
    const globalForDb = globalThis as typeof globalThis & {
      __hafizPostgresqlPool?: Pool;
    };

    pool = globalForDb.__hafizPostgresqlPool ?? new Pool({
      connectionString: databaseUrl,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });

    if (process.env.NODE_ENV !== "production") {
      globalForDb.__hafizPostgresqlPool = pool;
    }

    db = drizzle(pool);
    console.log("✅ Database connected successfully");
  } catch (error) {
    console.error("❌ Database connection error:", error);
    pool = null;
    db = null;
  }
} else {
  console.log("⚠️ Skipping database connection during build or missing DATABASE_URL");
}

export { pool, db };