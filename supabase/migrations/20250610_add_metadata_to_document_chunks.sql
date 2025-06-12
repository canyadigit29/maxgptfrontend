-- Migration: Add/Update all columns for document_chunks to match latest schema

ALTER TABLE document_chunks
  ADD COLUMN IF NOT EXISTS id uuid,
  ADD COLUMN IF NOT EXISTS user_id uuid,
  ADD COLUMN IF NOT EXISTS created_at timestamp without time zone,
  ADD COLUMN IF NOT EXISTS content text,
  ADD COLUMN IF NOT EXISTS timestamp timestamp without time zone,
  ADD COLUMN IF NOT EXISTS file_id uuid,
  ADD COLUMN IF NOT EXISTS chunk_index integer,
  ADD COLUMN IF NOT EXISTS file_name text,
  ADD COLUMN IF NOT EXISTS embedding vector(1536), -- USER-DEFINED, legacy/optional
  ADD COLUMN IF NOT EXISTS tokens integer,
  ADD COLUMN IF NOT EXISTS local_embedding bytea,
  ADD COLUMN IF NOT EXISTS updated_at timestamp without time zone,
  ADD COLUMN IF NOT EXISTS sharing text,
  ADD COLUMN IF NOT EXISTS folder_id uuid,
  ADD COLUMN IF NOT EXISTS file_path text,
  ADD COLUMN IF NOT EXISTS type text,
  ADD COLUMN IF NOT EXISTS size integer,
  ADD COLUMN IF NOT EXISTS message_index integer,
  ADD COLUMN IF NOT EXISTS topic_id uuid,
  ADD COLUMN IF NOT EXISTS embedding_json jsonb,
  ADD COLUMN IF NOT EXISTS session_id uuid,
  ADD COLUMN IF NOT EXISTS status text,
  ADD COLUMN IF NOT EXISTS topic_name text,
  ADD COLUMN IF NOT EXISTS speaker_role text,
  ADD COLUMN IF NOT EXISTS ingested boolean,
  ADD COLUMN IF NOT EXISTS ingested_at timestamp without time zone,
  ADD COLUMN IF NOT EXISTS uploaded_at timestamp without time zone,
  ADD COLUMN IF NOT EXISTS file_content text,
  ADD COLUMN IF NOT EXISTS name text,
  ADD COLUMN IF NOT EXISTS chunk_hash text,
  ADD COLUMN IF NOT EXISTS section_header text,
  ADD COLUMN IF NOT EXISTS page_number integer,
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS openai_embedding vector(1536), -- USER-DEFINED, OpenAI embedding
  ADD COLUMN IF NOT EXISTS document_type text,
  ADD COLUMN IF NOT EXISTS meeting_year integer,
  ADD COLUMN IF NOT EXISTS meeting_month integer,
  ADD COLUMN IF NOT EXISTS meeting_month_name text,
  ADD COLUMN IF NOT EXISTS meeting_day integer,
  ADD COLUMN IF NOT EXISTS ordinance_title text,
  ADD COLUMN IF NOT EXISTS file_extension text;

-- Optionally, create indexes for faster filtering (uncomment as needed)
-- CREATE INDEX IF NOT EXISTS idx_document_chunks_document_type ON document_chunks(document_type);
-- CREATE INDEX IF NOT EXISTS idx_document_chunks_meeting_year ON document_chunks(meeting_year);
-- CREATE INDEX IF NOT EXISTS idx_document_chunks_meeting_month ON document_chunks(meeting_month);
-- CREATE INDEX IF NOT EXISTS idx_document_chunks_section_header ON document_chunks(section_header);

-- Drop the old match_documents function if it exists
DROP FUNCTION IF EXISTS public.match_documents;

-- Create the new match_documents function with metadata columns
CREATE OR REPLACE FUNCTION public.match_documents(
  query_embedding vector,
  user_id_filter uuid DEFAULT NULL,
  file_name_filter text DEFAULT NULL,
  description_filter text DEFAULT NULL,
  start_date timestamp without time zone DEFAULT NULL,
  end_date timestamp without time zone DEFAULT NULL,
  match_threshold double precision DEFAULT 0.3,
  match_count integer DEFAULT 20
)
RETURNS TABLE (
  id uuid,
  file_id uuid,
  content text,
  tokens integer,
  similarity double precision,
  score double precision,
  file_name text,
  document_type text,
  meeting_year integer,
  meeting_month integer,
  meeting_month_name text,
  meeting_day integer,
  ordinance_title text,
  file_extension text,
  section_header text,
  page_number integer,
  description text
)
LANGUAGE plpgsql
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    document_chunks.id,
    document_chunks.file_id,
    document_chunks.content,
    document_chunks.tokens,
    1 - (document_chunks.openai_embedding <=> query_embedding) AS similarity,
    1 - (document_chunks.openai_embedding <=> query_embedding) AS score,
    document_chunks.file_name,
    document_chunks.document_type,
    document_chunks.meeting_year,
    document_chunks.meeting_month,
    document_chunks.meeting_month_name,
    document_chunks.meeting_day,
    document_chunks.ordinance_title,
    document_chunks.file_extension,
    document_chunks.section_header,
    document_chunks.page_number,
    document_chunks.description
  FROM document_chunks
  WHERE (user_id_filter IS NULL OR document_chunks.user_id = user_id_filter)
    AND (file_name_filter IS NULL OR document_chunks.file_name ILIKE file_name_filter)
    AND (description_filter IS NULL OR document_chunks.description ILIKE description_filter)
    AND (start_date IS NULL OR document_chunks.created_at >= start_date)
    AND (end_date IS NULL OR document_chunks.created_at <= end_date)
    AND (document_chunks.openai_embedding <=> query_embedding) >= match_threshold
  ORDER BY document_chunks.openai_embedding <=> query_embedding
  LIMIT match_count;
END;
$function$;
