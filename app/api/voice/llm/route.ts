import { NextRequest } from "next/server";
import { getSession } from "@/lib/state/call-session";
import { brainModel } from "@/lib/gemini/client";
import { buildGuidanceSystemPrompt } from "@/lib/gemini/prompts";
import { createServiceClient } from "@/lib/supabase/server";

// ElevenLabs Custom LLM endpoint
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { messages, metadata } = body;
  const call_sid = metadata?.call_sid;

  if (!call_sid) {
    return new Response(JSON.stringify({ error: "No call_sid in metadata" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const session = getSession(call_sid);
  if (!session) {
    console.error("[voice/llm] Session not found for call_sid:", call_sid);
    // Fallback if session is missing but call is active
  }

  // Coordination with Agent 2: 
  // We check if there's a guidance session (Gemini ChatSession) already created by Agent 2.
  // Since Agent 2 hasn't implemented lib/gemini/guidance-sessions.ts yet, we'll stub it.
  
  let chatResponse;
  const lastUserMessage = messages[messages.length - 1].content;

  try {
    // FALLBACK: Use brainModel directly if guidance session is not found
    // This happens for the first turn or if intent matching hasn't finished.
    
    // We might need some user context for the prompt
    const supabase = await createServiceClient();
    const { data: elderlyUser } = await supabase
      .from("elderly_users")
      .select("*, agent_configs(*)")
      .eq("id", session?.elderly_user_id)
      .single();

    const agentConfig = elderlyUser?.agent_configs[0] || {
      metaphor_mode: false,
      tts_speed: 1.0,
      repetition_level: 2,
    };

    const systemPrompt = buildGuidanceSystemPrompt(
      elderlyUser?.name || "User",
      {
        metaphor_mode: agentConfig.metaphor_mode,
        tts_speed: agentConfig.tts_speed,
        repetition_level: agentConfig.repetition_level,
      },
      null // No flow yet
    );

    const result = await brainModel.generateContentStream({
      contents: [
        { role: "user", parts: [{ text: systemPrompt }] },
        { role: "model", parts: [{ text: "Understood. I am Coco. How can I help you today?" }] },
        ...messages.map((m: any) => ({
          role: m.role === "assistant" ? "model" : "user",
          parts: [{ text: m.content }],
        })),
      ],
    });

    const stream = new ReadableStream({
      async start(controller) {
        for await (const chunk of result.stream) {
          const text = chunk.text();
          const openAIChunk = {
            choices: [
              {
                delta: { content: text },
                finish_reason: null,
                index: 0,
              },
            ],
          };
          controller.enqueue(`data: ${JSON.stringify(openAIChunk)}\n\n`);
        }
        controller.enqueue(`data: [DONE]\n\n`);
        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });

  } catch (error) {
    console.error("[voice/llm] Error generating response:", error);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
