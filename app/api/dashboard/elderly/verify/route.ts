import { NextRequest, NextResponse } from "next/server";
import type { VerifyElderlyPayload } from "@/types/api";

// POST /api/dashboard/elderly/verify
// Checks the SMS verification code and marks elderly user as verified.
// Agent 3 owns this route.
export async function POST(req: NextRequest) {
  // TODO (Agent 3):
  // 1. Parse VerifyElderlyPayload
  // 2. Fetch elderly_user row, compare verification_code
  // 3. If match → set verified=true, clear verification_code
  // 4. Return { verified: boolean }

  const payload: VerifyElderlyPayload = await req.json();
  console.log("[dashboard/elderly/verify]", payload.elderly_user_id);
  return NextResponse.json({ verified: false });
}
