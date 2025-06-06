-- Create a table to track which chunks were retrieved for a search or message
CREATE TABLE IF NOT EXISTS retrieved_chunks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    search_id UUID NOT NULL, -- or message_id, or session_id
    chunk_id UUID NOT NULL,  -- references file_items(id) or document_chunks(id)
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Add an index for efficient lookup by search/message
CREATE INDEX IF NOT EXISTS idx_retrieved_chunks_search_id ON retrieved_chunks (search_id);
CREATE INDEX IF NOT EXISTS idx_retrieved_chunks_chunk_id ON retrieved_chunks (chunk_id);
