import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServiceClient } from "@/lib/supabase/server";
import { embedText, extractJsonBlock, generateText, toVectorLiteral } from "@/lib/gemini/client";
import { buildIntentJudgePrompt } from "@/lib/gemini/prompts";
import {
  chooseIntentBand,
  filterAccessibleMatches,
} from "@/lib/gemini/intelligence-utils.mjs";

const requestSchema = z.object({
  query: z.string().trim().min(1),
  elderly_user_id: z.string().uuid(),
});

const judgeSchema = z.object({
  matched: z.boolean(),
  intent_id: z.string().uuid().nullable(),
  confidence: z.number().min(0).max(1),
  needs_clarification: z.boolean(),
  clarification_question: z.string().nullable().optional(),
});

const HIGH_THRESHOLD = 0.86;
const MID_THRESHOLD = 0.68;

type FlowMatch = {
  id: string;
  name: string;
  app: string;
  description: string;
  steps: unknown;
  similarity: number;
};

export async function POST(req: NextRequest) {
  try {
    const { query, elderly_user_id } = requestSchema.parse(await req.json());
    const supabase = await createServiceClient();

    const { data: elderlyUser, error: elderlyError } = await supabase
      .from("elderly_users")
      .select("id, caretaker_id")
      .eq("id", elderly_user_id)
      .single();

    if (elderlyError || !elderlyUser) {
      return NextResponse.json({ error: "Elderly user not found" }, { status: 404 });
    }

    const queryEmbedding = await embedText(query);
    const { data: rpcMatches, error: matchError } = await supabase.rpc("match_flow", {
      query_embedding: toVectorLiteral(queryEmbedding),
      match_threshold: 0.45,
      match_count: 3,
    });

    if (matchError) {
      throw matchError;
    }

    const rawMatches = (rpcMatches ?? []) as FlowMatch[];
    const flowIds = rawMatches.map((match) => match.id);
    const { data: flowRows, error: flowError } = flowIds.length
      ? await supabase
          .from("ingested_flows")
          .select("id, caretaker_id")
          .in("id", flowIds)
      : { data: [], error: null };

    if (flowError) {
      throw flowError;
    }

    const ownership = new Map(
      (flowRows ?? []).map((flow) => [flow.id, flow.caretaker_id])
    );

    const matches = filterAccessibleMatches(
      rawMatches,
      ownership,
      elderlyUser.caretaker_id
    );

    if (matches.length === 0) {
      return NextResponse.json({
        matched: false,
        intent_id: null,
        confidence: 0,
        needs_clarification: false,
      });
    }

    const best = matches[0];
    const similarityBand = chooseIntentBand(
      best.similarity,
      HIGH_THRESHOLD,
      MID_THRESHOLD
    );

    if (similarityBand === "high") {
      return NextResponse.json({
        matched: true,
        intent_id: best.id,
        confidence: best.similarity,
        needs_clarification: false,
      });
    }

    if (similarityBand === "low") {
      return NextResponse.json({
        matched: false,
        intent_id: null,
        confidence: best.similarity,
        needs_clarification: false,
      });
    }

    const rawJudge = await generateText(
      buildIntentJudgePrompt({
        query,
        candidates: matches.map((match: FlowMatch) => ({
          id: match.id,
          name: match.name,
          app: match.app,
          description: match.description,
        })),
      })
    );

    const judged = judgeSchema.parse(extractJsonBlock(rawJudge));

    return NextResponse.json({
      matched: judged.matched,
      intent_id: judged.intent_id,
      confidence: judged.confidence,
      needs_clarification: judged.needs_clarification,
      clarification_question: judged.clarification_question ?? undefined,
    });
  } catch (error) {
    console.error("[tools/match-intent]", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
