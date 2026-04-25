import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { brainModel } from "@/lib/gemini/client";
import { CALL_SUMMARIZATION_PROMPT } from "@/lib/gemini/prompts";
import { createServiceClient } from "@/lib/supabase/server";

const summarizePayloadSchema = z.object({
  call_log_id: z.string().uuid(),
});

// POST /api/intelligence/summarize
// Called at end of call. Gemini 2.5 Flash reads full transcript and writes a 2-sentence summary.
// Agent 2 owns this route.
export async function POST(req: NextRequest) {
  try {
    const payload = summarizePayloadSchema.parse(await req.json());
    const supabase = await createServiceClient();

    const { data: transcripts, error: transcriptError } = await supabase
      .from("call_transcripts")
      .select("speaker, text, timestamp")
      .eq("call_log_id", payload.call_log_id)
      .order("timestamp", { ascending: true });

    if (transcriptError) {
      throw transcriptError;
    }

    const dialogue = (transcripts ?? [])
      .map((entry) => `[${entry.speaker === "agent" ? "Agent" : "User"}]: ${entry.text}`)
      .join("\n");

    const result = await brainModel.generateContent(
      `${CALL_SUMMARIZATION_PROMPT}\n\nTranscript:\n${dialogue}`
    );

    const summary = result.response.text().trim();

    const { error: updateError } = await supabase
      .from("call_logs")
      .update({ summary })
      .eq("id", payload.call_log_id);

    if (updateError) {
      throw updateError;
    }

    console.log("[intelligence/summarize]", payload.call_log_id);
    return NextResponse.json({ ok: true, summary });
  } catch (error) {
    console.error("[intelligence/summarize]", error);
    return NextResponse.json(
      { error: "Failed to summarize call" },
      { status: 500 }
    );
  }
}
