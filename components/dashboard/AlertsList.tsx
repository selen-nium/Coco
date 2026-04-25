"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

type AlertRecord = {
  id: string;
  detected_keywords: string[];
  severity: "high" | "critical";
  created_at: string;
  elderly_user: { name: string; phone: string };
};

export function AlertsList({ initialAlerts }: { initialAlerts: AlertRecord[] }) {
  const [alerts, setAlerts] = useState(initialAlerts);
  const [busyId, setBusyId] = useState<string | null>(null);
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    let active = true;

    async function refresh() {
      const response = await fetch("/api/dashboard/alerts?status=active", {
        cache: "no-store",
      });
      const payload = await response.json();
      if (active) {
        setAlerts(payload.alerts ?? []);
      }
    }

    const channel = supabase
      .channel("alerts-page")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "scam_alerts" },
        refresh
      )
      .subscribe();

    return () => {
      active = false;
      void supabase.removeChannel(channel);
    };
  }, [supabase]);

  async function dismissAlert(id: string) {
    setBusyId(id);
    const response = await fetch(`/api/dashboard/alerts/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status: "dismissed" }),
    });

    if (response.ok) {
      setAlerts((current) => current.filter((alert) => alert.id !== id));
    }

    setBusyId(null);
  }

  if (alerts.length === 0) {
    return (
      <Card className="p-6">
        <p className="text-sm text-slate-500">No active scam alerts.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {alerts.map((alert) => (
        <Card key={alert.id} className="p-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant={alert.severity === "critical" ? "red" : "amber"}>{alert.severity.toUpperCase()}</Badge>
                <p className="text-sm font-semibold text-slate-900">{alert.elderly_user.name}</p>
              </div>
              <p className="text-sm text-slate-600">
                Keywords: {alert.detected_keywords.join(", ") || "Unknown"}
              </p>
              <p className="text-sm text-slate-500">
                {new Date(alert.created_at).toLocaleString()}
              </p>
            </div>
            <Button
              variant="outline"
              disabled={busyId === alert.id}
              onClick={() => void dismissAlert(alert.id)}
            >
              {busyId === alert.id ? "Dismissing..." : "Dismiss"}
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
}
