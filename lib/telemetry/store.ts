import { Metrics, TelemetryPoint, Workload } from "@/types";
import { calculateCarbonImpact, secondsToHours } from "@/lib/carbon/engine";
import { getRegion } from "@/lib/carbon/intensity";

// Demo fallback: real telemetry would come from NVIDIA DCGM / nvidia-smi
// exporters, or a cluster-level metrics pipeline. This simulator stands in
// for that source. The rest of the app (API routes, UI) is written against
// the Workload/TelemetryPoint shape only, so a real collector can replace
// this module without touching anything downstream.

interface DemoState {
  workloads: Workload[];
  history: Record<string, TelemetryPoint[]>;
  carbonSavedKg: number;
  intervalStarted: boolean;
  tick: number;
  paused: boolean;
}

const g = globalThis as unknown as { __carbonlensState?: DemoState };

function seedWorkloads(): Workload[] {
  return [
    {
      id: "llm-training",
      name: "LLM Training",
      type: "Training",
      region: "Region A",
      status: "RUNNING",
      gpu: 87,
      cpu: 62,
      ram: 74,
      power: 52.4,
      runtimeSeconds: 4 * 3600 + 32 * 60 + 18,
      energyKwh: 410,
      carbonKg: 118,
    },
    {
      id: "inference-api",
      name: "Inference API",
      type: "Inference",
      region: "Region B",
      status: "RUNNING",
      gpu: 68,
      cpu: 41,
      ram: 55,
      power: 18.2,
      runtimeSeconds: 2 * 3600 + 18 * 60 + 42,
      energyKwh: 210,
      carbonKg: 62,
    },
    {
      id: "analytics",
      name: "Analytics",
      type: "Batch",
      region: "Region C",
      status: "RUNNING",
      gpu: 44,
      cpu: 35,
      ram: 48,
      power: 11.5,
      runtimeSeconds: 5 * 3600 + 41 * 60 + 10,
      energyKwh: 280,
      carbonKg: 91,
    },
    {
      id: "data-processing",
      name: "Data Processing",
      type: "Batch",
      region: "Region A",
      status: "IDLE",
      gpu: 31,
      cpu: 28,
      ram: 33,
      power: 6.1,
      runtimeSeconds: 1 * 3600 + 42 * 60 + 12,
      energyKwh: 120,
      carbonKg: 38,
    },
  ];
}

function initState(): DemoState {
  const workloads = seedWorkloads();
  const history: Record<string, TelemetryPoint[]> = {};
  for (const w of workloads) {
    history[w.id] = [
      {
        timestamp: Date.now(),
        gpu: w.gpu,
        cpu: w.cpu,
        power: w.power,
        energyKwh: w.energyKwh,
        carbonKg: w.carbonKg,
      },
    ];
  }
  return {
    workloads,
    history,
    carbonSavedKg: 318,
    intervalStarted: false,
    tick: 0,
    paused: false,
  };
}

export function getState(): DemoState {
  if (!g.__carbonlensState) {
    g.__carbonlensState = initState();
  }
  ensureTicking();
  return g.__carbonlensState;
}

function clamp(v: number, min: number, max: number) {
  return Math.min(max, Math.max(min, v));
}

function jitter(value: number, spread: number, min: number, max: number) {
  return clamp(value + (Math.random() - 0.5) * spread, min, max);
}

function stepWorkload(w: Workload) {
  if (w.status === "STOPPED") return;

  const running = w.status === "RUNNING" || w.status === "OPTIMIZED";
  if (running) {
    w.gpu = Math.round(jitter(w.gpu, 6, 15, 99));
    w.cpu = Math.round(jitter(w.cpu, 5, 10, 95));
    w.ram = Math.round(jitter(w.ram, 3, 20, 96));
    w.power = Math.round(jitter(w.power, 2.2, 1, 90) * 10) / 10;
    w.runtimeSeconds += 2;

    const intensity = getRegion(w.region).gPerKwh;
    const stepHours = secondsToHours(2);
    const stepImpact = calculateCarbonImpact(w.power, stepHours, intensity, 1.1);
    w.energyKwh = Math.round((w.energyKwh + stepImpact.energyKwh) * 100) / 100;
    w.carbonKg = Math.round((w.carbonKg + stepImpact.carbonKg) * 100) / 100;
  } else {
    // idle: tiny drift, mostly flat
    w.gpu = Math.round(jitter(w.gpu, 1.5, 5, 40));
    w.cpu = Math.round(jitter(w.cpu, 1.5, 5, 40));
  }
}

function ensureTicking() {
  const state = g.__carbonlensState!;
  if (state.intervalStarted) return;
  state.intervalStarted = true;

  setInterval(() => {
    if (state.paused) return;
    state.tick += 1;
    for (const w of state.workloads) {
      stepWorkload(w);
      const hist = state.history[w.id] ?? [];
      hist.push({
        timestamp: Date.now(),
        gpu: w.gpu,
        cpu: w.cpu,
        power: w.power,
        energyKwh: w.energyKwh,
        carbonKg: w.carbonKg,
      });
      state.history[w.id] = hist.slice(-60); // keep last 60 points (~2min at 2s)
    }
  }, 2000);
}

export function getWorkloads(): Workload[] {
  return getState().workloads;
}

export function getWorkload(id: string): Workload | undefined {
  return getState().workloads.find((w) => w.id === id);
}

export function getHistory(id: string): TelemetryPoint[] {
  return getState().history[id] ?? [];
}

export function computeMetrics(): Metrics {
  const state = getState();
  const totalCarbonKg = state.workloads.reduce((sum, w) => sum + w.carbonKg, 0);
  const totalEnergyMwh =
    state.workloads.reduce((sum, w) => sum + w.energyKwh, 0) / 1000;
  const activeWorkloads = state.workloads.filter(
    (w) => w.status === "RUNNING" || w.status === "OPTIMIZED"
  ).length;

  return {
    totalCarbonKg: Math.round(totalCarbonKg),
    totalEnergyMwh: Math.round(totalEnergyMwh * 10) / 10,
    activeWorkloads,
    carbonSavedKg: Math.round(state.carbonSavedKg),
    deltaCarbonPct: -12.4,
    deltaEnergyPct: 8.2,
    deltaSavedPct: 21.6,
  };
}

export function applyOptimization(workloadId: string, savingKg: number, newRegion: Workload["region"]) {
  const state = getState();
  const w = state.workloads.find((x) => x.id === workloadId);
  if (!w) return;
  w.status = "OPTIMIZED";
  w.region = newRegion;
  w.optimizedSavingKg = savingKg;
  state.carbonSavedKg += savingKg;
}

export function setPaused(paused: boolean) {
  getState().paused = paused;
}

export function isPaused(): boolean {
  return getState().paused;
}

export function resetDemo() {
  g.__carbonlensState = initState();
  ensureTicking();
}
