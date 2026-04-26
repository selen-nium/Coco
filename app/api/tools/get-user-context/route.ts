import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServiceClient } from "@/lib/supabase/server";

const getUserContextSchema = z.object({
  elderly_user_id: z.string().uuid(),
});

export async function POST(req: NextRequest) {
  try {
    const { elderly_user_id } = getUserContextSchema.parse(await req.json());
    const supabase = await createServiceClient();

    const { data: elderlyUser, error: userError } = await supabase
      .from("elderly_users")
      .select("name")
      .eq("id", elderly_user_id)
      .single();

    if (userError || !elderlyUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { data: agentConfig, error: configError } = await supabase
      .from("agent_configs")
      .select(
        "elevenlabs_voice_id, tts_speed, repetition_level, metaphor_mode, allow_sensitive_flows"
      )
      .eq("elderly_user_id", elderly_user_id)
      .maybeSingle();

    if (configError) {
      throw configError;
    }

    return NextResponse.json({
      name: elderlyUser.name,
      agent_config: {
        elevenlabs_voice_id: agentConfig?.elevenlabs_voice_id ?? "default",
        tts_speed: agentConfig?.tts_speed ?? 1,
        repetition_level: agentConfig?.repetition_level ?? 2,
        metaphor_mode: agentConfig?.metaphor_mode ?? false,
        allow_sensitive_flows: agentConfig?.allow_sensitive_flows ?? false,
      },
    });
  } catch (error) {
    console.error("[tools/get-user-context]", error);
    return NextResponse.json(
      { error: "Failed to fetch user context" },
      { status: 500 }
    );
  }
}
