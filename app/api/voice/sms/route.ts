import { NextRequest, NextResponse } from "next/server";

// POST /api/voice/sms
// Twilio inbound SMS webhook — used for elderly phone verification handshakes.
// Agent 1 owns this route.
export async function POST(req: NextRequest) {
  // TODO (Agent 1):
  // 1. Parse Twilio SMS payload (From, Body)
  // 2. Match Body (verification code) against elderly_users.verification_code
  // 3. If match → set elderly_users.verified = true, clear verification_code
  // 4. Reply with TwiML SMS confirming link

  const body = await req.formData();
  const from = body.get("From") as string;
  const text = body.get("Body") as string;

  console.log("[voice/sms] from:", from, "body:", text);

  return new NextResponse(
    `<?xml version="1.0" encoding="UTF-8"?><Response></Response>`,
    { headers: { "Content-Type": "text/xml" } }
  );
}
