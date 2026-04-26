import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { deleteSession, getSession } from "@/lib/state/call-session";
import { validateTwilioSignature } from "@/lib/twilio/client";
import type { CallStatusPayload } from "@/types/api";

// POST /api/voice/status
export async function POST(req: NextRequest) {
  const url = req.url;
  const signature = req.headers.get("x-twilio-signature") || "";
  const body = await req.formData();
  const params = Object.fromEntries(body) as Record<string, string>;
  if (!validateTwilioSignature(signature, url, params)) {
    console.error("[voice/status] Invalid Twilio signature");
    return new NextResponse("Forbidden", { status: 403 });
  }
  const payload = params as unknown as CallStatusPayload;
  const { CallSid, CallStatus, CallDuration } = payload;

  const supabase = await createServiceClient();
  const session = getSession(CallSid);

  // 1. Map Twilio status to our DB status
  let dbStatus: "completed" | "dropped" | "escalated" = "completed";
  if (CallStatus !== "completed") {
    dbStatus = "dropped";
  }
  
  if (session?.status === "escalated") {
    dbStatus = "escalated";
  }

  // 2. Update call_log
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

  // 3. Clean up the in-memory session.
  if (session) {
    deleteSession(CallSid);
  }

  return NextResponse.json({ ok: true });
}
