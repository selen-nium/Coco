<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

---

# Coco — Agent Work Division

Three agents work this repo in parallel. Each agent owns specific files and must not edit files owned by another agent without a comment explaining the cross-concern.

## Shared Contract (read before implementing)

**`/api/voice/transcript` payload shape** — Agent 1 produces, Agent 2 consumes:
```ts
{ call_sid: string; speaker: "agent" | "user"; text: string; timestamp: string }
```

**`/api/intelligence/intent` response shape** — Agent 2 produces, Agent 1 consumes:
```ts
{ flow_id: string | null; flow: IngestedFlow | null; similarity: number | null }
```

**Supabase Realtime** — Agent 2 writes `scam_alerts`; Agent 3 subscribes to `scam_alerts` inserts for live dashboard banners.

---

## Agent 1 — Voice & Telephony Pipeline — `AGENT1_README.md`
## Agent 2 — Intelligence Layer — `AGENT2_README.md`
## Agent 3 — Dashboard & Frontend — `AGENT3_README.md`
