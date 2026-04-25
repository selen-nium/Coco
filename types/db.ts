export type Speaker = "agent" | "user";
export type CallStatus = "completed" | "dropped" | "escalated" | "in_progress";
export type InterventionType =
  | "3-loop"
  | "visual-aid"
  | "scam"
  | "silence"
  | "state-drift";
export type ScamSeverity = "high" | "critical";
export type AlertStatus = "active" | "dismissed";

export interface Caretaker {
  id: string;
  auth_user_id: string;
  name: string;
  email: string;
  phone: string;
  created_at: string;
}

export interface ElderlyUser {
  id: string;
  caretaker_id: string;
  name: string;
  phone: string;
  verified: boolean;
  verification_code: string | null;
  created_at: string;
}

export interface AgentConfig {
  id: string;
  elderly_user_id: string;
  elevenlabs_voice_id: string;
  tts_speed: number;
  repetition_level: number;
  metaphor_mode: boolean;
  allow_sensitive_flows: boolean;
  updated_at: string;
}

export interface FlowStep {
  step: number;
  instruction: string;
  target: string;
  location: string;
  icon: string;
  validation: string;
  secondary_anchor?: string;
}

export interface IngestedFlow {
  id: string;
  caretaker_id: string | null;
  name: string;
  app: string;
  description: string;
  steps: FlowStep[];
  created_at: string;
}

export interface FlowVisualAid {
  id: string;
  flow_id: string;
  step_index: number;
  image_url: string;
  description: string;
}

export interface CallLog {
  id: string;
  elderly_user_id: string;
  twilio_call_sid: string;
  flow_id: string | null;
  intent_text: string | null;
  started_at: string;
  ended_at: string | null;
  duration_seconds: number | null;
  summary: string | null;
  status: CallStatus;
}

export interface CallTranscript {
  id: string;
  call_log_id: string;
  speaker: Speaker;
  text: string;
  timestamp: string;
}

export interface InterventionLog {
  id: string;
  call_log_id: string;
  type: InterventionType;
  step_index: number | null;
  metadata: Record<string, unknown>;
  triggered_at: string;
}

export interface ScamAlert {
  id: string;
  call_log_id: string;
  elderly_user_id: string;
  detected_keywords: string[];
  severity: ScamSeverity;
  sms_sent_at: string | null;
  status: AlertStatus;
  dismissed_by: string | null;
  created_at: string;
}

export interface MoodMetric {
  id: string;
  elderly_user_id: string;
  call_log_id: string;
  sentiment_score: number;
  frustration_level: number;
  confusion_level: number;
  recorded_at: string;
}
