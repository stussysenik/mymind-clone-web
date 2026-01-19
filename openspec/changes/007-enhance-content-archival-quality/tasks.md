# Implementation Tasks

## Phase 1: Screenshot Quality (Priority)

### 1.1 ScreenshotOne Integration
- [ ] 1.1.1 Research ScreenshotOne API documentation and pricing tiers
- [ ] 1.1.2 Add `SCREENSHOTONE_API_KEY` and `SCREENSHOTONE_PROJECT_ID` to `.env.example`
- [ ] 1.1.3 Install `screenshotone-api-sdk` package (`npm install screenshotone-api-sdk`)
- [ ] 1.1.4 Create `apps/web/lib/screenshot.ts` with ScreenshotOne client initialization
- [ ] 1.1.5 Implement `captureScreenshot(url: string)` function with 1080p+ quality settings
- [ ] 1.1.6 Add retry logic with exponential backoff (max 3 attempts)
- [ ] 1.1.7 Implement fallback chain: ScreenshotOne → Microlink (graceful degradation)

### 1.2 Scraper Integration
- [ ] 1.2.1 Update `apps/web/lib/scraper.ts` to import `captureScreenshot`
- [ ] 1.2.2 Replace Microlink screenshot calls with new capture function
- [ ] 1.2.3 Add error handling and logging for screenshot capture failures
- [ ] 1.2.4 Preserve existing Microlink fallback for Instagram/Twitter (use both)

### 1.3 Testing & Validation
- [ ] 1.3.1 Create test URLs covering: YouTube, Instagram, Twitter, generic websites
- [ ] 1.3.2 Test screenshot quality on staging (verify 1080p minimum)
- [ ] 1.3.3 Test fallback chain by simulating ScreenshotOne API failures
- [ ] 1.3.4 Measure capture time (target <5s for 95% of URLs)
- [ ] 1.3.5 Monitor error rates and rate limit headers in logs

### 1.4 Deployment
- [ ] 1.4.1 Add ScreenshotOne API key to staging environment variables
- [ ] 1.4.2 Deploy to staging and test with real URLs
- [ ] 1.4.3 Add ScreenshotOne API key to production environment variables
- [ ] 1.4.4 Deploy to production with monitoring alerts
- [ ] 1.4.5 Monitor screenshot quality and capture times for 48 hours

## Phase 2: AI Quality Assurance Pipeline

### 2.1 DSPy Framework Setup
- [ ] 2.1.1 Research DSPy documentation and installation requirements
- [ ] 2.1.2 Install `dspy-ai` package (`npm install dspy-ai`)
- [ ] 2.1.3 Create `apps/web/lib/validation/dspy-optimizer.ts` module
- [ ] 2.1.4 Define validation metrics: `summaryQuality`, `tagRelevance`, `contentPreservation`
- [ ] 2.1.5 Implement DSPy metric functions (50-150 char length, keyword overlap)
- [ ] 2.1.6 Create prompt optimization pipeline with bootstrapping

### 2.2 Heuristic Validation Layer
- [ ] 2.2.1 Create `apps/web/lib/validation/heuristics.ts` module
- [ ] 2.2.2 Implement length checks (summary: 50-150 chars, tags: 3-5)
- [ ] 2.2.3 Implement keyword density checks (avoid generic terms)
- [ ] 2.2.4 Implement sentiment analysis (flag extreme sentiment)
- [ ] 2.2.5 Add validation thresholds and scoring logic

### 2.3 Symbolic Reasoning Layer
- [ ] 2.3.1 Create `apps/web/lib/validation/symbolic.ts` module
- [ ] 2.3.2 Implement structural pattern matching (title format, tag structure)
- [ ] 2.3.3 Add domain-specific rules (e.g., YouTube → video, GitHub → code)
- [ ] 2.3.4 Implement consistency checks (title matches content)

### 2.4 Human-in-the-Loop Flagging
- [ ] 2.4.1 Add `validationScore` and `validationFlags` to CardMetadata interface
- [ ] 2.4.2 Update `apps/web/components/CardDetailModal.tsx` to show validation warnings
- [ ] 2.4.3 Add visual indicator (⚠️ icon) for low-confidence cards (<0.7 score)
- [ ] 2.4.4 Add "Report Issue" button to flag incorrect AI outputs

### 2.5 Pipeline Integration
- [ ] 2.5.1 Update `apps/web/app/api/enrich/route.ts` to run QA pipeline
- [ ] 2.5.2 Implement sequential validation: DSPy → Heuristics → Symbolic
- [ ] 2.5.3 Calculate final confidence score (weighted average)
- [ ] 2.5.4 Add retry logic for failed validations (max 2 retries)
- [ ] 2.5.5 Store validation metadata in card.metadata

