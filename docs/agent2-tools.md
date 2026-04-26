# Agent 2 Tool Contracts

## `POST /api/tools/recall-memory`
Request:
```json
{ "query": "What recipe did we discuss?", "elderly_user_id": "uuid" }
```

Response:
```json
{
  "success": true,
  "memory": "- On 4/1/2026, the user said: \"I need help with photos\"",
  "snippets": [{ "text": "I need help with photos", "timestamp": "2026-04-01T12:00:00.000Z", "similarity": 0.82 }]
}
```

## `POST /api/tools/match-intent`
Request:
```json
{ "query": "I want to check my bank balance", "elderly_user_id": "uuid" }
```

Response:
```json
{ "matched": true, "intent_id": "uuid", "confidence": 0.91, "needs_clarification": false }
```

Ambiguous response:
```json
{
  "matched": false,
  "intent_id": null,
  "confidence": 0.72,
  "needs_clarification": true,
  "clarification_question": "Are you trying to view your balance or send money?"
}
```

## `POST /api/tools/get-intent-instructions`
Request:
```json
{ "intent_id": "uuid", "elderly_user_id": "uuid" }
```

Response:
```json
{
  "id": "uuid",
  "name": "Check Bank Balance",
  "app": "Chase",
  "description": "Open the banking app and review account balance.",
  "steps": []
}
```

## `POST /api/tools/detect-scam`
Request:
```json
{
  "transcript_chunk": "They said I need to buy gift cards right now.",
  "call_log_id": "uuid",
  "elderly_user_id": "uuid"
}
```

Response:
```json
{
  "scam_detected": true,
  "confidence": 0.96,
  "keywords": ["gift cards", "urgency"],
  "severity": "critical"
}
```

## `POST /api/intelligence/embed-flow`
Request:
```json
{ "flow_id": "uuid" }
```

Response:
```json
{ "ok": true, "flow_id": "uuid" }
```

## `POST /api/intelligence/post-call`
Request body should include ElevenLabs transcript, summary, and `metadata.call_log_id`.

Response:
```json
{ "success": true }
```

## Compatibility Endpoints
- `POST /api/intelligence/summarize`
- `POST /api/intelligence/mood`

These remain available because the current Agent 1 branch still triggers them from `voice/status`.
