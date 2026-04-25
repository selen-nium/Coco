import { NextRequest, NextResponse } from "next/server";
import type { InboundCallPayload } from "@/types/api";

// POST /api/voice/inbound
// Twilio webhook — fires when an elderly user calls the Twilio number.
// Must respond with TwiML to connect the call to ElevenLabs.
// Agent 1 owns this route.
export async function POST(req: NextRequest) {
  // TODO (Agent 1):
  // 1. Parse and validate Twilio signature
  // 2. Look up elderly_user by phone number (req.body.From)
  // 3. Create call_log row in Supabase
  // 4. Create in-memory CallSession
  // 5. Return TwiML <Connect><Stream> pointing to ElevenLabs

  const body = await req.formData();
  const payload = Object.fromEntries(body) as unknown as InboundCallPayload;

  console.log("[voice/inbound]", payload.CallSid, payload.From);

  return new NextResponse(
    `<?xml version="1.0" encoding="UTF-8"?><Response><Say>Coco is connecting, please hold.</Say></Response>`,
    { headers: { "Content-Type": "text/xml" } }
  );
}
