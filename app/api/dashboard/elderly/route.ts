import { NextRequest, NextResponse } from "next/server";
import type { LinkElderlyPayload } from "@/types/api";

// POST /api/dashboard/elderly
// Creates elderly_user record and sends Twilio SMS verification.
// Agent 3 owns this route.
export async function POST(req: NextRequest) {
  // TODO (Agent 3):
  // 1. Parse LinkElderlyPayload
  // 2. Generate 6-digit verification_code
  // 3. Insert elderly_users row (verified=false)
  // 4. Send Twilio SMS to elderly phone with code
  // 5. Return { elderly_user_id }

  const payload: LinkElderlyPayload = await req.json();
  console.log("[dashboard/elderly] link request for", payload.phone);
  return NextResponse.json({ elderly_user_id: null });
}

export async function GET(req: NextRequest) {
  // TODO (Agent 3): list all elderly users for authenticated caretaker
  return NextResponse.json([]);
}
