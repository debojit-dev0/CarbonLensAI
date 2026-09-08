import { NextResponse } from "next/server";
import { listWorkloads } from "@/lib/telemetry/service";

export async function GET() {
  try {
    return NextResponse.json({ workloads: listWorkloads() });
  } catch (err) {
    return NextResponse.json({ error: "Failed to load workloads" }, { status: 500 });
  }
}
