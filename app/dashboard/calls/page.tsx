import Link from "next/link";
import { requireAuthenticatedCaretaker } from "@/app/api/dashboard/_lib/auth";
import { Card } from "@/components/ui/Card";

function formatDuration(value: number | null) {
  if (!value) return "—";
  const m = Math.floor(value / 60);
  const s = value % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

export default async function CallsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageParam } = await searchParams;
  const page = Math.max(Number(pageParam ?? "1") || 1, 1);
  const limit = 20;
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const { supabase, caretaker } = await requireAuthenticatedCaretaker();
  const { data: elderlyUsers } = await supabase
    .from("elderly_users")
    .select("id")
    .eq("caretaker_id", caretaker.id);

  const elderlyIds = (elderlyUsers ?? []).map((u) => u.id);

  const query =
    elderlyIds.length > 0
      ? supabase
          .from("call_logs")
          .select(
            `*, elderly_user:elderly_users!call_logs_elderly_user_id_fkey(name),
             flow:ingested_flows!call_logs_flow_id_fkey(name, app)`,
            { count: "exact" }
          )
          .in("elderly_user_id", elderlyIds)
          .order("started_at", { ascending: false })
      : null;

  const { data: calls, count } = query
    ? await query.range(from, to)
    : { data: [], count: 0 };

  const normalizedCalls = (calls ?? []).map((call) => ({
    ...call,
    elderly_user: Array.isArray(call.elderly_user) ? call.elderly_user[0] : call.elderly_user,
    flow: Array.isArray(call.flow) ? call.flow[0] : call.flow,
  }));

  const totalPages = Math.max(Math.ceil((count ?? 0) / limit), 1);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[#1a1208]">Call History</h1>
        <p className="mt-1 text-sm text-[#888]">All calls routed through Coco for your linked users.</p>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-[#e8e4de] bg-[#f5f4f0]">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-[#888]">
                  Date & Time
                </th>
                <th className="hidden sm:table-cell px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-[#888]">
                  Duration
                </th>
                <th className="hidden md:table-cell px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-[#888]">
                  Sentiment
                </th>
                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-[#888]">
                  Conversation Summary
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e8e4de]">
              {normalizedCalls.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-5 py-10 text-center text-[#888] text-sm">
                    No calls found.
                  </td>
                </tr>
              ) : (
                normalizedCalls.map((call) => (
                  <tr key={call.id} className="hover:bg-[#f5f4f0] transition-colors">
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <Link
                        href={`/dashboard/calls/${call.id}`}
                        className="font-medium text-[#1a1208] hover:text-[#e8733b] transition-colors"
                      >
                        {new Date(call.started_at).toLocaleString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                          timeZone: "America/Los_Angeles",
                        })}
                      </Link>
                    </td>
                    <td className="hidden sm:table-cell px-5 py-3.5 text-[#666] whitespace-nowrap">
                      {formatDuration(call.duration_seconds)}
                    </td>
                    <td className="hidden md:table-cell px-5 py-3.5 text-[#666] whitespace-nowrap">
                      {call.intent_text ?? "—"}
                    </td>
                    <td className="px-5 py-3.5 text-[#666] min-w-[200px] max-w-md">
                      {call.summary ?? "Summary pending"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <Link
          href={`/dashboard/calls?page=${Math.max(page - 1, 1)}`}
          className={`rounded-xl border px-4 py-2 text-sm font-medium transition-colors ${
            page === 1
              ? "pointer-events-none border-transparent bg-[#e8e4de] text-[#bbb]"
              : "border-[#e8e4de] bg-white text-[#1a1208] hover:border-[#e8733b] hover:text-[#e8733b]"
          }`}
        >
          ← Previous
        </Link>
        <p className="text-sm text-[#888]">
          Page {page} of {totalPages}
        </p>
        <Link
          href={`/dashboard/calls?page=${Math.min(page + 1, totalPages)}`}
          className={`rounded-xl border px-4 py-2 text-sm font-medium transition-colors ${
            page >= totalPages
              ? "pointer-events-none border-transparent bg-[#e8e4de] text-[#bbb]"
              : "border-[#e8e4de] bg-white text-[#1a1208] hover:border-[#e8733b] hover:text-[#e8733b]"
          }`}
        >
          Next →
        </Link>
      </div>
    </div>
  );
}
