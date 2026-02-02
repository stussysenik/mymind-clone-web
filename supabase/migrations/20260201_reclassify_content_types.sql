-- Migration: Reclassify Content Types
-- Date: 2026-02-01
-- Description: Migrate existing content to new type categories:
--   - Twitter/Instagram/Reddit posts from 'article' to 'social'
--   - IMDB/Letterboxd content from 'article' to 'movie'
--   - StoryGraph content to ensure it's 'book' type

-- ============================================================================
-- SOCIAL MEDIA: Migrate to 'social' type
-- ============================================================================

-- Migrate Twitter/X posts
UPDATE cards
SET type = 'social'
WHERE type = 'article'
  AND (url ILIKE '%twitter.com%' OR url ILIKE '%x.com%');

-- Migrate Instagram posts
UPDATE cards
SET type = 'social'
WHERE type = 'article'
  AND url ILIKE '%instagram.com%';

-- Migrate Reddit posts
UPDATE cards
SET type = 'social'
WHERE type = 'article'
  AND url ILIKE '%reddit.com%';

-- Migrate LinkedIn posts
UPDATE cards
SET type = 'social'
WHERE type = 'article'
  AND url ILIKE '%linkedin.com%';

-- Migrate Bluesky posts
UPDATE cards
SET type = 'social'
WHERE type = 'article'
  AND (url ILIKE '%bsky.app%' OR url ILIKE '%bluesky%');

-- Migrate Mastodon posts (common instances)
UPDATE cards
SET type = 'social'
WHERE type = 'article'
  AND (url ILIKE '%mastodon%' OR url ILIKE '%fosstodon%' OR url ILIKE '%hachyderm%');

-- Also migrate any cards that were typed as 'twitter' or 'reddit' directly
UPDATE cards
SET type = 'social'
WHERE type IN ('twitter', 'reddit');

-- ============================================================================
-- MOVIES: Migrate to 'movie' type
-- ============================================================================

-- Migrate IMDB content
UPDATE cards
SET type = 'movie'
WHERE type = 'article'
  AND url ILIKE '%imdb.com%';

-- Migrate Letterboxd content
UPDATE cards
SET type = 'movie'
WHERE type = 'article'
  AND url ILIKE '%letterboxd.com%';

-- ============================================================================
-- BOOKS: Ensure StoryGraph is classified as 'book'
-- ============================================================================

-- Migrate StoryGraph content
UPDATE cards
SET type = 'book'
WHERE type = 'article'
  AND url ILIKE '%thestorygraph.com%';

-- Also ensure Goodreads is classified as book
UPDATE cards
SET type = 'book'
WHERE type = 'article'
  AND url ILIKE '%goodreads.com%';

-- ============================================================================
-- SUMMARY: Log counts for verification
-- ============================================================================
-- After running this migration, you can verify with:
-- SELECT type, COUNT(*) FROM cards GROUP BY type ORDER BY COUNT(*) DESC;
