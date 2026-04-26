import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { embedText, toVectorLiteral } from "@/lib/gemini/client";

/**
 * POST /api/intelligence/post-call
 * Webhook triggered by ElevenLabs when a conversation ends.
 * Handles transcript storage, user message embedding, and summary sync.
 */
export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("elevenlabs-signature");
    
    // The shared secret provided by ElevenLabs
    const secret = process.env.ELEVENLABS_WEBHOOK_SECRET || "wsec_625da311609f0fb97cf6aa0c1f48b7da3ec27072acae379b0172f51afdc27737";

    if (!signature) {
      console.error("[post-call] Missing ElevenLabs signature");
      return NextResponse.json({ error: "Missing signature" }, { status: 401 });
    }

    // Verify HMAC SHA256 signature
    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(rawBody)
      .digest("hex");

    if (crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature)) === false) {
      console.error("[post-call] Invalid HMAC signature. Unauthorized request.");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const payload = JSON.parse(rawBody || "{}");
    
    // Check if it's the new post_call_transcription webhook format
    const isNewSchema = payload.type === "post_call_transcription" && payload.data;
    const data = isNewSchema ? payload.data : payload;

    const transcript = data.transcript || [];
    const summary = data.analysis?.transcript_summary || data.summary;
    
    const supabase = await createServiceClient();

    // ElevenLabs passes the dynamic variables back in the client data
    let call_log_id = 
      data.conversation_initiation_client_data?.dynamic_variables?.call_log_id ||
      data.metadata?.call_log_id ||
      data.custom_data?.call_log_id;

    // Fallback: If the dynamic variables didn't persist, look it up via the conversation_id
    // since we saved it in twilio_call_sid during the pre-call webhook!
    if (!call_log_id) {
      const convId = data.conversation_id || payload.conversation_id;
      if (convId) {
        const { data: cLog } = await supabase
          .from("call_logs")
          .select("id")
          .eq("twilio_call_sid", convId)
          .single();
        
        if (cLog) {
          call_log_id = cLog.id;
        }
      }
    }

    if (!call_log_id) {
      console.error("[post-call] Missing call_log_id in metadata and fallback lookup failed");
      // Return 200 to ElevenLabs to acknowledge, even if we can't process
      return NextResponse.json({ error: "Missing metadata" }, { status: 200 });
    }

    // 1. Update the call log with the ElevenLabs summary
    if (summary) {
      await supabase
        .from("call_logs")
        .update({ summary })
        .eq("id", call_log_id);
    }

    // 2. Process and store the transcript chunks
    if (Array.isArray(transcript)) {
      const transcriptEntries = await Promise.all(
        transcript.map(async (entry: any) => {
          const isUser = entry.role === "user" || entry.role === "user_proxy";
          let embedding = null;

          // Only embed user messages for semantic memory retrieval
          if (isUser && entry.message && entry.message.trim().length > 0) {
            try {
              const vector = await embedText(entry.message);
              embedding = toVectorLiteral(vector);
            } catch (err) {
              console.error("[post-call] Embedding failed for chunk:", err);
            }
          }

          return {
            call_log_id,
            speaker: isUser ? "user" : "agent",
            text: entry.message || "",
            embedding,
            timestamp: new Date().toISOString(),
          };
        })
      );

      const { error: insertError } = await supabase
        .from("call_transcripts")
        .insert(transcriptEntries);

      if (insertError) {
        console.error("[post-call] Failed to insert transcript:", insertError);
      }
    }

    console.log("[post-call] Successfully processed call:", call_log_id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[post-call] Internal Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
