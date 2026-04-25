// ElevenLabs Conversational AI client
// Docs: https://elevenlabs.io/docs/conversational-ai

const ELEVENLABS_BASE_URL = "https://api.elevenlabs.io/v1";

export const ELEVENLABS_AGENT_ID = process.env.ELEVENLABS_AGENT_ID!;

export async function createConversationalSession(params: {
  agent_id: string;
  phone_number: string;
  call_sid: string;
}): Promise<{ session_id: string }> {
  // TODO (Agent 1): implement ElevenLabs session creation
  throw new Error("Not implemented");
}

export async function getAgentVoices(): Promise<
  { voice_id: string; name: string; preview_url: string }[]
> {
  const res = await fetch(`${ELEVENLABS_BASE_URL}/voices`, {
    headers: { "xi-api-key": process.env.ELEVENLABS_API_KEY! },
  });
  const data = await res.json();
  return data.voices ?? [];
}

export async function updateAgentConfig(config: {
  voice_id: string;
  tts_speed: number;
  repetition_level: number;
  metaphor_mode: boolean;
}): Promise<void> {
  // TODO (Agent 1): patch ElevenLabs agent with updated config
  throw new Error("Not implemented");
}
