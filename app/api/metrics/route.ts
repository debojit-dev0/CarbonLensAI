import { NextResponse } from "next/server";
import { computeMetrics } from "@/lib/telemetry/store";

export async function GET() {
  return NextResponse.json({ metrics: computeMetrics() });
}
