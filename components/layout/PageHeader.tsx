import { Radio } from "lucide-react";

export default function PageHeader({
  title,
  subtitle,
  right,
}: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
}) {
  return (
    <header className="flex items-center justify-between px-8 py-6 border-b border-white/10 sticky top-0 z-10 bg-bg-0/85 backdrop-blur-md">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-text-0">{title}</h1>
        {subtitle && <p className="text-xs text-text-2 mt-1 font-mono">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-3">
        {right}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded border border-primary/30 bg-primary/5">
          <Radio size={11} className="text-primary animate-pulseSoft" />
          <span className="text-[10px] font-mono tracking-wider text-primary">LIVE</span>
        </div>
        <div className="px-2.5 py-1 rounded border border-warning/30 bg-warning/5">
          <span className="text-[10px] font-mono tracking-wider text-warning">DEMO MODE</span>
        </div>
      </div>
    </header>
  );
}
