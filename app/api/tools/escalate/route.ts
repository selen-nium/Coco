import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { call_sid } = body;

    if (!call_sid) {
      return NextResponse.json({ error: "Missing call_sid" }, { status: 400 });
    }

    const supabase = await createServiceClient();
    const { error } = await supabase
      .from("call_logs")
      .update({ status: "escalated" })
      .eq("twilio_call_sid", call_sid);

    if (error) {
      console.error("[tools/escalate] Supabase error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "Call successfully escalated." });
  } catch (err) {
    console.error("[tools/escalate] Error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
