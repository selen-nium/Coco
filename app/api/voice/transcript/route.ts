import { NextRequest, NextResponse } from "next/server";
import type { TranscriptChunkPayload } from "@/types/api";

// POST /api/voice/transcript
// Called by the ElevenLabs webhook for each transcript chunk.
// Fans out to: intelligence layer (intent/scam) + Supabase persistence.
// Agent 1 owns the fan-out orchestration; Agent 2 owns the downstream handlers.
export async function POST(req: NextRequest) {
  // TODO (Agent 1):
  // 1. Parse TranscriptChunkPayload
  // 2. Write chunk to call_transcripts in Supabase
  // 3. If first user utterance → POST /api/intelligence/intent
  // 4. Fire-and-forget POST /api/intelligence/scam-alert with chunk
  // 5. Check CallSession for silence / 3-loop state

  const payload: TranscriptChunkPayload = await req.json();

  console.log("[voice/transcript]", payload.call_sid, payload.speaker, payload.text.slice(0, 60));

  return NextResponse.json({ ok: true });
}
