import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
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

  // Fetch last 3 call summaries for pre-loaded memory
  const { data: recentCalls } = await supabase
    .from("call_logs")
    .select("summary")
    .eq("elderly_user_id", elderlyUser.id)
    .not("summary", "is", null)
    .order("started_at", { ascending: false })
    .limit(3);

  const recentHistory = recentCalls && recentCalls.length > 0
    ? recentCalls.map(c => c.summary).join(" ")
    : "No recent conversations.";

  const agentConfig = elderlyUser.agent_configs[0] || {
    metaphor_mode: false,
  };
  
  const caretakerPhone = elderlyUser.caretakers?.phone || "Unknown";

  const dynamicVariables = {
    user_name: elderlyUser.name,
    metaphor_mode: agentConfig.metaphor_mode ? "true" : "false",
    caretaker_phone: caretakerPhone,
    call_log_id: callLog.id,
    elderly_user_id: elderlyUser.id,
    recent_history: recentHistory
  };

  const escapedDynamicVars = escapeXml(JSON.stringify(dynamicVariables));
  
  const websocketUrl = `wss://api.elevenlabs.io/v1/convai/twilio?agent_id=${ELEVENLABS_AGENT_ID}`;
  const escapedUrl = escapeXml(websocketUrl);

  return new NextResponse(
    `<?xml version="1.0" encoding="UTF-8"?>
    <Response>
      <Connect>
        <Stream url="${escapedUrl}">
          <Parameter name="dynamic_variables" value="${escapedDynamicVars}" />
        </Stream>
      </Connect>
    </Response>`,
    { headers: { "Content-Type": "text/xml" } }
  );
}
