import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

// POST /api/voice/sms
export async function POST(req: NextRequest) {
  const body = await req.formData();
  const from = body.get("From") as string;
  const text = (body.get("Body") as string)?.trim();

  console.log("[voice/sms] from:", from, "body:", text);

  if (!from || !text) {
    return new NextResponse(
      `<?xml version="1.0" encoding="UTF-8"?><Response></Response>`,
      { headers: { "Content-Type": "text/xml" } }
    );
  }

  const supabase = await createServiceClient();

  // 1. Look up elderly_user by phone number and check if not verified
  const { data: elderlyUser, error: userError } = await supabase
    .from("elderly_users")
    .select("*")
    .eq("phone", from)
    .eq("verified", false)
    .single();

  if (userError || !elderlyUser) {
    console.warn("[voice/sms] User not found or already verified:", from);
    return new NextResponse(
      `<?xml version="1.0" encoding="UTF-8"?><Response></Response>`,
      { headers: { "Content-Type": "text/xml" } }
    );
  }

  // 2. Compare Body against verification_code
  if (text === elderlyUser.verification_code) {
    // 3. Match found -> update verified = true
    const { error: updateError } = await supabase
      .from("elderly_users")
      .update({ verified: true, verification_code: null })
      .eq("id", elderlyUser.id);

    if (updateError) {
      console.error("[voice/sms] Failed to verify user:", updateError);
      return new NextResponse(
        `<?xml version="1.0" encoding="UTF-8"?><Response><Message>System error. Please try again later.</Message></Response>`,
        { headers: { "Content-Type": "text/xml" } }
      );
    }

    // 4. Reply with success
    return new NextResponse(
      `<?xml version="1.0" encoding="UTF-8"?><Response><Message>Success! Your phone is now linked to Coco. You can start calling this number anytime you need help.</Message></Response>`,
      { headers: { "Content-Type": "text/xml" } }
    );
  } else {
    // 5. Code mismatch
    return new NextResponse(
      `<?xml version="1.0" encoding="UTF-8"?><Response><Message>Invalid verification code. Please check the code and try again.</Message></Response>`,
      { headers: { "Content-Type": "text/xml" } }
    );
  }
}
