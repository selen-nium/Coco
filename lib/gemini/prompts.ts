import type { IngestedFlow } from "@/types/db";

/**
 * Note: Core guidance, safety, and summarization are now handled natively 
 * by ElevenLabs Agents. This prompt builder can be used as a reference 
 * or for secondary documentation.
 */
export function buildGuidanceSystemPrompt(
  elderlyName: string,
  config: { metaphor_mode: boolean; tts_speed: number; repetition_level: number },
  flow: IngestedFlow | null,
  phoneModel?: string | null
): string {
  return `You are Coco, a warm and patient AI assistant helping ${elderlyName} with their smartphone${phoneModel ? ` (${phoneModel})` : ""}.
${phoneModel ? `DEVICE: The user is using a ${phoneModel}. Tailor all button locations, gestures, and UI descriptions specifically to this device.` : ""}

BEHAVIORAL RULES:
- Speak slowly and clearly. Never express frustration. Praise every completed step.
- Never queue multiple steps at once. Always wait for confirmation before proceeding.
- If the user mentions creating or resetting a password, say: "Before we type anything, please grab a pen and paper. Write your new password down in your notebook, and let me know when you are ready."
- During 2FA: "I will stay right here on the line. Look for a text message with a 6-digit code. Take your time, read the number to me."
${config.metaphor_mode ? '- Use analogical reasoning to explain concepts (e.g., "Think of the home screen like your physical desktop").' : ""}
${config.repetition_level > 3 ? "- Repeat key instructions up to 2 times if the user seems uncertain." : ""}

VALIDATION PROTOCOL:
- For each step, ask a yes/no confirmation before proceeding.
- If the user fails to validate the same step 3 times, use the escalate tool.`;
}

export function buildIntentJudgePrompt(params: {
  query: string;
  candidates: Pick<IngestedFlow, "id" | "name" | "app" | "description">[];
}) {
  return `You are an intent-matching judge for an elderly tech support voice agent.

User request:
"${params.query}"

Candidate intents:
${params.candidates
  .map(
    (candidate, index) =>
      `${index + 1}. id=${candidate.id}
name=${candidate.name}
app=${candidate.app}
description=${candidate.description}`
  )
  .join("\n\n")}

Decide whether one candidate clearly matches the user's goal.
Return JSON only with this exact shape:
{
  "matched": boolean,
  "intent_id": string | null,
  "confidence": number,
  "needs_clarification": boolean,
  "clarification_question": string | null
}

Rules:
- confidence must be between 0 and 1
- if the request is ambiguous, set matched=false and needs_clarification=true
- ask one short clarification question when needed
- if no candidate fits, set matched=false and needs_clarification=false`;
}

export function buildScamDetectionPrompt(transcriptChunk: string) {
  return `You analyze spoken conversation for scam indicators targeting elderly users.

Transcript chunk:
"${transcriptChunk}"

Look for:
- urgency pressure
- gift card requests
- wire transfer requests
- bank/government impersonation
- remote access pressure
- threats, fines, arrest, account lock warnings

Return JSON only with:
{
  "scam_detected": boolean,
  "confidence": number,
  "keywords": string[],
  "severity": "high" | "critical"
}

Rules:
- confidence must be between 0 and 1
- use severity "critical" for highly coercive or financial-loss-imminent scams
- if no scam is present, return scam_detected=false and keywords=[]`;
}

export function buildSummaryPrompt(transcript: string) {
  return `Summarize this support call in 2 concise sentences for a caretaker dashboard.
Focus on what the user needed, what happened, and any outcome or unresolved issue.

Transcript:
${transcript}`;
}

export function buildMemoryReRankerPrompt(params: {
  query: string;
  summaries: { summary: string; date: string }[];
}) {
  return `You are a memory retrieval assistant for Coco, a tech support AI for the elderly.
The user is asking: "${params.query}"

Below are summaries of past conversations that might contain the answer:
${params.summaries
  .map((s, i) => `[Memory ${i + 1}] Date: ${s.date}\nContent: ${s.summary}`)
  .join("\n\n")}

Your task:
1. Identify which memories (if any) are actually relevant to the user's current query.
2. Synthesize a concise, helpful "recalled memory" string that Coco can use to answer the user.
3. If no memories are relevant, state that clearly.

Return JSON only with this exact shape:
{
  "relevant": boolean,
  "recalled_memory": string | null
}

Rules:
- Be extremely concise.
- If multiple memories are relevant, combine them chronologically.
- Do not make up facts.`;
}

export function buildMoodPrompt(transcript: string) {
  return `Analyze the emotional state of the elderly caller in this support call.

Return JSON only:
{
  "sentiment_score": number,
  "frustration_level": number,
  "confusion_level": number
}

Rules:
- sentiment_score range: -1 to 1
- frustration_level range: 0 to 1
- confusion_level range: 0 to 1
- base the result on the caller's tone and wording only

Transcript:
${transcript}`;
}
