import { NextRequest, NextResponse } from "next/server";
import {
  requireAuthenticatedCaretaker,
  responseForError,
} from "@/app/api/dashboard/_lib/auth";

// GET /api/dashboard/calls/[id]
// Returns a single call log with full transcript and intervention logs.
// Agent 3 owns this route.
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { supabase, caretaker } = await requireAuthenticatedCaretaker();
    const { data: call, error: callError } = await supabase
      .from("call_logs")
      .select(
        `
          *,
          elderly_user:elderly_users!call_logs_elderly_user_id_fkey(id, name, phone, caretaker_id),
          flow:ingested_flows!call_logs_flow_id_fkey(id, name, app, description)
        `
      )
      .eq("id", id)
      .maybeSingle();

    if (callError) {
      throw callError;
    }

    if (!call || call.elderly_user?.caretaker_id !== caretaker.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const [{ data: transcripts, error: transcriptError }, { data: interventions, error: interventionError }] =
      await Promise.all([
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

    if (transcriptError) {
      throw transcriptError;
    }

    if (interventionError) {
      throw interventionError;
    }

    return NextResponse.json({
      ...call,
      transcripts: transcripts ?? [],
      interventions: interventions ?? [],
    });
  } catch (error) {
    return responseForError(error);
  }
}
