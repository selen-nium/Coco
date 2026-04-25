import { NextRequest, NextResponse } from "next/server";
import { validateTwilioSignature } from "@/lib/twilio/client";
import { ELEVENLABS_AGENT_ID } from "@/lib/elevenlabs/client";
import type { InboundCallPayload } from "@/types/api";

function escapeXml(unsafe: string) {
  return unsafe.replace(/[<>&'"]/g, function (c) {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
      default: return c;
    }
  });
}

export async function POST(req: NextRequest) {
  const url = req.url;
  const signature = req.headers.get("x-twilio-signature") || "";
  const body = await req.formData();
  const params = Object.fromEntries(body) as Record<string, string>;

  if (!validateTwilioSignature(signature, url, params)) {
    console.error("[voice/inbound] Invalid Twilio signature");
    return new NextResponse("Forbidden", { status: 403 });
  }

  // The Agent's native system variables (system__caller_id, system__call_sid)
  // will be populated automatically by ElevenLabs when Twilio connects.
  const websocketUrl = `wss://api.elevenlabs.io/v1/convai/twilio?agent_id=${ELEVENLABS_AGENT_ID}`;
  const escapedUrl = escapeXml(websocketUrl);

  return new NextResponse(
    `<?xml version="1.0" encoding="UTF-8"?>
    <Response>
      <Connect>
        <Stream url="${escapedUrl}" />
      </Connect>
    </Response>`,
    { headers: { "Content-Type": "text/xml" } }
  );
}
