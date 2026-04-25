import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { responseForError, requireOwnedElderlyUser } from "@/app/api/dashboard/_lib/auth";
import { elderlyVerifySchema } from "@/app/api/dashboard/_lib/schemas";

// POST /api/dashboard/elderly/verify
// Checks the SMS verification code and marks elderly user as verified.
// Agent 3 owns this route.
export async function POST(req: NextRequest) {
  try {
    const payload = elderlyVerifySchema.parse(await req.json());
    const { supabase, elderlyUser } = await requireOwnedElderlyUser(
      payload.elderly_user_id
    );

    const submittedCode = payload.code.trim().toLowerCase();
    const expectedCode = elderlyUser.verification_code?.trim().toLowerCase();

    if (!expectedCode || submittedCode !== expectedCode) {
      return NextResponse.json({ verified: false }, { status: 400 });
    }

    const { error } = await supabase
      .from("elderly_users")
      .update({ verified: true, verification_code: null })
      .eq("id", elderlyUser.id);

    if (error) {
      throw error;
    }

    return NextResponse.json({ verified: true });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Invalid verification payload", details: error.flatten() },
        { status: 400 }
      );
    }

    return responseForError(error);
  }
}
