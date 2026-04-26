import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { requireOwnedElderlyUser, responseForError } from "@/app/api/dashboard/_lib/auth";
import { configUpdateSchema } from "@/app/api/dashboard/_lib/schemas";
import { updateAgentConfig } from "@/lib/elevenlabs/client";

// GET   /api/dashboard/config/[elderlyId] — fetch agent config
// PATCH /api/dashboard/config/[elderlyId] — update agent config + sync to ElevenLabs
// Agent 3 owns this route.
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ elderlyId: string }> }
) {
  try {
    const { elderlyId } = await params;
    const { supabase, elderlyUser } = await requireOwnedElderlyUser(elderlyId);
    const { data, error } = await supabase
      .from("agent_configs")
      .select("*")
      .eq("elderly_user_id", elderlyUser.id)
      .maybeSingle();

    if (error) {
      throw error;
    }

    return NextResponse.json(
      data ?? {
        elderly_user_id: elderlyUser.id,
        elevenlabs_voice_id: "default",
        tts_speed: 1,
        repetition_level: 2,
        metaphor_mode: false,
        allow_sensitive_flows: false,
      }
    );
  } catch (error) {
    return responseForError(error);
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ elderlyId: string }> }
) {
  try {
    const { elderlyId } = await params;
    const { supabase, elderlyUser } = await requireOwnedElderlyUser(elderlyId);
    const body = configUpdateSchema.parse(await req.json());
    const { data: existingConfig, error: existingError } = await supabase
      .from("agent_configs")
      .select("*")
      .eq("elderly_user_id", elderlyUser.id)
      .maybeSingle();

    if (existingError) {
      throw existingError;
    }

    const payload = {
      elderly_user_id: elderlyUser.id,
      elevenlabs_voice_id:
        body.elevenlabs_voice_id ??
        existingConfig?.elevenlabs_voice_id ??
        "default",
      tts_speed: body.tts_speed ?? existingConfig?.tts_speed ?? 1,
      repetition_level:
        body.repetition_level ?? existingConfig?.repetition_level ?? 2,
      metaphor_mode:
        body.metaphor_mode ?? existingConfig?.metaphor_mode ?? false,
      allow_sensitive_flows:
        body.allow_sensitive_flows ??
        existingConfig?.allow_sensitive_flows ??
        false,
      updated_at: new Date().toISOString(),
    };

    let data, error;
    if (existingConfig) {
      ({ data, error } = await supabase
        .from("agent_configs")
        .update(payload)
        .eq("id", existingConfig.id)
        .select("*")
        .single());
    } else {
      ({ data, error } = await supabase
        .from("agent_configs")
        .insert(payload)
        .select("*")
        .single());
    }

    if (error) {
      throw error;
    }

    try {
      await updateAgentConfig({
        voice_id: data.elevenlabs_voice_id,
        tts_speed: data.tts_speed,
        repetition_level: data.repetition_level,
        metaphor_mode: data.metaphor_mode,
      });
    } catch (syncError) {
      console.error("[dashboard/config] elevenlabs sync failed", syncError);
    }

    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Invalid config payload", details: error.flatten() },
        { status: 400 }
      );
    }

    return responseForError(error);
  }
}
