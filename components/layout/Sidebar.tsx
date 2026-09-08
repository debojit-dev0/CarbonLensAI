"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Server,
  Leaf,
  Sparkles,
  Settings,
  Radio,
  Database,
  BrainCircuit,
} from "lucide-react";
import clsx from "clsx";
import { SystemStatus } from "@/types";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/workloads", label: "Workloads", icon: Server },
  { href: "/carbon", label: "Carbon Analytics", icon: Leaf },
  { href: "/optimization", label: "Optimization", icon: Sparkles },
  { href: "/ai-assistant", label: "AI Assistant", icon: BrainCircuit },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [status, setStatus] = useState<SystemStatus | null>(null);

  useEffect(() => {
    let mounted = true;
    const load = () =>
      fetch("/api/status")
        .then((r) => r.json())
        .then((d) => mounted && setStatus(d.status))
        .catch(() => {});
    load();
    const id = setInterval(load, 8000);
    return () => {
      mounted = false;
      clearInterval(id);
    };
  }, []);

  return (
    <aside className="w-64 shrink-0 border-r border-white/10 bg-bg-1/80 backdrop-blur-md flex flex-col">
      <div className="px-5 py-6 border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-sm bg-primary/10 border border-primary/40 flex items-center justify-center">
            <span className="h-2 w-2 rounded-full bg-primary animate-pulseSoft" />
          </div>
          <span className="font-mono text-[13px] tracking-[0.18em] text-text-0 font-semibold">
            CARBONLENS
          </span>
        </div>
      </div>

      <nav className="flex-1 px-3 py-5 space-y-1">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname?.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={clsx(
                "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors group",
                active
                  ? "bg-primary/10 text-primary border border-primary/30"
                  : "text-text-1 hover:text-text-0 hover:bg-white/5 border border-transparent"
              )}
            >
              <Icon size={16} strokeWidth={2} className={active ? "text-primary" : "text-text-2 group-hover:text-text-1"} />
              <span className="font-medium">{label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="px-3 pb-3">
        <Link
          href="/settings"
          className={clsx(
            "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors",
            pathname?.startsWith("/settings")
              ? "bg-primary/10 text-primary border border-primary/30"
              : "text-text-1 hover:text-text-0 hover:bg-white/5 border border-transparent"
          )}
        >
          <Settings size={16} />
          <span className="font-medium">Settings</span>
        </Link>
      </div>

      <div className="px-5 py-4 border-t border-white/10 space-y-2.5">
        <div className="font-mono text-[10px] tracking-[0.16em] text-text-2 mb-1">
          SYSTEM STATUS
        </div>
        <StatusRow icon={Radio} label="Telemetry" ok={true} okLabel="Active" badLabel="Offline" forcedDemo />
        <StatusRow
          icon={Database}
          label="Database"
          ok={status?.database === "connected"}
          okLabel="Connected"
          badLabel="Demo Mode"
        />
        <StatusRow
          icon={BrainCircuit}
          label="NVIDIA AI"
          ok={status?.ai === "nvidia"}
          okLabel="Connected"
          badLabel="Fallback Mode"
        />
      </div>
    </aside>
  );
}

function StatusRow({
  icon: Icon,
  label,
  ok,
  okLabel,
  badLabel,
  forcedDemo,
}: {
  icon: any;
  label: string;
  ok: boolean;
  okLabel: string;
  badLabel: string;
  forcedDemo?: boolean;
}) {
  return (
    <div className="flex items-center justify-between text-xs">
      <div className="flex items-center gap-2 text-text-1">
        <Icon size={13} />
        <span>{label}</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span
          className={clsx(
            "h-1.5 w-1.5 rounded-full",
            ok ? "bg-primary animate-pulseSoft" : "bg-warning"
          )}
        />
        <span className={clsx("font-mono", ok ? "text-primary" : "text-warning")}>
          {ok ? okLabel : badLabel}
        </span>
      </div>
    </div>
  );
}
