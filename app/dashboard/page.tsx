"use client";

import { useEffect, useState, useCallback } from "react";
import { Play, Pause, RotateCcw } from "lucide-react";
import PageHeader from "@/components/layout/PageHeader";
import KpiCard from "@/components/dashboard/KpiCard";
import WorkloadTable from "@/components/workload/WorkloadTable";
import RecommendationCard from "@/components/ai/RecommendationCard";
import { Metrics, OptimizationRecommendation, Workload } from "@/types";

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [workloads, setWorkloads] = useState<Workload[]>([]);
  const [rec, setRec] = useState<OptimizationRecommendation | null>(null);
  const [paused, setPausedState] = useState(false);
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(false);

  const refresh = useCallback(() => {
    fetch("/api/metrics").then((r) => r.json()).then((d) => setMetrics(d.metrics));
    fetch("/api/workloads")
      .then((r) => r.json())
      .then((d) => {
        setWorkloads(d.workloads);
        const top = d.workloads.find((w: Workload) => w.status === "RUNNING") ?? d.workloads[0];
        if (top) {
          fetch("/api/optimization/analyze", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ workloadId: top.id }),
          })
            .then((r) => r.json())
            .then((rd) => setRec(rd.recommendation));
        }
      });
  }, []);

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, 3000);
    return () => clearInterval(id);
  }, [refresh]);

  const toggleDemo = async () => {
    const res = await fetch("/api/demo/toggle", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paused: !paused }),
    });
    const d = await res.json();
    setPausedState(d.paused);
  };

  const resetDemo = async () => {
    await fetch("/api/demo/reset", { method: "POST" });
    setApplied(false);
    refresh();
  };

  const applyRec = async () => {
    if (!rec) return;
    setApplying(true);
    await fetch("/api/optimization/apply", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ workloadId: rec.workloadId }),
    });
    setApplying(false);
    setApplied(true);
    refresh();
  };

  const topWorkload = workloads.find((w) => w.id === rec?.workloadId);

  return (
    <div>
      <PageHeader
        title="CarbonLens AI"
        subtitle="Carbon-aware compute intelligence"
        right={
          <div className="flex items-center gap-1.5">
            <button
              onClick={toggleDemo}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded border border-white/15 text-text-1 hover:text-text-0 hover:border-white/30 text-[10px] font-mono tracking-wider transition-colors"
            >
              {paused ? <Play size={11} /> : <Pause size={11} />}
              {paused ? "RESUME DEMO" : "PAUSE DEMO"}
            </button>
            <button
              onClick={resetDemo}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded border border-white/15 text-text-1 hover:text-text-0 hover:border-white/30 text-[10px] font-mono tracking-wider transition-colors"
            >
              <RotateCcw size={11} />
              RESET
            </button>
          </div>
        }
      />

      <div className="p-8 space-y-8">
        <div className="grid grid-cols-4 gap-4">
          <KpiCard
            label="TOTAL CO2"
            value={metrics ? metrics.totalCarbonKg.toLocaleString() : "—"}
            unit="kg"
            deltaPct={metrics?.deltaCarbonPct}
          />
          <KpiCard
            label="ENERGY CONSUMED"
            value={metrics ? metrics.totalEnergyMwh.toFixed(1) : "—"}
            unit="MWh"
            deltaPct={metrics?.deltaEnergyPct}
            accent="secondary"
          />
          <KpiCard
            label="ACTIVE WORKLOADS"
            value={metrics ? metrics.activeWorkloads : "—"}
            accent="secondary"
          />
          <KpiCard
            label="CARBON SAVED"
            value={metrics ? metrics.carbonSavedKg.toLocaleString() : "—"}
            unit="kg"
            deltaPct={metrics?.deltaSavedPct}
          />
        </div>

        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2">
            <div className="font-mono text-[10px] tracking-[0.16em] text-text-2 mb-3">
              LIVE WORKLOAD MONITOR
            </div>
            <WorkloadTable workloads={workloads} />
          </div>
          <div>
            <div className="font-mono text-[10px] tracking-[0.16em] text-text-2 mb-3">
              AI RECOMMENDATION
            </div>
            {rec && topWorkload ? (
              <RecommendationCard
                workloadName={topWorkload.name}
                rec={rec}
                onApply={applyRec}
                applying={applying}
                applied={applied || topWorkload.status === "OPTIMIZED"}
              />
            ) : (
              <div className="glass-panel rounded-lg p-5 text-sm text-text-2">
                Analyzing workloads…
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
