import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { z } from "zod";

const logScamSchema = z.object({
  details: z.string().optional().default(""),
  keywords: z.array(z.string()).optional().default([]),
  severity: z.enum(["high", "critical"]).optional().default("high"),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ call_sid: string }> }
) {
  try {
    const { call_sid } = await params;
    const body = await req.json();
    const { details, keywords, severity } = logScamSchema.parse(body);

    const supabase = await createServiceClient();
    
    // Determine if call_sid is a UUID or a Twilio/ElevenLabs ID
    const isUuid = z.string().uuid().safeParse(call_sid).success;
    
    let query = supabase
      .from("call_logs")
      .select("id, elderly_user_id, twilio_call_sid");

    if (isUuid) {
      query = query.eq("id", call_sid);
    } else {
      query = query.eq("twilio_call_sid", call_sid);
    }

    const { data: callLog, error: logError } = await query.maybeSingle();

    if (logError) {
      console.error("[tools/log-scam] Database error during lookup:", logError);
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    if (!callLog) {
      console.error(`[tools/log-scam] Call log not found for SID: ${call_sid} (isUuid: ${isUuid})`);
      return NextResponse.json({ 
        error: "Call log not found",
        details: `No record found for ${isUuid ? 'UUID' : 'SID'} ${call_sid}`
      }, { status: 404 });
    }

    console.log(`[tools/log-scam] Found call log: ${callLog.id} for user: ${callLog.elderly_user_id}`);

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
