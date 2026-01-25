# Change: Fix Card Consistency and Enrichment Pipeline

## Why
Card preview UI is inconsistent across platforms - some cards show the blue highlighted domain link while others don't. The external link button position varies (bottom-left vs bottom-right). Additionally, the enrichment retry timer doesn't reset properly, Letterboxd shows full page screenshots instead of movie posters, and IMDB color extraction needs improvement for predictable results.

## What Changes

### 1. Card URL Link Consistency
- Add blue highlighted domain link to ALL platform cards (YouTube, Letterboxd, MovieCard, GoodreadsCard, AmazonCard, StoryGraphCard)
- Standardize external link button position to bottom-right across all cards
- Update CardActions ExternalLinkButton to be used consistently

### 2. Letterboxd Poster Extraction Fix
- **BUG FIX**: The scraper finds `div.film-poster img` but then ignores it, defaulting to OG image (full page screenshot)
- Actually use the extracted poster URL instead of discarding it
- Fallback chain: `filmPoster` → `movieData.image` → `ogImage`

### 3. Enrichment Retry Timer Fix
- **BUG FIX**: When `isReAnalyzing` is true, useEffect returns early without creating interval
- The timer stays frozen at 1000ms because no interval advances elapsed time
- Fix: Create new interval with fresh startTime when retry is initiated
- Track retryStartTime separately from original card createdAt

### 4. IMDB/Movie Card Color Extraction
- Ensure KMeans colors are properly extracted and applied to MovieCard styling
- Make color extraction more predictable for movie platform cards

## Impact

### Affected specs:
- `card-display` - UI consistency requirements
- `content-scraping` - Letterboxd image extraction
- `enrichment-pipeline` - Retry behavior and timing

### Affected code:
| File | Changes |
|------|---------|
| `components/cards/YouTubeCard.tsx` | Add domain link display |
| `components/cards/LetterboxdCard.tsx` | Add domain link display |
| `components/cards/MovieCard.tsx` | Add domain link, verify color usage |
| `components/cards/GoodreadsCard.tsx` | Add domain link display |
| `components/cards/AmazonCard.tsx` | Add domain link display |
| `components/cards/StoryGraphCard.tsx` | Add domain link display |
| `components/cards/CardActions.tsx` | Standardize position prop |
| `lib/scraper.ts` | Fix Letterboxd poster extraction logic (lines 758-765) |
| `components/CardDetailModal.tsx` | Fix retry timer reset in AIThinkingIndicator |
| `lib/enrichment-timing.ts` | Add retry timing utilities |

## Verification Plan
1. Use Playwright to test card grid renders all domain links consistently
2. Use Chrome DevTools MCP to inspect card DOM structure
3. Test Letterboxd URL scraping returns actual poster, not screenshot
4. Test enrichment retry shows progress bar advancing correctly
5. Verify IMDB cards use extracted colors for styling