### 2.6 Testing & Validation
- [ ] 2.6.1 Create synthetic test dataset (50 cards covering edge cases)
- [ ] 2.6.2 Run QA pipeline on test set, measure accuracy (target 80%+)
- [ ] 2.6.3 Test validation latency (target <3s overhead)
- [ ] 2.6.4 Deploy to staging and validate with real content
- [ ] 2.6.5 Monitor flagged cards rate (target <10%)

## Phase 3: Multi-Model AI Orchestration

### 3.1 Parameter Tuning
- [ ] 3.1.1 Research GLM API parameter documentation (temperature, top_p, max_tokens)
- [ ] 3.1.2 Create `apps/web/lib/ai-config.ts` for model configuration
- [ ] 3.1.3 Add environment variables for model parameters
- [ ] 3.1.4 Implement parameter tuning logic based on content type

### 3.2 Vision-Text Coordination
- [ ] 3.2.1 Update `apps/web/lib/ai.ts` `classifyContent()` function
- [ ] 3.2.2 Pass GLM-4.6V vision outputs to GLM-4.7 text model as context
- [ ] 3.2.3 Implement vision → text pipeline (sequential, not parallel)
- [ ] 3.2.4 Add vision context formatting (colors, objects, vibe → prompt)

### 3.3 Context Caching
- [ ] 3.3.1 Research GLM context caching API and cache key requirements
- [ ] 3.3.2 Implement cache key generation (imageUrl hash + content hash)
- [ ] 3.3.3 Add cache TTL configuration (default 24 hours)
- [ ] 3.3.4 Update API calls to use cached context when available
- [ ] 3.3.5 Add cache hit/miss logging for monitoring

### 3.4 Prompt Templates
- [ ] 3.4.1 Create `apps/web/lib/prompts/optimized/` directory
- [ ] 3.4.2 Add DSPy-optimized prompt templates for classification
- [ ] 3.4.3 Add DSPy-optimized prompt templates for summarization
- [ ] 3.4.4 Add DSPy-optimized prompt templates for tagging
- [ ] 3.4.5 Update AI functions to use optimized templates

### 3.5 Testing & Validation
- [ ] 3.5.1 Test vision-text coordination with image-heavy content
- [ ] 3.5.2 Measure context caching cost savings (target 40%+ reduction)
- [ ] 3.5.3 Monitor cache hit rates (target >50%)
- [ ] 3.5.4 Test total enrichment time (target <5s)
- [ ] 3.5.5 Deploy to staging and validate with production-like data

## Phase 4: Content Preservation

### 4.1 Formatting Metadata
- [ ] 4.1.1 Add `formatting` field to CardMetadata interface
- [ ] 4.1.2 Update `apps/web/lib/scraper.ts` to extract line breaks
- [ ] 4.1.3 Extract code blocks with syntax highlighting metadata
- [ ] 4.1.4 Extract emphasis (bold, italic, links) from HTML
- [ ] 4.1.5 Store formatting metadata in card.metadata

### 4.2 Thread Context Extraction
- [ ] 4.2.1 Add `threadContext` field to CardMetadata interface
- [ ] 4.2.2 Update Twitter scraper to extract parent tweet ID
- [ ] 4.2.3 Extract reply count and thread structure
- [ ] 4.2.4 Update Reddit scraper to extract thread context
- [ ] 4.2.5 Store thread metadata for future navigation

### 4.3 Embedded Media Extraction
- [ ] 4.3.1 Add `embeddedMedia` field to CardMetadata interface
- [ ] 4.3.2 Extract video URLs from Twitter/Instagram embeds
- [ ] 4.3.3 Extract embed codes for iframes (YouTube, Vimeo)
- [ ] 4.3.4 Store media metadata for potential future playback

### 4.4 Display Components
- [ ] 4.4.1 Update `apps/web/components/CardDetailModal.tsx` to render formatting
- [ ] 4.4.2 Add code syntax highlighting with Prism or Shiki
- [ ] 4.4.3 Render line breaks and emphasis from metadata
- [ ] 4.4.4 Add thread navigation UI for Twitter/Reddit context
- [ ] 4.4.5 Add embedded media preview (thumbnails with play button)

### 4.5 Testing & Validation
- [ ] 4.5.1 Test formatting preservation with GitHub code snippets
- [ ] 4.5.2 Test thread context with Twitter conversation threads
- [ ] 4.5.3 Test embedded media extraction with YouTube embeds
- [ ] 4.5.4 Measure formatting retention rate (target 95%+)
- [ ] 4.5.5 Deploy to staging and validate with diverse content types

## Phase 5: Title Source Control

