import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServiceClient } from "@/lib/supabase/server";
import { embedText, toVectorLiteral } from "@/lib/gemini/client";

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

/**
 * POST /api/tools/recall-memory
 * Server Tool for ElevenLabs Agent to search past conversation history.
 * Updated to search call summaries for better high-level fact retrieval.
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
      match_threshold: 0.4, // Lowered threshold for broad summary matching
      match_count: 3,
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

    console.log(`[recall-memory] Found ${matches.length} matching summaries`);

    const memoryBlocks = (matches as SummaryMatch[]).map((match) => {
      const date = new Date(match.started_at).toLocaleDateString();
      console.log(`[recall-memory] Match (${match.similarity.toFixed(4)}): ${match.summary.substring(0, 100)}...`);
      return `Summary of conversation on ${date}: "${match.summary}"`;
    });

    const memory = memoryBlocks.join("\n\n");

    return NextResponse.json({ success: true, memory });
  } catch (error) {
    console.error("[recall-memory] Error:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
