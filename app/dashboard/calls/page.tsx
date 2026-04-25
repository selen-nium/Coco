// TODO (Agent 3): fetch call logs via /api/dashboard/calls with pagination
export default function CallsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Call History</h1>
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {["Date", "Duration", "Intent / App", "Summary", "Interventions"].map((h) => (
                <th key={h} className="text-left px-4 py-3 text-gray-500 font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                No calls yet — Agent 3 populates this table
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
