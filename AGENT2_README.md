# Agent 2 — Intelligence Layer

## Mission
Make Coco smart. Implement the intent routing (pgvector), Gemini 2.5 Flash guidance brain, async scam detection, call summarization, and mood analysis. By the time this agent is done, a matched flow should be loaded into context and scam detection should flag real threats.

## Files You Own
```
app/api/intelligence/intent/route.ts
app/api/intelligence/scam-alert/route.ts
app/api/intelligence/summarize/route.ts
app/api/intelligence/mood/route.ts
app/api/intelligence/embed-flow/route.ts
lib/gemini/client.ts
lib/gemini/prompts.ts
lib/gemini/guidance-sessions.ts   ← stores live Gemini chat sessions by call_sid
```

## Do Not Touch
- `app/api/voice/*` — Agent 1
- `app/api/dashboard/*` — Agent 3
- `app/(dashboard)/**` — Agent 3

---

## Tasks (implement in this order)

### 1. Gemini Embedding Helper
In `lib/gemini/client.ts`, add an `embedText(text: string): Promise<number[]>` function using the Gemini `text-embedding-004` model (1536 dimensions). This is called by the intent router and the flow embedder.

```ts
export async function embedText(text: string): Promise<number[]> {
  const embeddingModel = genAI.getGenerativeModel({ model: "text-embedding-004" });
  const result = await embeddingModel.embedContent(text);
  return result.embedding.values;
}
```

### 2. Intent Router (`/api/intelligence/intent`)
Called by Agent 1 on the first user utterance.

1. Parse `IntentPayload` (`call_sid`, `elderly_user_id`, `text`).
2. Call `embedText(text)` to get a 1536-dim vector.
3. Call Supabase RPC `match_flow(query_embedding, threshold=0.75, match_count=1)` — this function is defined in the migration.
4. If a match is found:
   - Fetch full `ingested_flows` row.
   - Update `call_logs.flow_id` for this call.
   - Build the Gemini 2.5 Flash guidance context using `buildGuidanceSystemPrompt()` from `lib/gemini/prompts.ts`.
   - Start a Gemini chat session: `brainModel.startChat({ history: [], systemInstruction: prompt })`.
   - Store it: `storeGuidanceSession(call_sid, chatSession)` from `lib/gemini/guidance-sessions.ts`.
     **This is the critical step** — Agent 1's `/api/voice/llm` reads this session on every ElevenLabs turn.
5. Return `IntentResult { flow_id, flow, similarity }` to Agent 1.

**Fallback:** If similarity < 0.75, return `{ flow_id: null, flow: null, similarity: null }`. Gemini falls back to general OS reasoning using the base system prompt (no flow JSON).

### 3. Scam Detection (`/api/intelligence/scam-alert`)
Called fire-and-forget by Agent 1 per user transcript chunk.

1. Only process chunks where `speaker === 'user'`.
2. Send `transcript_excerpt` to `safetyModel` (Gemini 2.5 Flash) with `SCAM_DETECTION_PROMPT` from `lib/gemini/prompts.ts`.
3. Parse the JSON response.
4. If `is_scam === true`:
   a. Insert `scam_alerts` row (`elderly_user_id`, `call_log_id`, `detected_keywords`, `severity`).
   b. Fetch caretaker phone from `elderly_users → caretakers`.
   c. Send Twilio SMS to caretaker: `"[URGENT] Possible scam detected during [Elderly Name]'s call. Keywords: [keywords]. Call them now or log in to Coco to listen."`.
   d. Update `scam_alerts.sms_sent_at`.
   e. Insert `intervention_logs` row (`type: 'scam'`, `metadata: { keywords, severity }`).
   f. Update `call_logs.status = 'escalated'`.
5. Return `{ flagged: boolean }`.

**Performance note:** This route must respond in < 200ms to avoid blocking Agent 1's fan-out loop. The Gemini call itself is async — start it immediately, and if it takes > 150ms, return `{ flagged: false }` and let the insert happen as a background promise. Use `Promise.race` or a timeout wrapper.

### 4. Call Summarization (`/api/intelligence/summarize`)
Called by Agent 1 after call ends.

