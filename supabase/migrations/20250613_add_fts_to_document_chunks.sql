-- Migration: Add FTS (full-text search) support to document_chunks for hybrid search

ALTER TABLE document_chunks
ADD COLUMN IF NOT EXISTS content_tsv tsvector GENERATED ALWAYS AS (to_tsvector('english', content)) STORED;

CREATE INDEX IF NOT EXISTS idx_document_chunks_content_tsv
ON document_chunks
USING GIN (content_tsv);
