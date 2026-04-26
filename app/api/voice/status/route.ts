import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { deleteSession, getSession } from "@/lib/state/call-session";
import type { CallStatusPayload } from "@/types/api";

// POST /api/voice/status
// Webhook called by Twilio when the physical phone line disconnects.
export async function POST(req: NextRequest) {
  try {
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
    
    // Preserve escalated status if it was set during the call
    if (session?.status === "escalated") {
      dbStatus = "escalated";
    }

    // 2. Update call_log with duration and final status
    const { error: updateError } = await supabase
      .from("call_logs")
      .update({
        ended_at: new Date().toISOString(),
        duration_seconds: CallDuration ? parseInt(CallDuration) : null,
        status: dbStatus,
      })
      .eq("twilio_call_sid", CallSid);

    if (updateError) {
      console.error("[voice/status] Failed to update call log:", updateError);
    }

    // 3. Clean up the in-memory session (if using one)
    if (session) {
      deleteSession(CallSid);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[voice/status] Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
