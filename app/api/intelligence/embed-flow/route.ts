import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { embedText, toVectorLiteral } from "@/lib/gemini/client";
import { createServiceClient } from "@/lib/supabase/server";

const embedFlowSchema = z.object({
  flow_id: z.string().uuid(),
});

// POST /api/intelligence/embed-flow
// Generates and stores pgvector embedding for a newly created/updated flow.
// Called by Agent 3's flow CRUD routes.
// Agent 2 owns this route.
export async function POST(req: NextRequest) {
  try {
    const { flow_id } = embedFlowSchema.parse(await req.json());
    const supabase = await createServiceClient();

    const { data: flow, error: flowError } = await supabase
      .from("ingested_flows")
      .select("id, name, description, app")
      .eq("id", flow_id)
      .single();

    if (flowError || !flow) {
      return NextResponse.json(
        { error: "Flow not found" },
        { status: 404 }
      );
    }

    const embedding = await embedText(
      `${flow.name} ${flow.description} ${flow.app}`
    );

    const { error: updateError } = await supabase
      .from("ingested_flows")
      .update({ embedding: toVectorLiteral(embedding) })
      .eq("id", flow_id);

    if (updateError) {
      throw updateError;
    }

    console.log("[intelligence/embed-flow]", flow_id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[intelligence/embed-flow]", error);
    return NextResponse.json(
      { error: "Failed to embed flow" },
      { status: 500 }
    );
  }
}
