// In-memory call session state (per call_sid)
// Replace with Redis for multi-instance deployments

export interface CallSession {
  call_sid: string;
  elderly_user_id: string;
  flow_id: string | null;
  current_step: number;
  step_attempts: number; // resets on step change, triggers 3-loop at 3
  last_active: number; // Date.now()
  status: "active" | "completed" | "escalated";
}

const sessions = new Map<string, CallSession>();

export function createSession(
  call_sid: string,
  elderly_user_id: string
): CallSession {
  const session: CallSession = {
    call_sid,
    elderly_user_id,
    flow_id: null,
    current_step: 0,
    step_attempts: 0,
    last_active: Date.now(),
    status: "active",
  };
  sessions.set(call_sid, session);
  return session;
}

export function getSession(call_sid: string): CallSession | undefined {
  return sessions.get(call_sid);
}

export function updateSession(
  call_sid: string,
  updates: Partial<CallSession>
): void {
  const session = sessions.get(call_sid);
  if (session) {
    sessions.set(call_sid, { ...session, ...updates, last_active: Date.now() });
  }
}

export function deleteSession(call_sid: string): void {
  sessions.delete(call_sid);
}

export function incrementStepAttempts(call_sid: string): number {
  const session = sessions.get(call_sid);
  if (!session) return 0;
  const updated = { ...session, step_attempts: session.step_attempts + 1 };
  sessions.set(call_sid, updated);
  return updated.step_attempts;
}

export function advanceStep(call_sid: string): void {
  const session = sessions.get(call_sid);
  if (!session) return;
  sessions.set(call_sid, {
    ...session,
    current_step: session.current_step + 1,
    step_attempts: 0,
    last_active: Date.now(),
  });
}
