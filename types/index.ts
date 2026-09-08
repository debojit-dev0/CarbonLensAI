export type WorkloadType = "Training" | "Inference" | "Batch";
export type WorkloadStatus = "RUNNING" | "IDLE" | "OPTIMIZED" | "STOPPED";
export type Region = "Region A" | "Region B" | "Region C";

export interface Workload {
  id: string;
  name: string;
  type: WorkloadType;
  region: Region;
  status: WorkloadStatus;
  gpu: number; // %
  cpu: number; // %
  ram: number; // %
  power: number; // kW
  runtimeSeconds: number;
  energyKwh: number;
  carbonKg: number;
  optimizedSavingKg?: number;
}

export interface TelemetryPoint {
  timestamp: number;
  gpu: number;
  cpu: number;
  power: number;
  energyKwh: number;
  carbonKg: number;
}

export interface CarbonIntensityPoint {
  hour: string; // "00:00"
  value: number; // gCO2e/kWh
}

export interface RegionIntensity {
  region: Region;
  gPerKwh: number;
  curve: CarbonIntensityPoint[];
  electricityPricePerKwh: number; // $/kWh — used for total-cost and MAC calc
}

export interface CarbonImpactResult {
  energyKwh: number;
  carbonGrams: number;
  carbonKg: number;
  carbonIntensity: number;
  estimatedCost: number;
}

export interface SCIResult {
  operationalGrams: number; // E x I
  embodiedGrams: number; // M
  totalGrams: number; // E x I + M
  functionalUnitR: number; // R
  sciPerUnit: number; // (E x I + M) / R
}

export interface OptimizationRecommendation {
  workloadId: string;
  currentRegion: Region;
  currentIntensity: number;
  currentImpactKg: number;
  recommendedRegion: Region;
  recommendedIntensity: number;
  recommendedStart: string;
  projectedImpactKg: number;
  savingKg: number;
  reductionPct: number;
  // Cost / SCI extensions
  currentCostUsd: number;
  projectedCostUsd: number;
  costSavingUsd: number;
  currentSci: number;
  projectedSci: number;
  macUsdPerTonne: number | null; // $ per tonne CO2 abated vs. the dirtiest ("coal") region
  coalBaselineRegion: Region;
}

export interface Metrics {
  totalCarbonKg: number;
  totalEnergyMwh: number;
  activeWorkloads: number;
  carbonSavedKg: number;
  deltaCarbonPct: number;
  deltaEnergyPct: number;
  deltaSavedPct: number;
}

export interface SystemStatus {
  telemetry: "active" | "demo";
  database: "connected" | "demo";
  ai: "nvidia" | "fallback";
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}
