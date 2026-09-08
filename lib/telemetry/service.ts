import { TelemetryPoint, Workload } from "@/types";
import * as demoStore from "@/lib/telemetry/store";

/**
 * Telemetry Service
 *
 *      Telemetry Service
 *            |
 *   ---------+---------
 *   |                   |
 * Real NVIDIA DCGM   Demo Telemetry Generator (active)
 * / nvidia-smi
 *
 * Everything above this module (API routes, UI) is written against the
 * Workload / TelemetryPoint shape only. Swapping the demo generator for a
 * real collector means implementing this same function signatures against
 * DCGM/nvidia-smi output and nothing else needs to change.
 */

export function listWorkloads(): Workload[] {
  return demoStore.getWorkloads();
}

export function getWorkloadById(id: string): Workload | undefined {
  return demoStore.getWorkload(id);
}

export function getTelemetryHistory(id: string): TelemetryPoint[] {
  return demoStore.getHistory(id);
}

export function source(): "real" | "demo" {
  return "demo"; // flips to "real" once a DCGM/nvidia-smi collector is wired in
}
