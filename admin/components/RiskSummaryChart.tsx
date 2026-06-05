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
    <div className="h-80 w-full px-2 py-4">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 8, right: 12, left: 0, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#bdc9c8" opacity={0.5} />
          <XAxis dataKey="name" tick={{ fill: "#3e4949", fontSize: 11, fontFamily: "Work Sans" }} />
          <YAxis allowDecimals={false} tick={{ fill: "#3e4949", fontSize: 11, fontFamily: "Work Sans" }} />
          <Tooltip contentStyle={{ background: "#ffffff", border: "1px solid #bdc9c8", borderRadius: "8px" }} />
          <Legend wrapperStyle={{ fontSize: 12, fontFamily: "Work Sans" }} />
          <Bar dataKey="LOW" fill="#006565" radius={[4, 4, 0, 0]} name="Low Risk" />
          <Bar dataKey="MODERATE" fill="#fd876f" radius={[4, 4, 0, 0]} name="Mod Risk" />
          <Bar dataKey="HIGH" fill="#ba1a1a" radius={[4, 4, 0, 0]} name="High Risk" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
