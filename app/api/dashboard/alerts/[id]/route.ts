import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import {
  requireAuthenticatedCaretaker,
  responseForError,
} from "@/app/api/dashboard/_lib/auth";
import { dismissAlertSchema } from "@/app/api/dashboard/_lib/schemas";

// PATCH /api/dashboard/alerts/[id]
// Dismisses a scam alert.
// Agent 3 owns this route.
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = dismissAlertSchema.parse(await req.json());
    const { supabase, caretaker } = await requireAuthenticatedCaretaker();
    const { data: alert, error: alertError } = await supabase
      .from("scam_alerts")
      .select(
        `
          *,
          elderly_user:elderly_users!scam_alerts_elderly_user_id_fkey(caretaker_id)
        `
      )
      .eq("id", id)
      .maybeSingle();

    if (alertError) {
      throw alertError;
    }

    if (!alert || alert.elderly_user?.caretaker_id !== caretaker.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const { data, error } = await supabase
      .from("scam_alerts")
      .update({ status: body.status, dismissed_by: caretaker.id })
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
        { error: "Invalid alert update", details: error.flatten() },
        { status: 400 }
      );
    }

    return responseForError(error);
  }
}
