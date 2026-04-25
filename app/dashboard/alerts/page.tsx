// TODO (Agent 3): fetch scam_alerts via /api/dashboard/alerts, add Supabase Realtime subscription
export default function AlertsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Alerts</h1>
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <p className="text-gray-400 text-sm">
          Alert list — Agent 3 implements with real-time Supabase subscription
        </p>
      </div>
    </div>
  );
}
