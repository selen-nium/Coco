import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/state/call-session";
import { getGuidanceSession } from "@/lib/gemini/guidance-sessions";

// POST /api/voice/llm
// ElevenLabs Custom LLM endpoint — called by ElevenLabs for every conversation turn.
// ElevenLabs sends an OpenAI-compatible chat payload; we forward it to the Gemini
// guidance session (which already has the matched flow in context) and stream back
// the response in OpenAI SSE format so ElevenLabs can speak it via TTS.
//
// Configured in ElevenLabs agent settings as:
//   Custom LLM URL: https://<your-domain>/api/voice/llm
//
// Agent 1 owns this route (wires it to ElevenLabs config).
// Agent 2 owns getGuidanceSession() — the Gemini session with flow context.

export async function POST(req: NextRequest) {
  // TODO (Agent 1 + Agent 2 joint):
  //
  // Agent 1's responsibility:
  // 1. Parse the ElevenLabs OpenAI-compatible payload:
  //    { model, messages: [{role, content}], stream, metadata: { call_sid } }
  // 2. Extract call_sid from metadata or a custom header ElevenLabs passes
  // 3. Look up CallSession to get flow_id
  //
  // Agent 2's responsibility:
  // 4. Call getGuidanceSession(call_sid) to retrieve the live Gemini chat session
  //    (already loaded with matched flow steps + system prompt)
  // 5. Extract the latest user message from messages[]
  // 6. Send to Gemini chat session: session.sendMessageStream(userMessage)
  // 7. Stream back tokens in OpenAI SSE format:
  //    data: {"choices":[{"delta":{"content":"..."}}]}\n\n
  //    data: [DONE]\n\n
  //
  // If no guidance session exists yet (flow not matched), fall back to a
  // general Gemini call with the base elderly-assistant system prompt.

  const body = await req.json();
  const callSid = body.metadata?.call_sid ?? req.headers.get("x-call-sid");

  console.log("[voice/llm] turn for call_sid:", callSid);

  // Stub: echo last user message back so ElevenLabs doesn't hang
  const lastUserMessage =
    body.messages?.findLast((m: { role: string }) => m.role === "user")
      ?.content ?? "Hello";

  const stubResponse = {
    choices: [{ message: { role: "assistant", content: `I heard: ${lastUserMessage}` } }],
  };

  return NextResponse.json(stubResponse);
}
