# Agent 1 — Voice & Telephony Pipeline (ElevenLabs Edition)

## Mission
Wire up the end-to-end phone call using the ElevenLabs Agents API. Twilio handles the telephony, and your Next.js app handles the inbound webhook to route the call to ElevenLabs. You are also responsible for providing the core "Client Tools" (webhooks) that the AI uses to interact with the database and the caretaker...

## Files You Own
```
app/api/voice/inbound/route.ts   ← Entry point (Twilio)
app/api/voice/status/route.ts    ← Cleanup/Log duration (Twilio)
app/api/voice/sms/route.ts       ← Caretaker linking logic
app/api/tools/escalate/route.ts  ← Tool for AI to flag frustration
app/api/tools/log-scam/route.ts  ← Tool for AI to log threats
app/api/tools/send-sms/route.ts  ← Tool for AI to message caretaker
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
These are POST endpoints that ElevenLabs calls mid-conversation.
- **Escalate:** Updates `call_logs.status = 'escalated'`.
- **Log Scam:** Inserts into `intervention_logs` with type `scam`.
- **Send SMS:** Dispatches a Twilio message to the caretaker's phone.

### 3. Twilio Status Cleanup (`/api/voice/status`)
Twilio fires this when the physical phone line closes.
1. Update `call_logs`: `ended_at`, `duration_seconds`, and `status` (completed/dropped).
2. **Note:** Post-call analysis (summaries/transcripts) is handled separately by Agent 2's ElevenLabs webhook.

### 4. SMS Verification (`/api/voice/sms`)
Handle the 6-digit code loop to verify new elderly users and link them to caretakers.

---

## ElevenLabs Integration
- **System Prompt:** You will configure the Agent's instructions on the ElevenLabs dashboard.
- **Tools:** Register your `/api/tools/*` URLs as "Client Tools" in the ElevenLabs dashboard.
- **Dynamic Variables:** Ensure the LLM instructions use `{{user_name}}` and `{{recent_history}}` to personalize the greeting.
