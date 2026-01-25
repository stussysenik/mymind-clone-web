# Tasks: Content Quality QA Enhancement

## Sprint 1: Core Quality Fixes (COMPLETED)

### Phase 1: Content Source Signatures
- [x] Create `/lib/content-signatures/index.ts` with base types and registry
- [x] Create `/lib/content-signatures/validator.ts` with validation utilities
- [x] Define signatures for: Instagram, Twitter, YouTube, Letterboxd, Reddit, GitHub, Generic

### Phase 2: Fix Title Concatenation Bug
- [x] Update `/lib/scraper.ts` Instagram handling (lines 210-250)
- [x] Extract author SEPARATELY from caption text
- [x] Remove username prefix from caption before using as title
- [x] Add logging for debug visibility

### Phase 3: AI Summary Quality Improvement
- [x] Create `/lib/prompts/summary.ts` with platform-specific prompts
- [x] Update `generateSummary()` in `/lib/ai.ts` to use platform detection
- [x] Add summary quality validation (length, analytical vs truncation check)
- [x] Export new functions from `/lib/prompts/index.ts`

### Phase 4: Screenshot Pop-up Handling
- [x] Add `POPUP_CONFIGS` to `/lib/screenshot-playwright.ts`
- [x] Implement `dismissPopups()` function with platform selectors
- [x] Integrate popup dismissal into `captureWithPlaywright()` flow
- [x] Add selectors for: Twitter, Instagram, Reddit, LinkedIn, TikTok

### Phase 5: Instagram Carousel Image Quality
- [x] Enhanced image extraction in `/lib/scraper.ts`
- [x] Parse `display_url` from embedded scripts (full resolution)
- [x] Parse `display_resources` array for size metadata
- [x] Deduplicate and prioritize by quality (display_url > display_resources > img_tag)
- [x] Add logging for candidate vs selected image counts

### Phase 6: Light/Dark Mode Toggle
- [x] Create `/lib/theme/ThemeProvider.tsx` with context and localStorage persistence
- [x] Create `/lib/theme/index.ts` exports
- [x] Create `/components/ThemeToggle.tsx` with Sun/Moon/Monitor icons
- [x] Update `/components/Header.tsx` to include ThemeToggle
- [x] Update `/app/layout.tsx` to wrap with ThemeProvider
- [x] Add inline theme script to prevent FOUC (Flash of Unstyled Content)

---

## Sprint 2: DSPy Integration (PENDING)

### Phase 7: DSPy Python Microservice
- [ ] Create `/services/dspy-service/` directory structure
- [ ] Implement FastAPI server with `/optimize/summary` endpoint
- [ ] Create DSPy signatures for summary and title validation
- [ ] Add Dockerfile for deployment
- [ ] Create TypeScript client in `/lib/dspy-client.ts`

### Phase 8: Batch Migration
- [ ] Design migration script for existing cards
- [ ] Implement rate limiting to avoid API throttling
- [ ] Add progress tracking and resume capability

---

## Verification Checklist

After implementation:
- [x] Build passes (`npm run build`)
- [x] TypeScript compiles without errors in production code
- [x] Theme toggle appears in Header
- [x] Theme persists across page refreshes
- [ ] Instagram titles no longer show username prefix (test with real URL)
- [ ] AI summaries are analytical (test with real content)
- [ ] Screenshots don't show login prompts (test with Twitter/Instagram)
- [ ] Carousel images are full resolution (test with Instagram carousel)

---

## Files Created

| File | Purpose |
|------|---------|
| `/lib/content-signatures/index.ts` | Platform contracts and registry |
| `/lib/content-signatures/validator.ts` | Content validation utilities |
| `/lib/prompts/summary.ts` | Platform-specific summary prompts |
| `/lib/theme/ThemeProvider.tsx` | Theme context with localStorage |
| `/lib/theme/index.ts` | Theme module exports |
| `/components/ThemeToggle.tsx` | Theme toggle UI component |

## Files Modified

| File | Changes |
|------|---------|
| `/lib/scraper.ts` | Fixed Instagram author/title separation, enhanced image extraction |
| `/lib/ai.ts` | Platform-aware generateSummary with quality validation |
| `/lib/screenshot-playwright.ts` | Added popup dismissal before screenshot |
| `/lib/prompts/index.ts` | Added summary exports |
| `/components/Header.tsx` | Added ThemeToggle component |
| `/app/layout.tsx` | Wrapped with ThemeProvider, added theme script |
