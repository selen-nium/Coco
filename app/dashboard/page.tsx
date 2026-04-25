import { requireAuthenticatedCaretaker } from "@/app/api/dashboard/_lib/auth";
import { MoodChart } from "@/components/charts/MoodChart";
import { LiveAlertsPanel } from "@/components/dashboard/LiveAlertsPanel";
import { Card } from "@/components/ui/Card";

function formatMetric(value: number) {
  return value > 0 ? `+${value.toFixed(2)}` : value.toFixed(2);
}

async function getOverviewData(
  supabase: Awaited<ReturnType<typeof requireAuthenticatedCaretaker>>["supabase"],
  elderlyIds: string[]
) {
  const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const [
    { count },
    { data: metricRows },
    { data: alertRows },
  ] = await Promise.all([
    supabase
      .from("call_logs")
      .select("id", { count: "exact", head: true })
      .in("elderly_user_id", elderlyIds)
      .gte("started_at", cutoff),
    supabase
      .from("mood_metrics")
      .select("recorded_at, sentiment_score, frustration_level, confusion_level")
      .in("elderly_user_id", elderlyIds)
      .gte("recorded_at", cutoff)
      .order("recorded_at", { ascending: true }),
    supabase
      .from("scam_alerts")
      .select(
        `
          id,
          detected_keywords,
          severity,
          created_at,
          elderly_user:elderly_users!scam_alerts_elderly_user_id_fkey(name, phone)
        `
      )
      .in("elderly_user_id", elderlyIds)
      .eq("status", "active")
      .order("created_at", { ascending: false }),
  ]);

  return {
    totalCalls: count ?? 0,
    moodMetrics: metricRows ?? [],
    alerts: (alertRows ?? []).map((alert) => {
      const elderlyUser = Array.isArray(alert.elderly_user)
        ? alert.elderly_user[0]
        : undefined;

      return {
        id: alert.id,
        detected_keywords: alert.detected_keywords,
        severity: alert.severity,
        created_at: alert.created_at,
        elderly_user: {
          name: elderlyUser?.name ?? "Unknown",
          phone: elderlyUser?.phone ?? "",
        },
      };
    }),
  };
}

export default async function DashboardPage() {
  const { supabase, caretaker } = await requireAuthenticatedCaretaker();
  const { data: elderlyUsers } = await supabase
    .from("elderly_users")
    .select("id")
    .eq("caretaker_id", caretaker.id);

  const elderlyIds = (elderlyUsers ?? []).map((user) => user.id);

  let totalCalls = 0;
  let moodMetrics: Array<{
    recorded_at: string;
    sentiment_score: number;
    frustration_level: number;
    confusion_level: number;
  }> = [];
  let alerts: Array<{
    id: string;
    detected_keywords: string[];
    severity: "high" | "critical";
    created_at: string;
    elderly_user: { name: string; phone: string };
  }> = [];

  if (elderlyIds.length > 0) {
    const data = await getOverviewData(supabase, elderlyIds);
    totalCalls = data.totalCalls;
    moodMetrics = data.moodMetrics;
    alerts = data.alerts;
  }

  const averageSentiment =
    moodMetrics.length > 0
      ? moodMetrics.reduce((sum, row) => sum + row.sentiment_score, 0) / moodMetrics.length
      : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium uppercase tracking-[0.25em] text-emerald-700">
          Overview
        </p>
        <h1 className="text-4xl font-semibold text-slate-900">
          Keep every support call a little calmer.
        </h1>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-5">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Total Calls</p>
          <p className="mt-3 text-3xl font-semibold text-slate-900">{totalCalls}</p>
          <p className="mt-2 text-sm text-slate-500">Last 30 days</p>
        </Card>
        <Card className="p-5">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Active Alerts</p>
          <p className="mt-3 text-3xl font-semibold text-rose-700">{alerts.length}</p>
          <p className="mt-2 text-sm text-slate-500">Live scam watchlist</p>
        </Card>
        <Card className="p-5">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Avg Sentiment</p>
          <p className="mt-3 text-3xl font-semibold text-slate-900">
            {formatMetric(averageSentiment)}
          </p>
          <p className="mt-2 text-sm text-slate-500">Across analyzed calls</p>
        </Card>
      </div>

      <Card className="p-6">
        <div className="mb-4">
          <p className="text-lg font-semibold text-slate-900">Mood Meter</p>
          <p className="text-sm text-slate-500">Sentiment, frustration, and confusion over the last 30 days.</p>
        </div>
        <MoodChart data={moodMetrics} />
      </Card>

      <LiveAlertsPanel initialAlerts={alerts} />
    </div>
  );
}
