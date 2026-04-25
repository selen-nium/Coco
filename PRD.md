# Comprehensive Product Requirements Document: Coco (Elderly Care Voice Assistant)

## 1. Executive Summary & Vision
**Product Name:** Coco
**Vision:** To bridge the digital divide for the elderly through intuitive, conversational AI, while providing peace of mind and real-time monitoring for their caretakers.

**Core Value Proposition:** Coco acts as an empathetic, patient, and highly accessible voice assistant that users interact with simply by making a standard phone call. It guides elderly users step-by-step through complex digital workflows (like navigating a smartphone, using online banking, or setting up a smart TV). Concurrently, it functions as an active safety monitor, running real-time transcript analysis to detect scams, cognitive distress, or extreme frustration, immediately escalating issues to designated caretakers via SMS and live dashboard alerts.

## 2. Target Demographics & Use Cases
### 2.1 Primary Users (The Elderly)
*   **Profile:** Individuals aged 70+, who may struggle with touch interfaces, tiny text, or the rapid pace of technological change.
*   **Needs:** Requires high-patience interactions, repeated instructions, simple metaphors for complex tech concepts, and a familiar interface (a standard PSTN phone call).
*   **Pain Points:** Fear of scams, anxiety around "breaking" technology, feeling like a burden to family members when asking for tech support.

### 2.2 Secondary Users (The Caretakers)
*   **Profile:** Adult children or professional caregivers.
*   **Needs:** Needs to know their elderly loved one is safe from predators, wants insights into their cognitive state (confusion/frustration levels), and wants the ability to customize the AI's behavior to best suit the elderly person's personality.

## 3. Core Feature Set
1.  **Standard Telephony Interface:** No apps to install for the elderly user; they simply dial a phone number.
2.  **Conversational AI Guidance:** Real-time, ultra-low-latency voice interaction that feels like talking to a patient human.
3.  **Semantic Intent Routing:** The system listens to the user's initial problem and automatically fetches the correct step-by-step instructional "flow" from the database using vector embeddings.
4.  **"Metaphor Mode":** An adjustable setting where the AI translates technical jargon into physical world analogies (e.g., "Think of this app like a filing cabinet").
5.  **The "3-Loop" Escalation Rule:** If a user fails a single step three times in a row, the AI gracefully stops the flow, logs the failure, and alerts the caretaker to prevent severe frustration.
6.  **Real-Time Scam Detection:** Asynchronous processing of the user's speech to detect phishing, social engineering, or financial scams, triggering immediate alerts.
7.  **Post-Call Mood Analysis:** Every call generates a sentiment, frustration, and confusion score to help caretakers track cognitive trends over time.

## 4. System Architecture & Tech Stack
Coco utilizes a modern, serverless Next.js architecture orchestrated to manage multiple third-party API integrations.

*   **Framework:** **Next.js (App Router)**. Chosen for its ability to seamlessly blend React front-end dashboard components with robust backend API routes that handle webhooks.
*   **Telephony:** **Twilio**. Manages PSTN inbound/outbound calls, TwiML generation, and SMS notifications.
*   **Conversational AI:** **ElevenLabs (Conversational AI / Agents)**. Handles the actual voice synthesis (TTS), speech recognition (STT), and native LLM prompting via WebSockets. It executes custom Next.js endpoints as "Agent Tools."
*   **Intelligence Engine:** **Google Gemini (2.5 Flash)**. Selected for its speed and cost-effectiveness. It provides `text-embedding-004` for intent routing, and `gemini-2.5-flash` for async scam analysis and mood summarization.
*   **Database & Auth:** **Supabase**. Provides PostgreSQL. Crucially utilizes the `pgvector` extension for semantic similarity searches on "Flows", Supabase Auth for caretaker login, and Supabase Realtime to push live scam alerts to the React dashboard.

## 5. The Multi-Agent Ecosystem
To manage complexity, the backend is logically partitioned into three isolated "Agents", each with specific responsibilities and file ownership.

