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
    const { query, phone } = await req.json();

    if (!query || !phone) {
      return NextResponse.json({ error: "Missing query or phone" }, { status: 400 });
    }

    const supabase = await createServiceClient();
    
    // 1. Lookup the elderly user by phone
    const { data: elderlyUser, error: userError } = await supabase
      .from("elderly_users")
      .select("id")
      .eq("phone", phone)
      .single();

    if (userError || !elderlyUser) {
      return NextResponse.json({ 
        success: false, 
        memory: "User not found. Cannot search memory." 
      });
    }

    // 2. Embed the search query
    const embedding = await embedText(query);

    // 3. Perform similarity search filtered by the specific elderly user
    const { data: matches, error } = await supabase.rpc("match_memory", {
      query_embedding: toVectorLiteral(embedding),
      elderly_id: elderlyUser.id,
      match_threshold: 0.7,
      match_count: 5,
    });

    if (error) {
      console.error("[recall-memory] Supabase RPC error:", error);
      throw error;
    }

    // 4. Format matches into a context string for the AI
    if (!matches || matches.length === 0) {
      return NextResponse.json({ 
        success: true, 
        memory: "I searched the past conversations but couldn't find any specific information about that." 
      });
    }

    const context = matches
      .map((m: any) => `- On ${new Date(m.timestamp).toLocaleDateString()}, the user said: "${m.text}"`)
      .join("\n");

    console.log("[recall-memory] Found memory for user:", elderlyUser.id);

    return NextResponse.json({ 
      success: true, 
      memory: context 
    });
  } catch (error) {
    console.error("[recall-memory] Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
