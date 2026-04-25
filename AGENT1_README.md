# Agent 1 — Voice & Telephony Pipeline (ElevenLabs Edition)

## Mission
Wire up the end-to-end phone call using the ElevenLabs Agents API. Twilio handles the telephony, and your Next.js app handles the inbound webhook to route the call to ElevenLabs. You are also responsible for providing the core "Client Tools" (webhooks) that the AI uses to interact with the database and the caretaker...

## Files You Own
```
app/api/voice/inbound/route.ts            ← Entry point (Twilio)
app/api/voice/status/route.ts             ← Cleanup/Log duration (Twilio)
app/api/voice/sms/route.ts                ← Caretaker linking logic
app/api/tools/escalate/route.ts           ← Client Tool: AI flags frustration
app/api/tools/log-scam/route.ts           ← Client Tool: AI manually logs a threat
app/api/tools/send-sms/route.ts           ← Client Tool: AI messages caretaker
app/api/tools/get-user-context/route.ts   ← Client Tool: fetch name + voice config at call start
app/api/tools/get-instructions/route.ts   ← Client Tool: fetch per-user behavioral instructions
lib/twilio/client.ts
```

## Do Not Touch
- `app/api/intelligence/*` — Agent 2 (Memory & Analysis)
- `app/api/dashboard/*` — Agent 3
- `app/(dashboard)/**` — Agent 3

---

## Tasks (implement in this order)

### 1. Inbound Call & Memory Handshake (`/api/voice/inbound`)
This is the most critical route. It bridges the user to ElevenLabs and provides the AI with its initial context.
1. **Identify User:** Lookup `elderly_users` by caller ID (`From`).
2. **Create Log:** Insert `call_logs` entry (status: `in_progress`).
3. **Fetch Immediate Memory:** Query the last 3 `call_logs` for this user. Concatenate their `summary` fields into a `recent_history` stri1ng.
4. **Return TwiML:** Use `<Connect><Stream>` to link to ElevenLabs. 
   - **Crucial:** Pass `call_log_id`, `elderly_user_id`, `user_name`, and `recent_history` as JSON in the `<Parameter name="dynamic_variables" ... />` tag.

### 2. Core Agent Tools (`/api/tools/*`)
These are POST endpoints registered as **Client Tools** in the ElevenLabs dashboard. ElevenLabs calls them mid-conversation.

- **Escalate** (`/api/tools/escalate`): Updates `call_logs.status = 'escalated'`.
- **Log Scam** (`/api/tools/log-scam`): Inserts into `intervention_logs` with type `scam`. Used when the AI manually flags a threat.
- **Send SMS** (`/api/tools/send-sms`): Dispatches a Twilio message to the caretaker's phone.

### 3. Context Client Tools (`/api/tools/get-user-context` + `/api/tools/get-instructions`)
Register both as **Client Tools** that ElevenLabs calls at the very start of each conversation (configure as "conversation start" triggers in the ElevenLabs dashboard).

**`/api/tools/get-user-context`**
- Input: `{ elderly_user_id: string }` — ElevenLabs passes this from the `dynamic_variables` set in the inbound TwiML.
- Action: Fetch the `elderly_users` row + their `agent_configs` row.
- Output: `{ name: string; voice_config: { voice_id, speed, stability } }`
- The ElevenLabs agent uses `name` in its greeting and applies `voice_config` to the session.

**`/api/tools/get-instructions`**
- Input: `{ elderly_user_id: string }`
- Action: Fetch `agent_configs.custom_instructions` for this user.
- Output: `{ instructions: string }` — a plain-text block the agent appends to its working context (e.g. "Always speak slowly. Remind about medication at the end of calls.").

### 4. Twilio Status Cleanup (`/api/voice/status`)
Twilio fires this when the physical phone line closes.
1. Update `call_logs`: `ended_at`, `duration_seconds`, and `status` (completed/dropped).
2. **Note:** Post-call analysis (summaries/transcripts) is handled separately by Agent 2's ElevenLabs webhook.

### 5. SMS Verification (`/api/voice/sms`)
Handle the 6-digit code loop to verify new elderly users and link them to caretakers.

---

## ElevenLabs Integration
- **System Prompt:** Configure the Agent's base instructions on the ElevenLabs dashboard.
- **Client Tools:** Register all `/api/tools/*` URLs as "Client Tools" in the ElevenLabs dashboard. Mark `get-user-context` and `get-instructions` as conversation-start triggers.
- **Dynamic Variables:** The inbound TwiML must pass `elderly_user_id` and `call_log_id` in `<Parameter name="dynamic_variables" />` so every Client Tool can identify the user without an extra lookup.
- **Do not** hardcode user name or instructions in dynamic variables — those are now fetched live by the Client Tools so they stay up-to-date.
