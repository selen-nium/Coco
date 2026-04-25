// Voice API
export interface InboundCallPayload {
  CallSid: string;
  From: string;
  To: string;
  CallStatus: string;
}

export interface TranscriptChunkPayload {
  call_sid: string;
  speaker: "agent" | "user";
  text: string;
  timestamp: string;
}

export interface CallStatusPayload {
  CallSid: string;
  CallStatus: string;
  CallDuration?: string;
}

// Intelligence API
export interface IntentPayload {
  call_sid: string;
  elderly_user_id: string;
  text: string;
}

export interface IntentResult {
  flow_id: string | null;
  flow: import("./db").IngestedFlow | null;
  similarity: number | null;
}

export interface ScamAlertPayload {
  call_sid: string;
  elderly_user_id: string;
  detected_keywords: string[];
  severity: import("./db").ScamSeverity;
  transcript_excerpt: string;
}

export interface SummarizePayload {
  call_log_id: string;
}

export interface MoodPayload {
  call_log_id: string;
  elderly_user_id: string;
}

// Dashboard API
export interface LinkElderlyPayload {
  name: string;
  phone: string;
}

export interface VerifyElderlyPayload {
  elderly_user_id: string;
  code: string;
}

export interface UpdateConfigPayload {
  elevenlabs_voice_id?: string;
  tts_speed?: number;
  repetition_level?: number;
  metaphor_mode?: boolean;
  allow_sensitive_flows?: boolean;
}

export interface DismissAlertPayload {
  status: "dismissed";
}
