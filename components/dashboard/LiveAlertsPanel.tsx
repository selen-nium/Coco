"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Badge } from "@/components/ui/Badge";

type AlertItem = {
  id: string;
  detected_keywords: string[];
  severity: "high" | "critical";
  created_at: string;
  elderly_user: { name: string; phone: string };
};

export function LiveAlertsPanel({ initialAlerts }: { initialAlerts: AlertItem[] }) {
  const [alerts, setAlerts] = useState(initialAlerts);
  const [dismissing, setDismissing] = useState<string | null>(null);
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    let isMounted = true;

    async function refreshAlerts() {
      const response = await fetch("/api/dashboard/alerts?status=active", { cache: "no-store" });
      const payload = await response.json();
      if (isMounted) setAlerts(payload.alerts ?? []);
    }

    const channel = supabase
      .channel("dashboard-live-alerts")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "scam_alerts" }, refreshAlerts)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "scam_alerts" }, refreshAlerts)
      .subscribe();

    return () => {
      isMounted = false;
      void supabase.removeChannel(channel);
    };
  }, [supabase]);

  async function dismiss(id: string) {
    setDismissing(id);
    try {
      await fetch(`/api/dashboard/alerts/${id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status: "dismissed" }),
      });
      setAlerts((prev) => prev.filter((a) => a.id !== id));
    } finally {
      setDismissing(null);
    }
  }

  if (alerts.length === 0) return null;

  return (
    <div className="space-y-3">
      {alerts.map((alert) => (
        <div
          key={alert.id}
          className="rounded-2xl border-2 border-rose-300 bg-rose-50 p-5 shadow-lg animate-pulse [animation-duration:2.6s]"
        >
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="inline-flex h-2.5 w-2.5 rounded-full bg-red-500 animate-ping" />
                <Badge variant={alert.severity === "critical" ? "red" : "amber"}>
                  {alert.severity.toUpperCase()}
                </Badge>
                <span className="text-sm font-bold text-rose-800">
                  Potential scam detected for {alert.elderly_user.name}
                </span>
              </div>
              <p className="text-sm text-rose-700">
                Keywords: {alert.detected_keywords.join(", ") || "Unknown"}
              </p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <a
                href={`tel:${alert.elderly_user.phone}`}
                className="inline-flex items-center justify-center rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-500 transition-colors"
              >
                Call Now
              </a>
              <button
                onClick={() => void dismiss(alert.id)}
                disabled={dismissing === alert.id}
                className="inline-flex items-center justify-center rounded-xl border border-rose-300 bg-white px-4 py-2 text-sm font-medium text-rose-700 hover:bg-rose-100 disabled:opacity-50 transition-colors"
              >
                {dismissing === alert.id ? "Dismissing…" : "Dismiss"}
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
