import { NextRequest, NextResponse } from "next/server";

// GET  /api/dashboard/flows  — list all flows (global + caretaker's own)
// POST /api/dashboard/flows  — create a new ingested flow
// Agent 3 owns the CRUD; Agent 2 owns the embedding on create.
export async function GET(_req: NextRequest) {
  // TODO (Agent 3): fetch ingested_flows where caretaker_id = current user OR null (global)
  return NextResponse.json({ flows: [] });
}

export async function POST(req: NextRequest) {
  // TODO (Agent 3):
  // 1. Parse and validate flow payload (name, app, description, steps JSONB)
  // 2. Insert ingested_flows row
  // 3. Call POST /api/intelligence/embed-flow to generate and store embedding
  // 4. Return created flow
  const body = await req.json();
  return NextResponse.json({ id: null, ...body });
}
