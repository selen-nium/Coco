import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { z } from "zod";

const logScamSchema = z.object({
  call_sid: z.string().min(1),
  details: z.string().optional().default(""),
  keywords: z.array(z.string()).optional().default([]),
  severity: z.enum(["high", "critical"]).optional().default("high"),
});

export async function POST(req: NextRequest) {
  try {
    const { call_sid, details, keywords, severity } = logScamSchema.parse(
      await req.json()
    );

    const supabase = await createServiceClient();
    
    // First lookup the call_log_id
    const { data: callLog, error: logError } = await supabase
      .from("call_logs")
      .select("id, elderly_user_id")
      .eq("twilio_call_sid", call_sid)
      .single();

    if (logError || !callLog) {
      return NextResponse.json({ error: "Call log not found" }, { status: 404 });
    }

    const [{ error: interventionError }, { error: alertError }, { error: statusError }] =
      await Promise.all([
        supabase.from("intervention_logs").insert({
          call_log_id: callLog.id,
          type: "scam",
          metadata: { details, keywords, severity },
        }),
        supabase.from("scam_alerts").insert({
          call_log_id: callLog.id,
          elderly_user_id: callLog.elderly_user_id,
          detected_keywords: keywords,
          severity,
        }),
        supabase
          .from("call_logs")
          .update({ status: "escalated" })
          .eq("id", callLog.id),
      ]);

    const error = interventionError ?? alertError ?? statusError;
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
