import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

/**
 * Helper function to handle the lookup logic for both GET and POST requests.
 */
async function handleLookup(phone: string | null, call_sid: string | null) {
  if (!phone || !call_sid) {
    return NextResponse.json({ error: "Missing phone or call_sid" }, { status: 400 });
  }

  const supabase = await createServiceClient();

  // 1. Lookup the elderly user
  const { data: elderlyUser, error: userError } = await supabase
    .from("elderly_users")
    .select("*, agent_configs(*), caretakers(phone)")
    .eq("phone", phone)
    .single();

  if (userError || !elderlyUser) {
    return NextResponse.json({ 
      success: false, 
      message: "User not found. Please politely inform them this number is unregistered and hang up." 
    });
  }

  // 2. Create or get the active call log (upsert to handle retries/existing logs gracefully)
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
    console.error("[tools/lookup-user] Failed to create or update call log:", logError);
    return NextResponse.json({ error: `Database error: ${logError.message}` }, { status: 500 });
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

  // 4. Return the massive context payload back to the Agent's memory
  return NextResponse.json({
    success: true,
    user_name: elderlyUser.name,
    elderly_user_id: elderlyUser.id,
    call_log_id: callLog.id,
    metaphor_mode: agentConfig.metaphor_mode,
    caretaker_phone: caretakerPhone,
    recent_history: recentHistory,
    instructions: `Greet the user by saying 'Hi ${elderlyUser.name}'. Keep the elderly_user_id and call_log_id in your memory to use for future tools.`
  });
}

/**
 * POST /api/tools/lookup-user
 * Tool called by the ElevenLabs Agent at the very beginning of the call.
 */
export async function POST(req: NextRequest) {
  try {
    const { phone, call_sid } = await req.json();
    return await handleLookup(phone, call_sid);
  } catch (error) {
    console.error("[tools/lookup-user] POST Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

/**
 * GET /api/tools/lookup-user
 * Added to support ElevenLabs GET requests (often used for tool testing/query parameters).
 */
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const phone = searchParams.get("phone");
    const call_sid = searchParams.get("call_sid");
    
    return await handleLookup(phone, call_sid);
  } catch (error) {
    console.error("[tools/lookup-user] GET Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
