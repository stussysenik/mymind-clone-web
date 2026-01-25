# Tasks: Fix Card Consistency and Enrichment Pipeline

## 1. Card URL Link Consistency

### 1.1 Add Domain Link Component
- [ ] Create reusable `DomainLink` component or pattern for blue highlighted domain
- [ ] Pattern: `<Globe icon> + text-[var(--accent-primary)] + domain`

### 1.2 Update Platform Cards with Domain Link
- [ ] YouTubeCard.tsx - Add domain link display
- [ ] LetterboxdCard.tsx - Add domain link display
- [ ] MovieCard.tsx - Add domain link display
- [ ] GoodreadsCard.tsx - Add domain link display (currently missing)
- [ ] AmazonCard.tsx - Add domain link display (currently missing)
- [ ] StoryGraphCard.tsx - Add domain link display (currently missing)
- [ ] RedditCard.tsx - Verify uses consistent styling

### 1.3 Standardize External Link Position
- [ ] Audit all cards for ExternalLinkButton position
- [ ] Standardize to `position="bottom-right"` for all cards
- [ ] Fix AmazonCard (currently bottom-left)
- [ ] Fix YouTubeCard (currently bottom-left)
- [ ] Fix LetterboxdCard (currently bottom-left)
- [ ] Fix MovieCard (currently bottom-left)

## 2. Letterboxd Poster Extraction Fix

### 2.1 Fix Scraper Logic
- [ ] Update `lib/scraper.ts` lines 758-765
- [ ] Change priority: `filmPoster` → `movieData.image` → `ogImage`
- [ ] Current bug: `posterUrl = ogImage` at line 759 is never overridden

### 2.2 Verify Fix
- [ ] Test with Letterboxd URL in Playwright
- [ ] Verify poster image returned, not screenshot
- [ ] Check fallback chain works correctly

## 3. Enrichment Retry Timer Fix

### 3.1 Fix Timer Reset in CardDetailModal
- [ ] Identify bug in AIThinkingIndicator useEffect (lines 1016-1031)
- [ ] When `isReAnalyzing=true`, don't return early - create new interval
- [ ] Track `retryStartTime` separately from `createdAt`
- [ ] Reset elapsed to 0 and start fresh interval on retry

### 3.2 Add Retry Timing Support
- [ ] Add `getRetryTiming()` function to enrichment-timing.ts
- [ ] Pass retry start time to AIThinkingIndicator
- [ ] Show visual feedback that timer has reset

## 4. IMDB/Movie Card Color Enhancement

### 4.1 Verify Color Extraction
- [ ] Check IMDB scraper extracts KMeans colors
- [ ] Verify colors are stored in card.metadata.colors
- [ ] Confirm MovieCard uses colors for styling

### 4.2 Improve Color Usage
- [ ] Apply extracted colors to MovieCard background/accents
- [ ] Add gradient using dominant color if available

## 5. Testing & Verification

### 5.1 Playwright Tests
- [ ] Write test for card grid domain link consistency
- [ ] Write test for Letterboxd poster extraction
- [ ] Write test for enrichment retry behavior

### 5.2 Chrome DevTools Verification
- [ ] Use MCP to inspect card DOM in running app
- [ ] Verify domain links rendered with correct styling
- [ ] Check external link button positions

### 5.3 Manual DSPy Testing
- [ ] Test IMDB URL enrichment pipeline
- [ ] Verify colors extracted and applied
- [ ] Check retry mechanism with DSPy service
