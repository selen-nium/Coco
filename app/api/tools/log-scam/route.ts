import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { call_sid, details } = body;

    if (!call_sid) {
      return NextResponse.json({ error: "Missing call_sid" }, { status: 400 });
    }

    const supabase = await createServiceClient();
    
    // First lookup the call_log_id
    const { data: callLog, error: logError } = await supabase
      .from("call_logs")
      .select("id")
      .eq("twilio_call_sid", call_sid)
      .single();

    if (logError || !callLog) {
      return NextResponse.json({ error: "Call log not found" }, { status: 404 });
    }

    const { error } = await supabase
      .from("intervention_logs")
      .insert({
        call_log_id: callLog.id,
        type: "scam",
        metadata: { details }
      });

    if (error) {
      console.error("[tools/log-scam] Supabase error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "Scam alert logged successfully." });
  } catch (err) {
    console.error("[tools/log-scam] Error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
