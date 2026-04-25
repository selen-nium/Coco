import { NextRequest, NextResponse } from "next/server";
import {
  requireAuthenticatedCaretaker,
  responseForError,
} from "@/app/api/dashboard/_lib/auth";

// GET /api/dashboard/calls
// Returns paginated call log for the authenticated caretaker's elderly users.
// Query params: elderly_user_id, page, limit
// Agent 3 owns this route.
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const elderlyUserId = searchParams.get("elderly_user_id");
    const page = Math.max(parseInt(searchParams.get("page") ?? "1", 10), 1);
    const limit = Math.min(
      Math.max(parseInt(searchParams.get("limit") ?? "20", 10), 1),
      50
    );
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    const { supabase, caretaker } = await requireAuthenticatedCaretaker();
    const { data: elderlyUsers, error: elderlyError } = await supabase
      .from("elderly_users")
      .select("id")
      .eq("caretaker_id", caretaker.id);

    if (elderlyError) {
      throw elderlyError;
    }

    const elderlyIds = (elderlyUsers ?? []).map((user) => user.id);

    if (elderlyIds.length === 0) {
      return NextResponse.json({ calls: [], total: 0, page, limit });
    }

    let query = supabase
      .from("call_logs")
      .select(
        `
          *,
          elderly_user:elderly_users!call_logs_elderly_user_id_fkey(id, name, phone),
          flow:ingested_flows!call_logs_flow_id_fkey(id, name, app)
        `,
        { count: "exact" }
      )
      .in("elderly_user_id", elderlyIds)
      .order("started_at", { ascending: false })
      .range(from, to);

    if (elderlyUserId) {
      query = query.eq("elderly_user_id", elderlyUserId);
    }

    const { data, error, count } = await query;

    if (error) {
      throw error;
    }

    const callIds = (data ?? []).map((call) => call.id);
    const { data: interventions, error: interventionError } = await supabase
      .from("intervention_logs")
      .select("call_log_id")
      .in("call_log_id", callIds.length ? callIds : ["00000000-0000-0000-0000-000000000000"]);

    if (interventionError) {
      throw interventionError;
    }

    const interventionCounts = new Map<string, number>();

    for (const row of interventions ?? []) {
      interventionCounts.set(
        row.call_log_id,
        (interventionCounts.get(row.call_log_id) ?? 0) + 1
      );
    }

    const calls = (data ?? []).map((call) => ({
      ...call,
      intervention_count: interventionCounts.get(call.id) ?? 0,
    }));

    return NextResponse.json({ calls, total: count ?? 0, page, limit });
  } catch (error) {
    return responseForError(error);
  }
}
