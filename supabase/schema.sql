-- =============================================================================
-- MyMind Clone - Supabase Schema
-- =============================================================================
-- Run this in your Supabase SQL Editor to create the required tables.
-- Go to: Supabase Dashboard → SQL Editor → New Query → Paste this → Run
-- =============================================================================

-- Cards table - stores all saved itemsi
CREATE TABLE IF NOT EXISTS cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL DEFAULT 'demo-user',
  type text NOT NULL CHECK (type IN ('article', 'image', 'note', 'product', 'book')),
  title text,
  content text,
  url text,
  image_url text,
  metadata jsonb DEFAULT '{}'::jsonb,
  tags text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  deleted_at timestamptz DEFAULT NULL,
  archived_at timestamptz DEFAULT NULL
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_cards_user ON cards(user_id);
CREATE INDEX IF NOT EXISTS idx_cards_type ON cards(type);
CREATE INDEX IF NOT EXISTS idx_cards_tags ON cards USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_cards_metadata ON cards USING GIN(metadata);
CREATE INDEX IF NOT EXISTS idx_cards_created ON cards(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cards_deleted_at ON cards(deleted_at);
CREATE INDEX IF NOT EXISTS idx_cards_archived_at ON cards(archived_at);

-- Full-text search index
CREATE INDEX IF NOT EXISTS idx_cards_search ON cards USING GIN(
  to_tsvector('english', coalesce(title, '') || ' ' || coalesce(content, ''))
);

-- Spaces table - for organizing cards into collections
CREATE TABLE IF NOT EXISTS spaces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL DEFAULT 'demo-user',
  name text NOT NULL,
  query text, -- Smart Space query string, e.g., "type:article tag:design"
  is_smart boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_spaces_user ON spaces(user_id);

-- Enable Row Level Security (optional - for multi-user setup)
-- ALTER TABLE cards ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE spaces ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- Sample data (optional) - uncomment to add test cards
-- =============================================================================

-- INSERT INTO cards (type, title, url, tags, metadata) VALUES
-- ('article', 'Getting Started with Next.js', 'https://nextjs.org/docs', ARRAY['nextjs', 'react'], '{"summary": "Learn how to build with Next.js"}'),
-- ('product', 'MacBook Pro', 'https://apple.com/macbook-pro', ARRAY['tech', 'apple'], '{"price": "$1999", "summary": "Apple laptop"}');
