-- Migration: Add deleted_at column for soft deletes
ALTER TABLE cards ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Index for faster filtering
CREATE INDEX IF NOT EXISTS idx_cards_deleted_at ON cards(deleted_at);
