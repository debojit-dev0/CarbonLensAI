import { NextRequest, NextResponse } from "next/server";
import { getTelemetryHistory, getWorkloadById } from "@/lib/telemetry/service";

export async function GET(_req: NextRequest, { params }: { params: { workloadId: string } }) {
  const workload = getWorkloadById(params.workloadId);
  if (!workload) {
    return NextResponse.json({ error: "Workload not found" }, { status: 404 });
  }
  return NextResponse.json({ history: getTelemetryHistory(params.workloadId) });
}
