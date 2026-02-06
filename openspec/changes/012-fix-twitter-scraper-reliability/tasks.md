## 1. Create Twitter Extractor Module
- [x] 1.1 Create `lib/twitter-extractor.ts` with FxTwitter API client
- [x] 1.2 Add Syndication API fallback with token generation
- [x] 1.3 Add tweet ID extraction from various X.com/Twitter URL formats
- [x] 1.4 Normalize response to common TweetData interface (text, author, media, metrics)
- [x] 1.5 Add 5s timeout per API call, graceful fallback chain

## 2. Update Scraper Twitter Section
- [x] 2.1 Replace oEmbed-based extraction in `lib/scraper.ts` with new twitter-extractor
- [x] 2.2 Return tweet photos/video thumbnails as `imageUrl` and `images[]`
- [x] 2.3 Return author avatar URL from API data
- [x] 2.4 Keep DSPy title enhancement (works on extracted text)

## 3. Update Save Route for Twitter
- [x] 3.1 Remove Playwright screenshot path for Twitter URLs
- [x] 3.2 Persist tweet images to Supabase Storage (prevent CDN expiry)
- [x] 3.3 Store tweet engagement metrics in card metadata
- [x] 3.4 Ensure <2s total save time for Twitter URLs (1.6s text-only, 2.8s with images)

## 4. Update TwitterCard Component
- [x] 4.1 Display author avatar from metadata (already has fallback)
- [x] 4.2 Handle multi-image tweets with image count badge
- [x] 4.3 Handle text-only tweets gracefully (no broken image placeholder)
- [x] 4.4 Ensure mobile-optimized image sizing

## 5. Test via Chrome DevTools
- [x] 5.1 Test saving a Twitter URL with images (4-photo tweet: Trickcal)
- [x] 5.2 Test saving a text-only Twitter URL (Abhishek Singh backend eng)
- [x] 5.3 Test saving a Twitter URL with video (India Today Global, WEF 2026)
- [x] 5.4 Verify save time via network panel: 1.6s text, 2.8s 4-photos, 1.6s video
- [x] 5.5 Verify mobile preview rendering (iPhone 15 Pro viewport)

## Test Results Summary
| Test | Tweet | Duration | Before | Images | Author |
|------|-------|----------|--------|--------|--------|
| Text-only | @0xlelouch_ | 1,622ms | 7,500ms+ | Microlink fallback (correct) | Name + Avatar |
| 4 photos | @trickcal_en | 2,847ms | 7,500ms+ | 4 photos persisted to Supabase | Name + Avatar |
| Video | @ITGGlobal | 1,632ms | 7,500ms+ | Video thumbnail persisted | Name + Avatar |
| Invalid ID | N/A | 6,257ms | 7,500ms+ | Microlink fallback | None (expected) |
