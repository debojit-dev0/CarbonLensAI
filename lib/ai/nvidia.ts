import { OptimizationRecommendation, Workload } from "@/types";
import { fallbackRecommendation } from "@/lib/ai/fallback";

const NVIDIA_BASE_URL =
  process.env.NVIDIA_BASE_URL || "https://integrate.api.nvidia.com/v1";
const NVIDIA_MODEL = process.env.NVIDIA_MODEL || "meta/llama-3.1-70b-instruct";

export function nvidiaConfigured(): boolean {
  return Boolean(process.env.NVIDIA_API_KEY);
}

function buildPrompt(workload: Workload, rec: OptimizationRecommendation, question?: string) {
  const context = `
Workload: ${workload.name}
Type: ${workload.type}
GPU: ${workload.gpu}%
CPU: ${workload.cpu}%
Runtime: ${(workload.runtimeSeconds / 3600).toFixed(2)} hours
Energy: ${workload.energyKwh} kWh
Current Region: ${rec.currentRegion}
Current Carbon Intensity: ${rec.currentIntensity} gCO2e/kWh
Current Estimated Impact: ${rec.currentImpactKg} kg CO2e
Current SCI (Software Carbon Intensity, gCO2e/compute-hour): ${rec.currentSci}
Current Total Cost (electricity + carbon price): $${rec.currentCostUsd.toFixed(2)}
Alternative Region: ${rec.recommendedRegion}
Alternative Carbon Intensity: ${rec.recommendedIntensity} gCO2e/kWh
Alternative Start Time: ${rec.recommendedStart}
Projected Impact: ${rec.projectedImpactKg} kg CO2e
Projected SCI: ${rec.projectedSci}
Projected Total Cost: $${rec.projectedCostUsd.toFixed(2)}
Potential Carbon Saving: ${rec.savingKg} kg CO2e (${rec.reductionPct}%)
Potential Cost Saving: $${rec.costSavingUsd.toFixed(2)}
Marginal Abatement Cost vs. ${rec.coalBaselineRegion} (dirtiest region): ${rec.macUsdPerTonne === null ? "n/a" : `$${rec.macUsdPerTonne}/tonne CO2e`}
`.trim();

  // Note: questions naming a specific time of day never reach this prompt —
  // the API route answers those deterministically before NVIDIA is called.
  const instruction = question
    ? `A user asked: "${question}". Using the workload telemetry and carbon data below, answer them directly and specifically.`
    : `Analyze the workload telemetry and carbon data below, and produce a short, direct carbon-optimization recommendation.`;

  return `You are the CarbonLens AI assistant, a carbon-aware compute optimization advisor. ${instruction}

Explain the recommendation simply, cite the concrete before/after numbers, and keep the whole answer under 140 words. Do not invent numbers beyond what is given.

${context}`;
}

/**
 * Calls the NVIDIA AI / NIM chat completions endpoint. Falls back to the
 * deterministic recommendation engine on any missing key, network error,
 * or non-2xx response, so the app never breaks without the key.
 */
export async function getAIRecommendation(
  workload: Workload,
  rec: OptimizationRecommendation,
  question?: string
): Promise<{ text: string; mode: "nvidia" | "fallback" }> {
  if (!nvidiaConfigured()) {
    return { text: fallbackRecommendation(workload, rec), mode: "fallback" };
  }

  try {
    const res = await fetch(`${NVIDIA_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.NVIDIA_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: NVIDIA_MODEL,
        messages: [{ role: "user", content: buildPrompt(workload, rec, question) }],
        temperature: 0.3,
        max_tokens: 300,
      }),
      // keep the demo responsive even if NVIDIA is slow/unreachable
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) {
      return { text: fallbackRecommendation(workload, rec), mode: "fallback" };
    }

    const data = await res.json();
    const text = data?.choices?.[0]?.message?.content;
    if (!text) {
      return { text: fallbackRecommendation(workload, rec), mode: "fallback" };
    }
    return { text, mode: "nvidia" };
  } catch {
    return { text: fallbackRecommendation(workload, rec), mode: "fallback" };
  }
}
