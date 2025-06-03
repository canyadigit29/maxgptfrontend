-- Hardcode similarity threshold for file_items retrieval to 0.8

create or replace function match_file_items_local (
  query_embedding vector(384),
  match_count int DEFAULT null,
  file_ids UUID[] DEFAULT null
) returns table (
  id UUID,
  file_id UUID,
  content TEXT,
  tokens INT,
  similarity float
)
language plpgsql
as $$
#variable_conflict use_column
begin
  return query
  select
    id,
    file_id,
    content,
    tokens,
    1 - (file_items.local_embedding <=> query_embedding) as similarity
  from file_items
  where (file_id = ANY(file_ids))
    and 1 - (file_items.local_embedding <=> query_embedding) >= 0.8
  order by file_items.local_embedding <=> query_embedding
  limit match_count;
end;
$$;

create or replace function match_file_items_openai (
  query_embedding vector(1536),
  match_count int DEFAULT null,
  file_ids UUID[] DEFAULT null
) returns table (
  id UUID,
  file_id UUID,
  content TEXT,
  tokens INT,
  similarity float
)
language plpgsql
as $$
#variable_conflict use_column
begin
  return query
  select
    id,
    file_id,
    content,
    tokens,
    1 - (file_items.openai_embedding <=> query_embedding) as similarity
  from file_items
  where (file_id = ANY(file_ids))
    and 1 - (file_items.openai_embedding <=> query_embedding) >= 0.8
  order by file_items.openai_embedding <=> query_embedding
  limit match_count;
end;
$$;
