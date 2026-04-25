import Link from "next/link";
import { requireAuthenticatedCaretaker } from "@/app/api/dashboard/_lib/auth";
import { Card } from "@/components/ui/Card";

function formatDuration(value: number | null) {
  if (!value) return "—";
  const minutes = Math.floor(value / 60);
  const seconds = value % 60;
  return `${minutes}m ${seconds}s`;
}

export default async function CallsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageParam } = await searchParams;
  const page = Math.max(Number(pageParam ?? "1") || 1, 1);
  const limit = 10;
  const from = (page - 1) * limit;
  const to = from + limit - 1;
  const { supabase, caretaker } = await requireAuthenticatedCaretaker();
  const { data: elderlyUsers } = await supabase
    .from("elderly_users")
    .select("id")
    .eq("caretaker_id", caretaker.id);

  const elderlyIds = (elderlyUsers ?? []).map((user) => user.id);
  const { data: calls, count } =
    elderlyIds.length > 0
      ? await supabase
          .from("call_logs")
          .select(
            `
              *,
              elderly_user:elderly_users!call_logs_elderly_user_id_fkey(name),
              flow:ingested_flows!call_logs_flow_id_fkey(name, app)
            `,
            { count: "exact" }
          )
          .in("elderly_user_id", elderlyIds)
          .order("started_at", { ascending: false })
          .range(from, to)
      : { data: [], count: 0 };

  const callIds = (calls ?? []).map((call) => call.id);
  const { data: interventionRows } =
    callIds.length > 0
      ? await supabase.from("intervention_logs").select("call_log_id").in("call_log_id", callIds)
      : { data: [] };

  const counts = new Map<string, number>();
  for (const row of interventionRows ?? []) {
    counts.set(row.call_log_id, (counts.get(row.call_log_id) ?? 0) + 1);
  }

  const normalizedCalls = (calls ?? []).map((call) => ({
    ...call,
    elderly_user: Array.isArray(call.elderly_user)
      ? call.elderly_user[0]
      : call.elderly_user,
    flow: Array.isArray(call.flow) ? call.flow[0] : call.flow,
  }));

  const totalPages = Math.max(Math.ceil((count ?? 0) / limit), 1);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium uppercase tracking-[0.25em] text-cyan-700">
          Call History
        </p>
        <h1 className="mt-2 text-4xl font-semibold text-slate-900">Recent conversations</h1>
      </div>
      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-slate-200 bg-slate-50">
            <tr>
              {["Date", "Duration", "Intent / App", "Summary", "Interventions"].map((h) => (
                <th key={h} className="px-4 py-3 text-left font-medium text-slate-500">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {normalizedCalls.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                  No calls yet.
                </td>
              </tr>
            ) : (
              normalizedCalls.map((call) => (
                <tr key={call.id} className="border-t border-slate-100 hover:bg-slate-50/70">
                  <td className="px-4 py-4 text-slate-600">
                    <Link href={`/dashboard/calls/${call.id}`} className="font-medium text-slate-900">
                      {new Date(call.started_at).toLocaleString()}
                    </Link>
                  </td>
                  <td className="px-4 py-4 text-slate-600">
                    {formatDuration(call.duration_seconds)}
                  </td>
                  <td className="px-4 py-4 text-slate-600">
                    {call.flow?.app ?? call.intent_text ?? "Unknown"}
                  </td>
                  <td className="max-w-md px-4 py-4 text-slate-600">
                    {call.summary ?? "Summary pending"}
                  </td>
                  <td className="px-4 py-4 text-slate-600">
                    {counts.get(call.id) ?? 0}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </Card>
      <div className="flex items-center justify-between">
        <Link
          href={`/dashboard/calls?page=${Math.max(page - 1, 1)}`}
          className={`rounded-xl px-4 py-2 text-sm ${
            page === 1
              ? "pointer-events-none bg-slate-100 text-slate-400"
              : "bg-white text-slate-700 ring-1 ring-slate-200"
          }`}
        >
          Previous
        </Link>
        <p className="text-sm text-slate-500">
          Page {page} of {totalPages}
        </p>
        <Link
          href={`/dashboard/calls?page=${Math.min(page + 1, totalPages)}`}
          className={`rounded-xl px-4 py-2 text-sm ${
            page >= totalPages
              ? "pointer-events-none bg-slate-100 text-slate-400"
              : "bg-white text-slate-700 ring-1 ring-slate-200"
          }`}
        >
          Next
        </Link>
      </div>
    </div>
  );
}
