import { CarbonImpactResult, SCIResult } from "@/types";

/**
 * Real carbon calculation engine.
 *
 * Energy (kWh) = Power (kW) x Runtime (hours) x PUE
 * CO2e        = Energy (kWh) x Carbon Intensity (gCO2e/kWh)
 *
 * PUE (Power Usage Effectiveness) accounts for data-center overhead
 * (cooling, power delivery loss, etc). Default 1.0 = no overhead assumed.
 *
 * estimatedCost is a rough USD estimate using an average industrial
 * electricity rate; it exists to make the numbers feel tangible, and is
 * clearly presented as an estimate, not billing-grade accounting.
 */

const USD_PER_KWH = 0.14;

export function calculateCarbonImpact(
  power: number,
  runtimeHours: number,
  carbonIntensity: number,
  pue: number = 1.0
): CarbonImpactResult {
  if (power < 0 || runtimeHours < 0 || carbonIntensity < 0 || pue < 0) {
    throw new Error("calculateCarbonImpact: inputs must be non-negative");
  }

  const energyKwh = power * runtimeHours * pue;
  const carbonGrams = energyKwh * carbonIntensity;
  const carbonKg = carbonGrams / 1000;
  const estimatedCost = energyKwh * USD_PER_KWH;

  return {
    energyKwh: round(energyKwh, 3),
    carbonGrams: round(carbonGrams, 1),
    carbonKg: round(carbonKg, 3),
    carbonIntensity,
    estimatedCost: round(estimatedCost, 2),
  };
}

/**
 * Software Carbon Intensity (SCI), per the Green Software Foundation spec:
 *
 *   SCI = (E x I + M) / R
 *
 *   E = energy consumed by the workload (kWh)
 *   I = carbon intensity of the energy grid (gCO2e/kWh)
 *   M = embodied emissions of the hardware, amortized over this run (gCO2e)
 *   R = functional unit — what the score is "per" (here: per compute-hour)
 *
 * E x I is the operational footprint; M is manufacturing/hardware footprint
 * folded in so a workload can't look "clean" just by ignoring the GPU it
 * runs on. Dividing by R makes the score comparable across workloads of
 * different sizes/durations.
 */
export function calculateSCI(
  energyKwh: number,
  carbonIntensity: number,
  embodiedGrams: number,
  functionalUnitR: number
): SCIResult {
  if (energyKwh < 0 || carbonIntensity < 0 || embodiedGrams < 0) {
    throw new Error("calculateSCI: inputs must be non-negative");
  }
  if (functionalUnitR <= 0) {
    throw new Error("calculateSCI: functionalUnitR must be > 0");
  }

  const operationalGrams = energyKwh * carbonIntensity;
  const totalGrams = operationalGrams + embodiedGrams;
  const sciPerUnit = totalGrams / functionalUnitR;

  return {
    operationalGrams: round(operationalGrams, 1),
    embodiedGrams: round(embodiedGrams, 1),
    totalGrams: round(totalGrams, 1),
    functionalUnitR: round(functionalUnitR, 3),
    sciPerUnit: round(sciPerUnit, 2),
  };
}

/**
 * Total dollar cost of running a workload: the electricity bill plus a
 * carbon price on the emissions produced, so "cheap but dirty" regions
 * don't look artificially cheap.
 *
 *   Total $ cost = (electricity price x energy used) + (carbon emitted x price-of-carbon)
 */
export function calculateTotalCost(
  energyKwh: number,
  electricityPricePerKwh: number,
  carbonKg: number,
  priceOfCarbonPerTonne: number
): number {
  const electricityCost = electricityPricePerKwh * energyKwh;
  const carbonCost = (carbonKg / 1000) * priceOfCarbonPerTonne;
  return round(electricityCost + carbonCost, 4);
}

/**
 * Marginal Abatement Cost (MAC): the dollar cost per tonne of CO2 avoided
 * by moving a workload from a dirty ("coal") baseline to a candidate
 * region s, using each region's electricity price as the cost signal:
 *
 *   MAC_s = (C_s - C_coal) / (I_coal - I_s) x 1,000,000
 *
 *   C_s, C_coal   = electricity price in the candidate / coal-baseline region ($/kWh)
 *   I_s, I_coal   = carbon intensity in the candidate / coal-baseline region (gCO2e/kWh)
 *   x 1,000,000   = converts $/gCO2e to $/tonne CO2e (1 tonne = 1,000,000 g)
 *
 * A negative MAC means the switch is both cheaper AND cleaner — free
 * abatement. A positive MAC is the price you pay per tonne avoided.
 * Returns null when I_coal === I_s (no emissions difference to price).
 */
export function calculateMAC(
  costCandidatePerKwh: number,
  costCoalPerKwh: number,
  intensityCandidate: number,
  intensityCoal: number
): number | null {
  const intensityDelta = intensityCoal - intensityCandidate;
  if (intensityDelta === 0) return null;

  const mac = ((costCandidatePerKwh - costCoalPerKwh) / intensityDelta) * 1_000_000;
  return round(mac, 2);
}

export function round(value: number, decimals: number): number {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}

export function secondsToHours(seconds: number): number {
  return seconds / 3600;
}

export function formatRuntime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

