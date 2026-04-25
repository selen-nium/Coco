"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type MoodPoint = {
  recorded_at: string;
  sentiment_score: number;
  frustration_level: number;
  confusion_level: number;
};

export function MoodChart({ data }: { data: MoodPoint[] }) {
  const chartData = data.map((point) => ({
    date: new Date(point.recorded_at).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    }),
    sentiment: Number(point.sentiment_score.toFixed(2)),
    frustration: Number(point.frustration_level.toFixed(2)),
    confusion: Number(point.confusion_level.toFixed(2)),
  }));

  if (chartData.length === 0) {
    return (
      <div className="flex h-72 items-center justify-center rounded-2xl bg-slate-50 text-sm text-slate-500">
        Mood trends will appear after the first analyzed calls.
      </div>
    );
  }

  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" />
          <XAxis dataKey="date" tick={{ fill: "#64748b", fontSize: 12 }} />
          <YAxis domain={[-1, 1]} tick={{ fill: "#64748b", fontSize: 12 }} />
          <Tooltip />
          <Line type="monotone" dataKey="sentiment" stroke="#0f766e" strokeWidth={3} dot={false} />
          <Line type="monotone" dataKey="frustration" stroke="#ea580c" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="confusion" stroke="#dc2626" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
