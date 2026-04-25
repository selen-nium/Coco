import { NextRequest } from "next/server";
import { getSession } from "@/lib/state/call-session";
import { getGuidanceSession } from "@/lib/gemini/guidance-sessions";
import { brainModel } from "@/lib/gemini/client";
import { buildGuidanceSystemPrompt } from "@/lib/gemini/prompts";
import { createServiceClient } from "@/lib/supabase/server";

// POST /api/voice/llm
// ElevenLabs Custom LLM endpoint — called for every conversation turn.
// Priority: use Agent 2's matched-flow Gemini session if available,
// otherwise fall back to a stateless brainModel call with base prompt.
// Configure in ElevenLabs agent: Custom LLM URL = https://<domain>/api/voice/llm
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

  const lastUserMessage = messages?.[messages.length - 1]?.content ?? "";
  const session = getSession(call_sid);

  // Use Agent 2's guidance session (has matched flow in context) if ready
  const guidanceSession = getGuidanceSession(call_sid);

  try {
    let stream: ReadableStream;

    if (guidanceSession) {
      // Happy path: flow-aware Gemini chat session created by Agent 2 after intent match
      const result = await guidanceSession.sendMessageStream(lastUserMessage);
      stream = new ReadableStream({
        async start(controller) {
          for await (const chunk of result.stream) {
            const text = chunk.text();
            if (text) {
              controller.enqueue(
                `data: ${JSON.stringify({ choices: [{ delta: { content: text }, finish_reason: null, index: 0 }] })}\n\n`
              );
            }
          }
          controller.enqueue(`data: [DONE]\n\n`);
          controller.close();
        },
      });
    } else {
      // Fallback: stateless call, used on first turn before intent match resolves
      const supabase = await createServiceClient();
      const { data: elderlyUser } = await supabase
        .from("elderly_users")
        .select("*, agent_configs(*)")
        .eq("id", session?.elderly_user_id)
        .single();

      const agentConfig = elderlyUser?.agent_configs?.[0] ?? {
        metaphor_mode: false,
        tts_speed: 1.0,
        repetition_level: 2,
      };

      const systemPrompt = buildGuidanceSystemPrompt(
        elderlyUser?.name ?? "there",
        {
          metaphor_mode: agentConfig.metaphor_mode,
          tts_speed: agentConfig.tts_speed,
          repetition_level: agentConfig.repetition_level,
        },
        null
      );

      const result = await brainModel.generateContentStream({
        contents: [
          { role: "user", parts: [{ text: systemPrompt }] },
          { role: "model", parts: [{ text: "Understood. I am Coco. How can I help you today?" }] },
          ...messages.map((m: { role: string; content: string }) => ({
            role: m.role === "assistant" ? "model" : "user",
            parts: [{ text: m.content }],
          })),
        ],
      });

      stream = new ReadableStream({
        async start(controller) {
          for await (const chunk of result.stream) {
            const text = chunk.text();
            if (text) {
              controller.enqueue(
                `data: ${JSON.stringify({ choices: [{ delta: { content: text }, finish_reason: null, index: 0 }] })}\n\n`
              );
            }
          }
          controller.enqueue(`data: [DONE]\n\n`);
          controller.close();
        },
      });
    }

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("[voice/llm]", error);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
