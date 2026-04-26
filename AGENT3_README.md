# Agent 3 — Dashboard & Frontend

## Mission
Build the caretaker web app. By the time this agent is done, a caretaker should be able to sign up, link an elderly user, configure the AI agent, view call history, and see live scam alerts in real-time

## Files You Own
```
app/(auth)/login/page.tsx         → app/auth/login/page.tsx
app/(auth)/signup/page.tsx        → app/auth/signup/page.tsx
app/dashboard/layout.tsx
app/dashboard/page.tsx
app/dashboard/alerts/page.tsx
app/dashboard/calls/page.tsx
app/dashboard/calls/[id]/page.tsx
app/dashboard/config/page.tsx
app/dashboard/flows/page.tsx
app/api/dashboard/**
components/**                      (create as needed)
```

## Do Not Touch
- `app/api/voice/*` — Agent 1
- `app/api/intelligence/*` — Agent 2 (except: you may call them via fetch)
- `lib/state/*` — Agent 1
- `lib/gemini/*` — Agent 2
- `supabase/migrations/*` — schema is frozen; do not alter

---

## Tasks (implement in this order)

### 1. Auth — Signup & Login

**`/auth/signup`**
- Form fields: Full Name, Email, Phone, Password.
- On submit: `supabase.auth.signUp({ email, password })` then immediately insert a `caretakers` row with `auth_user_id = user.id`.
- Redirect to `/dashboard` on success.

**`/auth/login`**
- Email + Password form.
- `supabase.auth.signInWithPassword({ email, password })`.
- Redirect to `/dashboard`.

Both pages should show inline validation errors. Use the Supabase browser client from `lib/supabase/client.ts`.

### 2. Middleware (already scaffolded)
`middleware.ts` is already wired. Do not touch — it redirects unauthenticated users to `/auth/login`.

### 3. API Routes — Caretaker Profile
**`/api/dashboard/caretakers/[id]`** (GET + PATCH)
- Use the Supabase server client (`lib/supabase/server.ts`).
- On GET: verify the authenticated user's `auth_user_id` matches the `caretakers.id` param.
- On PATCH: validate and update `name`, `phone`.

### 4. API Routes — Elderly User Linking
**`POST /api/dashboard/elderly`**
1. Get caretaker from session.
2. Generate a random 6-digit code.
3. Insert `elderly_users` row (`verified: false`, `verification_code: code`).
4. Send Twilio SMS to `payload.phone`: `"Your Coco verification code is: [code]. Reply with this code to link your phone."`
5. Return `{ elderly_user_id }`.

**`POST /api/dashboard/elderly/verify`**
1. Fetch `elderly_users` row by `elderly_user_id`.
2. Compare `code` to `verification_code` (case-insensitive trim).
3. If match: `verified = true`, `verification_code = null`.

**`GET /api/dashboard/elderly`**
- Return all `elderly_users` for the authenticated caretaker.

### 5. API Routes — Agent Config
**`GET/PATCH /api/dashboard/config/[elderlyId]`**
- On PATCH: upsert `agent_configs` row.
- After DB write, call `updateAgentConfig()` from `lib/elevenlabs/client.ts` to sync to ElevenLabs.

### 6. Dashboard UI — Overview (`/dashboard`)
- Fetch stats: total calls (30d), active alert count, average sentiment score (from `mood_metrics`).
- **Mood Meter chart:** Install `recharts`. Fetch `mood_metrics` ordered by `recorded_at` for the last 30 days. Render a `LineChart` with three lines: sentiment, frustration, confusion.
- **Live Alerts panel:** Subscribe to Supabase Realtime on `scam_alerts` where `status = 'active'`. Show a flashing red banner with a "Call User Now" button (`href="tel:[phone]"`).

### 7. Dashboard UI — Alerts (`/dashboard/alerts`)
- Fetch from `GET /api/dashboard/alerts?status=active`.
- List cards showing: detected keywords, severity badge (red=critical, orange=high), timestamp, elderly user name.
- Dismiss button → `PATCH /api/dashboard/alerts/[id]` with `{ status: 'dismissed' }`.
- **Supabase Realtime:** subscribe to `scam_alerts` inserts to add new alerts without a page reload.

### 8. Dashboard UI — Call History (`/dashboard/calls`)
- Paginated table from `GET /api/dashboard/calls`.
- Columns: Date, Duration, Intent/App, AI Summary, Intervention count.
- Click row → `/dashboard/calls/[id]` detail page.

**Detail page (`/dashboard/calls/[id]`):**
- Full transcript viewer (alternating agent/user bubbles).
- Intervention log timeline (type + timestamp + metadata).

### 9. Dashboard UI — Configuration (`/dashboard/config`)
- Load `GET /api/dashboard/config/[elderlyId]`.
- **Voice selector:** fetch voices from ElevenLabs via `getAgentVoices()` → render a `<select>` or card grid.
- **TTS Speed slider:** range 0.5–1.5, step 0.1.
- **Repetition Level slider:** range 1–5, step 1.
- **Metaphor Mode toggle:** boolean switch.
- **Live Test Chatbox:** text input → send to a new `/api/dashboard/test-voice` route that calls ElevenLabs TTS with current config → play the audio response in the browser via `<audio>` element.

### 10. Dashboard UI — Flows (`/dashboard/flows`)
- Table of `ingested_flows` from `GET /api/dashboard/flows`.
- **Add Flow modal:** fields for Name, App, Description, and a JSON step editor (textarea that validates JSON).
- On save: `POST /api/dashboard/flows` → on success, the route calls `POST /api/intelligence/embed-flow` (Agent 2) automatically.
- Edit and Delete inline actions.

### 11. Elderly User Linking UI
Add a "Linked Users" section to the config page or a dedicated `/dashboard/users` page:
- Show linked elderly user (name, phone, verified status).
- "Link a new user" form: Name + Phone → `POST /api/dashboard/elderly` → show "Code sent. Ask them to reply to the text."
- Manual verify input (in case the SMS webhook isn't set up yet) → `POST /api/dashboard/elderly/verify`.

---

## Component Conventions
- Use `app/` Server Components by default; add `"use client"` only when using hooks or browser APIs.
- Create shared components in `components/` (e.g., `components/ui/Button.tsx`, `components/charts/MoodChart.tsx`).
- Tailwind only — no additional CSS libraries.

## Key Env Vars
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
TWILIO_ACCOUNT_SID
TWILIO_AUTH_TOKEN
TWILIO_PHONE_NUMBER
ELEVENLABS_API_KEY
```

## Supabase Tables You Read/Write
- `caretakers` — read/update profile
- `elderly_users` — insert + verify
- `agent_configs` — upsert
- `call_logs` — read for history
- `call_transcripts` — read for detail view
- `intervention_logs` — read for detail view
- `scam_alerts` — read + dismiss
- `mood_metrics` — read for mood chart
- `ingested_flows` — CRUD

## Integration Points with Other Agents
- **→ Agent 2:** `POST /api/intelligence/embed-flow` (called from your flows CRUD after insert/update)
- **← Agent 2 (Supabase Realtime):** subscribe to `scam_alerts` inserts — rows arrive from both Agent 2's auto `detect-scam` Client Tool and Agent 1's manual `log-scam` Client Tool
- **← Agent 1 (indirect):** `call_logs`, `call_transcripts`, `intervention_logs` are written by Agent 1 during calls — you read them
