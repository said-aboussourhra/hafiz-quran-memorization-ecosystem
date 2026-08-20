import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { gradeReview } from "@/lib/progress";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
    const body = await req.json();
    const surahNumber = Number(body.surahNumber);
    const quality = Number(body.quality);
    if (!surahNumber || surahNumber < 1 || surahNumber > 114 || ![0, 3, 4, 5].includes(quality)) {
      return NextResponse.json({ ok: false, error: "bad_input" }, { status: 400 });
    }
    const result = await gradeReview(user.id, surahNumber, quality);
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  }
}
