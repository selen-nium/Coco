import { NextRequest, NextResponse } from "next/server";
import type { MoodPayload } from "@/types/api";

// POST /api/intelligence/mood
// Batch sentiment analysis of call transcript embeddings → write mood_metrics row.
// Agent 2 owns this route.
export async function POST(req: NextRequest) {
  // TODO (Agent 2):
  // 1. Parse MoodPayload
  // 2. Fetch call_transcripts embeddings for this call
  // 3. Compute aggregate sentiment_score, frustration_level, confusion_level
  //    via Gemini or cosine similarity against reference sentiment vectors
  // 4. Insert mood_metrics row

  const payload: MoodPayload = await req.json();

  console.log("[intelligence/mood]", payload.call_log_id);

  return NextResponse.json({ ok: true });
}
