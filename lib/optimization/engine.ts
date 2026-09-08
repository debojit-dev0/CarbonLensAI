import { OptimizationRecommendation, Workload, RegionIntensity } from "@/types";
import {
  calculateCarbonImpact,
  calculateSCI,
  calculateTotalCost,
  calculateMAC,
  secondsToHours,
  round,
} from "@/lib/carbon/engine";
import {
  REGIONS,
  bestWindow,
  getRegion,
  coalBaselineRegion,
  intensityAtHour,
  PRICE_OF_CARBON_USD_PER_TONNE,
  EMBODIED_GRAMS_PER_HOUR,
} from "@/lib/carbon/intensity";

/**
 * Analyzes a workload against every region + that region's lowest-carbon
 * time window, and returns the alternative that minimizes total dollar
 * cost (electricity + carbon price) — not raw kg CO2 alone. This is what
 * "optimize the region based on cost of carbon emission and the cost of
 * skipping coal" means in practice: cheap-but-dirty regions get penalized
 * by the carbon price term, clean-but-pricier regions get credited for it.
 */
export function analyzeOptimization(workload: Workload): OptimizationRecommendation {
  const runtimeHours = secondsToHours(workload.runtimeSeconds);
  const embodiedPerHour = EMBODIED_GRAMS_PER_HOUR[workload.type] ?? 300;
  const embodiedGrams = embodiedPerHour * runtimeHours;

  const currentRegionData = getRegion(workload.region);
  const currentEnergyKwh = workload.power * runtimeHours * 1.1; // PUE 1.1
  const currentImpact = calculateCarbonImpact(workload.power, runtimeHours, currentRegionData.gPerKwh, 1.1);
  const currentSci = calculateSCI(currentEnergyKwh, currentRegionData.gPerKwh, embodiedGrams, runtimeHours);
  const currentCostUsd = calculateTotalCost(
    currentEnergyKwh,
    currentRegionData.electricityPricePerKwh,
    currentImpact.carbonKg,
    PRICE_OF_CARBON_USD_PER_TONNE
  );

  // Small epsilon bias so that, when two regions tie on total cost, the
  // engine prefers actually recommending a region switch over just a
  // same-region time-shift — a more actionable recommendation for the
  // same outcome.
  const SAME_REGION_EPSILON_USD = 0.0001;

  let best: {
    region: (typeof REGIONS)[number];
    window: string;
    intensity: number;
    impactKg: number;
    costUsd: number;
    effectiveCostUsd: number;
  } | null = null;

  for (const region of REGIONS) {
    const { window, value } = bestWindow(region);
    const energyKwh = workload.power * runtimeHours * 1.1;
    const impact = calculateCarbonImpact(workload.power, runtimeHours, value, 1.1);
    const costUsd = calculateTotalCost(
      energyKwh,
      region.electricityPricePerKwh,
      impact.carbonKg,
      PRICE_OF_CARBON_USD_PER_TONNE
    );
    const isCurrentRegion = region.region === workload.region;
    const effectiveCostUsd = isCurrentRegion ? costUsd + SAME_REGION_EPSILON_USD : costUsd;

    if (!best || effectiveCostUsd < best.effectiveCostUsd) {
      best = { region, window, intensity: value, impactKg: impact.carbonKg, costUsd, effectiveCostUsd };
    }
  }

  const chosen = best!;
  const chosenEnergyKwh = workload.power * runtimeHours * 1.1;
  const chosenSci = calculateSCI(chosenEnergyKwh, chosen.intensity, embodiedGrams, runtimeHours);

  const savingKg = round(currentImpact.carbonKg - chosen.impactKg, 2);
  const reductionPct =
    currentImpact.carbonKg > 0 ? round((savingKg / currentImpact.carbonKg) * 100, 1) : 0;
  const costSavingUsd = round(currentCostUsd - chosen.costUsd, 4);

  const coal = coalBaselineRegion();
  const macUsdPerTonne = calculateMAC(
    chosen.region.electricityPricePerKwh,
    coal.electricityPricePerKwh,
    chosen.intensity,
    coal.gPerKwh
  );

  return {
    workloadId: workload.id,
    currentRegion: workload.region,
    currentIntensity: currentRegionData.gPerKwh,
    currentImpactKg: currentImpact.carbonKg,
    recommendedRegion: chosen.region.region,
    recommendedIntensity: chosen.intensity,
    recommendedStart: chosen.window,
    projectedImpactKg: chosen.impactKg,
    savingKg: Math.max(savingKg, 0),
    reductionPct: Math.max(reductionPct, 0),
    currentCostUsd,
    projectedCostUsd: chosen.costUsd,
    costSavingUsd,
    currentSci: currentSci.sciPerUnit,
    projectedSci: chosenSci.sciPerUnit,
    macUsdPerTonne,
    coalBaselineRegion: coal.region,
  };
}

export interface RegionAtHour {
  region: RegionIntensity["region"];
  intensity: number;
  impactKg: number;
  costUsd: number;
}

/**
 * Compares every region's carbon intensity and total cost at one specific
 * hour (rather than each region's best window across the whole day) — used
 * to answer time-specific questions like "which region at 6pm?" instead of
 * always returning the single global-best answer regardless of what was
 * asked.
 */
export function compareRegionsAtHour(workload: Workload, hour: number): RegionAtHour[] {
  const runtimeHours = secondsToHours(workload.runtimeSeconds);
  const energyKwh = workload.power * runtimeHours * 1.1;

  return REGIONS.map((region) => {
    const intensity = intensityAtHour(region, hour);
    const impact = calculateCarbonImpact(workload.power, runtimeHours, intensity, 1.1);
    const costUsd = calculateTotalCost(
      energyKwh,
      region.electricityPricePerKwh,
      impact.carbonKg,
      PRICE_OF_CARBON_USD_PER_TONNE
    );
    return { region: region.region, intensity, impactKg: impact.carbonKg, costUsd };
  }).sort((a, b) => a.costUsd - b.costUsd);
}