### 5.1 Agent 1: Voice & Telephony Pipeline
**Role:** The bridge between Twilio's PSTN network and ElevenLabs' WebSocket infrastructure.
**Key Responsibilities:**
*   **`/api/voice/inbound`:** Receives the initial Twilio webhook. Looks up the caller's phone number in `elderly_users`, fetches their specific `agent_configs`, and returns a TwiML `<Connect><Stream>` response pointing to ElevenLabs. It passes dynamic variables (like the user's name and metaphor mode) as JSON in the stream parameters.
*   **`/api/voice/status`:** Handles the call-completion webhook from Twilio to log the final duration and trigger Agent 2's post-call analysis.
*   **Agent Tools (`/api/tools/*`):** Exposes webhooks that ElevenLabs calls natively:
    *   `/api/tools/escalate`: Marks a call as needing human intervention.
    *   `/api/tools/log-scam`: Injects an intervention log when the AI detects a scam attempt.
    *   `/api/tools/send-sms`: Dispatches an SMS via Twilio to the caretaker.

### 5.2 Agent 2: Intelligence Layer
**Role:** The analytical brain that operates on transcripts and states, separated from the real-time voice latency path.
**Key Responsibilities:**
*   **Intent Routing (`/api/intelligence/intent`):** Converts the user's stated problem into a vector embedding and runs a Supabase RPC (`match_flow`) to find the most relevant set of instructions.
*   **Scam Detection (`/api/intelligence/scam-alert`):** A fire-and-forget route that analyzes chunks of the user's transcript against a Gemini prompt designed to catch social engineering.
*   **Post-Call Analysis (`/api/intelligence/summarize` & `/api/intelligence/mood`):** Compiles the full transcript after the call ends to generate a concise 2-sentence summary and calculate float values (0.0 to 1.0) for sentiment, frustration, and confusion metrics.
*   **Flow Embedding (`/api/intelligence/embed-flow`):** Generates vector embeddings when caretakers create new instructional flows via the dashboard.

### 5.3 Agent 3: Dashboard & Frontend
**Role:** The Caretaker Management Portal built with React and Tailwind CSS.
**Key Responsibilities:**
*   **Auth (`/auth/login`, `/auth/signup`):** Standard Supabase authentication flows.
*   **User Management:** Linking elderly users via a Twilio SMS verification code loop (`/api/dashboard/elderly/verify`).
*   **Configuration UI:** A dashboard to adjust Coco's personality (Voice ID, TTS Speed, Repetition Level, and Metaphor Mode) which syncs to the `agent_configs` table.
*   **Live Monitoring:** A React component subscribed to `scam_alerts` via Supabase Realtime that flashes a red banner with a "Call User Now" button if a scam is detected mid-call.
*   **Flow Management:** A CRUD interface for caretakers to define the step-by-step JSON instructions the AI uses to guide the elderly user.

## 6. Comprehensive User Journeys

### 6.1 Onboarding & Setup Flow
1.  **Caretaker Signup:** The caretaker registers on the web app. A row is created in `caretakers`.
2.  **Elderly Linking:** The caretaker inputs the elderly user's name and phone number. The system generates a 6-digit code and creates an unverified row in `elderly_users`.
3.  **SMS Verification:** Twilio sends the 6-digit code to the elderly user's phone.
4.  **Confirmation:** The elderly user replies with the code. The `/api/voice/sms` webhook validates it, sets `verified = true`, and links them to the caretaker.
5.  **Agent Configuration:** The caretaker navigates to `/dashboard/config` and adjusts Coco's voice speed and enables "Metaphor Mode". This upserts `agent_configs`.

### 6.2 The Inbound Call & Guidance Loop
1.  **Connection:** The elderly user dials the Twilio number.
2.  **Lookup:** `/api/voice/inbound` fires. The system identifies the user by their caller ID, looks up their `agent_configs`, and creates a new `call_logs` entry (status: `in_progress`).
3.  **WebSocket Handoff:** Twilio connects to ElevenLabs. The ElevenLabs system prompt is populated with dynamic variables (`{{user_name}}`, `{{metaphor_mode}}`, `{{caretaker_phone}}`, `{{call_sid}}`).
4.  **Greeting & Intent:** Coco greets the user: "Hi Martha, it's Coco. How can I help you today?" Martha says: "I can't figure out how to see my bank balance."
5.  **Guidance:** The system matches this to the "Online Banking" flow. Coco begins walking Martha through the steps.
6.  **The 3-Loop Rule:** Martha gets stuck on step 2 (finding the login button). After Martha expresses confusion three times, ElevenLabs triggers the `escalate` tool.
7.  **Escalation:** The `/api/tools/escalate` route updates the `call_logs` status to `escalated`. Coco says, "I understand this is tricky, Martha. Let's take a break. I'll make a note for your son to help you with this later."

