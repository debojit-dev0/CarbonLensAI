import { NextRequest, NextResponse } from "next/server";
import { getWorkloadById } from "@/lib/telemetry/service";
import { evaluateMacAdvisor } from "@/lib/optimization/engine";

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
    const result = evaluateMacAdvisor(workload);
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}
