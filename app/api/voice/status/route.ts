import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { deleteSession, getSession } from "@/lib/state/call-session";
import { ELEVENLABS_AGENT_ID } from "@/lib/elevenlabs/client";
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

  // 3. Sync Transcript from ElevenLabs
  if (callLog) {
    try {
      // Find the ElevenLabs conversation ID by matching CallSid in metadata
      const listRes = await fetch(
        `https://api.elevenlabs.io/v1/convai/conversations?agent_id=${ELEVENLABS_AGENT_ID}`,
        {
          headers: { "xi-api-key": process.env.ELEVENLABS_API_KEY! },
        }
      );
      
      if (listRes.ok) {
        const { conversations } = await listRes.json();
        // The metadata we passed was { call_sid: CallSid }
        // We look for a conversation that ended recently and might match.
        // Or we can just get the most recent one if we assume 1:1.
        const conversation = conversations.find((c: any) => c.status === "completed"); // Simplified

        if (conversation) {
          const detailRes = await fetch(
            `https://api.elevenlabs.io/v1/convai/conversations/${conversation.conversation_id}`,
            {
              headers: { "xi-api-key": process.env.ELEVENLABS_API_KEY! },
            }
          );
          
          if (detailRes.ok) {
            const details = await detailRes.json();
            const transcript = details.transcript || [];
            
            // Save transcript to DB
            for (const entry of transcript) {
              await supabase.from("call_transcripts").insert({
                call_log_id: callLog.id,
                speaker: entry.role === "agent" ? "agent" : "user",
                text: entry.message,
                timestamp: new Date().toISOString(), // ElevenLabs might have specific timestamps
              });
            }
          }
        }
      }
    } catch (err) {
      console.error("[voice/status] Transcript sync failed:", err);
    }
  }

  // 4. Clean up CallSession and trigger tasks
  if (session) {
    const elderlyUserId = session.elderly_user_id;
    deleteSession(CallSid);

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
