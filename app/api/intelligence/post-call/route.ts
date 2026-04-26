import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServiceClient } from "@/lib/supabase/server";
import { embedText, toVectorLiteral } from "@/lib/gemini/client";
import { normalizeTranscriptEntry } from "@/lib/gemini/intelligence-utils.mjs";

const transcriptEntrySchema = z.object({
  role: z.string(),
  message: z.string().optional(),
  text: z.string().optional(),
  timestamp: z.string().optional(),
});

const payloadSchema = z.object({
  transcript: z.array(transcriptEntrySchema).optional().default([]),
  summary: z.string().optional().nullable(),
  metadata: z
    .object({
      call_log_id: z.string().uuid().optional(),
    })
    .optional(),
});

/**
 * POST /api/intelligence/post-call
 * Webhook triggered by ElevenLabs when a conversation ends.
 * Handles transcript storage, user message embedding, and summary sync.
 */
export async function POST(req: NextRequest) {
  try {
    const payload = payloadSchema.parse(await req.json());
    const { transcript, summary, metadata } = payload;
    
    // ElevenLabs sends metadata back exactly as passed during the connection
    const { call_log_id } = metadata || {};

    if (!call_log_id) {
      console.error("[post-call] Missing call_log_id in metadata");
      // Return 200 to ElevenLabs to acknowledge, even if we can't process
      return NextResponse.json({ error: "Missing metadata" }, { status: 200 });
    }

    const supabase = await createServiceClient();

    // 1. Update the call log with the ElevenLabs summary
    if (summary) {
      await supabase
        .from("call_logs")
        .update({ summary })
        .eq("id", call_log_id);
    }

    // 2. Process and store the transcript chunks
    if (transcript.length > 0) {
      const transcriptEntries = await Promise.all(
        transcript.map(async (entry) => {
          const message = normalizeTranscriptEntry(entry);
          const isUser = entry.role === "user" || entry.role === "user_proxy";
          let embedding = null;

          // Only embed user messages for semantic memory retrieval
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
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
