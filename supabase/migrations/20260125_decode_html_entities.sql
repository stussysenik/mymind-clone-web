-- Migration: Decode HTML Entities in Existing Cards
-- Date: 2026-01-25
-- Description: Fix HTML entities (like &amp;, &lt;, &gt;) in existing card titles and descriptions
--              that were previously scraped with encoded entities.

-- Update title field
UPDATE cards
SET title = REPLACE(
  REPLACE(
    REPLACE(
      REPLACE(
        REPLACE(title, '&amp;', '&'),
        '&lt;', '<'
      ),
      '&gt;', '>'
    ),
    '&quot;', '"'
  ),
  '&#39;', ''''
)
WHERE title LIKE '%&amp;%'
   OR title LIKE '%&lt;%'
   OR title LIKE '%&gt;%'
   OR title LIKE '%&quot;%'
   OR title LIKE '%&#39;%';

-- Update description field
UPDATE cards
SET description = REPLACE(
  REPLACE(
    REPLACE(
      REPLACE(
        REPLACE(description, '&amp;', '&'),
        '&lt;', '<'
      ),
      '&gt;', '>'
    ),
    '&quot;', '"'
  ),
  '&#39;', ''''
)
WHERE description LIKE '%&amp;%'
   OR description LIKE '%&lt;%'
   OR description LIKE '%&gt;%'
   OR description LIKE '%&quot;%'
   OR description LIKE '%&#39;%';

-- Update content field (for notes)
UPDATE cards
SET content = REPLACE(
  REPLACE(
    REPLACE(
      REPLACE(
        REPLACE(content, '&amp;', '&'),
        '&lt;', '<'
      ),
      '&gt;', '>'
    ),
    '&quot;', '"'
  ),
  '&#39;', ''''
)
WHERE content LIKE '%&amp;%'
   OR content LIKE '%&lt;%'
   OR content LIKE '%&gt;%'
   OR content LIKE '%&quot;%'
   OR content LIKE '%&#39;%';

-- Note: The metadata JSONB column (containing summary) requires different handling.
-- This can be addressed with a more complex UPDATE if needed, or handled at render-time.
-- For now, render-time decoding in the components handles the metadata.summary field.
