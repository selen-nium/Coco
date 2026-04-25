"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";

type AlertItem = {
  id: string;
  detected_keywords: string[];
  severity: "high" | "critical";
  created_at: string;
  elderly_user: { name: string; phone: string };
};

export function LiveAlertsPanel({ initialAlerts }: { initialAlerts: AlertItem[] }) {
  const [alerts, setAlerts] = useState(initialAlerts);
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    let isMounted = true;

    async function refreshAlerts() {
      const response = await fetch("/api/dashboard/alerts?status=active", {
        cache: "no-store",
      });
      const payload = await response.json();
      if (isMounted) {
        setAlerts(payload.alerts ?? []);
      }
    }

    const channel = supabase
      .channel("dashboard-live-alerts")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "scam_alerts",
          filter: "status=eq.active",
        },
        refreshAlerts
      )
      .subscribe();

    return () => {
      isMounted = false;
      void supabase.removeChannel(channel);
    };
  }, [supabase]);

  if (alerts.length === 0) {
    return (
      <Card className="p-6">
        <p className="text-sm font-semibold text-slate-900">Live Alerts</p>
        <p className="mt-2 text-sm text-slate-500">No active scam alerts right now.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {alerts.map((alert) => (
        <Card
          key={alert.id}
          className="animate-pulse border-rose-200 bg-rose-50/90 p-5 [animation-duration:2.6s]"
        >
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge tone={alert.severity}>{alert.severity.toUpperCase()}</Badge>
                <span className="text-sm font-semibold text-rose-800">
                  Potential scam detected for {alert.elderly_user.name}
                </span>
              </div>
              <p className="text-sm text-rose-700">
                Keywords: {alert.detected_keywords.join(", ") || "Unknown"}
              </p>
            </div>
            <a
              href={`tel:${alert.elderly_user.phone}`}
              className="inline-flex items-center justify-center rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-500"
            >
              Call User Now
            </a>
          </div>
        </Card>
      ))}
    </div>
  );
}
