import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { brainModel } from "@/lib/gemini/client";
import { MOOD_ANALYSIS_PROMPT } from "@/lib/gemini/prompts";
import { createServiceClient } from "@/lib/supabase/server";

const moodPayloadSchema = z.object({
  call_log_id: z.string().uuid(),
  elderly_user_id: z.string().uuid(),
});

const moodResultSchema = z.object({
  sentiment_score: z.number().min(-1).max(1),
  frustration_level: z.number().min(0).max(1),
  confusion_level: z.number().min(0).max(1),
});

function extractJson(text: string) {
  const match = text.match(/\{[\s\S]*\}/);
  return match?.[0] ?? text;
}

// POST /api/intelligence/mood
// Batch sentiment analysis of call transcript embeddings → write mood_metrics row.
// Agent 2 owns this route.
export async function POST(req: NextRequest) {
  try {
    const payload = moodPayloadSchema.parse(await req.json());
    const supabase = await createServiceClient();

    const { data: transcripts, error: transcriptError } = await supabase
      .from("call_transcripts")
      .select("text")
      .eq("call_log_id", payload.call_log_id)
      .eq("speaker", "user")
      .order("timestamp", { ascending: true });

    if (transcriptError) {
      throw transcriptError;
    }

    const userTranscript = (transcripts ?? [])
      .map((entry) => entry.text)
      .join("\n");

    const result = await brainModel.generateContent(
      `${MOOD_ANALYSIS_PROMPT}\n\nUser transcript:\n${userTranscript}`
    );

    const scores = moodResultSchema.parse(
      JSON.parse(extractJson(result.response.text()))
    );

    const { error: insertError } = await supabase.from("mood_metrics").insert({
      elderly_user_id: payload.elderly_user_id,
      call_log_id: payload.call_log_id,
      sentiment_score: scores.sentiment_score,
      frustration_level: scores.frustration_level,
      confusion_level: scores.confusion_level,
    });

    if (insertError) {
      throw insertError;
    }

    console.log("[intelligence/mood]", payload.call_log_id);
    return NextResponse.json({ ok: true, scores });
  } catch (error) {
    console.error("[intelligence/mood]", error);
    return NextResponse.json(
      { error: "Failed to calculate mood" },
      { status: 500 }
    );
  }
}
