"use client";

import { useEffect, useState } from "react";
import clsx from "clsx";
import PageHeader from "@/components/layout/PageHeader";
import { SystemStatus } from "@/types";

export default function SettingsPage() {
  const [status, setStatus] = useState<SystemStatus | null>(null);

  useEffect(() => {
    fetch("/api/status").then((r) => r.json()).then((d) => setStatus(d.status));
  }, []);

  return (
    <div>
      <PageHeader title="Settings" subtitle="System configuration (read-only — no secrets shown)" />
      <div className="p-8 grid grid-cols-2 gap-6 max-w-3xl">
        <SettingCard
          title="AI Provider"
          rows={[{ label: "NVIDIA AI", ok: status?.ai === "nvidia", okLabel: "Connected", badLabel: "Fallback Mode" }]}
        />
        <SettingCard
          title="Database"
          rows={[{ label: "Firebase", ok: status?.database === "connected", okLabel: "Connected", badLabel: "Demo Mode" }]}
        />
        <SettingCard title="Telemetry" rows={[{ label: "Demo Mode", ok: true, okLabel: "Active", badLabel: "Inactive" }]} />
        <SettingCard
          title="Carbon Data"
          rows={[{ label: "Demo Regional Data", ok: true, okLabel: "Active", badLabel: "Inactive" }]}
        />
      </div>
    </div>
  );
}

function SettingCard({
  title,
  rows,
}: {
  title: string;
  rows: { label: string; ok: boolean; okLabel: string; badLabel: string }[];
}) {
  return (
    <div className="glass-panel rounded-lg p-5">
      <div className="font-mono text-[10px] tracking-[0.16em] text-text-2 mb-4">{title.toUpperCase()}</div>
      <div className="space-y-3">
        {rows.map((r) => (
          <div key={r.label} className="flex items-center justify-between">
            <span className="text-sm text-text-0">{r.label}</span>
            <span
              className={clsx(
                "flex items-center gap-1.5 text-xs font-mono",
                r.ok ? "text-primary" : "text-warning"
              )}
            >
              <span className={clsx("h-1.5 w-1.5 rounded-full", r.ok ? "bg-primary" : "bg-warning")} />
              {r.ok ? r.okLabel : r.badLabel}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
