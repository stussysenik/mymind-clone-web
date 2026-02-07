# 009: Instagram Media Persistence - Tasks

## Implementation Checklist

### Phase 1: Types
- [x] Add `mediaTypes?: ('image' | 'video')[]` to CardMetadata
- [x] Add `videoPositions?: number[]` to CardMetadata
- [x] Add `mediaPersisted?: boolean` to CardMetadata
- [x] Add `originalCdnUrls?: string[]` to CardMetadata

### Phase 2: Scraper Enhancement
- [x] Create `InstagramMediaItem` interface
- [x] Detect video content via response content-type
- [x] Parse GraphVideo typename from JSON
- [x] Parse is_video flag from embed data
- [x] Return `media[]` array with types

### Phase 3: Storage Module
- [x] Create `apps/web/lib/instagram-storage.ts`
- [x] Implement `downloadMedia(url)` function
- [x] Implement `uploadInstagramMedia()` function
- [x] Implement `persistInstagramMedia()` main entry point
- [x] Add 100ms delay between downloads (rate limiting)

### Phase 4: Background Extraction
- [x] Update `extractInstagramCarouselBackground()` in route.ts
- [x] Call enhanced scraper
- [x] Use storage module to persist media
- [x] Update card with new metadata fields
- [x] Handle errors gracefully

### Phase 5: UI Updates
- [x] InstagramCard: Add video count badge
- [x] CardDetailModal: Orange ring for video dots
- [x] CardDetailModal: Play icon on video slides

### Phase 6: Testing
- [ ] Test single image post persistence
- [ ] Test carousel with all images
- [ ] Test reel (video) thumbnail extraction
- [ ] Test mixed carousel (images + videos)
- [ ] Verify 403 errors no longer occur for persisted media

## File Changes Summary

| File | Action |
|------|--------|
| `lib/types.ts` | MODIFIED - Added 4 new CardMetadata fields |
| `lib/instagram-scraper.ts` | MODIFIED - Added video detection, InstagramMediaItem interface |
| `lib/instagram-storage.ts` | CREATED - New storage module (~200 lines) |
| `app/api/save/route.ts` | MODIFIED - Updated background extraction with persistence |
| `components/cards/InstagramCard.tsx` | MODIFIED - Added video badge |
| `components/CardDetailModal.tsx` | MODIFIED - Added video indicators |

## Notes

- Keep backwards compatibility - existing cards without new fields should work
- Storage bucket name: `instagram` (create if doesn't exist)
- Use JPEG format for all images (including video thumbnails)
- Compression quality: 90% for balance of quality/size

## Implementation Complete

All code changes have been implemented. Ready for testing once the `instagram` storage bucket is created in Supabase.
