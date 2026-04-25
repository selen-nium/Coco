import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import {
  requireCaretakerIdMatch,
  responseForError,
} from "@/app/api/dashboard/_lib/auth";
import { caretakerUpdateSchema } from "@/app/api/dashboard/_lib/schemas";

// GET  /api/dashboard/caretakers/[id] — fetch caretaker profile
// PATCH /api/dashboard/caretakers/[id] — update caretaker profile
// Agent 3 owns this route.
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { caretaker } = await requireCaretakerIdMatch(id);
    return NextResponse.json(caretaker);
  } catch (error) {
    return responseForError(error);
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { supabase } = await requireCaretakerIdMatch(id);
    const body = caretakerUpdateSchema.parse(await req.json());
    const { data, error } = await supabase
      .from("caretakers")
      .update(body)
      .eq("id", id)
      .select("*")
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Invalid caretaker profile", details: error.flatten() },
        { status: 400 }
      );
    }

    return responseForError(error);
  }
}
