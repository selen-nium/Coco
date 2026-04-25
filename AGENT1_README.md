# Agent 1 — Voice & Telephony Pipeline

## Mission
Wire up the end-to-end phone call using the Native ElevenLabs Dashboard Architecture. Twilio handles the telephony, your Next.js app handles the inbound webhook to route the call to ElevenLabs and provides Agent Tools (webhooks) for the AI to interact with your database. The LLM, transcripts, and intent routing are handled natively by ElevenLabs.

## Files You Own
```
app/api/voice/inbound/route.ts
app/api/voice/status/route.ts
app/api/voice/sms/route.ts
app/api/tools/escalate/route.ts
app/api/tools/log-scam/route.ts
app/api/tools/send-sms/route.ts
lib/twilio/client.ts
lib/elevenlabs/client.ts
```

## Do Not Touch
- `app/api/intelligence/*` — Agent 2
- `app/api/dashboard/*` — Agent 3
- `app/(dashboard)/**` — Agent 3

---

## Tasks (implement in this order)

### 1. Twilio Signature Validation
In `lib/twilio/client.ts`, `validateTwilioSignature` is already stubbed. Make sure every Twilio webhook route validates the `X-Twilio-Signature` header before processing. Return HTTP 403 on failure.

### 2. Inbound Call Handler (`/api/voice/inbound`)
1. Parse Twilio `From` field (elderly user's phone number) and `CallSid`.
2. Query Supabase `elderly_users` by `phone = From` (join with `agent_configs` and `caretakers`).  
   - If no match: respond with TwiML that says "This number is not registered." and hangs up.
3. Insert a `call_logs` row (`status: 'in_progress'`, `twilio_call_sid`, `elderly_user_id`).
4. Format dynamic variables (user's name, metaphor mode, caretaker's phone, call SID) as a JSON string.
5. Return TwiML `<Connect><Stream>` pointing to the ElevenLabs Conversational AI websocket endpoint (`wss://api.elevenlabs.io/v1/convai/twilio?agent_id=...`). Include the JSON string in `<Parameter name="dynamic_variables" value="..." />`.

### 3. Agent Tools (`/api/tools/*`)
These are Next.js API routes that act as tools for the ElevenLabs agent.
- **Escalate (`/api/tools/escalate`):** Called when the 3-Loop Rule is triggered or the user needs help. Updates `call_logs.status = 'escalated'` for the given `call_sid`.
- **Log Scam (`/api/tools/log-scam`):** Called when a scam is suspected. Inserts a record into `intervention_logs` (`type: 'scam'`) with details provided by the agent.
- **Send SMS (`/api/tools/send-sms`):** Uses Twilio to send a verification code or alert to a phone number.

### 4. Call Status Callback (`/api/voice/status`)
Twilio fires this when the call ends.
1. Parse `CallStatus` and `CallDuration`.
2. Update `call_logs`: `ended_at`, `duration_seconds`, `status` (map Twilio status → your enum).
3. Fire-and-forget logic for post-call processing (e.g., triggering Agent 2 for summarization and mood analysis).

### 5. SMS Verification (`/api/voice/sms`)
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
- `elderly_users` — read by phone on inbound, read/update on SMS verification
- `agent_configs` — read on inbound
- `call_logs` — insert on inbound, update on status and tool execution
- `intervention_logs` — insert on log-scam tool execution

## Integration Points with Other Agents
- **→ Agent 2:** POST `/api/intelligence/summarize` and `/api/intelligence/mood` (fire on call end)
- **ElevenLabs Natively Handles:** Intent routing, transcripts, 3-Loop Rule evaluation, and scam detection via system prompts and tools.
