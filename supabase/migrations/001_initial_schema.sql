-- Enable pgvector
create extension if not exists vector;

-- Caretakers (linked to Supabase Auth users)
create table caretakers (
  id              uuid primary key default gen_random_uuid(),
  auth_user_id    uuid not null references auth.users(id) on delete cascade,
  name            text not null,
  email           text not null unique,
  phone           text not null,
  created_at      timestamptz not null default now()
);

-- Elderly users
create table elderly_users (
  id                  uuid primary key default gen_random_uuid(),
  caretaker_id        uuid not null references caretakers(id) on delete cascade,
  name                text not null,
  phone               text not null unique,
  verified            boolean not null default false,
  verification_code   text,
  created_at          timestamptz not null default now()
);

-- Agent configuration per elderly user
create table agent_configs (
  id                      uuid primary key default gen_random_uuid(),
  elderly_user_id         uuid not null unique references elderly_users(id) on delete cascade,
  elevenlabs_voice_id     text not null default 'default',
  tts_speed               float not null default 1.0 check (tts_speed between 0.5 and 1.5),
  repetition_level        int not null default 2 check (repetition_level between 1 and 5),
  metaphor_mode           boolean not null default false,
  allow_sensitive_flows   boolean not null default false,
  updated_at              timestamptz not null default now()
);

-- Ingested step-by-step flows (global or caretaker-specific)
create table ingested_flows (
  id              uuid primary key default gen_random_uuid(),
  caretaker_id    uuid references caretakers(id) on delete cascade,  -- null = global/admin
  name            text not null,
  app             text not null,
  description     text not null,
  steps           jsonb not null default '[]',
  embedding       vector(1536),
  created_at      timestamptz not null default now()
);

-- Visual aids stored in Supabase Storage, referenced per flow step
create table flow_visual_aids (
  id              uuid primary key default gen_random_uuid(),
  flow_id         uuid not null references ingested_flows(id) on delete cascade,
  step_index      int not null,
  image_url       text not null,
  description     text not null
);

-- Call logs
create table call_logs (
  id                  uuid primary key default gen_random_uuid(),
  elderly_user_id     uuid not null references elderly_users(id) on delete cascade,
  twilio_call_sid     text not null unique,
  flow_id             uuid references ingested_flows(id) on delete set null,
  intent_text         text,
  started_at          timestamptz not null default now(),
  ended_at            timestamptz,
  duration_seconds    int,
  summary             text,
  status              text not null default 'in_progress'
    check (status in ('in_progress', 'completed', 'dropped', 'escalated'))
);

-- Transcript chunks with embeddings for mood analysis
create table call_transcripts (
  id              uuid primary key default gen_random_uuid(),
  call_log_id     uuid not null references call_logs(id) on delete cascade,
  speaker         text not null check (speaker in ('agent', 'user')),
  text            text not null,
  embedding       vector(1536),
  timestamp       timestamptz not null default now()
);

-- Intervention events during calls
create table intervention_logs (
  id              uuid primary key default gen_random_uuid(),
  call_log_id     uuid not null references call_logs(id) on delete cascade,
  type            text not null
    check (type in ('3-loop', 'visual-aid', 'scam', 'silence', 'state-drift')),
  step_index      int,
  metadata        jsonb not null default '{}',
  triggered_at    timestamptz not null default now()
);

-- Scam alerts
create table scam_alerts (
  id                  uuid primary key default gen_random_uuid(),
  call_log_id         uuid not null references call_logs(id) on delete cascade,
  elderly_user_id     uuid not null references elderly_users(id) on delete cascade,
  detected_keywords   text[] not null default '{}',
  severity            text not null check (severity in ('high', 'critical')),
  sms_sent_at         timestamptz,
  status              text not null default 'active' check (status in ('active', 'dismissed')),
  dismissed_by        uuid references caretakers(id) on delete set null,
  created_at          timestamptz not null default now()
);

-- Mood metrics per call
create table mood_metrics (
  id                  uuid primary key default gen_random_uuid(),
  elderly_user_id     uuid not null references elderly_users(id) on delete cascade,
  call_log_id         uuid not null references call_logs(id) on delete cascade,
  sentiment_score     float not null check (sentiment_score between -1.0 and 1.0),
  frustration_level   float not null check (frustration_level between 0.0 and 1.0),
  confusion_level     float not null check (confusion_level between 0.0 and 1.0),
  recorded_at         timestamptz not null default now()
);

-- Indexes
create index on elderly_users (caretaker_id);
create index on call_logs (elderly_user_id, started_at desc);
create index on call_transcripts (call_log_id, timestamp);
create index on scam_alerts (elderly_user_id, status);
create index on mood_metrics (elderly_user_id, recorded_at desc);

-- pgvector indexes for similarity search
create index on ingested_flows using ivfflat (embedding vector_cosine_ops) with (lists = 100);
create index on call_transcripts using ivfflat (embedding vector_cosine_ops) with (lists = 100);

-- RPC: semantic flow matching (used by Agent 2 intent router)
create or replace function match_flow(
  query_embedding vector(1536),
  match_threshold float default 0.75,
  match_count     int default 1
)
returns table (
  id          uuid,
  name        text,
  app         text,
  description text,
  steps       jsonb,
  similarity  float
)
language sql stable
as $$
  select
    id, name, app, description, steps,
    1 - (embedding <=> query_embedding) as similarity
  from ingested_flows
  where 1 - (embedding <=> query_embedding) > match_threshold
  order by embedding <=> query_embedding
  limit match_count;
$$;
