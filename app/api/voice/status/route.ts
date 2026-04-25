import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { deleteSession, getSession } from "@/lib/state/call-session";
import type { CallStatusPayload } from "@/types/api";

// POST /api/voice/status
export async function POST(req: NextRequest) {
  const body = await req.formData();
  const payload = Object.fromEntries(body) as unknown as CallStatusPayload;
  const { CallSid, CallStatus, CallDuration } = payload;

  const supabase = await createServiceClient();
  const session = getSession(CallSid);

  // 1. Map Twilio status to our DB status
  let dbStatus: "completed" | "dropped" | "escalated" = "completed";
  if (CallStatus !== "completed") {
    dbStatus = "dropped";
  }
  
  // If the session was already marked as escalated, preserve it
  if (session?.status === "escalated") {
    dbStatus = "escalated";
  }

  // 2. Update call_log
  const { data: callLog, error: updateError } = await supabase
    .from("call_logs")
    .update({
      ended_at: new Date().toISOString(),
      duration_seconds: CallDuration ? parseInt(CallDuration) : null,
      status: dbStatus,
    })
    .eq("twilio_call_sid", CallSid)
    .select()
    .single();

  if (updateError) {
    console.error("[voice/status] Failed to update call log:", updateError);
  }

  // 3. Clean up CallSession
  if (session) {
    const elderlyUserId = session.elderly_user_id;
    deleteSession(CallSid);

    // 4. Fire-and-forget intelligence tasks
    if (callLog) {
      const protocol = req.headers.get("x-forwarded-proto") || "http";
      const host = req.headers.get("host");
      const baseUrl = `${protocol}://${host}`;

      // Summarize
      fetch(`${baseUrl}/api/intelligence/summarize`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ call_log_id: callLog.id }),
      }).catch(err => console.error("[voice/status] Summarize trigger failed:", err));

      // Mood Analysis
      fetch(`${baseUrl}/api/intelligence/mood`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          call_log_id: callLog.id,
          elderly_user_id: elderlyUserId,
        }),
      }).catch(err => console.error("[voice/status] Mood trigger failed:", err));
    }
  }

  return NextResponse.json({ ok: true });
}
