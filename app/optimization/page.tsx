"use client";

import { useEffect, useMemo, useState } from "react";
import clsx from "clsx";
import { Check, Loader2, Sparkles } from "lucide-react";
import PageHeader from "@/components/layout/PageHeader";
import MacAdvisorPanel from "@/components/optimization/MacAdvisorPanel";
import { MacAdvisorResult, OptimizationRecommendation, Workload } from "@/types";

const STEPS = [
  "ANALYZING WORKLOAD",
  "CHECKING CARBON INTENSITY",
  "COMPARING REGIONS",
  "QUERYING NVIDIA AI",
  "GENERATING RECOMMENDATION",
  "OPTIMIZATION READY",
];

export default function OptimizationPage() {
  const [workloads, setWorkloads] = useState<Workload[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [rec, setRec] = useState<OptimizationRecommendation | null>(null);
  const [running, setRunning] = useState(false);
  const [stepIndex, setStepIndex] = useState(-1);
  const [applied, setApplied] = useState(false);
  const [applying, setApplying] = useState(false);
  const [macResult, setMacResult] = useState<MacAdvisorResult | null>(null);

  useEffect(() => {
    fetch("/api/workloads")
      .then((r) => r.json())
      .then((d) => {
        setWorkloads(d.workloads);
        if (!selectedId && d.workloads[0]) setSelectedId(d.workloads[0].id);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const workload = useMemo(() => workloads.find((w) => w.id === selectedId) ?? null, [workloads, selectedId]);

  useEffect(() => {
    if (!selectedId) return;
    setMacResult(null);
    fetch("/api/optimization/mac-advisor", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ workloadId: selectedId }),
    })
      .then((r) => r.json())
      .then((d) => setMacResult(d.rows ? d : null));
  }, [selectedId]);

  const runAnalysis = async () => {
    if (!workload) return;
    setRec(null);
    setApplied(false);
    setRunning(true);
    setStepIndex(0);

    for (let i = 1; i < STEPS.length; i++) {
      await new Promise((res) => setTimeout(res, 420));
      setStepIndex(i);
    }

    const res = await fetch("/api/optimization/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ workloadId: workload.id }),
    });
    const data = await res.json();
    setRec(data.recommendation);
    setRunning(false);
  };

  const apply = async () => {
    if (!workload) return;
    setApplying(true);
    await fetch("/api/optimization/apply", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ workloadId: workload.id }),
    });
    setApplying(false);
    setApplied(true);
    fetch("/api/workloads").then((r) => r.json()).then((d) => setWorkloads(d.workloads));
  };

  return (
    <div>
      <PageHeader title="Optimization" subtitle="Carbon-aware region and time-window optimization engine" />
      <div className="p-8 space-y-8">
        <div className="flex items-center gap-2 flex-wrap">
          {workloads.map((w) => (
            <button
              key={w.id}
              onClick={() => {
                setSelectedId(w.id);
                setRec(null);
                setApplied(false);
                setStepIndex(-1);
              }}
              className={clsx(
                "px-3 py-1.5 rounded text-xs font-mono border transition-colors",
                selectedId === w.id
                  ? "bg-primary/10 border-primary/40 text-primary"
                  : "border-white/10 text-text-2 hover:text-text-0 hover:border-white/25"
              )}
            >
              {w.name}
            </button>
          ))}
        </div>

        {workload && (
          <div className="grid grid-cols-2 gap-6">
            <div className="glass-panel rounded-lg p-5">
              <div className="font-mono text-[10px] tracking-[0.16em] text-text-2 mb-3">
                CURRENT WORKLOAD
              </div>
              <div className="text-lg text-text-0 font-medium mb-4">{workload.name}</div>
              <Row label="Current Region" value={workload.region} />
              <Row label="Current Carbon Intensity" value={rec ? `${rec.currentIntensity} gCO2e/kWh` : "—"} />
              <Row label="Current SCI (per compute-hr)" value={rec ? `${rec.currentSci} gCO2e` : "—"} />
              <Row label="Current Estimated Impact" value={rec ? `${rec.currentImpactKg} kg CO2e` : "—"} accent="warning" />
              <Row label="Current Total Cost" value={rec ? `$${rec.currentCostUsd.toFixed(2)}` : "—"} accent="warning" />
            </div>

            <div className="glass-panel rounded-lg p-5 border-primary/20">
              <div className="font-mono text-[10px] tracking-[0.16em] text-primary mb-3">
                CARBON-AWARE ALTERNATIVE
              </div>
              {rec ? (
                <>
                  <div className="text-lg text-text-0 font-medium mb-4">{rec.recommendedRegion}</div>
                  <Row label="Carbon Intensity" value={`${rec.recommendedIntensity} gCO2e/kWh`} />
                  <Row label="Recommended Start" value={rec.recommendedStart} />
                  <Row label="Projected SCI (per compute-hr)" value={`${rec.projectedSci} gCO2e`} />
                  <Row label="Projected Impact" value={`${rec.projectedImpactKg} kg CO2e`} accent="secondary" />
                  <Row label="Projected Total Cost" value={`$${rec.projectedCostUsd.toFixed(2)}`} accent="secondary" />
                  <Row label="Potential Carbon Saving" value={`${rec.savingKg} kg CO2e`} accent="primary" />
                  <Row label="Potential Cost Saving" value={`$${rec.costSavingUsd.toFixed(2)}`} accent="primary" />
                  <Row label="Reduction" value={`${rec.reductionPct}%`} accent="primary" />
                  <Row
                    label={`MAC vs. ${rec.coalBaselineRegion} (coal baseline)`}
                    value={rec.macUsdPerTonne === null ? "n/a" : `$${rec.macUsdPerTonne}/tonne CO2e`}
                    accent={rec.macUsdPerTonne !== null && rec.macUsdPerTonne < 0 ? "primary" : "secondary"}
                  />
                </>
              ) : (
                <div className="text-sm text-text-2">Run the optimizer to see the recommendation.</div>
              )}
            </div>
          </div>
        )}

        <div className="flex items-center gap-4">
          <button
            onClick={runAnalysis}
            disabled={running || !workload}
            className="flex items-center gap-2 px-5 py-2.5 rounded-md bg-primary/10 border border-primary/40 text-primary text-sm font-mono tracking-wide hover:bg-primary/20 disabled:opacity-50 transition-colors"
          >
            {running ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
            {running ? "OPTIMIZING..." : "FIND LOWER-CARBON EXECUTION"}
          </button>
        </div>

        {stepIndex >= 0 && (
          <div className="glass-panel rounded-lg p-5">
            <div className="flex flex-wrap gap-3">
              {STEPS.map((s, i) => (
                <div
                  key={s}
                  className={clsx(
                    "flex items-center gap-2 px-3 py-1.5 rounded border font-mono text-[10px] tracking-wider transition-colors",
                    i < stepIndex
                      ? "border-primary/30 text-primary bg-primary/5"
                      : i === stepIndex
                      ? "border-secondary/40 text-secondary bg-secondary/5"
                      : "border-white/10 text-text-2"
                  )}
                >
                  {i < stepIndex ? (
                    <Check size={11} />
                  ) : i === stepIndex ? (
                    <Loader2 size={11} className="animate-spin" />
                  ) : null}
                  {s}
                </div>
              ))}
            </div>
          </div>
        )}

        {rec && workload && (
          <div className="glass-panel rounded-lg p-6 animate-rise">
            <div className="font-mono text-[10px] tracking-[0.16em] text-text-2 mb-5">
              BEFORE / AFTER
            </div>
            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-6">
              <div>
                <div className="font-mono text-[10px] text-text-2 mb-1">BEFORE</div>
                <div className="text-text-0 font-medium">{rec.currentRegion}</div>
                <div className="text-sm text-text-1 font-mono">{rec.currentIntensity} gCO2e/kWh</div>
                <div className="text-2xl font-semibold text-warning mt-2">{rec.currentImpactKg} kg</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">↓ {rec.reductionPct}%</div>
                <div className="font-mono text-[10px] text-text-2 mt-1">CARBON REDUCTION</div>
                <div className="text-sm font-semibold text-secondary mt-3">
                  ${rec.costSavingUsd.toFixed(2)} saved
                </div>
                <div className="font-mono text-[9px] text-text-2 mt-1">
                  MAC: {rec.macUsdPerTonne === null ? "n/a" : `$${rec.macUsdPerTonne}/tonne`}
                </div>
              </div>
              <div>
                <div className="font-mono text-[10px] text-text-2 mb-1">AFTER</div>
                <div className="text-text-0 font-medium">{rec.recommendedRegion}</div>
                <div className="text-sm text-text-1 font-mono">{rec.recommendedIntensity} gCO2e/kWh</div>
                <div className="text-2xl font-semibold text-primary mt-2">{rec.projectedImpactKg} kg</div>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={apply}
                disabled={applying || applied || workload.status === "OPTIMIZED"}
                className="flex items-center gap-2 px-5 py-2.5 rounded-md bg-primary text-bg-0 text-sm font-mono tracking-wide font-semibold hover:brightness-110 disabled:opacity-50 transition-all"
              >
                {applying ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : applied || workload.status === "OPTIMIZED" ? (
                  <Check size={14} />
                ) : null}
                {applied || workload.status === "OPTIMIZED" ? "OPTIMIZATION APPLIED" : "APPLY RECOMMENDATION"}
              </button>
            </div>
          </div>
        )}

        <div>
          <div className="font-mono text-[10px] tracking-[0.16em] text-text-2 mb-3">
            MAC ADVISOR — SHOULD YOU SWITCH?
          </div>
          <MacAdvisorPanel result={macResult} />
        </div>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: "primary" | "secondary" | "warning";
}) {
  const color = accent === "primary" ? "text-primary" : accent === "secondary" ? "text-secondary" : accent === "warning" ? "text-warning" : "text-text-0";
  return (
    <div className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
      <span className="text-xs text-text-2 font-mono">{label}</span>
      <span className={clsx("text-sm font-medium tabular-nums", color)}>{value}</span>
    </div>
  );
}
