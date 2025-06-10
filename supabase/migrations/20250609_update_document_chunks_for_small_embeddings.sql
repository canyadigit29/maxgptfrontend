-- Migration: Update document_chunks for OpenAI text-embedding-3-small (1536 dims)

-- Drop and recreate the openai_embedding column if needed
ALTER TABLE document_chunks DROP COLUMN IF EXISTS openai_embedding;
ALTER TABLE document_chunks ADD COLUMN openai_embedding vector(1536);

-- Add or update vector index for fast ANN search
CREATE INDEX IF NOT EXISTS idx_document_chunks_openai_embedding
ON document_chunks
USING ivfflat (openai_embedding vector_cosine_ops)
WITH (lists = 100);

-- Drop and recreate the match_documents function for 1536-dim vectors
DROP FUNCTION IF EXISTS match_documents;

CREATE OR REPLACE FUNCTION match_documents(
  query_embedding vector(1536),
  user_id_filter uuid DEFAULT NULL,
  file_name_filter text DEFAULT NULL,
  description_filter text DEFAULT NULL,
  start_date timestamp DEFAULT NULL,
  end_date timestamp DEFAULT NULL,
  match_threshold float DEFAULT 0.3,
  match_count int DEFAULT 20
)
RETURNS TABLE (
  id uuid,
  file_id uuid,
  content text,
  tokens int,
  similarity float,
  score float
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    id,
    file_id,
    content,
    tokens,
    1 - (openai_embedding <=> query_embedding) AS similarity,
    1 - (openai_embedding <=> query_embedding) AS score
  FROM document_chunks
  WHERE (user_id_filter IS NULL OR user_id = user_id_filter)
    AND (file_name_filter IS NULL OR file_name ILIKE file_name_filter)
    AND (description_filter IS NULL OR description ILIKE description_filter)
    AND (start_date IS NULL OR created_at >= start_date)
    AND (end_date IS NULL OR created_at <= end_date)
    AND (openai_embedding <=> query_embedding) >= match_threshold
  ORDER BY openai_embedding <=> query_embedding
  LIMIT match_count;
END;
$$ LANGUAGE plpgsql;
