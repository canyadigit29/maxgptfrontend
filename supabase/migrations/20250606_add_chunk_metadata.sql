-- Migration: Add chunk metadata fields to document_chunks
ALTER TABLE document_chunks
ADD COLUMN IF NOT EXISTS chunk_hash TEXT,
ADD COLUMN IF NOT EXISTS section_header TEXT,
ADD COLUMN IF NOT EXISTS page_number INTEGER;
