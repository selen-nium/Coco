import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServiceClient } from "@/lib/supabase/server";
import { generateText } from "@/lib/gemini/client";
import { buildSummaryPrompt } from "@/lib/gemini/prompts";

const summarizeSchema = z.object({
  call_log_id: z.string().uuid(),
});

export async function POST(req: NextRequest) {
  try {
    const { call_log_id } = summarizeSchema.parse(await req.json());
    const supabase = await createServiceClient();
    const { data: transcriptRows, error } = await supabase
      .from("call_transcripts")
      .select("speaker, text, timestamp")
      .eq("call_log_id", call_log_id)
      .order("timestamp", { ascending: true });

    if (error) {
      throw error;
    }

    const transcript = (transcriptRows ?? [])
      .map((row) => `${row.speaker}: ${row.text}`)
      .join("\n");

    if (!transcript.trim()) {
      return NextResponse.json({ ok: true, summary: null });
    }

    const summary = await generateText(buildSummaryPrompt(transcript));
    const { error: updateError } = await supabase
      .from("call_logs")
      .update({ summary })
      .eq("id", call_log_id);

    if (updateError) {
      throw updateError;
    }

    return NextResponse.json({ ok: true, summary });
  } catch (error) {
    console.error("[intelligence/summarize]", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
