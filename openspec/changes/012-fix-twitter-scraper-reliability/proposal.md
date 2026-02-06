# Change: Fix Twitter/X scraper reliability and optimize content preview pipeline

## Why
Twitter/X link saving is broken: the oEmbed API frequently fails, Playwright screenshots timeout after 30s (X.com blocks headless browsers), and the Microlink fallback produces generic screenshots that don't tell you what the content is. The entire save flow takes 7.5s+ and often fails entirely. The preview images are not optimized for mobile masonry layout and don't visually communicate what the saved content is about.

## What Changes

### 1. Replace Twitter scraping with FxTwitter API + Syndication API
- **Primary**: Use `https://api.fxtwitter.com/status/{id}` for rich tweet data (text, images, videos, metrics, author info) — free, no auth, ~200ms response
- **Fallback**: Use Twitter Syndication API (`cdn.syndication.twimg.com/tweet-result`) for redundancy
- **Remove**: oEmbed dependency for tweet text extraction (unreliable, HTML-only)
- **Remove**: Playwright screenshot for Twitter entirely (30s timeouts, blocked by X.com)

### 2. Extract tweet media directly from API response
- FxTwitter returns photo URLs, video thumbnails, and even mosaic images for multi-photo tweets
- Store tweet photos directly as `imageUrl` — no screenshot needed
- For text-only tweets: use a server-rendered tweet card image (react-tweet style) or just display the text card

### 3. Optimize save speed to <1s (from 7.5s)
- FxTwitter API call: ~200ms
- No Playwright browser launch: saves 5-30s
- Persist tweet images to Supabase Storage (like Instagram) to avoid CDN expiry
- Total target: <1s for Twitter URLs including storage upload

### 4. Improve TwitterCard preview for mobile
- Display tweet images from API (not screenshots) at native resolution
- Show author avatar from API data
- Multi-photo tweets: show first image + count badge (like Instagram carousel)
- Text-only tweets: render as styled text card (no blank/broken image)

### 5. Make content type visually obvious in preview
- Twitter cards should look distinctly "Twitter" — black left border + X logo + tweet text + media
- Already have good TwitterCard component — just needs reliable data flowing in

## Impact
- Affected code: `lib/scraper.ts` (Twitter section), `app/api/save/route.ts` (Twitter screenshot flow), `lib/screenshot-playwright.ts` (can remove Twitter-specific config), `components/cards/TwitterCard.tsx` (avatar + multi-image)
- New file: `lib/twitter-extractor.ts` (FxTwitter + Syndication API client)
- Performance: 7.5s → <1s for Twitter saves
- Reliability: ~50% success → ~99% success (API-based, no browser)
- Zero new dependencies (pure `fetch` calls)
