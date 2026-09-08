"use client";

import { Sparkles } from "lucide-react";
import { OptimizationRecommendation } from "@/types";

export default function RecommendationCard({
  workloadName,
  rec,
  mode,
  onApply,
  applying,
  applied,
}: {
  workloadName: string;
  rec: OptimizationRecommendation;
  mode?: "nvidia" | "fallback";
  onApply?: () => void;
  applying?: boolean;
  applied?: boolean;
}) {
  return (
    <div className="glass-panel rounded-lg p-5 border-primary/20 animate-rise">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Sparkles size={14} className="text-primary" />
          <span className="font-mono text-[10px] tracking-[0.16em] text-primary">
            {mode === "nvidia" ? "NVIDIA AI RECOMMENDATION" : "AI RECOMMENDATION · DEMO FALLBACK"}
          </span>
        </div>
      </div>
      <p className="text-sm text-text-0 leading-relaxed mb-4">
        Move <span className="text-text-0 font-medium">{workloadName}</span> to{" "}
        <span className="text-secondary">{rec.recommendedRegion}</span> during the{" "}
        <span className="text-secondary">{rec.recommendedStart}</span> low-carbon window.
      </p>
      <div className="flex items-end justify-between">
        <div>
          <div className="font-mono text-[10px] text-text-2 tracking-wider">POTENTIAL SAVING</div>
          <div className="text-2xl font-semibold text-primary">{rec.savingKg} kg CO2e</div>
          <div className="text-xs text-secondary font-mono mt-0.5">${rec.costSavingUsd.toFixed(2)} saved</div>
        </div>
        {onApply && (
          <button
            onClick={onApply}
            disabled={applying || applied}
            className="px-4 py-2 rounded-md bg-primary/10 border border-primary/40 text-primary text-xs font-mono tracking-wider hover:bg-primary/20 disabled:opacity-50 transition-colors"
          >
            {applied ? "APPLIED" : applying ? "APPLYING..." : "APPLY"}
          </button>
        )}
      </div>
    </div>
  );
}
