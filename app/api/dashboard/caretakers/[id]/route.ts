import { NextRequest, NextResponse } from "next/server";

// GET  /api/dashboard/caretakers/[id] — fetch caretaker profile
// PATCH /api/dashboard/caretakers/[id] — update caretaker profile
// Agent 3 owns this route.
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  // TODO (Agent 3): fetch caretaker row, verify session user matches id
  return NextResponse.json({ id });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  // TODO (Agent 3): validate body, update caretakers row
  return NextResponse.json({ id, ...body });
}
