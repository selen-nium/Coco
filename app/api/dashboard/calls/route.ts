import { NextRequest, NextResponse } from "next/server";

// GET /api/dashboard/calls
// Returns paginated call log for the authenticated caretaker's elderly users.
// Query params: elderly_user_id, page, limit
// Agent 3 owns this route.
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const elderlyUserId = searchParams.get("elderly_user_id");
  const page = parseInt(searchParams.get("page") ?? "1");
  const limit = parseInt(searchParams.get("limit") ?? "20");

  // TODO (Agent 3): query call_logs joined with intervention_logs count
  return NextResponse.json({ calls: [], total: 0, page, limit });
}
