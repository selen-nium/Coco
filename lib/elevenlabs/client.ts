// ElevenLabs Conversational AI client
// Docs: https://elevenlabs.io/docs/conversational-ai

const ELEVENLABS_BASE_URL = "https://api.elevenlabs.io/v1";

export const ELEVENLABS_AGENT_ID = process.env.ELEVENLABS_AGENT_ID!;

export async function createConversationalSession(_params: {
  agent_id: string;
  phone_number: string;
  call_sid: string;
}): Promise<{ session_id: string }> {
  void _params;
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
  // Cross-concern patch by Agent 3: the dashboard needs a shared config sync hook.
  if (!process.env.ELEVENLABS_API_KEY || !ELEVENLABS_AGENT_ID) {
    return;
  }

  const response = await fetch(
    `${ELEVENLABS_BASE_URL}/convai/agents/${ELEVENLABS_AGENT_ID}`,
    {
      method: "PATCH",
      headers: {
        "content-type": "application/json",
        "xi-api-key": process.env.ELEVENLABS_API_KEY,
      },
      body: JSON.stringify({
        conversation_config: {
          tts: {
            voice_id: config.voice_id,
            speed: config.tts_speed,
          },
          agent: {
            prompt: {
              prompt: `Use repetition level ${config.repetition_level} and metaphor mode ${config.metaphor_mode ? "enabled" : "disabled"}.`,
            },
          },
        },
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`ElevenLabs config sync failed: ${response.status}`);
  }
}
