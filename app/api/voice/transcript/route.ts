import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { getSession, updateSession, advanceStep, incrementStepAttempts } from "@/lib/state/call-session";
import type { TranscriptChunkPayload } from "@/types/api";

// POST /api/voice/transcript
export async function POST(req: NextRequest) {
  const payload: TranscriptChunkPayload = await req.json();
  const { call_sid, speaker, text, timestamp } = payload;

  const supabase = await createServiceClient();
  const session = getSession(call_sid);

  if (!session) {
    console.error("[voice/transcript] No session found for call_sid:", call_sid);
    return NextResponse.json({ ok: false, error: "No session" }, { status: 404 });
  }

  // 1. Write chunk to call_transcripts in Supabase
  // We need the call_log_id. We can look it up by twilio_call_sid.
  const { data: callLog, error: logError } = await supabase
    .from("call_logs")
    .select("id")
    .eq("twilio_call_sid", call_sid)
    .single();

  if (logError || !callLog) {
    console.error("[voice/transcript] Call log not found:", logError);
    return NextResponse.json({ ok: false, error: "Call log not found" }, { status: 404 });
  }

  const { error: transcriptError } = await supabase
    .from("call_transcripts")
    .insert({
      call_log_id: callLog.id,
      speaker,
      text,
      timestamp,
    });

  if (transcriptError) {
    console.error("[voice/transcript] Failed to insert transcript:", transcriptError);
  }

  // 2. If first user utterance → POST /api/intelligence/intent
  if (speaker === "user" && session.flow_id === null) {
    // Fire-and-forget intent detection
    const protocol = req.headers.get("x-forwarded-proto") || "http";
    const host = req.headers.get("host");
    const baseUrl = `${protocol}://${host}`;

    fetch(`${baseUrl}/api/intelligence/intent`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        call_sid,
        elderly_user_id: session.elderly_user_id,
        text,
      }),
    }).then(async (res) => {
      if (res.ok) {
        const result = await res.json();
        if (result.flow_id) {
          updateSession(call_sid, { flow_id: result.flow_id });
        }
      }
    }).catch(err => console.error("[voice/transcript] Intent detection failed:", err));
  }

  // 3. Fire-and-forget scam-alert
  if (speaker === "user") {
    const protocol = req.headers.get("x-forwarded-proto") || "http";
    const host = req.headers.get("host");
    const baseUrl = `${protocol}://${host}`;

    fetch(`${baseUrl}/api/intelligence/scam-alert`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        call_sid,
        elderly_user_id: session.elderly_user_id,
        text, // Agent 2 might want more context, but we send this chunk
      }),
    }).catch(err => console.error("[voice/transcript] Scam alert failed:", err));
  }

  // 4. Three-Loop Rule logic
  if (speaker === "agent") {
    const successKeywords = ["great", "excellent", "perfect", "done", "success", "next step"];
    const isSuccess = successKeywords.some(kw => text.toLowerCase().includes(kw));

    if (isSuccess) {
      advanceStep(call_sid);
    } else {
      const attempts = incrementStepAttempts(call_sid);
      if (attempts >= 3) {
        // Escalate!
        console.warn("[voice/transcript] 3-loop detected for call_sid:", call_sid);
        
        await supabase.from("intervention_logs").insert({
          call_log_id: callLog.id,
          type: "3-loop",
          step_index: session.current_step,
        });

        await supabase.from("call_logs")
          .update({ status: "escalated" })
          .eq("id", callLog.id);

        updateSession(call_sid, { status: "escalated" });

        // TODO: Inject system message into ElevenLabs if possible
        // For now, we rely on the next agent turn to see the escalated status if they check it,
        // but we should ideally tell ElevenLabs directly.
        // Since we don't have the WebSocket, we might need a REST API call.
      }
    }
  }

  return NextResponse.json({ ok: true });
}