### 5.1 Data Model Extension
- [ ] 5.1.1 Add `titleSource`, `originalTitle`, `aiTitle` to CardMetadata interface
- [ ] 5.1.2 Update TypeScript types in `apps/web/lib/types.ts`
- [ ] 5.1.3 Add database migration guide to documentation (JSONB extension, no ALTER TABLE needed)

### 5.2 Save Logic Update
- [ ] 5.2.1 Update `apps/web/app/api/save/route.ts` to store both titles
- [ ] 5.2.2 Store original title from scraper as `metadata.originalTitle`
- [ ] 5.2.3 Store AI-generated title as `metadata.aiTitle`
- [ ] 5.2.4 Set default `titleSource`: 'original' if scraped successfully, otherwise 'ai'
- [ ] 5.2.5 Preserve active title in `card.title` field for backward compatibility

### 5.3 UI Component
- [ ] 5.3.1 Update `apps/web/components/CardDetailModal.tsx` to add title toggle
- [ ] 5.3.2 Add toggle button UI (icon: 🔄 or ⇄) next to title
- [ ] 5.3.3 Implement toggle state management with useState
- [ ] 5.3.4 Display active title based on `metadata.titleSource`
- [ ] 5.3.5 Add visual indicator (badge/icon) showing active source

### 5.4 Update API
- [ ] 5.4.1 Create PATCH `/api/cards/[id]/title-source` endpoint
- [ ] 5.4.2 Implement title source update logic (toggle between 'original' and 'ai')
- [ ] 5.4.3 Update `card.title` to reflect active title
- [ ] 5.4.4 Add optimistic UI update in frontend
- [ ] 5.4.5 Add error handling and rollback for failed updates

### 5.5 Testing & Validation
- [ ] 5.5.1 Test toggle functionality with cards that have both titles
- [ ] 5.5.2 Test default behavior (original preferred, AI fallback)
- [ ] 5.5.3 Test cards with only original title (no AI)
- [ ] 5.5.4 Test cards with only AI title (scrape failed)
- [ ] 5.5.5 Verify toggle updates immediately (<200ms)

## Phase 6: Batch Migration

### 6.1 Migration Script
- [ ] 6.1.1 Create `apps/web/scripts/migrate-cards.ts` batch processor
- [ ] 6.1.2 Implement card fetching with pagination (1000 cards/batch)
- [ ] 6.1.3 Add progress tracking with progress bar (e.g., ora or cli-progress)
- [ ] 6.1.4 Add resume capability (track last processed card ID)
- [ ] 6.1.5 Implement rate limiting (10 cards/second max)

### 6.2 Re-Processing Logic
- [ ] 6.2.1 Re-run screenshot capture for all cards with imageUrl
- [ ] 6.2.2 Re-run AI enrichment with QA validation pipeline
- [ ] 6.2.3 Re-run content preservation for formatting/thread context
- [ ] 6.2.4 Update title fields (originalTitle, aiTitle) for existing cards
- [ ] 6.2.5 Preserve existing metadata (don't overwrite user notes)

### 6.3 Monitoring & Safety
- [ ] 6.3.1 Add dry-run mode to preview changes without saving
- [ ] 6.3.2 Add error handling for individual card failures (skip, log, continue)
- [ ] 6.3.3 Implement rollback capability (store original metadata as backup)
- [ ] 6.3.4 Add cost estimation before starting migration
- [ ] 6.3.5 Add success/failure summary report at end

### 6.4 Deployment
- [ ] 6.4.1 Test migration on staging with 100 sample cards
- [ ] 6.4.2 Validate quality improvement with manual review (10 cards)
- [ ] 6.4.3 Run migration in production during off-peak hours
- [ ] 6.4.4 Monitor error rates and API costs during migration
- [ ] 6.4.5 Generate summary report and share with stakeholders

### 6.5 User Communication
- [ ] 6.5.1 Create opt-in modal for users with 1000+ cards
- [ ] 6.5.2 Add migration status indicator in settings
- [ ] 6.5.3 Send notification when migration completes
- [ ] 6.5.4 Add FAQ documentation for migration process
- [ ] 6.5.5 Collect user feedback on quality improvement

## Cross-Phase Tasks

### Documentation
- [ ] Update README with new environment variables
- [ ] Document ScreenshotOne API setup in CLAUDE.md
- [ ] Add validation metrics documentation
- [ ] Create troubleshooting guide for common issues

### Monitoring
- [ ] Add Sentry alerts for screenshot capture failures
- [ ] Add cost monitoring for GLM API usage
- [ ] Add validation score tracking in analytics
- [ ] Create dashboard for QA metrics

### Testing
- [ ] Add unit tests for validation modules
- [ ] Add integration tests for AI orchestration
- [ ] Add E2E tests for title toggle UI
- [ ] Add performance benchmarks for enrichment time
