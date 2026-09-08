"use client";

import Link from "next/link";
import clsx from "clsx";
import { Workload } from "@/types";
import { formatRuntime } from "@/lib/carbon/engine";

export default function WorkloadTable({ workloads }: { workloads: Workload[] }) {
  return (
    <div className="glass-panel rounded-lg overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-white/10 text-left">
            {["Workload", "Type", "GPU", "CPU", "Runtime", "Energy", "CO2", "Status"].map((h) => (
              <th
                key={h}
                className="font-mono text-[10px] tracking-[0.14em] text-text-2 px-5 py-3 font-medium"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {workloads.map((w) => (
            <tr key={w.id} className="group">
              <td className="p-0" colSpan={8}>
                <Link
                  href={`/workloads/${w.id}`}
                  className="grid grid-cols-8 items-center px-5 py-3.5 border-b border-white/5 hover:bg-white/[0.03] transition-colors"
                >
                  <span className="text-text-0 font-medium">{w.name}</span>
                  <span className="text-text-1">{w.type}</span>
                  <span className="font-mono text-text-0 tabular-nums">{w.gpu}%</span>
                  <span className="font-mono text-text-0 tabular-nums">{w.cpu}%</span>
                  <span className="font-mono text-text-1 tabular-nums">
                    {formatRuntime(w.runtimeSeconds)}
                  </span>
                  <span className="font-mono text-text-1 tabular-nums">{w.energyKwh.toFixed(0)} kWh</span>
                  <span className="font-mono text-secondary tabular-nums">{w.carbonKg.toFixed(0)} kg</span>
                  <StatusBadge status={w.status} />
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function StatusBadge({ status }: { status: Workload["status"] }) {
  const map: Record<Workload["status"], string> = {
    RUNNING: "text-primary border-primary/30 bg-primary/5",
    IDLE: "text-text-2 border-white/15 bg-white/5",
    OPTIMIZED: "text-secondary border-secondary/30 bg-secondary/5",
    STOPPED: "text-warning border-warning/30 bg-warning/5",
  };
  return (
    <span
      className={clsx(
        "justify-self-start font-mono text-[10px] tracking-wider px-2 py-1 rounded border",
        map[status]
      )}
    >
      {status}
    </span>
  );
}
