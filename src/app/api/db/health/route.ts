import { NextResponse } from "next/server";
import { ensureSchema, isDbAvailable, pool } from "@/db";

export const dynamic = "force-dynamic";

/**
 * Diagnostic: verifies connectivity AND that the schema is bootstrapped.
 * Safe to expose (no data returned). Visiting /api/db/health should report ok:true.
 */
export async function GET() {
  if (!isDbAvailable() || !pool) {
    return NextResponse.json({ ok: false, reason: "DATABASE_NOT_CONFIGURED" }, { status: 500 });
  }
  try {
    await ensureSchema();
    const r = await pool.query("select current_database() as db");
    return NextResponse.json({ ok: true, database: r.rows[0]?.db ?? null });
  } catch (err) {
    return NextResponse.json(
      { ok: false, reason: err instanceof Error ? err.message : "UNKNOWN" },
      { status: 500 },
    );
  }
}
