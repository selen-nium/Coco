// TODO (Agent 3): fetch real stats, mood trend, and active alerts for the overview
export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Overview</h1>

      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-4">
        {["Total Calls", "Active Alerts", "Avg Sentiment"].map((label) => (
          <div key={label} className="bg-white rounded-xl border border-gray-200 p-5">
            <p className="text-xs text-gray-500 uppercase tracking-wide">{label}</p>
            <div className="mt-2 h-8 bg-gray-100 rounded animate-pulse w-16" />
          </div>
        ))}
      </div>

      {/* Mood meter placeholder */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <p className="text-sm font-medium mb-4">Mood Meter — Last 30 Days</p>
        <div className="h-40 bg-gray-50 rounded-lg flex items-center justify-center text-gray-400 text-sm">
          Chart placeholder — Agent 3 implements with Recharts
        </div>
      </div>

      {/* Active scam alert placeholder */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <p className="text-sm font-medium mb-4">Live Alerts</p>
        <div className="text-gray-400 text-sm">No active alerts</div>
      </div>
    </div>
  );
}
