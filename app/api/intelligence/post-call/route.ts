import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { embedText, toVectorLiteral } from "@/lib/gemini/client";
import { normalizeTranscriptEntry } from "@/lib/gemini/intelligence-utils.mjs";

/**
 * POST /api/intelligence/post-call
 * Webhook triggered by ElevenLabs when a conversation ends.
 * Handles transcript storage, user message embedding, and summary sync.
 */
export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("elevenlabs-signature");

    const secret = process.env.ELEVENLABS_WEBHOOK_SECRET || "wsec_625da311609f0fb97cf6aa0c1f48b7da3ec27072acae379b0172f51afdc27737";

    if (!signature) {
      console.error("[post-call] Missing ElevenLabs signature");
      return NextResponse.json({ error: "Missing signature" }, { status: 401 });
    }

    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(rawBody)
      .digest("hex");

    if (crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature)) === false) {
      console.error("[post-call] Invalid HMAC signature. Unauthorized request.");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const payload = JSON.parse(rawBody || "{}");

    // Handle both new (post_call_transcription) and legacy payload shapes
    const isNewSchema = payload.type === "post_call_transcription" && payload.data;
    const data = isNewSchema ? payload.data : payload;

    const transcript = data.transcript || [];
    const summary = data.analysis?.transcript_summary || data.summary;

    const call_log_id =
      data.conversation_initiation_client_data?.dynamic_variables?.call_log_id ||
      data.metadata?.call_log_id ||
      data.custom_data?.call_log_id;

    if (!call_log_id) {
      console.error("[post-call] Missing call_log_id in metadata");
      return NextResponse.json({ error: "Missing metadata" }, { status: 200 });
    }

    const supabase = await createServiceClient();

    if (summary) {
      await supabase
        .from("call_logs")
        .update({ summary })
        .eq("id", call_log_id);
    }

    if (Array.isArray(transcript) && transcript.length > 0) {
      const transcriptEntries = await Promise.all(
        transcript.map(async (entry: any) => {
          const message = normalizeTranscriptEntry(entry);
          const isUser = entry.role === "user" || entry.role === "user_proxy";
          let embedding = null;

          if (isUser && message.trim().length > 0) {
            try {
              const vector = await embedText(message);
              embedding = toVectorLiteral(vector);
            } catch (err) {
              console.error("[post-call] Embedding failed for chunk:", err);
            }
          }

          return {
            call_log_id,
            speaker: isUser ? "user" : "agent",
            text: message,
            embedding,
            timestamp: entry.timestamp ?? new Date().toISOString(),
          };
        })
      );

      const filteredEntries = transcriptEntries.filter((entry) => entry.text.trim().length > 0);

      const { error: insertError } = await supabase
        .from("call_transcripts")
        .insert(filteredEntries);

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
