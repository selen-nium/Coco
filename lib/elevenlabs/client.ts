// ElevenLabs Conversational AI client
// Docs: https://elevenlabs.io/docs/conversational-ai

const ELEVENLABS_BASE_URL = "https://api.elevenlabs.io/v1";

export const ELEVENLABS_AGENT_ID = process.env.ELEVENLABS_AGENT_ID!;

export async function createConversationalSession(params: {
  agent_id: string;
  phone_number: string;
  call_sid: string;
  agent_config_override?: Record<string, unknown>;
}): Promise<{ session_id: string; websocket_url: string }> {
  const agent_id = params.agent_id || ELEVENLABS_AGENT_ID;

  let websocket_url = `wss://api.elevenlabs.io/v1/convai/twilio?agent_id=${agent_id}`;

  if (params.agent_config_override) {
    const config_base64 = Buffer.from(
      JSON.stringify(params.agent_config_override)
    ).toString("base64");
    websocket_url += `&conversation_config_override=${config_base64}`;
  }

  return {
    session_id: params.call_sid,
    websocket_url,
  };
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
