import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import {
  requireAuthenticatedCaretaker,
  responseForError,
} from "@/app/api/dashboard/_lib/auth";
import { flowMutationSchema } from "@/app/api/dashboard/_lib/schemas";

// GET  /api/dashboard/flows  — list all flows (global + caretaker's own)
// POST /api/dashboard/flows  — create a new ingested flow
// Agent 3 owns the CRUD; Agent 2 owns the embedding on create.
export async function GET() {
  try {
    const { supabase, caretaker } = await requireAuthenticatedCaretaker();
    const { data, error } = await supabase
      .from("ingested_flows")
      .select("*")
      .or(`caretaker_id.eq.${caretaker.id},caretaker_id.is.null`)
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    return NextResponse.json({ flows: data ?? [] });
  } catch (error) {
    return responseForError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const { supabase, caretaker } = await requireAuthenticatedCaretaker();
    const body = flowMutationSchema.parse(await req.json());
    const { data, error } = await supabase
      .from("ingested_flows")
      .insert({ ...body, caretaker_id: caretaker.id })
      .select("*")
      .single();

    if (error) {
      throw error;
    }

    try {
      await fetch(new URL("/api/intelligence/embed-flow", req.url), {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ flow_id: data.id }),
      });
    } catch (embedError) {
      console.error("[dashboard/flows] embed create failed", embedError);
    }

    return NextResponse.json(data, { status: 201 });
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
