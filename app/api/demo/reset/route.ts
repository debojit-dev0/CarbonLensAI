import { NextResponse } from "next/server";
import { resetDemo } from "@/lib/telemetry/store";

export async function POST() {
  resetDemo();
  return NextResponse.json({ ok: true });
}
