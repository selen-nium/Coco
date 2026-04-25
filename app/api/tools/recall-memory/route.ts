import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { embedText, toVectorLiteral } from "@/lib/gemini/client";

/**
 * POST /api/tools/recall-memory
 * Tool for ElevenLabs Agent to search past conversation history.
 * Registered as a "Client Tool" in ElevenLabs dashboard.
 */
export async function POST(req: NextRequest) {
  try {
    const { query, elderly_user_id } = await req.json();

    if (!query || !elderly_user_id) {
      return NextResponse.json({ error: "Missing query or elderly_user_id" }, { status: 400 });
    }

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

    const context = matches
      .map((m: any) => `- On ${new Date(m.timestamp).toLocaleDateString()}, the user said: "${m.text}"`)
      .join("\n");

    console.log("[recall-memory] Found memory for user:", elderly_user_id);

    return NextResponse.json({ 
      success: true, 
      memory: context 
    });
  } catch (error) {
    console.error("[recall-memory] Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
