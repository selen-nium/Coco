import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import {
  requireAuthenticatedCaretaker,
  responseForError,
} from "@/app/api/dashboard/_lib/auth";
import { elderlyLinkSchema } from "@/app/api/dashboard/_lib/schemas";

// POST /api/dashboard/elderly
// Creates elderly_user record and returns a demo verification code.
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
        age: payload.age ?? null,
        nickname: payload.nickname ?? null,
        phone_model: payload.phone_model ?? null,
        verified: false,
        verification_code: verificationCode,
      })
      .select("id")
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({ elderly_user_id: data.id, verification_code: verificationCode });
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
