# 009: Instagram Media Persistence

## Status: In Progress

## Problem Statement

Instagram media extraction is unreliable due to:

1. **CDN URLs expire** - We store `cdninstagram.com` URLs that have hotlink protection and expiration
2. **No video detection** - Reels/videos show placeholders instead of thumbnails
3. **Mixed media not tracked** - Carousels with images + videos lose type information
4. **Order not preserved** - No record of which carousel positions are videos

### Evidence from Logs
- `403` errors from `cdninstagram.com` - direct CDN access blocked after extraction
- `429` errors from `microlink.io` - rate limiting on fallback
- "staygroundedtv" post works (recent extraction), others fail (expired URLs)

## Proposed Solution

Persist media to Supabase Storage instead of storing ephemeral CDN URLs.

### New Data Flow
```
User saves Instagram URL
  ↓
/api/save (instant response with placeholder)
  ↓
Background: extractInstagramCarouselBackground()
  ↓
instagram-scraper.ts (detect media types)
  ↓
instagram-storage.ts (download + upload to Supabase)
  ↓
Update card with permanent storage URLs + mediaTypes[]
```

## User Requirements

| Requirement | Solution |
|-------------|----------|
| Highest fidelity images | Download from CDN during browser session (fresh URLs) |
| Videos → thumbnail only | Detect video, extract `display_url` as poster frame |
| Preserve order | `mediaTypes[]` array maintains carousel order |
| Denote video positions | `videoPositions: [2, 5]` shows indices |
| Audio on images | Extract images normally (audio is separate track) |

## Scope

### In Scope
- Download and persist images to Supabase Storage during extraction
- Detect video vs image content type in carousel
- Track media types in card metadata
- Show video indicators in UI

### Out of Scope (Future Work)
- Re-extraction of existing cards with expired URLs (batch migration)
- Actual video download (TOS compliance)
- Stories extraction (ephemeral content)

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Instagram changes CDN patterns | Keep detection logic in single file, easy to update |
| Storage costs | Only store for saved cards, use JPEG compression |
| Download rate limiting | Add 100ms delay between downloads |
| Extraction timeout | Keep 20s timeout, mark as failed gracefully |

## Related

- Prior: 004-instagram-carousel-extraction (original implementation)
- Spec: CLAUDE.md defines <200ms optimistic UI requirement
