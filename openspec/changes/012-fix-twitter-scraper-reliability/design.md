## Context
Twitter/X content saving is unreliable (oEmbed fails, Playwright times out at 30s). The current flow launches a full browser to screenshot x.com, which actively blocks headless browsers. We need a reliable, fast, API-based approach.

## Goals / Non-Goals
- Goals: Reliable tweet extraction (<1s), rich metadata (text, images, author, metrics), mobile-optimized previews
- Non-Goals: Twitter search/timeline features, authenticated Twitter access, video playback in cards

## Decisions

### Decision: FxTwitter API as primary, Syndication API as fallback
- **FxTwitter** (`api.fxtwitter.com/status/{id}`): Free, no auth, returns full JSON with photos, videos, polls, author info. ~200ms response. Open source (MIT), self-hostable on Cloudflare Workers.
- **Syndication API** (`cdn.syndication.twimg.com/tweet-result`): Twitter's own embed data endpoint. Returns structured JSON. Used by Vercel's react-tweet. Token generation: `((Number(id) / 1e15) * Math.PI).toString(36).replace(/(0+|\.)/, '')`
- **Why not oEmbed?**: Only returns HTML, requires parsing, doesn't include images or metrics
- **Why not Playwright?**: X.com actively blocks headless browsers, 30s timeouts, 5-30s overhead

### Decision: Persist tweet images to Supabase Storage
- Tweet image CDN URLs may have limited lifespans (like Instagram)
- Download and re-upload to `images/twitter/{userId}/{tweetId}.jpg`
- Follows established Instagram persistence pattern

### Decision: No new dependencies
- Both APIs use standard `fetch()` calls
- No `react-tweet` package needed (we extract data ourselves)
- Keeps bundle lean

## Fallback Chain
```
1. FxTwitter API (200ms, free, rich data)
   ↓ failure
2. Syndication API (200ms, free, good data)
   ↓ failure
3. oEmbed (text only, no images — existing behavior)
   ↓ failure
4. Generic HTML scrape (existing fallback in scraper.ts)
```

## Risks / Trade-offs
- FxTwitter is a third-party service — could go down. Mitigation: Syndication API fallback + option to self-host FxTwitter on Cloudflare.
- Syndication API is undocumented — could change. Mitigation: FxTwitter as primary.
- Neither API works for private/age-restricted tweets. Mitigation: Fall back to generic scrape.

## Open Questions
- None — approach is well-validated by react-tweet (Vercel) and FixTweet communities
