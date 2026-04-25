import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { validateTwilioSignature } from "@/lib/twilio/client";
import { createConversationalSession, ELEVENLABS_AGENT_ID } from "@/lib/elevenlabs/client";
import { createSession } from "@/lib/state/call-session";
import { buildGuidanceSystemPrompt } from "@/lib/gemini/prompts";
import type { InboundCallPayload } from "@/types/api";

// POST /api/voice/inbound
export async function POST(req: NextRequest) {
  const url = req.url;
  const signature = req.headers.get("x-twilio-signature") || "";
  const body = await req.formData();
  const params = Object.fromEntries(body) as Record<string, string>;
  const payload = params as unknown as InboundCallPayload;

  // 1. Validate Twilio signature
  if (!validateTwilioSignature(signature, url, params)) {
    console.error("[voice/inbound] Invalid Twilio signature");
    return new NextResponse("Forbidden", { status: 403 });
  }

  const { From, CallSid } = payload;
  const supabase = await createServiceClient();

  // 2. Look up elderly_user by phone number
  const { data: elderlyUser, error: userError } = await supabase
    .from("elderly_users")
    .select("*, agent_configs(*)")
    .eq("phone", From)
    .single();

  if (userError || !elderlyUser) {
    console.warn("[voice/inbound] Number not registered:", From);
    return new NextResponse(
      `<?xml version="1.0" encoding="UTF-8"?><Response><Say>This number is not registered. Goodbye.</Say><Hangup/></Response>`,
      { headers: { "Content-Type": "text/xml" } }
    );
  }

  // 3. Create call_log row in Supabase
  const { data: callLog, error: logError } = await supabase
    .from("call_logs")
    .insert({
      elderly_user_id: elderlyUser.id,
      twilio_call_sid: CallSid,
      status: "in_progress",
    })
    .select()
    .single();

  if (logError) {
    console.error("[voice/inbound] Failed to create call log:", logError);
    return new NextResponse("Internal Server Error", { status: 500 });
  }

  // 4. Create in-memory CallSession
  createSession(CallSid, elderlyUser.id);

  // 5. Prepare ElevenLabs session with overrides
  const agentConfig = elderlyUser.agent_configs[0] || {
    elevenlabs_voice_id: "default",
    tts_speed: 1.0,
    metaphor_mode: false,
    repetition_level: 2,
  };

  const initialPrompt = buildGuidanceSystemPrompt(elderlyUser.name, {
    metaphor_mode: agentConfig.metaphor_mode,
    tts_speed: agentConfig.tts_speed,
    repetition_level: agentConfig.repetition_level,
  }, null);

  const overrides = {
    agent: {
      first_message: `Hi ${elderlyUser.name}, it's Coco. How can I help you today?`,
      prompt: {
        prompt: initialPrompt,
      },
      metadata: {
        call_sid: CallSid,
      },
    },
    tts: {
      voice_id: agentConfig.elevenlabs_voice_id,
      speed: agentConfig.tts_speed,
    },
  };

  const { websocket_url } = await createConversationalSession({
    agent_id: ELEVENLABS_AGENT_ID,
    phone_number: From,
    call_sid: CallSid,
    agent_config_override: overrides,
  });

  // 6. Return TwiML <Connect><Stream> pointing to ElevenLabs
  return new NextResponse(
    `<?xml version="1.0" encoding="UTF-8"?>
    <Response>
      <Connect>
        <Stream url="${websocket_url}" />
      </Connect>
    </Response>`,
    { headers: { "Content-Type": "text/xml" } }
  );
}
