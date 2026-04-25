# Agent 1 — Voice & Telephony Pipeline

## Mission
Wire up the end-to-end phone call: Twilio inbound → ElevenLabs session → call state tracking → call end teardown. The user must be able to call the Twilio number and hear Coco's voice by the time this agent is done.

## Files You Own
```
app/api/voice/inbound/route.ts
app/api/voice/transcript/route.ts
app/api/voice/status/route.ts
app/api/voice/sms/route.ts
app/api/voice/llm/route.ts        ← joint with Agent 2, see Task 8
lib/twilio/client.ts
lib/elevenlabs/client.ts
lib/state/call-session.ts
```

## Do Not Touch
- `app/api/intelligence/*` — Agent 2
- `app/api/dashboard/*` — Agent 3
- `app/(dashboard)/**` — Agent 3

---

## Tasks (implement in this order)

### 1. Twilio Signature Validation
In `lib/twilio/client.ts`, `validateTwilioSignature` is already stubbed. Make sure every Twilio webhook route (`inbound`, `status`, `sms`) validates the `X-Twilio-Signature` header before processing. Return HTTP 403 on failure.

### 2. Inbound Call Handler (`/api/voice/inbound`)
1. Parse Twilio `From` field (elderly user's phone number).
2. Query Supabase `elderly_users` by `phone = From`.  
   - If no match: respond with TwiML that says "This number is not registered." and hangs up.
3. Insert a `call_logs` row (`status: 'in_progress'`, `twilio_call_sid`, `elderly_user_id`, `started_at`).
4. Create a `CallSession` in `lib/state/call-session.ts`.
5. Return TwiML `<Connect><Stream>` pointing to ElevenLabs Conversational AI websocket endpoint.  
   Reference: ElevenLabs Twilio integration guide — the TwiML uses `<Stream url="wss://api.elevenlabs.io/v1/convai/twilio?agent_id=...">`.

**Latency fallback:** If ElevenLabs response exceeds 1.5s, ElevenLabs handles this natively via the agent's idle audio config. Set `idle_audio_url` in the ElevenLabs agent config to a hosted MP3 (keyboard/paper sound).

### 3. ElevenLabs Session (`lib/elevenlabs/client.ts`)
Implement `createConversationalSession`. The session must pass:
- `agent_id` from `ELEVENLABS_AGENT_ID` env var
- First message prompt derived from the elderly user's `AgentConfig` (voice, speed, metaphor mode)

Fetch `AgentConfig` from Supabase in the inbound handler and attach it to the ElevenLabs session as overrides.

### 4. Transcript Fan-out (`/api/voice/transcript`)
ElevenLabs posts each transcript chunk here via webhook.

1. Write the chunk to `call_transcripts` (Supabase insert — speaker, text, timestamp).
2. If `speaker === 'user'` and `CallSession.flow_id === null` (first user utterance):
   - Fire-and-forget `POST /api/intelligence/intent` with `{ call_sid, elderly_user_id, text }`.
   - Await the response, store `flow_id` in `CallSession`.
3. Fire-and-forget `POST /api/intelligence/scam-alert` with the chunk (never block on this).
4. **Silence detection:** ElevenLabs VAD handles 5-second silence natively via the agent config — set `turn_timeout` to 5s with a check-in follow-up prompt in the system prompt.

### 5. Three-Loop Rule (in transcript handler)
`CallSession` tracks `current_step` and `step_attempts`.

- When the user validates a step successfully (agent replies with "Great" or similar), call `advanceStep(call_sid)`.
- When validation fails, call `incrementStepAttempts(call_sid)`.
- If `step_attempts >= 3`: insert `intervention_logs` row (`type: '3-loop'`), and inject a system message into ElevenLabs telling the agent to escalate to the caretaker. Then update `call_logs.status = 'escalated'`.

**Note:** Visual aid SMS dispatch has been removed from scope. The 3-loop rule now only triggers the caretaker escalation message.

### 6. Call Status Callback (`/api/voice/status`)
Twilio fires this when the call ends.

1. Parse `CallStatus` and `CallDuration`.
2. Update `call_logs`: `ended_at`, `duration_seconds`, `status` (map Twilio status → your enum).
3. `deleteSession(call_sid)`.
4. Fire-and-forget:
   - `POST /api/intelligence/summarize { call_log_id }`
   - `POST /api/intelligence/mood { call_log_id, elderly_user_id }`

### 7. SMS Verification (`/api/voice/sms`)
1. Parse `From` (elderly phone) and `Body` (the code they texted back).
2. Query `elderly_users` where `phone = From` and `verified = false`.
3. Compare `Body.trim()` to `verification_code`.
4. If match: set `verified = true`, clear `verification_code`.
5. Reply with a TwiML `<Message>` confirming the link is established.

---

## Key Env Vars
```
TWILIO_ACCOUNT_SID
TWILIO_AUTH_TOKEN
TWILIO_PHONE_NUMBER
ELEVENLABS_API_KEY
ELEVENLABS_AGENT_ID
NEXT_PUBLIC_SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
```

## Supabase Tables You Read/Write
- `elderly_users` — read by phone, read AgentConfig
- `agent_configs` — read on inbound
- `call_logs` — insert on inbound, update on status
- `call_transcripts` — insert per chunk
- `intervention_logs` — insert on 3-loop trigger

### 8. Custom LLM Endpoint (`/api/voice/llm`) — Joint with Agent 2

This is the critical integration that makes the voice call actually smart.

ElevenLabs supports a **Custom LLM** mode where instead of using its internal model, it calls your endpoint for every conversation turn in OpenAI-compatible format. Configure this in your ElevenLabs agent settings:
```
LLM: Custom
Custom LLM URL: https://<your-ngrok-or-domain>/api/voice/llm
```

**Your responsibility in this route (Agent 1 side):**
1. Parse the incoming OpenAI-format body: `{ model, messages, stream, metadata }`.
2. Extract `call_sid` from `body.metadata.call_sid` (ElevenLabs passes custom metadata through the agent config).
3. Look up `CallSession` via `getSession(call_sid)` to confirm the call is active.
4. Call `getGuidanceSession(call_sid)` from `lib/gemini/guidance-sessions.ts` to retrieve the Gemini chat session that Agent 2 created after intent match.
5. Extract the latest user message from `messages`.
6. Stream the Gemini response back in OpenAI SSE format (see Agent 2's task for the streaming implementation — coordinate on who writes the stream formatter).

**Fallback:** If `getGuidanceSession(call_sid)` returns undefined (intent not matched yet or first turn), call `brainModel.generateContentStream()` with just the base elderly-assistant system prompt and the user message.

---

## Integration Points with Other Agents
- **→ Agent 2:** POST `/api/intelligence/intent` (fire after first user utterance)
- **→ Agent 2:** POST `/api/intelligence/scam-alert` (fire per user chunk, non-blocking)
- **→ Agent 2:** POST `/api/intelligence/summarize` and `/api/intelligence/mood` (fire on call end)
- **← Agent 2:** `/api/intelligence/intent` returns `{ flow_id, flow }` — store `flow_id` in `CallSession`
- **← Agent 2:** `getGuidanceSession(call_sid)` from `lib/gemini/guidance-sessions.ts` — read each turn in `/api/voice/llm`
