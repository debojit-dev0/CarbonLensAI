"use client";

import { ArrowDown, ArrowUp } from "lucide-react";
import clsx from "clsx";

export default function KpiCard({
  label,
  value,
  unit,
  deltaPct,
  accent = "primary",
}: {
  label: string;
  value: string | number;
  unit?: string;
  deltaPct?: number;
  accent?: "primary" | "secondary" | "warning";
}) {
  const isDown = (deltaPct ?? 0) < 0;
  const accentClass =
    accent === "secondary" ? "text-secondary" : accent === "warning" ? "text-warning" : "text-primary";

  return (
    <div className="glass-panel rounded-lg p-5 animate-rise transition-colors">
      <div className="font-mono text-[10px] tracking-[0.16em] text-text-2 mb-3">
        {label}
      </div>
      <div className="flex items-baseline gap-2">
        <span className={clsx("text-3xl font-semibold tabular-nums", accentClass)}>{value}</span>
        {unit && <span className="text-sm text-text-2 font-mono">{unit}</span>}
      </div>
      {typeof deltaPct === "number" && (
        <div
          className={clsx(
            "mt-3 inline-flex items-center gap-1 text-xs font-mono",
            isDown ? "text-primary" : "text-warning"
          )}
        >
          {isDown ? <ArrowDown size={12} /> : <ArrowUp size={12} />}
          {Math.abs(deltaPct)}%
        </div>
      )}
    </div>
  );
}
