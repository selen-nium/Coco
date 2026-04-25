import { NextRequest, NextResponse } from "next/server";
import type { DismissAlertPayload } from "@/types/api";

// PATCH /api/dashboard/alerts/[id]
// Dismisses a scam alert.
// Agent 3 owns this route.
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body: DismissAlertPayload = await req.json();
  // TODO (Agent 3): update scam_alerts.status = 'dismissed', dismissed_by = caretaker id
  return NextResponse.json({ id, ...body });
}
