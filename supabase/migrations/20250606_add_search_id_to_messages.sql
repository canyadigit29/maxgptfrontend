-- Add search_id column to messages for robust follow-up Q&A context linkage
ALTER TABLE messages ADD COLUMN search_id TEXT NULL;
