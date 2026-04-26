import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServiceClient } from "@/lib/supabase/server";
import { embedText, toVectorLiteral } from "@/lib/gemini/client";
import { buildMemoryText } from "@/lib/gemini/intelligence-utils.mjs";

const requestSchema = z.object({
  query: z.string().trim().min(1),
  elderly_user_id: z.string().uuid(),
});

type MemoryMatch = {
  text: string;
  timestamp: string;
  similarity: number;
};

/**
 * POST /api/tools/recall-memory
 * Tool for ElevenLabs Agent to search past conversation history.
 * Registered as a "Client Tool" in ElevenLabs dashboard.
 */
export async function POST(req: NextRequest) {
  try {
    const { query, elderly_user_id } = requestSchema.parse(await req.json());

    const supabase = await createServiceClient();
    
    // 1. Embed the search query
    const embedding = await embedText(query);

    // 2. Perform similarity search filtered by the specific elderly user
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

    // 3. Format matches into a context string for the AI
    if (!matches || matches.length === 0) {
      return NextResponse.json({ 
        success: true, 
        memory: "I searched the past conversations but couldn't find any specific information about that." 
      });
    }

    const snippets = (matches as MemoryMatch[]).map((match) => ({
      text: match.text,
      timestamp: match.timestamp,
      similarity: match.similarity,
    }));

    const memory = buildMemoryText(snippets);

    console.log("[recall-memory] Found memory for user:", elderly_user_id);

    return NextResponse.json({ 
      success: true, 
      memory,
      snippets,
    });
  } catch (error) {
    console.error("[recall-memory] Error:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
