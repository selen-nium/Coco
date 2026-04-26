import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServiceClient } from "@/lib/supabase/server";
import { embedText, toVectorLiteral } from "@/lib/gemini/client";
import { buildMemoryText } from "@/lib/gemini/intelligence-utils.mjs";

const requestSchema = z.object({
  query: z.string().trim().min(1),
  elderly_user_id: z.string().optional(),
  call_log_id: z.string().uuid().optional(),
});

type MemoryMatch = {
  text: string;
  timestamp: string;
  similarity: number;
};

/**
 * POST /api/tools/recall-memory
 * Server Tool for ElevenLabs Agent to search past conversation history.
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

    const { data: matches, error } = await supabase.rpc("match_memory", {
      query_embedding: toVectorLiteral(embedding),
      elderly_id: elderly_user_id,
      match_threshold: 0.7,
      match_count: 5,
    });

    if (error) {
      console.error("[recall-memory] Supabase RPC error:", error);
      throw error;
    }

    if (!matches || matches.length === 0) {
      return NextResponse.json({
        success: true,
        memory: "I searched the past conversations but couldn't find any specific information about that.",
      });
    }

    const snippets = (matches as MemoryMatch[]).map((match) => ({
      text: match.text,
      timestamp: match.timestamp,
      similarity: match.similarity,
    }));

    const memory = buildMemoryText(snippets);

    console.log("[recall-memory] Found memory for user:", elderly_user_id);

    return NextResponse.json({ success: true, memory, snippets });
  } catch (error) {
    console.error("[recall-memory] Error:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
