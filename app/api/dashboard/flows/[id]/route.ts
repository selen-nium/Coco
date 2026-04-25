import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import {
  requireAuthenticatedCaretaker,
  responseForError,
} from "@/app/api/dashboard/_lib/auth";
import { flowMutationSchema } from "@/app/api/dashboard/_lib/schemas";

// PATCH  /api/dashboard/flows/[id] — update flow steps or metadata
// DELETE /api/dashboard/flows/[id] — delete a flow
// Agent 3 owns this route.
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { supabase, caretaker } = await requireAuthenticatedCaretaker();
    const body = flowMutationSchema.parse(await req.json());
    const { data, error } = await supabase
      .from("ingested_flows")
      .update(body)
      .eq("id", id)
      .eq("caretaker_id", caretaker.id)
      .select("*")
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!data) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    try {
      await fetch(new URL("/api/intelligence/embed-flow", req.url), {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ flow_id: data.id }),
      });
    } catch (embedError) {
      console.error("[dashboard/flows] embed update failed", embedError);
    }

    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Invalid flow payload", details: error.flatten() },
        { status: 400 }
      );
    }

    return responseForError(error);
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { supabase, caretaker } = await requireAuthenticatedCaretaker();
    const { data, error } = await supabase
      .from("ingested_flows")
      .delete()
      .eq("id", id)
      .eq("caretaker_id", caretaker.id)
      .select("id")
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!data) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ deleted: data.id });
  } catch (error) {
    return responseForError(error);
  }
}
