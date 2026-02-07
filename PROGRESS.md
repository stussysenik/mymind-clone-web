# MyMind Development Progress

## Current Status: Web Production-Ready, iOS In Development

| Platform | Status | Repo |
|----------|--------|------|
| **Web PWA** | ✅ Production | This repo |
| **iOS Native** | 🔄 In Development | [mymind-clone-ios](https://github.com/stussysenik/mymind-clone-ios) |

---

## Timeline

### January 2026 - February 2026

#### Week 6 (Feb 3 - Feb 9)

**AI Enrichment Reliability + Design System Overhaul (Feb 7)**
- **AI 3-tier fallback**: Vision model GLM-4.6V (45s timeout) → Text model GLM-4.7 (30s) → Rule-based (instant). Eliminates generic fallback tags — every save now gets content-aware AI tags
- **Timing telemetry**: All GLM calls now log `[AI] GLM ${model} responded in ${ms}ms` for observability
- **Atomic claim enrichment**: Conditional UPDATE prevents duplicate enrichment processing (TOCTOU race fix)
- **Time budget management**: Reduced MAX_RETRIES 2→1, increased budget 50s→55s, skip tag normalization if <15s remaining
- **`processing: false` fix**: Initial card insert no longer pre-sets `processing: true`, allowing the enrich route to claim atomically
- **60/30/10 design token system**: Centralized CSS variables for surfaces (`--surface-primary`, `--surface-card`, `--surface-elevated`), elevation (`--shadow-xs` through `--shadow-xl`), radius (`--radius-sm` 6px through `--radius-full`), and borders (`--border-subtle`, `--border-default`, `--border-emphasis`)
- **`.card-base` utility class**: Unified card styling foundation (radius, shadow, hover lift) used by all card types
- **Platform card unification**: All 6 platform cards (Instagram, Twitter, YouTube, Reddit, Amazon, Movie) updated from hardcoded `bg-white`/`rounded-lg` to design tokens
- **CardDetailModal**: Frosted glass overlay (`bg-black/60 backdrop-blur-xl` replacing heavy `bg-black/90`), all internal surfaces use tokens
- **Mobile search bar**: Moved to fixed bottom position with gradient fade for thumb accessibility
- **FAB repositioned**: Floating action button moves above mobile search bar (`bottom-[calc(4.5rem+env(safe-area-inset-bottom))]`)
- **Dark mode audit**: All surfaces use CSS variables — no broken `bg-white` in dark mode
- **Instagram CDN migration script**: New `migrate-instagram-images.mjs` for batch repair of expired CDN URLs to Supabase storage

**Key Commits:**
- `feat: AI enrichment reliability + design system overhaul + Instagram CDN migration`

**Artifacts:**
- `apps/web/lib/ai.ts` — 3-tier fallback, timing telemetry, `tryGLMClassification()` helper
- `apps/web/app/api/enrich/route.ts` — Atomic claim, time budget, reduced retries
- `apps/web/app/api/save/route.ts` — `processing: false` fix, enrichmentTiming
- `apps/web/app/globals.css` — 60/30/10 design tokens, `.card-base` utility
- `apps/web/app/page.tsx` — Mobile bottom search bar layout
- `apps/web/components/CardDetailModal.tsx` — Frosted glass overlay + token migration
- `apps/web/components/Card.tsx` — card-base integration
- `apps/web/components/SearchBar.tsx` — Design token migration
- `apps/web/components/AddButton.tsx` — FAB repositioning
- `apps/web/components/Header.tsx` — `border-subtle` editorial border
- `apps/web/components/cards/*.tsx` — All 6 platform cards unified
- `apps/web/scripts/migrate-instagram-images.mjs` — CDN migration script

---

**Fix Instagram Extraction on Vercel — InstaFix Primary Strategy (Feb 7)**
- **Root Cause: Instagram blocks datacenter IPs** — All three existing strategies (GraphQL, Embed HTML, OG Tags) fail on Vercel because Instagram blocks AWS/datacenter IPs. Worked fine on localhost (residential IP)
- **Fix: Added InstaFix (`ddinstagram.com`) as primary strategy** — InstaFix is the Instagram equivalent of FxTwitter, proxying through its own infrastructure. Works from any IP including Vercel
- **InstaFix oEmbed API** (`ddinstagram.com/oembed?url=...`) — Structured JSON with thumbnail, author, caption
- **InstaFix HTML parsing** (`ddinstagram.com/p/{shortcode}/`) with Discordbot UA — OG tags with carousel support (multiple `og:image` tags), video detection via `og:video`
- **OG Tags fallback upgraded to Googlebot UA** — Instagram serves OG metadata to known search crawlers regardless of IP, making the last-resort strategy always work on Vercel
- **New 4-layer fallback chain**: InstaFix → GraphQL → Embed HTML → OG Tags (Googlebot)
- **Result**: Instagram posts now save successfully on Vercel production, not just localhost

**Key Commits:**
- `fix(instagram): add InstaFix as primary strategy for Vercel compatibility`

**Artifacts:**
- `apps/web/lib/instagram-extractor.ts` — InstaFix strategy, Googlebot UA for OG tags, 4-layer fallback

---

**Fix Instagram Carousel Extraction — All Images Now Captured (Feb 7)**
- **Root Cause: Desktop User-Agent on GraphQL API** — Instagram's GraphQL endpoint returns a 755KB HTML login wall when hit with a desktop Chrome UA. Switched to iPhone mobile UA, which returns proper JSON with full carousel data
- **Root Cause: Wrong typename check** — Instagram's API now returns `XDTGraphSidecar` for carousel posts, but the code only checked `GraphSidecar`. Carousel loop was skipped, only the cover image was extracted
- **Content-type guard** — Added check before `res.json()` to catch HTML responses from Instagram (prevents silent JSON parse failures)
- **Embed HTML fallback UA update** — Instagram embed endpoint also blocks desktop/Googlebot UAs now (returns login wall). Updated to mobile UA
- **OG Tags fallback UA update** — Same mobile UA fix for the OG tags last-resort strategy
- **Result**: 8-image carousel post now extracts all 8 images via GraphQL in ~200ms (was getting 0-2 images before)

**Key Commits:**
- `fix(instagram): use mobile UA and fix XDTGraphSidecar typename for full carousel extraction`

**Artifacts:**
- `apps/web/lib/instagram-extractor.ts` — Mobile UA, XDTGraphSidecar support, content-type guard

---

**Twitter Scraper Rewrite & GLM-4.7 Fix (Feb 6-7)**
- **FxTwitter API**: Rewrote Twitter/X extraction to use FxTwitter API as primary (no auth, rich JSON, ~200ms)
- **GLM-4.7 JSON parsing**: Fixed broken tool calling by switching to JSON-in-content approach with regex parsing

**Key Commits:**
- `feat(twitter): rewrite scraper with FxTwitter API for 99% reliability`
- `fix(ai): use JSON content parsing instead of broken GLM-4.7 tool calling`

---

**UI Polish, Mobile Hydration Fix & Scraper Modules (Feb 6)**
- **Add Modal Close Button Fix**: Close button was clipped by `overflow-hidden` and nearly invisible (`text-gray-400`). Moved inside bounds with `overflow-visible`, increased contrast (`text-gray-600`, `shadow-lg`), added 44x44px min tap target, responsive offsets, and `aria-label`
- **Mobile Layout Shift Fix**: `windowWidth` defaulted to 1200px (desktop), causing 4+ column flash on mobile before correcting to 1. Fixed by using CSS-based column classes (`columns-1 sm:columns-2 lg:columns-3...`) as SSR fallback, only switching to JS-calculated columns after mount
- **No-Transition Hydration Guard**: Existing `.no-transition` CSS class was defined but never used. Now applied via inline design-tokens script during initial render, removed after 2 animation frames to suppress color/layout transition flashes
- **Instagram Scraper Module Split**: Created 4 missing modules (`browser-factory.ts`, `scraper-config.ts`, `selectors.ts`, `scraper-metrics.ts`) that the refactored `instagram-scraper.ts` was importing but were never committed
- **Dev Server Port Cleanup**: Updated `predev` script to auto-kill stale processes on port 3737 before starting

**Key Commits:**
- `fix(ui): improve add modal close button visibility and mobile responsiveness`
- `fix(ssr): eliminate mobile layout shift with CSS column fallback`
- `feat(scraper): add browser-factory and scraper module split`

**Artifacts:**
- `apps/web/components/AddModal.tsx` — Visible close button, 44px tap target
- `apps/web/components/CardGridClient.tsx` — CSS column fallback for SSR
- `apps/web/lib/design-tokens.ts` — No-transition hydration guard
- `apps/web/lib/browser-factory.ts` — Stealth Playwright page factory
- `apps/web/lib/scraper-config.ts` — Scraper configuration constants
- `apps/web/lib/selectors.ts` — Instagram DOM selectors and CDN patterns
- `apps/web/lib/scraper-metrics.ts` — Scraper event recording
- `apps/web/package.json` — predev port cleanup script

---

**UI/UX Enhancements & Platform Support (Feb 5)**
- **Golden Ratio Design System**: Added CSS custom properties based on φ ≈ 1.618 for spacing
- **Card Size Slider**: Adjustable masonry grid density (0.7 compact to 1.5 expanded) with localStorage persistence
- **Platform Filter Pills**: Priority platforms (X, Reddit, YouTube, Instagram) always visible with "+N more" expansion
- **Clean Selection Styling**: Removed UI artifacts, simplified to bottom dot indicator
- **Mobile Touch Scrolling**: Added `touch-pan-x` and `-webkit-overflow-scrolling: touch` for smooth horizontal scrolling
- **Mobile Controls**: Card size slider now visible on all screen sizes
- **Perplexity.ai Support**: Added platform detection, screenshot config (mobile viewport), popup dismissal, and type mapping for AI research links
- **New "D" Logo**: Custom SVG logo with spark accent for "Digital consumption experiment" branding
- **Add Modal UX**: Moved close button outside input border for cleaner appearance
- **Serendipity Count Selector**: Users can choose how many random cards to explore (5/10/20/50/100)
- **Hydration Fix**: Fixed SSR/client mismatch in masonry grid column calculation

**Key Commits:**
- `feat(ui): add golden ratio design system, card size slider, and platform filters`
- `feat(platform): add Perplexity.ai support with screenshot config`
- `fix(build): resolve Vercel deployment type errors and SSR issues`
- `fix(ui): improve add modal close button and Perplexity support`
- `feat(ui): new D logo, serendipity count selector, fix hydration`

**Artifacts:**
- `apps/web/app/globals.css` — Golden ratio CSS variables, slider styling
- `apps/web/components/CardGridClient.tsx` — Card size slider with inline masonry styles, hydration fix
- `apps/web/components/TagScroller.tsx` — Platform filter pills with priority platforms
- `apps/web/components/Header.tsx` — Custom "D" SVG logo
- `apps/web/components/AddModal.tsx` — Repositioned close button
- `apps/web/components/SerendipityClient.tsx` — Card count selector
- `apps/web/lib/platforms.ts` — Perplexity platform definition
- `apps/web/lib/screenshot-playwright.ts` — Perplexity screenshot config with mobile viewport and popup dismissal
- `apps/web/lib/scraper.ts` — Perplexity-specific scraping handler

---

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
| Instagram carousels | ✅ Done | InstaFix primary (Vercel-safe), GraphQL fallback, all carousel images |
| Platform-specific AI | ✅ Done | Instagram, Twitter, website prompts |
| Dark mode | ✅ Done | Auto + manual with settings modal |
| AI feedback UX | ✅ Done | Stage-based progress indicators |
| Self-hosted screenshots | ✅ Done | Playwright-based, zero cost, unlimited |
| Serendipity mode | ✅ Done | Focus view, keyboard nav, shuffle, archive |
| Card consistency | ✅ Done | Domain links, external buttons, shared CardActions |
| Golden ratio design | ✅ Done | CSS variables based on φ ≈ 1.618 |
| Card size slider | ✅ Done | Adjustable grid density, mobile support |
| Platform filters | ✅ Done | Priority platforms, expandable pills, touch scroll |
| Perplexity.ai support | ✅ Done | Platform detection, screenshots, type mapping |
| Design token system | ✅ Done | 60/30/10 surfaces, elevation, radius, borders |
| AI enrichment reliability | ✅ Done | 3-tier GLM fallback, atomic claim, timing telemetry |
| Mobile-first search | ✅ Done | Bottom search bar on mobile, gradient fade, FAB above |
| Instagram CDN migration | ✅ Done | Batch repair of expired CDN URLs to Supabase storage |

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
| AI enrichment (vision) | <45s | ✅ 19-39s (GLM-4.6V) |
| AI enrichment (text fallback) | <30s | ✅ ~20s (GLM-4.7) |
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

| Twitter/X extraction | ✅ Done | FxTwitter API primary, syndication backup, no auth needed |
| Instagram API extractor | ✅ Done | InstaFix primary (Vercel-safe), GraphQL fallback, Googlebot OG tags |

*Last updated: 2026-02-07*
