import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import type { IntentPayload, IntentResult } from "@/types/api";
import type { IngestedFlow } from "@/types/db";
import {
  createGuidanceSession,
  embedText,
  toVectorLiteral,
} from "@/lib/gemini/client";
import { buildGuidanceSystemPrompt } from "@/lib/gemini/prompts";
import { updateSession } from "@/lib/state/call-session";
import { createServiceClient } from "@/lib/supabase/server";

const intentPayloadSchema = z.object({
  call_sid: z.string().min(1),
  elderly_user_id: z.string().uuid(),
  text: z.string().min(1),
});

// POST /api/intelligence/intent
// Embeds the user's opening utterance and runs pgvector cosine similarity
// against ingested_flows to find the best matching flow.
// Agent 2 owns this route.
export async function POST(req: NextRequest) {
  try {
    const payload: IntentPayload = intentPayloadSchema.parse(await req.json());
    const supabase = await createServiceClient();
    const embedding = await embedText(payload.text);

    const { data: matches, error: matchError } = await supabase.rpc(
      "match_flow",
      {
        query_embedding: toVectorLiteral(embedding),
        match_threshold: 0.75,
        match_count: 1,
      }
    );

    if (matchError) {
      throw matchError;
    }

    const match = matches?.[0];

    if (!match || typeof match.similarity !== "number" || match.similarity < 0.75) {
      const { data: elderlyUser } = await supabase
        .from("elderly_users")
        .select("name")
        .eq("id", payload.elderly_user_id)
        .single();

      const { data: config } = await supabase
        .from("agent_configs")
        .select("metaphor_mode, tts_speed, repetition_level")
        .eq("elderly_user_id", payload.elderly_user_id)
        .single();

      createGuidanceSession(
        payload.call_sid,
        buildGuidanceSystemPrompt(
          elderlyUser?.name ?? "your user",
          {
            metaphor_mode: config?.metaphor_mode ?? false,
            tts_speed: config?.tts_speed ?? 1,
            repetition_level: config?.repetition_level ?? 2,
          },
          null
        )
      );

      return NextResponse.json({
        flow_id: null,
        flow: null,
        similarity: null,
      } satisfies IntentResult);
    }

    const [{ data: flow, error: flowError }, { data: elderlyUser }, { data: config }, { data: callLog }] =
      await Promise.all([
        supabase
          .from("ingested_flows")
          .select("id, caretaker_id, name, app, description, steps, created_at")
          .eq("id", match.id)
          .single(),
        supabase
          .from("elderly_users")
          .select("name")
          .eq("id", payload.elderly_user_id)
          .single(),
        supabase
          .from("agent_configs")
          .select("metaphor_mode, tts_speed, repetition_level")
          .eq("elderly_user_id", payload.elderly_user_id)
          .single(),
        supabase
          .from("call_logs")
          .select("id")
          .eq("twilio_call_sid", payload.call_sid)
          .maybeSingle(),
      ]);

    if (flowError || !flow) {
      throw flowError ?? new Error("Matched flow missing");
    }

    const systemPrompt = buildGuidanceSystemPrompt(
      elderlyUser?.name ?? "your user",
      {
        metaphor_mode: config?.metaphor_mode ?? false,
        tts_speed: config?.tts_speed ?? 1,
        repetition_level: config?.repetition_level ?? 2,
      },
      flow as IngestedFlow
    );

    createGuidanceSession(payload.call_sid, systemPrompt);
    updateSession(payload.call_sid, { flow_id: flow.id });

    if (callLog?.id) {
      const { error: updateError } = await supabase
        .from("call_logs")
        .update({ flow_id: flow.id, intent_text: payload.text })
        .eq("id", callLog.id);

      if (updateError) {
        throw updateError;
      }
    }

    console.log(
      "[intelligence/intent]",
      payload.call_sid,
      payload.text.slice(0, 60)
    );

    return NextResponse.json({
      flow_id: flow.id,
      flow: flow as IngestedFlow,
      similarity: match.similarity,
    } satisfies IntentResult);
  } catch (error) {
    console.error("[intelligence/intent]", error);
    return NextResponse.json(
      {
        flow_id: null,
        flow: null,
        similarity: null,
        error: "Failed to resolve intent",
      },
      { status: 500 }
    );
  }
}
