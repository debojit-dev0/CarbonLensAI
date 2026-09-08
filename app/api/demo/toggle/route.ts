import { NextRequest, NextResponse } from "next/server";
import { isPaused, setPaused } from "@/lib/telemetry/store";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const paused = typeof body?.paused === "boolean" ? body.paused : !isPaused();
  setPaused(paused);
  return NextResponse.json({ paused });
}
