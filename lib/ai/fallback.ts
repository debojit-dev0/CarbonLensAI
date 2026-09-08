import { OptimizationRecommendation, Workload } from "@/types";
import { RegionAtHour } from "@/lib/optimization/engine";

/**
 * Deterministic, template-based recommendation. This is what powers the
 * AI Assistant and the recommendation cards whenever NVIDIA_API_KEY is
 * missing or the NVIDIA API call fails — the app must never go blank.
 */
export function fallbackRecommendation(
  workload: Workload,
  rec: OptimizationRecommendation
): string {
  if (rec.costSavingUsd <= 0) {
    return [
      `${workload.name} is already running in its lowest total-cost configuration (${rec.currentRegion} at ${rec.currentIntensity} gCO2e/kWh, SCI ${rec.currentSci} gCO2e/hr).`,
      `No region or time-shift currently available would reduce cost or carbon further.`,
      `Current estimated impact: ${rec.currentImpactKg} kg CO2e ($${rec.currentCostUsd.toFixed(2)}).`,
    ].join(" ");
  }

  const macLine =
    rec.macUsdPerTonne === null
      ? ""
      : `\nMarginal abatement cost vs. ${rec.coalBaselineRegion} (dirtiest region): $${rec.macUsdPerTonne}/tonne CO2e${rec.macUsdPerTonne < 0 ? " — cheaper AND cleaner." : "."}`;

  return [
    `Your workload is currently running in a high-carbon, high-cost window in ${rec.currentRegion} (${rec.currentIntensity} gCO2e/kWh).`,
    ``,
    `I recommend moving ${workload.name} to ${rec.recommendedRegion} at ${rec.recommendedStart}, where grid intensity drops to ${rec.recommendedIntensity} gCO2e/kWh.`,
    ``,
    `Estimated impact:`,
    `Current: ${rec.currentImpactKg} kg CO2e · SCI ${rec.currentSci} gCO2e/hr · $${rec.currentCostUsd.toFixed(2)}`,
    `Optimized: ${rec.projectedImpactKg} kg CO2e · SCI ${rec.projectedSci} gCO2e/hr · $${rec.projectedCostUsd.toFixed(2)}`,
    `Potential carbon reduction: ${rec.savingKg} kg CO2e (${rec.reductionPct}%)`,
    `Potential cost saving: $${rec.costSavingUsd.toFixed(2)}${macLine}`,
  ].join("\n");
}

/**
 * Answers a question about one specific hour ("which region at 6pm?") using
 * the real per-hour comparison across all three regions, instead of the
 * single global-best answer analyzeOptimization() always returns.
 */
export function fallbackHourSpecificReply(
  workload: Workload,
  hour: number,
  comparison: RegionAtHour[],
  ambiguousMeridiem: boolean = false
): string {
  const best = comparison[0];
  const clock = `${hour.toString().padStart(2, "0")}:00`;

  const lines = [
    ambiguousMeridiem
      ? `Reading "${clock}" as ${clock} on the 24-hour clock — say "6pm" or "18:00" if you meant the evening.\n`
      : null,
    `At ${clock}, here's how the regions compare for ${workload.name}:`,
    ``,
    ...comparison.map(
      (c, i) =>
        `${i === 0 ? "→ " : "  "}${c.region}: ${c.intensity} gCO2e/kWh · ${c.impactKg} kg CO2e · $${c.costUsd.toFixed(2)}`
    ),
    ``,
    `Lowest total cost at ${clock} is ${best.region} — $${best.costUsd.toFixed(2)} (electricity + carbon price combined).`,
  ].filter((l): l is string => l !== null);
  return lines.join("\n");
}

export function fallbackChatReply(
  question: string,
  workload: Workload | undefined,
  rec: OptimizationRecommendation | undefined
): string {
  if (!workload || !rec) {
    return "I don't have enough workload context to give a specific recommendation yet. Open a workload from the Workloads page, then ask me again.";
  }
  const base = fallbackRecommendation(workload, rec);
  return `${base}\n\n(Answering "${question.trim()}" using the deterministic optimization engine — NVIDIA AI is currently in fallback mode.)`;
}