1. Fetch all `call_transcripts` rows for `call_log_id`, ordered by `timestamp`.
2. Format as a dialogue string: `[Agent]: ... \n[User]: ...`
3. Send to `brainModel` (Gemini 2.5 Flash) with prompt:  
   `"Summarize this call in exactly 2 sentences. Focus on what was accomplished and any notable difficulties."`
4. Update `call_logs.summary` with the result.

### 5. Mood Calculation (`/api/intelligence/mood`)
Called by Agent 1 after call ends.

1. Fetch all `call_transcripts` where `speaker = 'user'` for `call_log_id`.
2. Concatenate user utterances.
3. Send to `brainModel` with prompt asking for JSON `{ sentiment_score, frustration_level, confusion_level }` where all values are floats between 0 and 1 (sentiment: -1 to 1).
4. Insert `mood_metrics` row.

### 6. Flow Embedding (`/api/intelligence/embed-flow`)
Called by Agent 3's flow CRUD routes when a flow is created or updated.

1. Fetch `ingested_flows` row by `flow_id`.
2. Embed `${flow.name} ${flow.description} ${flow.app}` using `embedText()`.
3. Update `ingested_flows.embedding` column with the resulting vector.

---

## Gemini 2.5 Flash Notes
- **Brain model** (`brainModel`): used for intent-guided step narration, summarization, and mood scoring.
- **Safety model** (`safetyModel`): same model, separate instance, used only for scam detection — keeps safety concerns isolated from the guidance context.
- Both use `gemini-2.5-flash` from `@google/generative-ai`.
- Use `startChat()` for the guidance session (stateful multi-turn); use `generateContent()` for one-shot scam detection and summarization.

## Key Env Vars
```
GOOGLE_AI_API_KEY
NEXT_PUBLIC_SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
TWILIO_ACCOUNT_SID
TWILIO_AUTH_TOKEN
TWILIO_PHONE_NUMBER
```

## Supabase Tables You Read/Write
- `ingested_flows` — read for intent match, update embedding
- `call_logs` — update flow_id, summary, status
- `call_transcripts` — read for summarize + mood
- `scam_alerts` — insert on detection
- `intervention_logs` — insert on scam detection
- `mood_metrics` — insert after call

## Supabase RPC You Call
- `match_flow(query_embedding, match_threshold, match_count)` — defined in `supabase/migrations/001_initial_schema.sql`

### SSE Streaming helper (for `/api/voice/llm`)

Agent 1 owns the `/api/voice/llm` route but needs a streaming formatter. Write this utility in `lib/gemini/guidance-sessions.ts` so Agent 1 can import it:

```ts
export async function streamGeminiToOpenAI(
  session: ChatSession,
  userMessage: string,
  onChunk: (chunk: string) => void
): Promise<void> {
  const result = await session.sendMessageStream(userMessage);
  for await (const chunk of result.stream) {
    const text = chunk.text();
    if (text) onChunk(text);
  }
}
```

Agent 1 uses this in `/api/voice/llm` to write SSE tokens to the response stream in OpenAI format:
```
data: {"choices":[{"delta":{"content":"<token>"}}]}\n\n
data: [DONE]\n\n
```

Also call `deleteGuidanceSession(call_sid)` at call end (Agent 1 triggers this from `/api/voice/status`).

---

## Integration Points with Other Agents
- **← Agent 1:** receives `POST /api/intelligence/intent`, `/api/intelligence/scam-alert`, `/api/intelligence/summarize`, `/api/intelligence/mood`
- **→ Agent 1:** returns `IntentResult` from `/api/intelligence/intent`
- **→ Agent 1 (shared memory):** `storeGuidanceSession(call_sid, session)` — Agent 1 reads this each turn via `getGuidanceSession()` in `/api/voice/llm`
- **→ Agent 3 (Supabase Realtime):** `scam_alerts` insert triggers Agent 3's dashboard live banner — no direct API call needed, Supabase handles the event push
- **← Agent 3:** receives `POST /api/intelligence/embed-flow` when Agent 3 creates/updates a flow
