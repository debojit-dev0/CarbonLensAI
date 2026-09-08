import { NextRequest, NextResponse } from "next/server";
import { getWorkloadById } from "@/lib/telemetry/service";
import { analyzeOptimization } from "@/lib/optimization/engine";
import { applyOptimization, getWorkload } from "@/lib/telemetry/store";

export async function POST(req: NextRequest) {
  try {
    const { workloadId } = await req.json();
    if (!workloadId) {
      return NextResponse.json({ error: "workloadId is required" }, { status: 400 });
    }
    const workload = getWorkloadById(workloadId);
    if (!workload) {
      return NextResponse.json({ error: "Workload not found" }, { status: 404 });
    }
    const recommendation = analyzeOptimization(workload);
    applyOptimization(workloadId, recommendation.savingKg, recommendation.recommendedRegion);
    const updated = getWorkload(workloadId);
    return NextResponse.json({ workload: updated, recommendation });
  } catch (err) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}
