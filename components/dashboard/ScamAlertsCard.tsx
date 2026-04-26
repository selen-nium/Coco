"use client";

import { useCallback, useEffect, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";

type ScamAlert = {
  id: string;
  severity: "high" | "critical";
  status: "active" | "inactive";
  detected_keywords: string[] | null;
  created_at: string;
  elderly_user: { name: string; phone: string } | null;
};

function formatPT(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    timeZone: "America/Los_Angeles",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function ScamAlertsCard() {
  const [alerts, setAlerts] = useState<ScamAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [dismissing, setDismissing] = useState<string | null>(null);

  const fetchAlerts = useCallback(async () => {
    try {
      const res = await fetch("/api/dashboard/alerts?status=active");
      const json = await res.json();
      setAlerts(json.alerts ?? []);
    } catch {
      // silently fail — stale data is fine
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchAlerts();
  }, [fetchAlerts]);

  async function dismiss(id: string) {
    setDismissing(id);
    try {
      await fetch(`/api/dashboard/alerts/${id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status: "inactive" }),
      });
      setAlerts((prev) => prev.filter((a) => a.id !== id));
    } finally {
      setDismissing(null);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-base font-semibold text-[#1a1208]">Scam alerts</p>
        {alerts.length > 0 && (
          <span className="flex items-center gap-1.5 text-xs font-medium text-red-600">
            <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
            {alerts.length} active
          </span>
        )}
      </div>

      <Card className="overflow-hidden">
        {loading ? (
          <div className="px-5 py-4 text-sm text-[#888]">Loading…</div>
        ) : alerts.length === 0 ? (
          <div className="flex items-center gap-3 px-5 py-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#e8f3ee]">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M2 7l3.5 3.5L12 3" stroke="#2d6a4f" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <p className="text-sm text-[#888]">No active scam alerts — all clear.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-[#e8e4de] bg-[#f5f4f0]">
              <tr>
                {["User", "Severity", "Keywords", "Detected", ""].map((h) => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-[#888]">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e8e4de]">
              {alerts.map((alert) => (
                <tr key={alert.id} className="hover:bg-[#fff8f4] transition-colors">
                  <td className="px-5 py-3.5 font-medium text-[#1a1208]">
                    {alert.elderly_user?.name ?? "Unknown"}
                  </td>
                  <td className="px-5 py-3.5">
                    <Badge variant={alert.severity === "critical" ? "red" : "amber"}>
                      {alert.severity}
                    </Badge>
                  </td>
                  <td className="px-5 py-3.5 text-[#666] max-w-[200px] truncate">
                    {(alert.detected_keywords ?? []).slice(0, 4).join(", ") || "—"}
                  </td>
                  <td className="px-5 py-3.5 text-[#888] whitespace-nowrap">
                    {formatPT(alert.created_at)}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <button
                      onClick={() => void dismiss(alert.id)}
                      disabled={dismissing === alert.id}
                      className="rounded-lg border border-[#e8e4de] bg-white px-3 py-1.5 text-xs font-medium text-[#666] hover:border-[#d0cdc8] hover:text-[#1a1208] disabled:opacity-50 transition-colors"
                    >
                      {dismissing === alert.id ? "Dismissing…" : "Dismiss"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
