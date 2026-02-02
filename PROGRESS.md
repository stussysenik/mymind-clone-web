# MyMind Development Progress

## Current Status: Web Production-Ready, iOS In Development

| Platform | Status | Repo |
|----------|--------|------|
| **Web PWA** | ✅ Production | This repo |
| **iOS Native** | 🔄 In Development | [mymind-clone-ios](https://github.com/stussysenik/mymind-clone-ios) |

---

## Timeline

### January 2026 - February 2026

#### Week 5 (Jan 27 - Feb 2)

**Scraper & Enrichment Bug Fixes (Feb 2)**
- **Letterboxd CDATA Fix**: Letterboxd wraps JSON-LD in CDATA comments (`/* <![CDATA[ */ ... /* ]]> */`), causing `JSON.parse()` to fail silently. Added CDATA stripping before parsing to extract poster URLs correctly.
- **Reddit old.reddit.com Fallback**: Added fallback to `old.reddit.com` when main Reddit API returns 403/429 (anti-bot blocking). Old Reddit has simpler HTML that's easier to scrape.
- **finalTags Crash Fix**: Fixed "finalTags is not iterable" error in `/api/enrich` by adding `Array.isArray()` checks before spreading.
- **Enrichment Timing States**: Distinguished "slow" (>2 min) from "failed" states in `AnalyzingIndicator` - only show "failed" when actual `enrichmentError` exists, not just timeout.
- **Instagram Field Mismatch**: Fixed re-extraction script to look for `metadata.images` (API format) in addition to `metadata.carouselImages`.

**Key Commits:**
- `fix(scraper): strip CDATA wrapper from Letterboxd JSON-LD`
- `fix(scraper): add old.reddit.com fallback for blocked requests`
- `fix(enrich): add Array.isArray checks for finalTags`
- `fix(enrichment): distinguish slow vs failed states`

**Artifacts:**
- `apps/web/lib/scraper.ts` — CDATA stripping, Reddit fallback
- `apps/web/app/api/enrich/route.ts` — Array.isArray guards
- `apps/web/lib/enrichment-timing.ts` — Slow state logic
- `apps/web/scripts/reextract-instagram-carousels.mjs` — Fixed field lookup

---

**Instagram High-Quality Carousel Extraction (Feb 2)**
- Fixed CDN pattern filter from `t51.82787-15` to `t51.2885-15`
- Added new `scrapeInstagramViaEmbed()` function using embed page approach
- Carousel navigation via Next button clicks to trigger image lazy-loading
- Network interception captures high-res images (1080x1348 to 1440x1798)
- Updated fallback chain: embed scraper → direct page → static HTML parsing
- Created migration script for re-extracting failed Instagram carousels

**Key Commits:**
- `feat(instagram): add high-quality multi-image carousel extraction`

**Artifacts:**
- `apps/web/lib/instagram-scraper.ts` — Updated with embed page scraper
- `scripts/reextract-instagram-carousels.mjs` — Migration script for failed cards

**Test Case:**
- 7-image carousel post (WIKID camo hoodies) successfully extracted all images at 1080+ resolution

---

#### Week 4 (Jan 20-26)

**Card Consistency & Enrichment Fixes (Jan 25)**
- Added domain link display to all platform cards (YouTube, Letterboxd, Movie, Goodreads, Amazon, StoryGraph, Reddit, Instagram)
- Standardized external link button position to bottom-right
- Fixed Letterboxd poster extraction with multiple selector fallbacks
- Fixed retry timer not resetting when Retry button clicked
- Applied IMDB extracted colors to MovieCard gradient background
- Added shared CardActions component for consistent card UI

**Key Commits:**
- `feat(cards): add consistent domain link display to all platform cards`
- `fix(scraper): improve Letterboxd poster extraction`
- `fix(enrichment): properly reset timer when retry is clicked`
- `feat(components): add shared UI components and design tokens`

**Artifacts:**
- `apps/web/components/cards/CardActions.tsx` — Shared card actions
- `apps/web/lib/design-tokens.ts` — Design system tokens
- `openspec/changes/archive/2026-01-25-012-fix-card-consistency-enrichment/` — Feature spec

**Serendipity Mode (Jan 25)**
- Implemented interactive serendipity exploration client
- Single-card focus view with swipe/keyboard navigation
- Keyboard shortcuts: ←/→ arrows, j/k vim-style, Space for details, Escape to close
- Shuffle functionality with client-side random card fetching
- Archive/Delete actions in card detail modal
- Realtime subscription for data sync during AI enrichment
- FocusCard component with animation states

**Key Commits:**
- `fix(serendipity): add archive functionality to card detail modal`
- `feat(serendipity): add realtime subscription for data sync`

**Artifacts:**
- `apps/web/components/SerendipityClient.tsx` — Interactive serendipity client
- `apps/web/components/FocusCard.tsx` — Single-card focus component
- `openspec/changes/014-interactive-serendipity/` — Feature spec
- `openspec/changes/015-serendipity-sync-archive/` — Bug fix spec

**Nix Development Environment (Jan 24-25)**
- Added comprehensive `flake.nix` with pinned Node 20.x (matching Vercel)
- Configured multiple shells: `web`, `ai`, `rust`, `capacitor`, `default`
- Integrated direnv for automatic shell activation
- Added extensive dev tooling: lazygit, ripgrep, fd, bat, delta
- Included infrastructure CLIs: Supabase, Vercel, GitHub CLI
- Set up Playwright browser dependencies in Nix

**Key Commits:**
- `fix(nix): Pin Node.js to 20.x LTS to match Vercel`

**Artifacts:**
- `flake.nix` — Comprehensive dev environment (~1000 LOC)
- `flake.lock` — Pinned dependency versions
- `.envrc` — direnv auto-activation
- `openspec/changes/011-add-nix-dev-environment/` — Proposal docs

#### Week 3 (Jan 15-19)

**iOS Strategy Pivot (Jan 15-17)**
- Started with Capacitor WebView approach
- Implemented Share Extension with native-to-WebView bridge
- Encountered performance and complexity issues
- **Decision:** Pivot to fully native Swift app

**Visual Enhancements (Jan 18-19)**
- Fixed Instagram carousel image extraction
- Added platform-specific AI prompts (Instagram, Twitter, website)
- Enhanced AI processing feedback with stage-based indicators
- Implemented dark mode with settings modal
- Added E2E tests for visual features

**Self-Hosted Screenshot System (Jan 20)**
- Replaced external ScreenshotOne API with Playwright
- Implemented content-focused selectors per platform
- Added Supabase Storage integration for screenshots
- Created `/api/screenshot` endpoint
- Zero API costs (~$17/month savings)
- Unlimited screenshots (~720k/month on Vercel Hobby)

**Key Commits:**
- `chore(ios): Archive Capacitor experiment, pivot to native Swift`
- `docs: Reorganize project structure and documentation`
- `fix(instagram): Store carousel images in metadata`
- `feat(ai): Add platform-specific prompt templates`
- `feat(theme): Add dark mode with settings modal`
- `test: Add E2E tests for visual enhancements`
- `deps: Add Playwright dependencies for self-hosted screenshots`
- `feat(screenshot): Add self-hosted Playwright screenshot service`
- `feat(storage): Add screenshot upload to Supabase Storage`
- `feat(api): Add /api/screenshot endpoint`
- `feat(save): Replace ScreenshotOne with Playwright screenshots`
- `test(screenshot): Add Playwright screenshot service tests`

**Artifacts:**
- `apps/web/ios-capacitor-archive/` — Archived Capacitor code
- `docs/capacitor-build-logs/` — Build evidence
- `openspec/changes/005-pivot-native-ios-swift/` — Decision rationale
- `FIX_SUMMARY_INSTAGRAM_CAROUSEL.md` — Technical analysis
- `IMPLEMENTATION_SUMMARY.md` — Complete overview
- `openspec/changes/006-enhance-visual-recall-experience/` — Design docs

#### Week 2 (Jan 9-14)

**iOS Share Sheet Foundation**
- Implemented `/api/save` endpoint with iOS support
- Added Capacitor iOS project
- Created Share Extension target
- Wrote Playwright E2E tests

**OpenSpec Changes:**
- `001-add-ios-share-api-support` — API endpoint spec
- `002-add-capacitor-ios-setup` — Capacitor setup
- `003-add-ios-share-extension` — Share Extension spec
- `004-add-share-flow-tests` — E2E test spec

#### Week 1 (Jan 1-8)

**Core PWA Development**
- Masonry grid with 12+ card types
- AI-powered save pipeline (GLM-4.7)
- Full-text search with filters
- Supabase auth with RLS
- Vercel deployment

---

## Feature Completion

### Web App

| Feature | Status | Notes |
|---------|--------|-------|
| Masonry grid layout | ✅ Done | Pinterest-style, responsive |
| Card types (12+) | ✅ Done | Articles, videos, tweets, etc. |
| AI classification | ✅ Done | GLM-4.7 integration |
| Auto-tagging | ✅ Done | AI-generated tags |
| Summaries | ✅ Done | AI-generated summaries |
| Full-text search | ✅ Done | With type/tag filters |
| Supabase auth | ✅ Done | OAuth + RLS |
| Archive/Trash | ✅ Done | Full lifecycle |
| Vercel deployment | ✅ Done | Edge functions |
| Instagram carousels | ✅ Done | Multi-image extraction via embed page, high-res (1080px+) |
| Platform-specific AI | ✅ Done | Instagram, Twitter, website prompts |
| Dark mode | ✅ Done | Auto + manual with settings modal |
| AI feedback UX | ✅ Done | Stage-based progress indicators |
| Self-hosted screenshots | ✅ Done | Playwright-based, zero cost, unlimited |
| Serendipity mode | ✅ Done | Focus view, keyboard nav, shuffle, archive |
| Card consistency | ✅ Done | Domain links, external buttons, shared CardActions |

### iOS App

| Feature | Status | Notes |
|---------|--------|-------|
| Project setup | ✅ Done | SwiftUI + MVVM |
| Share Extension | 🔄 In Progress | Native implementation |
| Supabase integration | 📋 Pending | Direct SDK |
| Masonry grid | 📋 Pending | LazyVGrid |
| Auth flow | 📋 Pending | Apple Sign In |

---

## Technical Decisions Log

### 2026-01-24: Nix Flakes for Development

**Problem:** Node.js version drift between Vercel production (20.x) and local development (22.x/24.x) causing subtle incompatibilities.

**Solution:** Nix Flakes providing:
- Pinned Node.js 20.x matching Vercel production exactly
- Reproducible environment across all developer machines
- direnv integration for automatic shell activation
- Multiple specialized shells (web, ai, rust, capacitor)
- Bundled dev tools eliminating separate installation steps

**Trade-offs:**
- Requires Nix installation (~5 min setup)
- Larger initial download for Nix store
- Alternative npm/bun workflow preserved for non-Nix users

**Evidence:** See `flake.nix` and `openspec/changes/011-add-nix-dev-environment/`

### 2026-01-17: Native iOS over Capacitor

**Problem:** Capacitor WebView approach had:
- WebView cold start exceeding 500ms target
- Complex Keychain bridge for Share Extension
- Difficulty achieving native iOS feel

**Solution:** Fully native Swift app with:
- Direct Supabase SDK connection
- Native Keychain for auth sharing
- SwiftUI for native UX

**Evidence:** See `docs/capacitor-build-logs/`

### 2026-01-09: GLM-4.7 over GPT-4

**Problem:** Need cost-effective AI for classification

**Solution:** Zhipu GLM-4.7 provides:
- Good classification accuracy
- Lower cost than OpenAI
- Fast response times

---

## Next Steps

1. **iOS App** — Complete Supabase integration and auth flow
2. **Share Extension** — Test with live Supabase backend
3. **Chrome Extension** — Design and implement
4. **Smart Spaces** — Query-based collections

---

## Metrics

### Performance Targets

| Metric | Target | Current |
|--------|--------|---------|
| Save response | <200ms | ✅ ~150ms |
| Search response | <300ms | ✅ ~200ms |
| Grid render | <100ms | ✅ ~80ms |
| Share Extension cold start | <500ms | 🔄 TBD (native) |

### Code Stats

```
apps/web/
├── Components: 35+
├── API routes: 9
├── Card types: 12
└── E2E tests: 18+
```

---

*Last updated: 2026-02-02*
