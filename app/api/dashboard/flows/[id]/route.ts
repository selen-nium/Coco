import { NextRequest, NextResponse } from "next/server";

// PATCH  /api/dashboard/flows/[id] — update flow steps or metadata
// DELETE /api/dashboard/flows/[id] — delete a flow
// Agent 3 owns this route.
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  // TODO (Agent 3): update ingested_flows row, re-trigger embedding via Agent 2
  return NextResponse.json({ id, ...body });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  // TODO (Agent 3): delete ingested_flows row (cascade deletes visual aids)
  return NextResponse.json({ deleted: id });
}
