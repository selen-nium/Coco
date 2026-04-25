import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { twilioClient, TWILIO_PHONE_NUMBER } from "@/lib/twilio/client";
import {
  requireAuthenticatedCaretaker,
  responseForError,
} from "@/app/api/dashboard/_lib/auth";
import { elderlyLinkSchema } from "@/app/api/dashboard/_lib/schemas";

// POST /api/dashboard/elderly
// Creates elderly_user record and sends Twilio SMS verification.
// Agent 3 owns this route.
export async function POST(req: NextRequest) {
  try {
    const { supabase, caretaker } = await requireAuthenticatedCaretaker();
    const payload = elderlyLinkSchema.parse(await req.json());
    const verificationCode = `${Math.floor(100000 + Math.random() * 900000)}`;

    const { data, error } = await supabase
      .from("elderly_users")
      .insert({
        caretaker_id: caretaker.id,
        name: payload.name,
        phone: payload.phone,
        verified: false,
        verification_code: verificationCode,
      })
      .select("id")
      .single();

    if (error) {
      throw error;
    }

    await twilioClient.messages.create({
      body: `Your Coco verification code is: ${verificationCode}. Reply with this code to link your phone.`,
      from: TWILIO_PHONE_NUMBER,
      to: payload.phone,
    });

    return NextResponse.json({ elderly_user_id: data.id });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Invalid elderly user payload", details: error.flatten() },
        { status: 400 }
      );
    }

    return responseForError(error);
  }
}

export async function GET() {
  try {
    const { supabase, caretaker } = await requireAuthenticatedCaretaker();
    const { data, error } = await supabase
      .from("elderly_users")
      .select("*")
      .eq("caretaker_id", caretaker.id)
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    return NextResponse.json(data ?? []);
  } catch (error) {
    return responseForError(error);
  }
}
