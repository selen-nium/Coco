import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServiceClient } from "@/lib/supabase/server";
import { embedText, toVectorLiteral } from "@/lib/gemini/client";

const embedFlowSchema = z.object({
  flow_id: z.string().uuid(),
});

export async function POST(req: NextRequest) {
  try {
    const { flow_id } = embedFlowSchema.parse(await req.json());
    const supabase = await createServiceClient();
    const { data: flow, error: fetchError } = await supabase
      .from("ingested_flows")
      .select("id, name, app, description, steps")
      .eq("id", flow_id)
      .single();

    if (fetchError || !flow) {
      return NextResponse.json({ error: "Flow not found" }, { status: 404 });
    }

    const embeddingInput = [
      flow.name,
      flow.app,
      flow.description,
      JSON.stringify(flow.steps),
    ].join("\n");

    const vector = await embedText(embeddingInput);
    const { error: updateError } = await supabase
      .from("ingested_flows")
      .update({ embedding: toVectorLiteral(vector) })
      .eq("id", flow.id);

    if (updateError) {
      throw updateError;
    }

    return NextResponse.json({ ok: true, flow_id: flow.id });
  } catch (error) {
    console.error("[intelligence/embed-flow]", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
