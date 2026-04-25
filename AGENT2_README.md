# Agent 2 — Memory Layer (ElevenLabs Edition)

## Mission
Act as the "Long-Term Librarian" for the ElevenLabs Agent. Since ElevenLabs handles real-time conversation, safety, and summarization natively, Agent 2 is strictly responsible for **transcript embedding** and **semantic memory retrieval**. This allows the AI to remember specific details from past calls across months or years.

## Files You Own
```
app/api/intelligence/post-call/route.ts      ← Syncs ElevenLabs data & generates embeddings
app/api/tools/recall-memory/route.ts         ← Tool for ElevenLabs to search old history
lib/gemini/client.ts                         ← text-embedding-004 only
```

## Do Not Touch
- `app/api/voice/*` — Agent 1 (Telephony/Twilio)
- `app/api/tools/*` — Agent 1 & 2 (Core Agent Tools)
- `app/api/dashboard/*` — Agent 3 (Frontend API)

---

## Tasks (implement in this order)

### 1. Vector Embedding Helper (`lib/gemini/client.ts`)
Ensure you have `embedText(text: string): Promise<number[]>` using Gemini's `text-embedding-004` (1536 dimensions). This powers the search engine for user history.

### 2. The Post-Call Webhook (`/api/intelligence/post-call`)
Configure this route to be the "Post-call webhook" in the ElevenLabs dashboard.
1. **Save ElevenLabs Summary:** ElevenLabs provides a summary in the payload. Save this directly to the `call_logs.summary` column.
2. **Save & Embed Transcript:** For each transcript chunk where `role === 'user'`:
   - Generate a vector embedding using `embedText()`.
   - Insert into `call_transcripts` table including the `embedding` vector.

### 3. Memory Retrieval Tool (`/api/tools/recall-memory`)
Expose this as a Client Tool in the ElevenLabs dashboard. ElevenLabs will call this if the user asks about past conversations (e.g., "What was that recipe we talked about last month?").
1. **Input:** Expects `query` (the user's question) and `elderly_user_id`.
2. **Action:** 
   - Embed the `query`.
   - Call Supabase RPC `match_memory(query_embedding, elderly_user_id)` to find the most relevant past transcript snippets.
3. **Output:** Return the text snippets to ElevenLabs so the Agent can answer accurately.


---

## Agent 1 Integration Note (Pre-loaded Memory)
1Agent 1's inbound Twilio route (`/api/voice/inbound`) should fetch the last 3 call summaries from `call_logs` and inject them into the initial ElevenLabs context as a dynamic variable (e.g., `{{recent_history}}`). This provides "instant" memory without needing a tool call.
