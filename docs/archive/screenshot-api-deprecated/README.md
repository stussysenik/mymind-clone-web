# Deprecated: ScreenshotOne API Implementation

**Status:** ⚠️ Deprecated as of January 20, 2026
**Replaced by:** Self-hosted Playwright screenshots (`apps/web/lib/screenshot-playwright.ts`)

## Why Deprecated?

The external ScreenshotOne API was replaced with a self-hosted Playwright solution for the following reasons:

### Cost Savings
- **Before:** $17/month for 2,000 screenshots (ScreenshotOne paid plan)
- **After:** $0/month (runs on Vercel serverless included in hosting)

### Unlimited Capacity
- **Before:** 100 screenshots/month (free tier) or 2,000/month (paid)
- **After:** ~720,000 screenshots/month (only limited by Vercel compute)

### Better Control
- **Before:** Limited viewport options, no element-level capture
- **After:** Full control over:
  - Content-focused selectors (capture main content only, no ads/thumbnails)
  - Platform-specific viewports (Instagram 375x812 mobile, Twitter 1200x800 desktop)
  - Retina/HiDPI quality (2x pixel density)
  - Wait times and network conditions

### Performance
- Similar performance to external API
- Cold start: 3-5s (first request)
- Warm requests: 1-2s (subsequent requests)

## Files in This Archive

### `screenshot.ts`
The original ScreenshotOne API implementation with:
- ScreenshotOne API integration
- Platform-specific viewport configurations
- Retry logic with exponential backoff
- Microlink fallback

### `SCREENSHOTONE_SETUP.md`
Setup documentation for the ScreenshotOne API, including:
- API key configuration
- Pricing comparison
- Usage examples

## Migration Path

If you need to reference the old implementation:

**Old way (ScreenshotOne):**
```typescript
import { captureScreenshot } from '@/lib/screenshot';
const url = await captureScreenshot('https://example.com');
```

**New way (Playwright):**
```typescript
import { captureWithPlaywright } from '@/lib/screenshot-playwright';
import { uploadScreenshotToStorage } from '@/lib/supabase';

const result = await captureWithPlaywright('https://example.com');
if (result.success) {
  const url = await uploadScreenshotToStorage(result.buffer, 'https://example.com');
}
```

Or use the API endpoint:
```bash
POST /api/screenshot
{ "url": "https://example.com" }
```

## Related Changes

- **PR/Commits:** January 20, 2026 (commits `5de69c5` through `d4c7704`)
- **New implementation:** `apps/web/lib/screenshot-playwright.ts`
- **API endpoint:** `apps/web/app/api/screenshot/route.ts`
- **Storage integration:** `apps/web/lib/supabase.ts` (`uploadScreenshotToStorage()`)

## See Also

- [Self-Hosted Screenshot Plan](../../../openspec/changes/) (if documented in OpenSpec)
- [PROGRESS.md](../../../PROGRESS.md) - Week 3, Jan 20 entry
- [DOCS.md](../../../DOCS.md) - Self-Hosted Screenshots section
