import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

/**
 * Helper function to handle the lookup logic for both GET and POST requests.
 */
async function handleLookup(phone: string | null, call_sid: string | null) {
  if (!phone || !call_sid) {
    console.error("[voice/pre-call] Missing phone or call_sid. Received:", { phone, call_sid });
    // Still return the correct structure to not crash ElevenLabs, but without dynamic vars
    return NextResponse.json({});
  }

  const supabase = await createServiceClient();

  // 1. Lookup the elderly user
  const { data: elderlyUser, error: userError } = await supabase
    .from("elderly_users")
    .select("*, agent_configs(*), caretakers(phone)")
    .eq("phone", phone)
    .single();

  if (userError || !elderlyUser) {
    // Return a configuration override that tells the Agent the user is not found
    return NextResponse.json({
      overrides: {
        system_prompt: "The caller's phone number is unregistered. Please politely inform them that this number is not registered with Coco and hang up."
      }
    });
  }

  // 2. Create or get the active call log (upsert to handle retries gracefully)
  const { data: callLog, error: logError } = await supabase
    .from("call_logs")
    .upsert(
      {
        elderly_user_id: elderlyUser.id,
        twilio_call_sid: call_sid,
        status: "in_progress",
      },
      { onConflict: "twilio_call_sid" }
    )
    .select()
    .single();

  if (logError) {
    console.error("[voice/pre-call] Failed to create or update call log:", logError);
    return NextResponse.json({});
  }

  // 3. Fetch recent history for immediate memory
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

  const agentConfig = elderlyUser.agent_configs[0] || { metaphor_mode: false };
  const caretakerPhone = elderlyUser.caretakers?.phone || "Unknown";

  // 4. Return the new standard ElevenLabs Webhook Response payload
  return NextResponse.json({
    dynamic_variables: {
      user_name: elderlyUser.name,
      elderly_user_id: elderlyUser.id,
      call_log_id: callLog.id,
      call_sid: call_sid,
      metaphor_mode: agentConfig.metaphor_mode ? "true" : "false",
      caretaker_phone: caretakerPhone,
      recent_history: recentHistory,
      phone_model: elderlyUser.phone_model || "Unknown"
    },
    overrides: {
      first_message: `Hi ${elderlyUser.name}!`,
      system_prompt: `You are Coco. You are talking to ${elderlyUser.name}. They are using a ${elderlyUser.phone_model || "standard phone"}. Their recent history is: ${recentHistory}`
    }
  });
}

/**
 * POST /api/voice/pre-call
 * Pre-call Webhook called by ElevenLabs to fetch dynamic variables.
 */
export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("elevenlabs-signature");
    const secret = process.env.ELEVENLABS_WEBHOOK_SECRET || "wsec_625da311609f0fb97cf6aa0c1f48b7da3ec27072acae379b0172f51afdc27737";

    // Verify HMAC SHA256 signature if a secret is configured and a signature is provided
    if (signature && secret) {
      const expectedSignature = crypto
        .createHmac("sha256", secret)
        .update(rawBody)
        .digest("hex");

      if (crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature)) === false) {
        console.error("[voice/pre-call] Invalid HMAC signature. Unauthorized request.");
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
      }
    }

    const payload = JSON.parse(rawBody || "{}");
    
    // Extract using the new native ElevenLabs webhook schema
    const phone = payload.caller_phone_number || payload.caller_id || payload.system__caller_id || payload.custom_data?.caller_id || payload.from || payload.From;
    const call_sid = payload.conversation_id || payload.call_id || payload.system__call_sid || payload.custom_data?.call_sid || payload.CallSid;

    return await handleLookup(phone, call_sid);
  } catch (error) {
    console.error("[voice/pre-call] POST Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

/**
 * GET /api/voice/pre-call
 * Fallback for simple tests.
 */
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const phone = searchParams.get("caller_phone_number") || searchParams.get("phone") || searchParams.get("caller_id");
    const call_sid = searchParams.get("conversation_id") || searchParams.get("call_sid") || searchParams.get("call_id");
    
    return await handleLookup(phone, call_sid);
  } catch (error) {
    console.error("[voice/pre-call] GET Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
