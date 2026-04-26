import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServiceClient } from "@/lib/supabase/server";
import { embedText, extractJsonBlock, generateText, toVectorLiteral } from "@/lib/gemini/client";
import { buildMemoryReRankerPrompt } from "@/lib/gemini/prompts";

const requestSchema = z.object({
  query: z.string().trim().min(1),
  elderly_user_id: z.string().optional(),
  call_log_id: z.string().uuid().optional(),
});

type SummaryMatch = {
  summary: string;
  started_at: string;
  similarity: number;
};

const reRankResultSchema = z.object({
  relevant: z.boolean(),
  recalled_memory: z.string().nullable(),
});

/**
 * POST /api/tools/recall-memory
 * Server Tool for ElevenLabs Agent to search past conversation history.
 * Uses Vector Search + LLM Re-ranking for high precision.
 */
export async function POST(req: NextRequest) {
  try {
    const body = requestSchema.parse(await req.json());
    const { query } = body;

    const supabase = await createServiceClient();

    // Resolve elderly_user_id — prefer direct value, fall back to call_log_id lookup
    let elderly_user_id = z.string().uuid().safeParse(body.elderly_user_id).success
      ? body.elderly_user_id!
      : null;

    if (!elderly_user_id && body.call_log_id) {
      const { data: log } = await supabase
        .from("call_logs")
        .select("elderly_user_id")
        .eq("id", body.call_log_id)
        .single();
      elderly_user_id = log?.elderly_user_id ?? null;
    }

    if (!elderly_user_id) {
      return NextResponse.json({ error: "Could not resolve elderly_user_id" }, { status: 400 });
    }

    const embedding = await embedText(query);
    console.log("[recall-memory] Searching summaries for query:", query, "user:", elderly_user_id);

    const { data: matches, error } = await supabase.rpc("match_call_summaries", {
      query_embedding: toVectorLiteral(embedding),
      elderly_id: elderly_user_id,
      match_threshold: 0.35, // Lowered threshold to give re-ranker more to work with
      match_count: 5, // Increased limit for re-ranking
    });

    if (error) {
      console.error("[recall-memory] Supabase RPC error:", error);
      throw error;
    }

    if (!matches || matches.length === 0) {
      console.log("[recall-memory] No matching summaries found.");
      return NextResponse.json({
        success: true,
        memory: "I searched the past conversation summaries but couldn't find any specific information about that.",
      });
    }

    console.log(`[recall-memory] Found ${matches.length} matching summaries, invoking re-ranker...`);
    (matches as SummaryMatch[]).forEach((m, i) => {
      console.log(`  [Match ${i + 1}] Similarity: ${m.similarity.toFixed(4)} | Summary: ${m.summary.substring(0, 80)}...`);
    });

    const rawReRank = await generateText(
      buildMemoryReRankerPrompt({
        query,
        summaries: (matches as SummaryMatch[]).map((m) => ({
          summary: m.summary,
          date: new Date(m.started_at).toLocaleDateString(),
        })),
      })
    );

    console.log("[recall-memory] Raw LLM Re-ranker Output:", rawReRank);

    const result = reRankResultSchema.parse(extractJsonBlock(rawReRank));

    if (!result.relevant || !result.recalled_memory) {
      console.log("[recall-memory] LLM Re-ranker found no relevant info.");
      return NextResponse.json({
        success: true,
        memory: "I found some past conversations, but none of them seem to contain the information you're looking for.",
      });
    }

    console.log("[recall-memory] Final synthesized memory:", result.recalled_memory);

    return NextResponse.json({
      success: true,
      memory: result.recalled_memory,
    });
  } catch (error) {
    console.error("[recall-memory] Error:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
