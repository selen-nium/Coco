import { NextRequest, NextResponse } from "next/server";
import type { IntentPayload, IntentResult } from "@/types/api";

// POST /api/intelligence/intent
// Embeds the user's opening utterance and runs pgvector cosine similarity
// against ingested_flows to find the best matching flow.
// Agent 2 owns this route.
export async function POST(req: NextRequest) {
  // TODO (Agent 2):
  // 1. Parse IntentPayload
  // 2. Embed payload.text using Gemini embedding model
  // 3. Run Supabase RPC: match_flow(embedding, threshold=0.75)
  // 4. If match → load full flow row, update CallSession with flow_id
  // 5. Build Gemini 2.5 Flash guidance context with flow steps
  // 6. Return IntentResult

  const payload: IntentPayload = await req.json();

  console.log("[intelligence/intent]", payload.call_sid, payload.text.slice(0, 60));

  const result: IntentResult = {
    flow_id: null,
    flow: null,
    similarity: null,
  };

  return NextResponse.json(result);
}
