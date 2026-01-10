-- Add archived_at column to cards table
-- This enables the Archive functionality

ALTER TABLE cards 
ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ DEFAULT NULL;

-- Create an index for performance on archived views
CREATE INDEX IF NOT EXISTS cards_archived_at_idx ON cards(archived_at);
