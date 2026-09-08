"use client";

import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, Cell } from "recharts";

export interface BarPoint {
  label: string;
  value: number;
  highlight?: boolean;
}

export default function CarbonBarChart({
  data,
  color = "#34D0FF",
  highlightColor = "#39FFA0",
  unit = "",
  height = 220,
}: {
  data: BarPoint[];
  color?: string;
  highlightColor?: string;
  unit?: string;
  height?: number;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
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
          cursor={{ fill: "rgba(255,255,255,0.04)" }}
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
        <Bar dataKey="value" radius={[3, 3, 0, 0]}>
          {data.map((d, i) => (
            <Cell key={i} fill={d.highlight ? highlightColor : color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
