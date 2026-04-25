import { NextRequest, NextResponse } from "next/server";
import type { CallStatusPayload } from "@/types/api";

// POST /api/voice/status
// Twilio status callback — fires on call completion, failure, or drop.
// Agent 1 owns this route.
export async function POST(req: NextRequest) {
  // TODO (Agent 1):
  // 1. Parse Twilio status payload
  // 2. Update call_log (ended_at, duration_seconds, status)
  // 3. Clean up CallSession from memory
  // 4. Trigger POST /api/intelligence/summarize
  // 5. Trigger POST /api/intelligence/mood

  const body = await req.formData();
  const payload = Object.fromEntries(body) as unknown as CallStatusPayload;

  console.log("[voice/status]", payload.CallSid, payload.CallStatus);

  return NextResponse.json({ ok: true });
}
