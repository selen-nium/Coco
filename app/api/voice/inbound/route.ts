import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { validateTwilioSignature } from "@/lib/twilio/client";
import { ELEVENLABS_AGENT_ID } from "@/lib/elevenlabs/client";
import type { InboundCallPayload } from "@/types/api";

export async function POST(req: NextRequest) {
  const url = req.url;
  const signature = req.headers.get("x-twilio-signature") || "";
  const body = await req.formData();
  const params = Object.fromEntries(body) as Record<string, string>;
  const payload = params as unknown as InboundCallPayload;

  if (!validateTwilioSignature(signature, url, params)) {
    console.error("[voice/inbound] Invalid Twilio signature");
    return new NextResponse("Forbidden", { status: 403 });
  }

  const { From, CallSid } = payload;
  const supabase = await createServiceClient();

  const { data: elderlyUser, error: userError } = await supabase
    .from("elderly_users")
    .select("*, agent_configs(*), caretakers(phone)")
    .eq("phone", From)
    .single();

  if (userError || !elderlyUser) {
    console.warn("[voice/inbound] Number not registered:", From);
    return new NextResponse(
      `<?xml version="1.0" encoding="UTF-8"?><Response><Say>This number is not registered. Goodbye.</Say><Hangup/></Response>`,
      { headers: { "Content-Type": "text/xml" } }
    );
  }

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

  const agentConfig = elderlyUser.agent_configs[0] || {
    metaphor_mode: false,
  };
  
  // Need to handle the caretaker phone format
  const caretakerPhone = elderlyUser.caretakers?.phone || "Unknown";

  const dynamicVariables = {
    user_name: elderlyUser.name,
    metaphor_mode: agentConfig.metaphor_mode ? "true" : "false",
    caretaker_phone: caretakerPhone,
    call_sid: CallSid,
    call_log_id: callLog.id,
    elderly_user_id: elderlyUser.id
  };

  const dynamicVariablesJson = JSON.stringify(dynamicVariables);
  const escapedJson = dynamicVariablesJson.replace(/"/g, '&quot;');
  
  const websocketUrl = `wss://api.elevenlabs.io/v1/convai/twilio?agent_id=${ELEVENLABS_AGENT_ID}`;
  const escapedUrl = websocketUrl.replace(/&/g, "&amp;");

  return new NextResponse(
    `<?xml version="1.0" encoding="UTF-8"?>
    <Response>
      <Connect>
        <Stream url="${escapedUrl}">
          <Parameter name="dynamic_variables" value="${escapedJson}" />
          <Parameter name="metadata" value="${escapedJson}" />
        </Stream>
      </Connect>
    </Response>`,
    { headers: { "Content-Type": "text/xml" } }
  );
}
