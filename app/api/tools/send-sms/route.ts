import { NextRequest, NextResponse } from "next/server";
import { twilioClient, TWILIO_PHONE_NUMBER } from "@/lib/twilio/client";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { phone_number, message } = body;

    if (!phone_number || !message) {
      return NextResponse.json({ error: "Missing phone_number or message" }, { status: 400 });
    }

    await twilioClient.messages.create({
      body: message,
      from: TWILIO_PHONE_NUMBER,
      to: phone_number,
    });

    return NextResponse.json({ success: true, message: "SMS sent successfully." });
  } catch (err) {
    console.error("[tools/send-sms] Error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
