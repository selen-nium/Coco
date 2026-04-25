# Agent 2 — Intelligence Layer (ElevenLabs Edition)

## Mission
Act as the "Brain" for the ElevenLabs Agent. You own all AI-powered reasoning: semantic memory retrieval, intent matching, flow lookup, and real-time scam detection. You expose these capabilities as **Client Tools** that ElevenLabs calls mid-conversation, and as a post-call webhook for transcript embedding.

## Files You Own
```
app/api/intelligence/post-call/route.ts      ← Post-call webhook: syncs ElevenLabs data & embeds transcripts
app/api/tools/recall-memory/route.ts         ← Client Tool: semantic search over past call transcripts
app/api/tools/match-intent/route.ts          ← Client Tool: map user utterance → intent + flow
app/api/tools/detect-scam/route.ts           ← Client Tool: real-time scam analysis via Gemini
lib/gemini/client.ts                         ← embedText() + generateText() helpers
```

## Do Not Touch
- `app/api/voice/*` — Agent 1 (Telephony/Twilio)
- `app/api/tools/escalate`, `log-scam`, `send-sms`, `get-user-context`, `get-instructions` — Agent 1
- `app/api/dashboard/*` — Agent 3 (Frontend API)

---

## Tasks (implement in this order)

### 1. Gemini Client (`lib/gemini/client.ts`)
Export two helpers:
- `embedText(text: string): Promise<number[]>` — Gemini `text-embedding-004`, 1536 dimensions. Used by recall-memory, match-intent, and detect-scam.
- `generateText(prompt: string): Promise<string>` — Gemini Flash/Pro for the LLM judge in intent matching and scam analysis.

### 2. The Post-Call Webhook (`/api/intelligence/post-call`)
Configure this route to be the "Post-call webhook" in the ElevenLabs dashboard.
1. **Save ElevenLabs Summary:** ElevenLabs provides a summary in the payload. Save this directly to the `call_logs.summary` column.
2. **Save & Embed Transcript:** For each transcript chunk where `role === 'user'`:
   - Generate a vector embedding using `embedText()`.
   - Insert into `call_transcripts` table including the `embedding` vector.

### 3. Memory Retrieval Client Tool (`/api/tools/recall-memory`)
ElevenLabs calls this when the user asks about past conversations (e.g., "What was that recipe we talked about last month?").
1. **Input:** `{ query: string; elderly_user_id: string }`
2. **Action:** Embed `query` → call Supabase RPC `match_memory(query_embedding, elderly_user_id)`.
3. **Output:** Return the matched text snippets so the Agent can answer accurately.

### 4. Intent Matching Client Tool (`/api/tools/match-intent`)
ElevenLabs calls this when the user states a task or goal (e.g., "I want to send money to my grandchild").
1. **Input:** `{ query: string; elderly_user_id: string }`
2. **Action:**
   - Embed `query` using `embedText()`.
   - Cosine-search the `ingested_flows` table for the closest match.
   - **If similarity ≥ threshold (0.80):** return the match directly.
   - **If similarity < threshold:** pass the top 3 candidates + original query to `generateText()` (LLM judge). Ask it to score confidence (0–1) and whether clarification is needed, and what to ask.
3. **Output:**
   ```ts
   {
     matched: boolean;
     intent_id: string | null;
     confidence: number;
     needs_clarification: boolean;
     clarification_question?: string;  // if needs_clarification
     flow?: IngestedFlow;              // full flow row if matched
   }
   ```
4. **Clarification loop:** If `needs_clarification: true`, ElevenLabs asks the user `clarification_question`, then calls this tool again with the refined query.

### 5. Scam Detection Client Tool (`/api/tools/detect-scam`)
ElevenLabs calls this periodically with recent transcript chunks during the conversation.
1. **Input:** `{ transcript_chunk: string; call_log_id: string; elderly_user_id: string }`
2. **Action:** Pass `transcript_chunk` to `generateText()` with a scam-detection prompt. Look for: urgency pressure, gift card requests, impersonation of banks/government, requests to wire money.
3. **If scam detected:** Insert a row into `scam_alerts` (triggers Agent 3's Realtime subscription automatically).
4. **Output:**
   ```ts
   { scam_detected: boolean; confidence: number; keywords: string[]; severity: "low" | "medium" | "high" | "critical" }
   ```
- **Note:** This is the *automatic* detection layer. The manual `log-scam` Client Tool (owned by Agent 1) remains for the ElevenLabs agent to explicitly flag something it noticed in the conversation.

---

## Agent 1 Integration Note (Pre-loaded Memory)
Agent 1's inbound Twilio route (`/api/voice/inbound`) fetches the last 3 call summaries from `call_logs` and injects them as `{{recent_history}}` dynamic variable. This gives instant context without a tool call. The `recall-memory` tool is for on-demand retrieval of older/specific memories during the conversation.
