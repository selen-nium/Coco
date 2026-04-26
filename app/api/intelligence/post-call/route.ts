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

    const secret = process.env.ELEVENLABS_WEBHOOK_SECRET;

    if (!signature) {
      console.error("[post-call] Missing ElevenLabs signature");
      return NextResponse.json({ error: "Missing signature" }, { status: 401 });
    }

    if (!secret) {
      console.error("[post-call] ELEVENLABS_WEBHOOK_SECRET not set");
      return NextResponse.json({ error: "Server misconfiguration" }, { status: 500 });
    }

    // ElevenLabs signature format: "t=<timestamp>,v0=<hex>"
    // HMAC is computed over "<timestamp>.<rawBody>"
    const parts = Object.fromEntries(signature.split(",").map(p => p.split("=")));
    const timestamp = parts["t"];
    const v0 = parts["v0"];

    if (!timestamp || !v0) {
      console.error("[post-call] Malformed signature header:", signature);
      return NextResponse.json({ error: "Invalid signature format" }, { status: 401 });
    }

    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(`${timestamp}.${rawBody}`)
      .digest("hex");

    const signatureBuffer = Buffer.from(v0);
    const expectedBuffer = Buffer.from(expectedSignature);

    if (signatureBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(signatureBuffer, expectedBuffer)) {
      console.error("[post-call] Invalid HMAC signature. Unauthorized request.");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const payload = JSON.parse(rawBody || "{}");
    console.log("[post-call] Received payload type:", payload.type);

    // Handle both new (post_call_transcription) and legacy payload shapes
    const isNewSchema = payload.type === "post_call_transcription" && payload.data;
    const data = isNewSchema ? payload.data : payload;

    // Log the structure of data.analysis if it exists to help debug
    if (data.analysis) {
      console.log("[post-call] Analysis keys:", Object.keys(data.analysis));
      console.log("[post-call] Full analysis object:", JSON.stringify(data.analysis));
    }

    const transcript = data.transcript || [];
    const summary = data.analysis?.transcript_summary || data.summary;
    
    // 1. Extract sentiment from Data Collection results
    const dataCollection = data.analysis?.data_collection_results;
    let sentimentResult = null;
    
    if (Array.isArray(dataCollection)) {
      sentimentResult = dataCollection.find(
        (item: any) => item.data_collection_id === "user_sentiment_at_end"
      );
    } else if (dataCollection && typeof dataCollection === "object") {
      sentimentResult = (dataCollection as any)["user_sentiment_at_end"];
    }
    
    // 2. Fallback chain for sentiment
    const sentiment = 
      sentimentResult?.value ||
      data.analysis?.user_sentiment_at_end || 
      data.user_sentiment_at_end || 
      payload.user_sentiment_at_end;

    const duration = data.metadata?.call_duration_secs || data.call_duration_secs || data.metadata?.duration_secs;

    console.log("[post-call] Extracted values:", { 
      hasSummary: !!summary, 
      sentiment: sentiment || "STILL_UNDEFINED", 
      duration,
    });

    const supabase = await createServiceClient();

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
      return NextResponse.json({ error: "Missing metadata" }, { status: 200 });
    }


    if (summary || sentiment || duration) {
      await supabase
        .from("call_logs")
        .update({ 
          summary,
          intent_text: sentiment,
          duration_seconds: duration,
          status: "completed"
        })
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
      const embeddingCount = filteredEntries.filter(e => e.embedding).length;

      console.log(`[post-call] Saving ${filteredEntries.length} transcript entries (${embeddingCount} with embeddings) for call:`, call_log_id);

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
