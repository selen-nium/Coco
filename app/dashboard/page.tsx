import { requireAuthenticatedCaretaker } from "@/app/api/dashboard/_lib/auth";
import { LiveAlertsPanel } from "@/components/dashboard/LiveAlertsPanel";
import { ScamAlertsCard } from "@/components/dashboard/ScamAlertsCard";
import { MoodChart } from "@/components/charts/MoodChart";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import Link from "next/link";

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function formatDuration(seconds: number | null) {
  if (!seconds) return "—";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

async function getOverviewData(
  supabase: Awaited<ReturnType<typeof requireAuthenticatedCaretaker>>["supabase"],
  elderlyIds: string[]
) {
  const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const [{ count }, { data: metricRows }, { data: alertRows }, { data: recentCalls }] =
    await Promise.all([
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
          `id, detected_keywords, severity, created_at,
           elderly_user:elderly_users!scam_alerts_elderly_user_id_fkey(name, phone)`
        )
        .in("elderly_user_id", elderlyIds)
        .eq("status", "active")
        .order("created_at", { ascending: false }),
      supabase
        .from("call_logs")
        .select(
          `id, started_at, duration_seconds, status, intent_text,
           flow:ingested_flows!call_logs_flow_id_fkey(name, app)`
        )
        .in("elderly_user_id", elderlyIds)
        .order("started_at", { ascending: false })
        .limit(5),
    ]);

  return {
    totalCalls: count ?? 0,
    moodMetrics: metricRows ?? [],
    alerts: (alertRows ?? []).map((alert) => {
      const elderlyUser = Array.isArray(alert.elderly_user)
        ? alert.elderly_user[0]
        : alert.elderly_user;
      return {
        id: alert.id,
        detected_keywords: alert.detected_keywords,
        severity: alert.severity,
        created_at: alert.created_at,
        elderly_user: {
          name: (elderlyUser as { name?: string; phone?: string } | null)?.name ?? "Unknown",
          phone: (elderlyUser as { name?: string; phone?: string } | null)?.phone ?? "",
        },
      };
    }),
    recentCalls: (recentCalls ?? []).map((call) => ({
      ...call,
      flow: Array.isArray(call.flow) ? call.flow[0] : call.flow,
    })),
  };
}

export default async function DashboardPage() {
  const { supabase, caretaker } = await requireAuthenticatedCaretaker();
  const { data: elderlyUsers } = await supabase
    .from("elderly_users")
    .select("id, name, nickname")
    .eq("caretaker_id", caretaker.id);

  const elderlyIds = (elderlyUsers ?? []).map((u) => u.id);

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
  let recentCalls: Array<{
    id: string;
    started_at: string;
    duration_seconds: number | null;
    status: string | null;
    intent_text: string | null;
    flow: { name: string; app: string } | null;
  }> = [];

  if (elderlyIds.length > 0) {
    const data = await getOverviewData(supabase, elderlyIds);
    totalCalls = data.totalCalls;
    moodMetrics = data.moodMetrics;
    alerts = data.alerts;
    recentCalls = data.recentCalls as typeof recentCalls;
  }

  const averageSentiment =
    moodMetrics.length > 0
      ? moodMetrics.reduce((sum, r) => sum + r.sentiment_score, 0) / moodMetrics.length
      : null;

  const caretakerFirstName = caretaker.name?.split(" ")[0] ?? "there";
  const primaryElderlyName =
    elderlyUsers?.[0]?.nickname ?? elderlyUsers?.[0]?.name ?? null;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-[#1a1208]">
          {getGreeting()}, {caretakerFirstName} 👋
        </h1>
        {primaryElderlyName && (
          <p className="mt-1 text-sm text-[#888]">
            Here&apos;s how {primaryElderlyName} is doing.
          </p>
        )}
      </div>


      <div className="grid gap-4 grid-cols-3">
        <Card className="p-5">
          <p className="text-xs font-medium uppercase tracking-wider text-[#888]">Total Calls</p>
          <p className="mt-3 text-3xl font-bold text-[#1a1208]">{totalCalls}</p>
          <p className="mt-1 text-xs text-[#aaa]">Last 30 days</p>
        </Card>
        <Card className="p-5">
          <p className="text-xs font-medium uppercase tracking-wider text-[#888]">Scam Alerts</p>
          <p className={`mt-3 text-3xl font-bold ${alerts.length > 0 ? "text-red-600" : "text-[#1a1208]"}`}>
            {alerts.length}
          </p>
          <p className="mt-1 text-xs text-[#aaa]">Active</p>
        </Card>
        <Card className="p-5">
          <p className="text-xs font-medium uppercase tracking-wider text-[#888]">Mood Score</p>
          <p className="mt-3 text-3xl font-bold text-[#1a1208]">
            {averageSentiment !== null ? averageSentiment.toFixed(2) : "—"}
          </p>
          <p className="mt-1 text-xs text-[#aaa]">Avg sentiment</p>
        </Card>
      </div>

      {moodMetrics.length > 0 && (
        <Card className="p-6">
          <p className="text-base font-semibold text-[#1a1208] mb-1">Mood over time</p>
          <p className="text-sm text-[#888] mb-4">Sentiment, frustration, and confusion — last 30 days</p>
          <MoodChart data={moodMetrics} />
        </Card>
      )}

      <ScamAlertsCard />

      <div>
        <div className="flex items-center justify-between mb-4">
          <p className="text-base font-semibold text-[#1a1208]">Recent calls</p>
          <Link href="/dashboard/calls" className="text-sm text-[#e8733b] hover:underline font-medium">
            View all →
          </Link>
        </div>
        <Card className="overflow-hidden">
          {recentCalls.length === 0 ? (
            <div className="px-6 py-10 text-center">
              <p className="text-sm text-[#888]">No calls yet. They&apos;ll show up here.</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="border-b border-[#e8e4de] bg-[#f5f4f0]">
                <tr>
                  {["Date", "Duration", "Intent", "Status"].map((h) => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-[#888]">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e8e4de]">
                {recentCalls.map((call) => (
                  <tr key={call.id} className="hover:bg-[#f5f4f0] transition-colors">
                    <td className="px-5 py-3.5">
                      <Link href={`/dashboard/calls/${call.id}`} className="font-medium text-[#1a1208] hover:text-[#e8733b]">
                        {new Date(call.started_at).toLocaleString("en-US", {
                          month: "short", day: "numeric", hour: "numeric", minute: "2-digit", timeZone: "America/Los_Angeles"
                        })}
                      </Link>
                    </td>
                    <td className="px-5 py-3.5 text-[#666]">{formatDuration(call.duration_seconds)}</td>
                    <td className="px-5 py-3.5 text-[#666]">
                      {call.flow?.app ?? call.intent_text ?? "Unknown"}
                    </td>
                    <td className="px-5 py-3.5">
                      <Badge variant={call.status === "completed" ? "green" : call.status === "scam_blocked" ? "red" : "gray"}>
                        {call.status ?? "unknown"}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      </div>

      {alerts.length > 0 && <LiveAlertsPanel initialAlerts={alerts} />}
    </div>
  );
}
