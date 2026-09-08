"use client";

import { useEffect, useMemo, useState } from "react";
import clsx from "clsx";
import PageHeader from "@/components/layout/PageHeader";
import TelemetryLineChart from "@/components/charts/TelemetryLineChart";
import CarbonBarChart from "@/components/charts/CarbonBarChart";
import { RegionIntensity, Workload } from "@/types";

const RANGE_OPTIONS = ["Today", "7 Days", "30 Days"] as const;
const REGION_OPTIONS = ["All", "Region A", "Region B", "Region C"] as const;
const TYPE_OPTIONS = ["All", "Training", "Inference", "Batch"] as const;

// Multipliers to make filtered charts feel reactive without fabricating
// a whole historical dataset — same shape data, scaled per range.
const RANGE_SCALE: Record<(typeof RANGE_OPTIONS)[number], number> = {
  Today: 1,
  "7 Days": 6.5,
  "30 Days": 24,
};

export default function CarbonPage() {
  const [range, setRange] = useState<(typeof RANGE_OPTIONS)[number]>("Today");
  const [region, setRegion] = useState<(typeof REGION_OPTIONS)[number]>("All");
  const [type, setType] = useState<(typeof TYPE_OPTIONS)[number]>("All");
  const [regions, setRegions] = useState<RegionIntensity[]>([]);
  const [workloads, setWorkloads] = useState<Workload[]>([]);

  useEffect(() => {
    fetch("/api/carbon-intensity").then((r) => r.json()).then((d) => setRegions(d.regions));
    const load = () => fetch("/api/workloads").then((r) => r.json()).then((d) => setWorkloads(d.workloads));
    load();
    const id = setInterval(load, 4000);
    return () => clearInterval(id);
  }, []);

  const filteredWorkloads = useMemo(
    () =>
      workloads.filter(
        (w) => (region === "All" || w.region === region) && (type === "All" || w.type === type)
      ),
    [workloads, region, type]
  );

  const scale = RANGE_SCALE[range];

  const emissionsOverTime = useMemo(() => {
    const primary = regions.find((r) => r.region === (region === "All" ? "Region A" : region)) ?? regions[0];
    if (!primary) return [];
    return primary.curve.map((p) => ({
      label: p.hour,
      value: Math.round(((p.value * scale) / 10) * (filteredWorkloads.length || 1)) / 10,
    }));
  }, [regions, region, scale, filteredWorkloads.length]);

  const energyOverTime = useMemo(
    () =>
      emissionsOverTime.map((p) => ({
        label: p.label,
        value: Math.round(p.value * 1.8 * 10) / 10,
      })),
    [emissionsOverTime]
  );

  const emissionsByWorkload = useMemo(
    () =>
      filteredWorkloads.map((w) => ({
        label: w.name,
        value: Math.round(w.carbonKg * scale * 10) / 10,
        highlight: w.status === "OPTIMIZED",
      })),
    [filteredWorkloads, scale]
  );

  const emissionsByRegion = useMemo(
    () =>
      regions.map((r) => ({
        label: r.region,
        value: Math.round(
          workloads.filter((w) => w.region === r.region).reduce((s, w) => s + w.carbonKg, 0) * scale
        ),
        highlight: r.gPerKwh === Math.min(...regions.map((x) => x.gPerKwh)),
      })),
    [regions, workloads, scale]
  );

  return (
    <div>
      <PageHeader title="Carbon Analytics" subtitle="Emissions, energy, and regional carbon intensity" />
      <div className="p-8 space-y-8">
        <div className="flex flex-wrap items-center gap-6">
          <FilterGroup label="RANGE" options={RANGE_OPTIONS} value={range} onChange={setRange} />
          <FilterGroup label="REGION" options={REGION_OPTIONS} value={region} onChange={setRegion} />
          <FilterGroup label="WORKLOAD" options={TYPE_OPTIONS} value={type} onChange={setType} />
        </div>

        <div className="grid grid-cols-2 gap-6">
          <Panel title="CO2 EMISSIONS OVER TIME">
            <TelemetryLineChart data={emissionsOverTime} color="#39FFA0" unit=" kg" />
          </Panel>
          <Panel title="ENERGY CONSUMPTION">
            <TelemetryLineChart data={energyOverTime} color="#34D0FF" unit=" kWh" />
          </Panel>
          <Panel title="EMISSIONS BY WORKLOAD">
            <CarbonBarChart data={emissionsByWorkload} unit=" kg" />
          </Panel>
          <Panel title="EMISSIONS BY REGION">
            <CarbonBarChart data={emissionsByRegion} unit=" kg" color="#FFB454" highlightColor="#39FFA0" />
          </Panel>
        </div>

        <div>
          <div className="font-mono text-[10px] tracking-[0.16em] text-text-2 mb-3">
            REGIONAL CARBON INTENSITY
          </div>
          <div className="grid grid-cols-3 gap-4">
            {regions.map((r) => (
              <RegionCard key={r.region} region={r} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function FilterGroup<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: readonly T[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="font-mono text-[10px] tracking-[0.14em] text-text-2">{label}</span>
      <div className="flex gap-1">
        {options.map((opt) => (
          <button
            key={opt}
            onClick={() => onChange(opt)}
            className={clsx(
              "px-3 py-1.5 rounded text-xs font-mono border transition-colors",
              value === opt
                ? "bg-primary/10 border-primary/40 text-primary"
                : "border-white/10 text-text-2 hover:text-text-0 hover:border-white/25"
            )}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="glass-panel rounded-lg p-5">
      <div className="font-mono text-[10px] tracking-[0.16em] text-text-2 mb-2">{title}</div>
      {children}
    </div>
  );
}

function RegionCard({ region }: { region: RegionIntensity }) {
  const best = region.curve.reduce((a, b) => (b.value < a.value ? b : a));
  const peak = region.curve.reduce((a, b) => (b.value > a.value ? b : a));
  const reduction = Math.round(((peak.value - best.value) / peak.value) * 1000) / 10;

  return (
    <div className="glass-panel rounded-lg p-5 space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-text-0 font-medium">{region.region}</span>
        <span className="font-mono text-secondary text-sm">{region.gPerKwh} gCO2e/kWh</span>
      </div>
      <TelemetryLineChart
        data={region.curve.map((p) => ({ label: p.hour, value: p.value }))}
        color="#34D0FF"
        unit="g"
        height={120}
      />
      <div className="rounded-md border border-primary/25 bg-primary/5 px-3 py-2.5">
        <div className="font-mono text-[9px] tracking-[0.14em] text-primary mb-1">BEST WINDOW</div>
        <div className="text-sm text-text-0">{best.hour} · {best.value} gCO2e/kWh</div>
        <div className="font-mono text-[10px] text-text-2 mt-1">Potential reduction: {reduction}%</div>
      </div>
    </div>
  );
}
