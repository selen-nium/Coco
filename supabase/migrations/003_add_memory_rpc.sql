create or replace function match_memory(
  query_embedding vector(1536),
  elderly_id      uuid,
  match_threshold float default 0.70,
  match_count     int default 5
)
returns table (
  text        text,
  timestamp   timestamptz,
  similarity  float
)
language sql stable
as $$
  select
    t.text,
    t.timestamp,
    1 - (t.embedding <=> query_embedding) as similarity
  from call_transcripts t
  join call_logs l on t.call_log_id = l.id
  where l.elderly_user_id = elderly_id
    and t.embedding is not null
    and 1 - (t.embedding <=> query_embedding) > match_threshold
  order by t.embedding <=> query_embedding
  limit match_count;
$$;
