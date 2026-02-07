# 009: Instagram Media Persistence - Design

## Architecture

### Storage Structure
```
Supabase Storage: instagram bucket
├── {userId}/
│   └── {shortcode}/
│       ├── 0.jpg          # First image
│       ├── 1.jpg          # Second image
│       ├── 2-thumb.jpg    # Video thumbnail (position 2 is video)
│       └── 3.jpg          # Fourth image
```

### Type Extensions

```typescript
// apps/web/lib/types.ts
interface CardMetadata {
  // ... existing fields

  // New fields for media persistence
  mediaTypes?: ('image' | 'video')[];  // Type per carousel position
  videoPositions?: number[];            // Which positions are videos
  mediaPersisted?: boolean;             // True if stored in Supabase
  originalCdnUrls?: string[];           // Original URLs for debugging
}
```

### New Module: instagram-storage.ts

```typescript
// apps/web/lib/instagram-storage.ts

interface InstagramMediaItem {
  url: string;
  type: 'image' | 'video';
  thumbnailUrl?: string; // For videos
}

// Download image from CDN while we have fresh session
async function downloadMedia(url: string): Promise<Buffer | null>

// Upload to Supabase Storage
async function uploadInstagramMedia(
  buffer: Buffer,
  userId: string,
  shortcode: string,
  index: number,
  isVideoThumb?: boolean
): Promise<string | null>

// Main entry point - process all carousel items
async function persistInstagramMedia(
  media: InstagramMediaItem[],
  userId: string,
  shortcode: string
): Promise<{
  urls: string[];
  mediaTypes: ('image' | 'video')[];
  videoPositions: number[];
}>
```

### Enhanced Scraper Response

```typescript
// Enhanced InstagramScraperResult
interface InstagramScraperResult {
  images: string[];           // Existing (for backwards compat)
  media: InstagramMediaItem[]; // New: typed media items
  caption: string;
  author: string;
  slideCount: number;
}
```

## Data Flow

1. **User saves Instagram URL** → Instant card created with `carouselPending: true`

2. **Background extraction starts** (fire-and-forget):
   ```
   extractInstagramCarouselBackground(cardId, shortcode)
   ```

3. **Scraper detects media types**:
   - Check `content-type` header for video
   - Parse `__typename: "GraphVideo"` in JSON
   - Parse `is_video: true` in embed data

4. **Storage module downloads & uploads**:
   - For images: download full resolution, upload as `.jpg`
   - For videos: extract `display_url` as thumbnail, upload as `-thumb.jpg`

5. **Card updated with permanent URLs**:
   ```typescript
   await updateCard(cardId, {
     image_url: persistedUrls[0],
     metadata: {
       images: persistedUrls,
       mediaTypes: ['image', 'video', 'image'],
       videoPositions: [1],
       mediaPersisted: true,
       originalCdnUrls: originalUrls, // For debugging
       carouselExtracted: true,
       carouselPending: false,
     }
   });
   ```

## Fallback Chain

1. **Primary**: Supabase Storage URL (permanent)
2. **Secondary**: Original CDN URL (may work if fresh)
3. **Tertiary**: Placeholder image `/images/instagram-placeholder.svg`

## UI Changes

### InstagramCard.tsx
- Add badge: "Contains X videos" when `videoPositions.length > 0`
- Update carousel counter: "1/5 (2 videos)"

### CardDetailModal.tsx
- Add orange ring to dot navigation for video positions
- Show play icon overlay on video thumbnail slides
