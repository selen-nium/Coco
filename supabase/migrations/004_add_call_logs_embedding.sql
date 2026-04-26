-- Add embedding column to call_logs for summary-based RAG
alter table call_logs
  add column if not exists embedding vector(1536);

-- Create index for faster similarity search
create index on call_logs using ivfflat (embedding vector_cosine_ops) with (lists = 100);

-- RPC: semantic search over call summaries
create or replace function match_call_summaries(
  query_embedding vector(1536),
  elderly_id      uuid,
  match_threshold float default 0.5,
  match_count     int default 3
)
returns table (
  summary     text,
  started_at  timestamptz,
  similarity  float
)
language sql stable
as $$
  select
    summary,
    started_at,
    1 - (embedding <=> query_embedding) as similarity
  from call_logs
  where elderly_user_id = elderly_id
    and summary is not null
    and embedding is not null
    and 1 - (embedding <=> query_embedding) > match_threshold
  order by embedding <=> query_embedding
  limit match_count;
$$;
