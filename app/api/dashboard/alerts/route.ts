import { NextRequest, NextResponse } from "next/server";
import {
  requireAuthenticatedCaretaker,
  responseForError,
} from "@/app/api/dashboard/_lib/auth";

// GET /api/dashboard/alerts
// Returns all scam_alerts for the caretaker's elderly users.
// Query params: status (active|dismissed), elderly_user_id
// Agent 3 owns this route.
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") ?? "active";
    const elderlyUserId = searchParams.get("elderly_user_id");
    const { supabase, caretaker } = await requireAuthenticatedCaretaker();

    let query = supabase
      .from("scam_alerts")
      .select(
        `
          *,
          elderly_user:elderly_users!scam_alerts_elderly_user_id_fkey(id, name, phone, caretaker_id),
          call_log:call_logs!scam_alerts_call_log_id_fkey(id, started_at, summary, twilio_call_sid)
        `
      )
      .eq("status", status)
      .order("created_at", { ascending: false });

    if (elderlyUserId) {
      query = query.eq("elderly_user_id", elderlyUserId);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    const alerts = (data ?? []).filter(
      (alert) => alert.elderly_user?.caretaker_id === caretaker.id
    );

    return NextResponse.json({ alerts });
  } catch (error) {
    return responseForError(error);
  }
}
