"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import PageHeader from "@/components/layout/PageHeader";
import TelemetryLineChart from "@/components/charts/TelemetryLineChart";
import { StatusBadge } from "@/components/workload/WorkloadTable";
import { TelemetryPoint, Workload } from "@/types";
import { formatRuntime } from "@/lib/carbon/engine";

export default function WorkloadDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [workload, setWorkload] = useState<Workload | null>(null);
  const [history, setHistory] = useState<TelemetryPoint[]>([]);

  useEffect(() => {
    if (!id) return;
    const load = () => {
      fetch(`/api/workloads/${id}`)
        .then((r) => r.json())
        .then((d) => setWorkload(d.workload ?? null));
      fetch(`/api/telemetry/${id}`)
        .then((r) => r.json())
        .then((d) => setHistory(d.history ?? []));
    };
    load();
    const t = setInterval(load, 2000);
    return () => clearInterval(t);
  }, [id]);

  if (!workload) {
    return (
      <div>
        <PageHeader title="Workload" />
        <div className="p-8 text-text-2 text-sm">Loading telemetry…</div>
      </div>
    );
  }

  const chartData = (key: keyof TelemetryPoint) =>
    history.map((h, i) => ({ label: i, value: Number(h[key]) }));

  return (
    <div>
      <PageHeader title={workload.name} subtitle={`${workload.type} · ${workload.region}`} />
      <div className="p-8 space-y-8">
        <button
          onClick={() => router.push("/workloads")}
          className="flex items-center gap-1.5 text-xs text-text-2 hover:text-text-0 transition-colors font-mono"
        >
          <ArrowLeft size={13} /> BACK TO WORKLOADS
        </button>

        <div className="flex items-center gap-4">
          <StatusBadge status={workload.status} />
          <span className="font-mono text-xs text-text-2">RUNTIME {formatRuntime(workload.runtimeSeconds)}</span>
        </div>

        <div className="grid grid-cols-4 gap-4">
          <Metric label="GPU UTILIZATION" value={`${workload.gpu}%`} accent="primary" />
          <Metric label="CPU" value={`${workload.cpu}%`} accent="secondary" />
          <Metric label="RAM" value={`${workload.ram}%`} accent="secondary" />
          <Metric label="POWER" value={`${workload.power} kW`} accent="warning" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Metric label="ENERGY" value={`${workload.energyKwh.toFixed(1)} kWh`} accent="secondary" wide />
          <Metric label="CARBON" value={`${workload.carbonKg.toFixed(1)} kg CO2e`} accent="primary" wide />
        </div>

        <div className="grid grid-cols-2 gap-6">
          <ChartPanel title="GPU UTILIZATION" data={chartData("gpu")} color="#39FFA0" unit="%" />
          <ChartPanel title="POWER CONSUMPTION" data={chartData("power")} color="#FFB454" unit="kW" />
          <ChartPanel title="ENERGY CONSUMPTION" data={chartData("energyKwh")} color="#34D0FF" unit=" kWh" />
          <ChartPanel title="CARBON EMISSIONS" data={chartData("carbonKg")} color="#39FFA0" unit=" kg" />
        </div>
      </div>
    </div>
  );
}

function Metric({
  label,
  value,
  accent,
  wide,
}: {
  label: string;
  value: string;
  accent: "primary" | "secondary" | "warning";
  wide?: boolean;
}) {
  const color = accent === "primary" ? "text-primary" : accent === "secondary" ? "text-secondary" : "text-warning";
  return (
    <div className={`glass-panel rounded-lg p-5 ${wide ? "col-span-1" : ""}`}>
      <div className="font-mono text-[10px] tracking-[0.16em] text-text-2 mb-2">{label}</div>
      <div className={`text-2xl font-semibold tabular-nums ${color}`}>{value}</div>
    </div>
  );
}

function ChartPanel({
  title,
  data,
  color,
  unit,
}: {
  title: string;
  data: { label: string | number; value: number }[];
  color: string;
  unit: string;
}) {
  return (
    <div className="glass-panel rounded-lg p-5">
      <div className="font-mono text-[10px] tracking-[0.16em] text-text-2 mb-2">{title}</div>
      <TelemetryLineChart data={data} color={color} unit={unit} />
    </div>
  );
}
