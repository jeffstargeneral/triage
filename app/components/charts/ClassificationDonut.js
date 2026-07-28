"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

const COLORS = { urgent: "#D97757", routine: "#5A7A3E", noise: "#9B9A91" };
const LABELS = { urgent: "Urgent", routine: "Routine", noise: "Noise" };

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const { name, value } = payload[0];
  return (
    <div className="bg-surface border border-black/10 rounded-lg px-3 py-2 shadow-lg text-xs">
      <div className="font-medium text-ink">{LABELS[name]}: {value}</div>
    </div>
  );
};

export default function ClassificationDonut({ data }) {
  const chartData = Object.entries(data)
    .filter(([, value]) => value > 0)
    .map(([name, value]) => ({ name, value }));

  const total = chartData.reduce((sum, d) => sum + d.value, 0);

  if (total === 0) {
    return (
      <div className="h-56 w-full flex items-center justify-center text-sm text-inkFaint">
        No data yet
      </div>
    );
  }

  return (
    <div className="h-56 w-full relative">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            dataKey="value"
            nameKey="name"
            innerRadius={55}
            outerRadius={80}
            paddingAngle={3}
            strokeWidth={0}
          >
            {chartData.map((entry) => (
              <Cell key={entry.name} fill={COLORS[entry.name]} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <div className="text-2xl font-serif">{total}</div>
        <div className="text-[11px] text-inkFaint">total</div>
      </div>
    </div>
  );
}
