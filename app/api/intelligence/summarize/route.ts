import { NextRequest, NextResponse } from "next/server";
import type { SummarizePayload } from "@/types/api";

// POST /api/intelligence/summarize
// Called at end of call. Gemini 2.5 Flash reads full transcript and writes a 2-sentence summary.
// Agent 2 owns this route.
export async function POST(req: NextRequest) {
  // TODO (Agent 2):
  // 1. Parse SummarizePayload
  // 2. Fetch all call_transcripts for call_log_id
  // 3. Send to brainModel (Gemini 2.5 Flash) with summarization prompt
  // 4. Update call_logs.summary with result

  const payload: SummarizePayload = await req.json();

  console.log("[intelligence/summarize]", payload.call_log_id);

  return NextResponse.json({ ok: true });
}
