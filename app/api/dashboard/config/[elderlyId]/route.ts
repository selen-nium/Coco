import { NextRequest, NextResponse } from "next/server";
import type { UpdateConfigPayload } from "@/types/api";

// GET   /api/dashboard/config/[elderlyId] — fetch agent config
// PATCH /api/dashboard/config/[elderlyId] — update agent config + sync to ElevenLabs
// Agent 3 owns this route.
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ elderlyId: string }> }
) {
  const { elderlyId } = await params;
  // TODO (Agent 3): fetch agent_configs row for elderlyId
  return NextResponse.json({ elderly_user_id: elderlyId });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ elderlyId: string }> }
) {
  const { elderlyId } = await params;
  const body: UpdateConfigPayload = await req.json();
  // TODO (Agent 3): upsert agent_configs, call updateAgentConfig() from ElevenLabs client
  return NextResponse.json({ elderly_user_id: elderlyId, ...body });
}
