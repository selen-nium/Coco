import type { ChatSession } from "@google/generative-ai";

// In-memory store of live Gemini chat sessions, keyed by call_sid.
// Agent 2 creates and stores sessions after intent match.
// Agent 1's /api/voice/llm reads them each turn.

const sessions = new Map<string, ChatSession>();

export function storeGuidanceSession(call_sid: string, session: ChatSession): void {
  sessions.set(call_sid, session);
}

export function getGuidanceSession(call_sid: string): ChatSession | undefined {
  return sessions.get(call_sid);
}

export function deleteGuidanceSession(call_sid: string): void {
  sessions.delete(call_sid);
}

export async function streamGeminiToOpenAI(
  session: ChatSession,
  userMessage: string,
  onChunk: (chunk: string) => void
): Promise<void> {
  const result = await session.sendMessageStream(userMessage);

  for await (const chunk of result.stream) {
    const text = chunk.text();
    if (text) {
      onChunk(text);
    }
  }
}
