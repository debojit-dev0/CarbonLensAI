import { NextRequest, NextResponse } from "next/server";
import { getWorkloadById } from "@/lib/telemetry/service";
import { analyzeOptimization, compareRegionsAtHour } from "@/lib/optimization/engine";
import { parseHourFromText } from "@/lib/carbon/intensity";
import { getAIRecommendation, nvidiaConfigured } from "@/lib/ai/nvidia";
import { fallbackChatReply, fallbackHourSpecificReply } from "@/lib/ai/fallback";

export async function POST(req: NextRequest) {
  try {
    const { workloadId, question } = await req.json();
    if (!workloadId) {
      return NextResponse.json({ error: "workloadId is required" }, { status: 400 });
    }
    const workload = getWorkloadById(workloadId);
    if (!workload) {
      return NextResponse.json({ error: "Workload not found" }, { status: 404 });
    }

    const recommendation = analyzeOptimization(workload);

    // If the question names a specific time ("6pm", "18:00", "noon", bare
    // "6"), answer with the real per-hour region comparison — and do this
    // deterministically, bypassing NVIDIA entirely. An LLM asked to "use
    // these numbers, not those" isn't reliably obedient about it, and a
    // numbers-driven answer like this should never depend on whether a
    // model chose to follow that instruction.
    const parsedTime = question ? parseHourFromText(question) : null;

    if (parsedTime !== null) {
      const hourComparison = compareRegionsAtHour(workload, parsedTime.hour);
      const text = fallbackHourSpecificReply(workload, parsedTime.hour, hourComparison, parsedTime.ambiguous);
      return NextResponse.json({ text, mode: "lookup", recommendation, hourComparison });
    }

    if (!nvidiaConfigured()) {
      const text = fallbackChatReply(question ?? "", workload, recommendation);
      return NextResponse.json({ text, mode: "fallback", recommendation });
    }

    const ai = await getAIRecommendation(workload, recommendation, question);
    return NextResponse.json({ text: ai.text, mode: ai.mode, recommendation });
  } catch (err) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}
