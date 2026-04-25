import { NextRequest, NextResponse } from "next/server";
import type { ScamAlertPayload } from "@/types/api";

// POST /api/intelligence/scam-alert
// Called asynchronously per transcript chunk by Agent 1.
// Gemini 2.5 Flash analyzes for scam signals; triggers caretaker SMS + DB alert if detected.
// Agent 2 owns this route.
export async function POST(req: NextRequest) {
  // TODO (Agent 2):
  // 1. Parse ScamAlertPayload
  // 2. Send transcript excerpt to safetyModel (Gemini 2.5 Flash) with SCAM_DETECTION_PROMPT
  // 3. Parse JSON response — if is_scam:
  //    a. Insert scam_alerts row
  //    b. Send Twilio SMS to caretaker (use twilioClient)
  //    c. Update call_log status to 'escalated'
  //    d. Insert intervention_log row (type: 'scam')
  // 4. Return { flagged: boolean }

  const payload: ScamAlertPayload = await req.json();

  console.log("[intelligence/scam-alert]", payload.call_sid);

  return NextResponse.json({ flagged: false });
}
