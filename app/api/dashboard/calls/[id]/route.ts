import { NextRequest, NextResponse } from "next/server";

// GET /api/dashboard/calls/[id]
// Returns a single call log with full transcript and intervention logs.
// Agent 3 owns this route.
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  // TODO (Agent 3): fetch call_log + call_transcripts + intervention_logs
  return NextResponse.json({ id, transcripts: [], interventions: [] });
}
