import { NextResponse } from "next/server";
import { searchQuran } from "@/lib/search";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") ?? "";
  if (q.trim().length < 2) {
    return NextResponse.json({ ok: true, matches: [] });
  }
  const matches = await searchQuran(q);
  return NextResponse.json({ ok: true, matches });
}
