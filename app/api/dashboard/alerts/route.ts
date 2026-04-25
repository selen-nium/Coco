import { NextRequest, NextResponse } from "next/server";

// GET /api/dashboard/alerts
// Returns all scam_alerts for the caretaker's elderly users.
// Query params: status (active|dismissed), elderly_user_id
// Agent 3 owns this route.
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") ?? "active";

  // TODO (Agent 3): query scam_alerts filtered by status + caretaker's elderly users
  return NextResponse.json({ alerts: [] });
}
