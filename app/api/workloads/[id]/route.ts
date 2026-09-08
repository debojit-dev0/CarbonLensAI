import { NextRequest, NextResponse } from "next/server";
import { getWorkloadById } from "@/lib/telemetry/service";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const workload = getWorkloadById(params.id);
  if (!workload) {
    return NextResponse.json({ error: "Workload not found" }, { status: 404 });
  }
  return NextResponse.json({ workload });
}
