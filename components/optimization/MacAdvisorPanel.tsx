"use client";

import clsx from "clsx";
import { TrendingDown, TrendingUp, Minus } from "lucide-react";
import { MacAdvisorResult, MacAdvisorRow } from "@/types";

const VERDICT_LABEL: Record<MacAdvisorRow["verdict"], string> = {
  current: "CURRENT REGION",
  cheaper_and_cleaner: "DO IT — CHEAPER & CLEANER",
  worth_it: "WORTH IT",
  marginal: "MARGINAL CALL",
  not_worth_it: "NOT WORTH IT",
  no_change: "N/A — COAL BASELINE",
};

const VERDICT_STYLE: Record<MacAdvisorRow["verdict"], string> = {
  current: "text-text-1 border-white/15 bg-white/5",
  cheaper_and_cleaner: "text-primary border-primary/40 bg-primary/10",
  worth_it: "text-primary border-primary/30 bg-primary/5",
  marginal: "text-warning border-warning/30 bg-warning/5",
  not_worth_it: "text-[#ff8a8a] border-[#ff8a8a]/30 bg-[#ff8a8a]/5",
  no_change: "text-text-2 border-white/10 bg-white/5",
};

export default function MacAdvisorPanel({ result }: { result: MacAdvisorResult | null }) {
  if (!result) {
    return (
      <div className="glass-panel rounded-lg p-5 text-sm text-text-2">
        Analyzing per-region economics…
      </div>
    );
  }

  return (
    <div className="glass-panel rounded-lg overflow-hidden animate-rise">
      <div className="px-5 pt-5 pb-3 flex items-center justify-between flex-wrap gap-2">
        <div>
          <div className="font-mono text-[10px] tracking-[0.16em] text-text-2">MAC ADVISOR</div>
          <div className="text-sm text-text-1 mt-1">
            Should you actually schedule this in a different region? Priced against a{" "}
            <span className="text-text-0 font-medium">${result.carbonPricePerTonne}/tonne</span> carbon price, MAC
            measured vs. <span className="text-text-0 font-medium">{result.coalBaselineRegion}</span> (dirtiest
            region).
          </div>
        </div>
      </div>

      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-white/10 text-left">
            {["Region", "Window", "Intensity", "Total Cost", "$ vs Current", "CO2 vs Current", "MAC $/tonne", "Verdict"].map(
              (h) => (
                <th key={h} className="font-mono text-[10px] tracking-[0.12em] text-text-2 px-4 py-2.5 font-medium">
                  {h}
                </th>
              )
            )}
          </tr>
        </thead>
        <tbody>
          {result.rows.map((row) => (
            <tr key={row.region} className="border-b border-white/5 last:border-0">
              <td className="px-4 py-3 text-text-0 font-medium">{row.region}</td>
              <td className="px-4 py-3 font-mono text-text-1">{row.window}</td>
              <td className="px-4 py-3 font-mono text-text-1">{row.intensity} g</td>
              <td className="px-4 py-3 font-mono text-text-0">${row.costUsd.toFixed(2)}</td>
              <td className="px-4 py-3 font-mono">
                <MoneyDelta value={row.costDeltaUsd} isCurrent={row.verdict === "current"} />
              </td>
              <td className="px-4 py-3 font-mono">
                <CarbonDelta value={row.carbonDeltaKg} isCurrent={row.verdict === "current"} />
              </td>
              <td className="px-4 py-3 font-mono text-text-1">
                {row.macUsdPerTonne === null ? "n/a" : `$${row.macUsdPerTonne}`}
              </td>
              <td className="px-4 py-3">
                <span
                  className={clsx(
                    "font-mono text-[10px] tracking-wider px-2 py-1 rounded border whitespace-nowrap",
                    VERDICT_STYLE[row.verdict]
                  )}
                >
                  {VERDICT_LABEL[row.verdict]}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function MoneyDelta({ value, isCurrent }: { value: number; isCurrent: boolean }) {
  if (isCurrent) return <span className="text-text-2">—</span>;
  const saving = value < 0;
  return (
    <span className={clsx("flex items-center gap-1", saving ? "text-primary" : "text-warning")}>
      {saving ? <TrendingDown size={12} /> : value > 0 ? <TrendingUp size={12} /> : <Minus size={12} />}
      {saving ? `$${Math.abs(value).toFixed(2)} saved` : `$${value.toFixed(2)} spent`}
    </span>
  );
}

function CarbonDelta({ value, isCurrent }: { value: number; isCurrent: boolean }) {
  if (isCurrent) return <span className="text-text-2">—</span>;
  const reduced = value > 0;
  return (
    <span className={clsx(reduced ? "text-primary" : "text-warning")}>
      {reduced ? "↓" : "↑"} {Math.abs(value).toFixed(1)} kg
    </span>
  );
}
