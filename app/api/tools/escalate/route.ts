import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { updateSession } from "@/lib/state/call-session";
import { z } from "zod";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { call_sid } = body;

    if (!call_sid) {
      return NextResponse.json({ error: "Missing call_sid" }, { status: 400 });
    }

    const supabase = await createServiceClient();

    // Determine if call_sid is a UUID or a Twilio/ElevenLabs ID
    const isUuid = z.string().uuid().safeParse(call_sid).success;
    
    let query = supabase
      .from("call_logs")
      .select("id, twilio_call_sid");

    if (isUuid) {
      query = query.eq("id", call_sid);
    } else {
      query = query.eq("twilio_call_sid", call_sid);
    }

    const { data: callLog, error: logError } = await query.maybeSingle();

    if (logError || !callLog) {
      console.error(`[tools/escalate] Call log not found for SID: ${call_sid}`);
      return NextResponse.json({ error: "Call log not found" }, { status: 404 });
    }

    const { error: updateError } = await supabase
      .from("call_logs")
      .update({ status: "escalated" })
      .eq("id", callLog.id);

    if (updateError) {
      console.error("[tools/escalate] Supabase error during update:", updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // Always use the Twilio SID for session state if available
    updateSession(callLog.twilio_call_sid || callLog.id, { status: "escalated" });

    return NextResponse.json({ success: true, message: "Call successfully escalated." });
  } catch (err) {
    console.error("[tools/escalate] Error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
