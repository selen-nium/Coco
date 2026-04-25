import { NextRequest, NextResponse } from "next/server";

// POST /api/intelligence/embed-flow
// Generates and stores pgvector embedding for a newly created/updated flow.
// Called by Agent 3's flow CRUD routes.
// Agent 2 owns this route.
export async function POST(req: NextRequest) {
  // TODO (Agent 2):
  // 1. Parse { flow_id }
  // 2. Fetch ingested_flows row
  // 3. Embed name + description + app using Gemini embedding model
  // 4. Update ingested_flows.embedding column

  const { flow_id } = await req.json();
  console.log("[intelligence/embed-flow]", flow_id);
  return NextResponse.json({ ok: true });
}
