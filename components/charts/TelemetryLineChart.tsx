"use client";

import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts";

export interface SeriesPoint {
  label: string | number;
  value: number;
}

export default function TelemetryLineChart({
  data,
  color = "#39FFA0",
  unit = "",
  height = 180,
}: {
  data: SeriesPoint[];
  color?: string;
  unit?: string;
  height?: number;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fill: "#6D7C79", fontSize: 10, fontFamily: "JetBrains Mono" }}
          axisLine={{ stroke: "rgba(255,255,255,0.08)" }}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: "#6D7C79", fontSize: 10, fontFamily: "JetBrains Mono" }}
          axisLine={false}
          tickLine={false}
          width={38}
        />
        <Tooltip
          contentStyle={{
            background: "#0A1012",
            border: "1px solid rgba(174,187,192,0.2)",
            borderRadius: 6,
            fontSize: 12,
            fontFamily: "JetBrains Mono",
          }}
          labelStyle={{ color: "#AEBBC0" }}
          formatter={(v: number) => [`${v}${unit}`, ""]}
        />
        <Line
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={2}
          dot={false}
          isAnimationActive={true}
          animationDuration={400}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