### 6.3 The Scam Detection Safety Loop
1.  **Trigger:** During a call, Martha mentions: "I just got an email saying my grandson is in jail and needs gift cards."
2.  **Detection:** ElevenLabs' native system prompt (or Agent 2's async webhook) recognizes the high-risk keywords.
3.  **Action:** The AI triggers the `log_scam` tool.
4.  **Logging:** `/api/tools/log-scam` inserts a row into `intervention_logs` and `scam_alerts` (severity: `critical`).
5.  **Alerting Caretaker (SMS):** The `send-sms` tool or backend logic immediately texts the caretaker: "[URGENT] Possible scam detected during Martha's call...".
6.  **Alerting Caretaker (Web):** The caretaker's dashboard receives the Supabase Realtime event and flashes a full-screen warning.
7.  **Protecting User:** Coco firmly instructs Martha: "Martha, please do not buy any gift cards. This sounds like a scam. Please hang up and call your son immediately."

## 7. Data Model & Schema Details (Supabase PostgreSQL)

| Table | Purpose | Key Columns | Relationships |
| :--- | :--- | :--- | :--- |
| **`caretakers`** | Stores account info for the web dashboard users. | `id`, `auth_user_id`, `name`, `phone`, `email` | Links to Supabase Auth `users` table. |
| **`elderly_users`** | Stores the profile and verification status of the end-users. | `id`, `caretaker_id`, `name`, `phone`, `verified`, `verification_code` | Belongs to `caretakers`. |
| **`agent_configs`** | 1-to-1 settings for how Coco interacts with an elderly user. | `elderly_user_id`, `elevenlabs_voice_id`, `tts_speed`, `repetition_level`, `metaphor_mode` | Belongs to `elderly_users`. |
| **`ingested_flows`** | Step-by-step instructional guides. | `id`, `caretaker_id`, `name`, `app`, `steps` (JSONB), `embedding` (vector 1536) | Created globally or per `caretaker`. |
| **`call_logs`** | The master record of a phone interaction. | `id`, `elderly_user_id`, `twilio_call_sid`, `flow_id`, `status` (enum), `duration_seconds`, `summary` | Belongs to `elderly_users`. References `ingested_flows`. |
| **`call_transcripts`** | Individual utterance chunks for analysis. | `call_log_id`, `speaker` ('agent'/'user'), `text`, `timestamp` | Belongs to `call_logs`. |
| **`intervention_logs`** | Records when the AI had to intervene (3-loop, scam). | `call_log_id`, `type` (enum), `metadata` (JSONB) | Belongs to `call_logs`. |
| **`scam_alerts`** | High-priority active threat table for dashboard alerts. | `call_log_id`, `elderly_user_id`, `detected_keywords` (array), `severity`, `status` | Belongs to `call_logs` and `elderly_users`. |
| **`mood_metrics`** | Post-call analysis of the user's emotional state. | `call_log_id`, `elderly_user_id`, `sentiment_score` (float), `frustration_level` (float), `confusion_level` (float) | Belongs to `call_logs` and `elderly_users`. |

## 8. Security, Safety, and Latency Considerations
*   **Latency Mitigation:** Twilio to ElevenLabs WebSocket connection minimizes conversational delay. Heavy operations (like Gemini scam detection and summarization) are strictly asynchronous and decoupled from the real-time audio stream.
*   **Data Privacy:** Transcripts and call logs contain sensitive user data and are protected by Supabase Row Level Security (RLS) ensuring caretakers can only access data linked to their specific `elderly_users`.
*   **Prompt Injection Protection:** The system prompts enforce a strict boundary; the AI is instructed to ignore any user requests to "ignore previous instructions" and prioritize the safety loop above all other tasks.

## 9. Future Enhancements (Out of Scope for V1)
*   **Visual Aid Dispatch:** Sending MMS images to the user's phone to visually guide them through a step.
*   **Live Call Barging:** Allowing the caretaker to click a button on the dashboard to instantly bridge into the ongoing Twilio call.
*   **Proactive Wellness Calls:** Coco initiating outbound calls to the elderly user at scheduled times to check in on their day.