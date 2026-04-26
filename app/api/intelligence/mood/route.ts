import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServiceClient } from "@/lib/supabase/server";
import { extractJsonBlock, generateText } from "@/lib/gemini/client";
import { buildMoodPrompt } from "@/lib/gemini/prompts";

const moodSchema = z.object({
  call_log_id: z.string().uuid(),
  elderly_user_id: z.string().uuid(),
});

const moodResponseSchema = z.object({
  sentiment_score: z.number().min(-1).max(1),
  frustration_level: z.number().min(0).max(1),
  confusion_level: z.number().min(0).max(1),
});

export async function POST(req: NextRequest) {
  try {
    const { call_log_id, elderly_user_id } = moodSchema.parse(await req.json());
    const supabase = await createServiceClient();
    const { data: transcriptRows, error } = await supabase
      .from("call_transcripts")
      .select("speaker, text, timestamp")
      .eq("call_log_id", call_log_id)
      .order("timestamp", { ascending: true });

    if (error) {
      throw error;
    }

    const userTranscript = (transcriptRows ?? [])
      .filter((row) => row.speaker === "user")
      .map((row) => row.text)
      .join("\n");

    if (!userTranscript.trim()) {
      return NextResponse.json({ ok: true, metrics: null });
    }

    const raw = await generateText(buildMoodPrompt(userTranscript));
    const metrics = moodResponseSchema.parse(extractJsonBlock(raw));

    const { error: insertError } = await supabase.from("mood_metrics").insert({
      call_log_id,
      elderly_user_id,
      sentiment_score: metrics.sentiment_score,
      frustration_level: metrics.frustration_level,
      confusion_level: metrics.confusion_level,
    });

    if (insertError) {
      throw insertError;
    }

    return NextResponse.json({ ok: true, metrics });
  } catch (error) {
    console.error("[intelligence/mood]", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
