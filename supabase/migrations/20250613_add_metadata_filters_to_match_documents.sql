-- Migration: Add metadata filter arguments to match_documents function for search

DROP FUNCTION IF EXISTS public.match_documents;

CREATE OR REPLACE FUNCTION public.match_documents(
  query_embedding vector,
  user_id_filter uuid DEFAULT NULL,
  file_name_filter text DEFAULT NULL,
  description_filter text DEFAULT NULL,
  start_date timestamp without time zone DEFAULT NULL,
  end_date timestamp without time zone DEFAULT NULL,
  meeting_year integer DEFAULT NULL,
  meeting_month integer DEFAULT NULL,
  meeting_month_name text DEFAULT NULL,
  meeting_day integer DEFAULT NULL,
  document_type text DEFAULT NULL,
  ordinance_title text DEFAULT NULL,
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
    AND (meeting_year IS NULL OR document_chunks.meeting_year = meeting_year)
    AND (meeting_month IS NULL OR document_chunks.meeting_month = meeting_month)
    AND (meeting_month_name IS NULL OR document_chunks.meeting_month_name ILIKE meeting_month_name)
    AND (meeting_day IS NULL OR document_chunks.meeting_day = meeting_day)
    AND (document_type IS NULL OR document_chunks.document_type ILIKE document_type)
    AND (ordinance_title IS NULL OR document_chunks.ordinance_title ILIKE ordinance_title)
    AND (document_chunks.openai_embedding <=> query_embedding) >= match_threshold
  ORDER BY document_chunks.openai_embedding <=> query_embedding
  LIMIT match_count;
END;
$function$;
