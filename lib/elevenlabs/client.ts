// ElevenLabs Conversational AI client
// Docs: https://elevenlabs.io/docs/conversational-ai

const ELEVENLABS_BASE_URL = "https://api.elevenlabs.io/v1";

export const ELEVENLABS_AGENT_ID = process.env.ELEVENLABS_AGENT_ID!;

export async function createConversationalSession(params: {
  agent_id: string;
  phone_number: string;
  call_sid: string;
  agent_config_override?: any;
}): Promise<{ session_id: string; websocket_url: string }> {
  const agent_id = params.agent_id || ELEVENLABS_AGENT_ID;
  
  let websocket_url = `wss://api.elevenlabs.io/v1/convai/twilio?agent_id=${agent_id}`;
  
  if (params.agent_config_override) {
    const config_base64 = Buffer.from(JSON.stringify(params.agent_config_override)).toString("base64");
    websocket_url += `&conversation_config_override=${config_base64}`;
  }

  // We don't strictly need to call an API to "start" a session for Twilio Stream,
  // as the connection to the WebSocket starts it. 
  // But we return the URL to be used in TwiML.
  return { 
    session_id: params.call_sid, // Use call_sid as session_id for tracking
    websocket_url 
  };
}

export async function updateAgentConfig(config: {
  voice_id: string;
  tts_speed: number;
  repetition_level: number;
  metaphor_mode: boolean;
}): Promise<void> {
  const res = await fetch(`${ELEVENLABS_BASE_URL}/convai/agents/${ELEVENLABS_AGENT_ID}`, {
    method: "PATCH",
    headers: {
      "xi-api-key": process.env.ELEVENLABS_API_KEY!,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      conversation_config: {
        tts: {
          voice_id: config.voice_id,
          speed: config.tts_speed,
        },
        // metaphor_mode and repetition_level might need to be handled in the prompt
      },
    }),
  });

  if (!res.ok) {
    const error = await res.text();
    console.error("Failed to update ElevenLabs agent config:", error);
    throw new Error(`ElevenLabs API error: ${error}`);
  }
}
