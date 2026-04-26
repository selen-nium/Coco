import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServiceClient } from "@/lib/supabase/server";

const requestSchema = z.object({
  intent_id: z.string().uuid(),
  elderly_user_id: z.string().uuid(),
});

export async function POST(req: NextRequest) {
  try {
    const { intent_id, elderly_user_id } = requestSchema.parse(await req.json());
    const supabase = await createServiceClient();

    const { data: elderlyUser, error: elderlyError } = await supabase
      .from("elderly_users")
      .select("caretaker_id")
      .eq("id", elderly_user_id)
      .single();

    if (elderlyError || !elderlyUser) {
      return NextResponse.json({ error: "Elderly user not found" }, { status: 404 });
    }

    const { data: flow, error } = await supabase
      .from("ingested_flows")
      .select("id, caretaker_id, name, app, description, steps")
      .eq("id", intent_id)
      .single();

    if (error || !flow) {
      return NextResponse.json({ error: "Intent not found" }, { status: 404 });
    }

    if (flow.caretaker_id && flow.caretaker_id !== elderlyUser.caretaker_id) {
      return NextResponse.json({ error: "Intent not available for this user" }, { status: 403 });
    }

    return NextResponse.json({
      id: flow.id,
      name: flow.name,
      app: flow.app,
      description: flow.description,
      steps: flow.steps,
    });
  } catch (error) {
    console.error("[tools/get-intent-instructions]", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
