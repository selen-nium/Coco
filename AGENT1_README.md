# Agent 1 — Voice & Telephony Pipeline (ElevenLabs Edition)

## Mission
Wre up te end-to-end phone call using the ElevenLabs Agents API. Twilio handles the telephony, and your Next.js app handles the inbound webhook to route the call to ElevenLabs. You are also responsible for providing the core Server Tools (webhooks) that the AI uses to interact with the database and the caretaker.

## Files You Own
```
app/api/voice/inbound/route.ts            ← Entry point (Twilio)
app/api/voice/status/route.ts             ← Cleanup/Log duration (Twilio)
app/api/voice/sms/route.ts                ← Caretaker linking logic
app/api/tools/escalate/1route.ts           ← Server Tool: AI flags frustration
app/api/tools/log-scam/route.ts           ← Server Tool: AI manually logs a threat
app/api/tools/get-user-context/route.ts   ← Server Tool: fetch elderly_users + agent_configs fields at call start
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
3. **Fetch Immediate Memory:** Query the last 3 `call_logs` for this user. Concatenate their `summary` fields into a `recent_his1tory` stri1ng.
4. **Return TwiML:** Use `<Connect><Stream>` to link to ElevenLabs. 
   - **Crucial:** Pass `call_log_id`, `elderly_user_id`, `user_name`, and `recent_history` as JSON in the `<Parameter name="dynamic_variables" ... />` tag.

### 2. Core Agent Tools (`/api/tools/*`)
These are POST endpoints registered as Server Tools in the ElevenLabs dashboard. ElevenLabs calls them mid-conversation.

- **Escalate** (`/api/tools/escalate`): Updates `call_logs.status = 'escalated'`.
- **Log Scam** (`/api/tools/log-scam`): Inserts into `intervention_logs` with type `scam` and creates/updates the dashboard-visible `scam_alerts` state. Used when the AI manually flags a threat.

### 3. Context Server Tool (`/api/tools/get-user-context`)
Register this as a Server Tool that ElevenLabs calls at the very start of each conversation.

**`/api/tools/get-user-context`**
- Input: `{ elderly_user_id: string }` — ElevenLabs passes this from the `dynamic_variables` set in the inbound TwiML.
- Action: Fetch the `elderly_users` row + their `agent_configs` row.
- Output:
  ```ts
  {
    name: string;
    agent_config: {
      elevenlabs_voice_id: string;
      tts_speed: number;
      repetition_level: number;
      metaphor_mode: boolean;
      allow_sensitive_flows: boolean;
    };
  }
  ```
- The ElevenLabs agent uses `name` from `elderly_users.name` and configuration values from `agent_configs`.

### 4. Twilio Status Cleanup (`/api/voice/status`)
Twilio fires this when the physical phone line closes.
1. Update `call_logs`: `ended_at`, `duration_seconds`, and `status` (completed/dropped).
2. **Note:** Post-call analysis (summaries/transcripts) is handled separately by Agent 2's ElevenLabs webhook.

### 5. SMS Verification (`/api/voice/sms`)
Handle the 6-digit code loop to verify new elderly users and link them to caretakers.

---

## ElevenLabs Integration
- **System Prompt:** Configure the Agent's base instructions on the ElevenLabs dashboard.
- **Server Tools:** Register all `/api/tools/*` URLs as Server Tools in the ElevenLabs dashboard. Mark `get-user-context` to run at conversation start if that trigger is available in the chosen workflow shape.
- **Dynamic Variables:** The inbound TwiML must pass `elderly_user_id` and `call_log_id` in `<Parameter name="dynamic_variables" />` so every Server Tool can identify the user without an extra lookup.
- **Do not** hardcode user name in dynamic variables — fetch live context through `get-user-context`.
- **Intent-specific instructions** are not owned here; ElevenLabs should call Agent 2's intent tools after the user states a task.
- **Per-user behavioral instructions:** there is no `agent_configs.custom_instructions` column in the current schema, so this route should only return fields that actually exist today.
