# Coco — AI Phone Companion for Elderly Users

> Built at **UWB Hacks 2026** by Selen

Coco is a voice-first AI companion that lets elderly users get help with their digital lives by simply making a phone call — no app, no screen, no learning curve. Caretakers get a real-time dashboard with alerts, call history, and full personalisation controls.

---

## The Problem

Elderly people struggle with smartphones and scams. They need help navigating apps, identifying phishing calls, and staying connected — but asking family members every time creates burden and erodes their independence. Existing tools require too much technical literacy to use.

## The Solution

Coco is a dedicated phone number elderly users call whenever they need help. An AI voice agent answers, understands their intent, retrieves step-by-step instructions tailored to their device, and guides them through tasks conversationally. Meanwhile, a scam-monitoring layer flags suspicious calls and alerts caretakers instantly.

---

## How It Works

```
Elderly User → Twilio → ElevenLabs Voice Agent
                              ↓               ↓
                   Intent Understanding    Scam / Risk Monitoring
                              ↓               ↓
                   Backend Semantic Search  Live Caretaker Alert
                              ↓
                   Known Task Found?
                    Yes ↓        ↓ No
             Fetch Structured   Fallback LLM
             Instructions       Help
             (Supabase)
                    └────────────┘
                              ↓
                   Step-by-Step Voice Guidance
                              ↓
                   Call Summary + Memory → Supabase
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Phone & voice routing | Twilio |
| Voice synthesis | ElevenLabs |
| Intent & scam detection | Google Gemini |
| Fallback reasoning | Anthropic Claude |
| Database & auth | Supabase |
| Frontend & API | Next.js 16 (App Router) |
| Deployment | Vercel |

---

## Features

**For the elderly user**
- Call a single number (`+1 888 870-8838`) — no app required
- Patient, conversational step-by-step guidance
- Device-aware instructions (tuned to their phone model)
- Real-time scam detection mid-call

**For the caretaker**
- Dashboard with full call history and transcripts
- Instant SMS/dashboard alerts on scam detections
- Personalise Coco's voice, pacing, and metaphor style
- Link multiple elderly users to one account

---

## Local Setup

```bash
# 1. Install dependencies
npm install

# 2. Set environment variables
cp .env.example .env.local
# Fill in: SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY,
#          TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER,
#          ELEVENLABS_API_KEY, GOOGLE_GENERATIVE_AI_API_KEY, ANTHROPIC_API_KEY

# 3. Run dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Project Structure

```
app/
  page.tsx              # Landing page
  dashboard/            # Caretaker dashboard (calls, config, alerts)
  auth/                 # Login / signup flow
  api/
    voice/              # Twilio webhooks, ElevenLabs integration
    dashboard/          # REST API for caretaker data
    intelligence/       # Scam detection, intent parsing
components/
  dashboard/            # Sidebar, charts, call cards
  ui/                   # Shared inputs, buttons, switches
```

## Try it at our platform!

<https://call-coco.vercel.app/dashboard/calls>

---

## Team

Built solo by **Selen** at UWB Hacks 2026.
