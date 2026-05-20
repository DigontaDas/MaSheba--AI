"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type RiskSummaryRow = {
  chw_id: string;
  chw_name: string;
  low_count: number;
  moderate_count: number;
  high_count: number;
};

export function RiskSummaryChart({ data }: { data: RiskSummaryRow[] }) {
  const chartData = data.map((row) => ({
    name: row.chw_name,
    LOW: row.low_count,
    MODERATE: row.moderate_count,
    HIGH: row.high_count,
  }));

  return (
    <div className="h-80 w-full px-3 py-4">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 8, right: 12, left: 0, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="name" tick={{ fill: "#475569", fontSize: 12 }} />
          <YAxis allowDecimals={false} tick={{ fill: "#475569", fontSize: 12 }} />
          <Tooltip />
          <Legend />
          <Bar dataKey="LOW" fill="#047857" radius={[3, 3, 0, 0]} />
          <Bar dataKey="MODERATE" fill="#b45309" radius={[3, 3, 0, 0]} />
          <Bar dataKey="HIGH" fill="#be123c" radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
