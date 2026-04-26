import Link from "next/link";
import { requireAuthenticatedCaretaker } from "@/app/api/dashboard/_lib/auth";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";

export default async function CallDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { supabase, caretaker } = await requireAuthenticatedCaretaker();
  const { data: call } = await supabase
    .from("call_logs")
    .select(
      `
        *,
        elderly_user:elderly_users!call_logs_elderly_user_id_fkey(name, phone, caretaker_id),
        flow:ingested_flows!call_logs_flow_id_fkey(name, app)
      `
    )
    .eq("id", id)
    .maybeSingle();

  const normalizedCall = call
    ? {
        ...call,
        elderly_user: Array.isArray(call.elderly_user)
          ? call.elderly_user[0]
          : call.elderly_user,
        flow: Array.isArray(call.flow) ? call.flow[0] : call.flow,
      }
    : null;

  if (!normalizedCall || normalizedCall.elderly_user?.caretaker_id !== caretaker.id) {
    return (
      <Card className="p-6">
        <p className="text-sm text-slate-500">Call not found.</p>
      </Card>
    );
  }

  const [{ data: transcripts }, { data: interventions }] = await Promise.all([
    supabase
      .from("call_transcripts")
      .select("*")
      .eq("call_log_id", id)
      .order("timestamp", { ascending: true }),
    supabase
      .from("intervention_logs")
      .select("*")
      .eq("call_log_id", id)
      .order("triggered_at", { ascending: true }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
        <p className="text-sm font-medium uppercase tracking-[0.25em] text-cyan-700">
            Call Detail
          </p>
          <h1 className="mt-2 text-4xl font-semibold text-slate-900">
            {normalizedCall.elderly_user?.name}
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            {new Date(normalizedCall.started_at).toLocaleString("en-US", { timeZone: "America/Los_Angeles", month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" })}
          </p>
        </div>
        <Link href="/dashboard/calls" className="rounded-xl bg-white px-4 py-2 text-sm ring-1 ring-slate-200">
          Back to calls
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-5">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Status</p>
          <p className="mt-3 text-xl font-semibold text-slate-900">{normalizedCall.status}</p>
        </Card>
        <Card className="p-5">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Intent / App</p>
          <p className="mt-3 text-xl font-semibold text-slate-900">
            {normalizedCall.flow?.app ?? normalizedCall.intent_text ?? "Unknown"}
          </p>
        </Card>
        <Card className="p-5">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Summary</p>
          <p className="mt-3 text-sm text-slate-600">
            {normalizedCall.summary ?? "Summary pending"}
          </p>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_0.8fr]">
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-slate-900">Transcript</h2>
          <div className="mt-4 space-y-3">
            {(transcripts ?? []).map((line) => (
              <div
                key={line.id}
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${
                  line.speaker === "agent"
                    ? "bg-emerald-50 text-emerald-900"
                    : "ml-auto bg-slate-100 text-slate-800"
                }`}
              >
                <p className="font-semibold capitalize">{line.speaker}</p>
                <p className="mt-1 whitespace-pre-wrap">{line.text}</p>
                <p className="mt-2 text-xs opacity-70">
                  {new Date(line.timestamp).toLocaleTimeString("en-US", { timeZone: "America/Los_Angeles", hour: "numeric", minute: "2-digit" })}
                </p>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-semibold text-slate-900">Interventions</h2>
          <div className="mt-4 space-y-4">
            {(interventions ?? []).length === 0 ? (
              <p className="text-sm text-slate-500">No interventions recorded.</p>
            ) : (
              (interventions ?? []).map((item) => (
                <div key={item.id} className="rounded-2xl border border-slate-200 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <Badge variant={item.type === "scam" ? "red" : "gray"}>{item.type}</Badge>
                    <span className="text-xs text-slate-500">
                      {new Date(item.triggered_at).toLocaleTimeString("en-US", { timeZone: "America/Los_Angeles", hour: "numeric", minute: "2-digit" })}
                    </span>
                  </div>
                  <pre className="mt-3 overflow-x-auto whitespace-pre-wrap text-xs text-slate-600">
                    {JSON.stringify(item.metadata, null, 2)}
                  </pre>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
