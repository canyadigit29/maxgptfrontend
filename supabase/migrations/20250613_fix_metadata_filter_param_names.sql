-- Migration: Fix duplicate parameter names in match_documents function

DROP FUNCTION IF EXISTS public.match_documents;

CREATE OR REPLACE FUNCTION public.match_documents(
  query_embedding vector,
  user_id_filter uuid DEFAULT NULL,
  file_name_filter text DEFAULT NULL,
  description_filter text DEFAULT NULL,
  start_date timestamp without time zone DEFAULT NULL,
  end_date timestamp without time zone DEFAULT NULL,
  filter_meeting_year integer DEFAULT NULL,
  filter_meeting_month integer DEFAULT NULL,
  filter_meeting_month_name text DEFAULT NULL,
  filter_meeting_day integer DEFAULT NULL,
  filter_document_type text DEFAULT NULL,
  filter_ordinance_title text DEFAULT NULL,
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
    AND (filter_meeting_year IS NULL OR document_chunks.meeting_year = filter_meeting_year)
    AND (filter_meeting_month IS NULL OR document_chunks.meeting_month = filter_meeting_month)
    AND (filter_meeting_month_name IS NULL OR document_chunks.meeting_month_name ILIKE filter_meeting_month_name)
    AND (filter_meeting_day IS NULL OR document_chunks.meeting_day = filter_meeting_day)
    AND (filter_document_type IS NULL OR document_chunks.document_type ILIKE filter_document_type)
    AND (filter_ordinance_title IS NULL OR document_chunks.ordinance_title ILIKE filter_ordinance_title)
    AND (document_chunks.openai_embedding <=> query_embedding) >= match_threshold
  ORDER BY document_chunks.openai_embedding <=> query_embedding
  LIMIT match_count;
END;
$function$;
