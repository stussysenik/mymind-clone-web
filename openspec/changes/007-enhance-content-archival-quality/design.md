# Design: Enhanced Content Archival Quality

## Context

MyMind's content archival pipeline currently has three critical quality gaps:

1. **Screenshot Quality**: Microlink produces low-resolution (~480p) screenshots insufficient for visual archival
2. **AI Reliability**: No validation layer for AI-generated summaries, tags, and titles (trust blindly)
3. **User Agency**: No ability to choose between original and AI-generated titles per card

This design addresses all three gaps through a phased enhancement strategy, prioritizing screenshot quality (foundation for visual-first archival) followed by AI quality assurance and user control.

### Stakeholders
- **End Users**: Need high-quality archival screenshots and accurate AI metadata
- **AI Pipeline**: Requires validation framework without blocking <200ms save operations
- **Database**: Must accommodate new metadata fields without schema migrations

### Constraints
- Maintain <200ms optimistic save time (AI enrichment remains async)
- Backward compatibility for existing cards (no breaking changes)
- Cost optimization (context caching, fallback chains)
- Graceful degradation (fallbacks for every external dependency)

## Goals / Non-Goals

### Goals
1. **Archival-Quality Screenshots**: 1080p minimum resolution via ScreenshotOne API
2. **AI Quality Assurance**: 4-layer validation pipeline (DSPy + heuristics + symbolic + human-in-loop)
3. **User Title Control**: Toggle between original and AI-generated titles per card
4. **Cost Efficiency**: 40%+ cost reduction via GLM context caching
5. **Content Preservation**: 95%+ original formatting retention (threads, embedded media)

### Non-Goals
- Real-time validation during save (<200ms constraint prohibits this)
- Video processing or transcript generation (out of scope)
- Multi-language support for validation metrics (English only for MVP)
- Automatic re-processing of old cards (optional batch migration script)

## Decisions

### Decision 1: ScreenshotOne over Playwright Self-Hosted
**Rationale**: ScreenshotOne provides:
- Archival-quality rendering (1080p+, searchable PDFs)
- Managed infrastructure (no Docker/Kubernetes overhead)
- $0.005/screenshot pricing (competitive)
- Great DX for rapid iteration

**Alternatives Considered**:
- **Playwright self-hosted**: Lower per-screenshot cost but requires infrastructure management, cold start issues, and CDN distribution complexity
- **APIFlash/GrabzIt**: Similar to ScreenshotOne but less archival-focused features

**Trade-off**: Slight vendor lock-in vs infrastructure complexity. Fallback to Microlink mitigates downtime risk.

### Decision 2: DSPy for Prompt Optimization
**Rationale**: DSPy automates prompt engineering through:
- Metric-driven optimization (summary quality, tag relevance)
- LLM generates + tests prompt variations
- 46.2% → 64.0% accuracy improvement in benchmarks

**Alternatives Considered**:
- **Manual prompt engineering**: Time-intensive, no feedback loop
- **LangSmith/LangFuse**: Focused on observability, not optimization
- **Hybrid**: DSPy + LangChain (considered for Phase 2)

**Trade-off**: 1-2s validation overhead vs blind trust. Mitigated by async enrichment.

### Decision 3: Multi-Model Orchestration (GLM-4.6V + GLM-4.7)
**Rationale**: Vision model describes images → text model generates context-aware summaries
- Improves semantic coherence (vision informs text)
- Enables context caching ($0.11/1M vs $0.60/1M)
- Leverages GLM-4.7's 200K context window

**Alternatives Considered**:
- **Single model (GPT-4V)**: Higher cost, less control over coordination
- **Separate pipelines**: Vision + text run independently (current state, poor coherence)

**Trade-off**: Increased API complexity vs 40% cost savings and better quality.

### Decision 4: JSONB Metadata Extension over Schema Migration
**Rationale**: CardMetadata JSONB field allows:
- Zero-downtime deployments (no ALTER TABLE)
- Backward compatibility (old cards work without new fields)
- Flexible iteration (add fields without migrations)

**Alternatives Considered**:
- **New columns**: `title_source`, `original_title`, `ai_title` (requires migration)
- **Separate table**: `card_titles` (over-engineered for 3 fields)

**Trade-off**: Slight query complexity vs deployment safety and flexibility.

### Decision 5: Phased Rollout (6 Phases)
**Rationale**: Each phase delivers user-visible value independently:
1. Screenshot quality (immediate visual improvement)
2. AI QA (reduces "meaningless noise")
3. Multi-model coordination (cost + quality)
4. Content preservation (thread context, formatting)
5. Title control (user agency)
6. Batch migration (retroactive quality boost)

**Alternatives Considered**:
- **Big bang**: All features at once (high risk, hard to debug)
- **Feature flags**: Adds complexity, harder to validate phases independently

**Trade-off**: Longer delivery timeline vs reduced deployment risk.

## Architecture

### Screenshot Capture Flow
```
User saves URL
    ↓
scraper.ts: scrapeUrl()
    ↓
screenshot.ts: captureScreenshot()
    ├─ Try ScreenshotOne API
    │   ├─ Success → Return 1080p image URL
    │   └─ Failure → Log error, continue to fallback
    └─ Fallback: Microlink (current behavior)
```

### AI Quality Assurance Pipeline
```
/api/enrich (async)
    ↓
1. GLM-4.6V: Analyze image → Extract colors, objects, vibe
    ↓
2. GLM-4.7: Generate summary (with vision context)
    ↓
3. DSPy Validation: Check summary quality metrics
    ├─ Pass → Continue
    └─ Fail → Retry with optimized prompt (max 2 retries)
    ↓
4. Heuristic Checks: Length, keyword density, sentiment
    ↓
5. Symbolic Reasoning: Pattern matching for structure
    ↓
6. Confidence Score: Flag if <0.7 for human review
    ↓
7. Update card.metadata (enrichedAt, processing=false)
```

### Title Source Control Flow
```
CardDetailModal
    ↓
[Toggle: Original ↔ AI]
    ↓
useState: titleSource
    ↓
Display: metadata.originalTitle | metadata.aiTitle
    ↓
Save: PATCH /api/cards/[id]
    └─ Update metadata.titleSource
```

## Data Model Changes

### CardMetadata Interface (JSONB Extension)
```typescript
export interface CardMetadata {
  // Existing fields...
  summary?: string;
  colors?: string[];
  images?: string[];

  // NEW: Title source control
  titleSource?: 'original' | 'ai';      // User preference
  originalTitle?: string;                // Scraped title (if available)
  aiTitle?: string;                      // AI-generated title

  // NEW: QA validation metadata
  validationScore?: number;              // 0.0-1.0 confidence
  validationFlags?: string[];            // ["low-quality", "needs-review"]

  // NEW: Content preservation
  formatting?: {
    lineBreaks?: boolean;
    codeBlocks?: boolean;
    emphasis?: boolean;
  };
  threadContext?: {
    parentTweetId?: string;
    replies?: number;
  };
  embeddedMedia?: {
    videoUrl?: string;
    embedCode?: string;
  };
}
```

## Risks / Trade-offs

### Risk 1: ScreenshotOne Rate Limits
**Impact**: 5xx errors during high-traffic periods
**Mitigation**:
- Fallback to Microlink immediately (no user impact)
- Exponential backoff + retry logic
- Monitor rate limit headers, adjust concurrency

### Risk 2: DSPy Validation Latency
**Impact**: AI enrichment takes 3-5s instead of 1-2s
**Mitigation**:
- Async enrichment (user never waits)
- Parallel validation layers where possible
- Skip DSPy for low-risk content types (e.g., notes)

### Risk 3: Context Caching Complexity
**Impact**: Incorrect cache keys → stale or wrong summaries
**Mitigation**:
- Cache key includes: imageUrl hash + content hash
- TTL: 24 hours (fresh daily)
- Monitor cache hit rates in production

### Risk 4: Migration Cost (10k+ Cards)
**Impact**: $50-100 in API costs to re-process all cards
**Mitigation**:
- Batch processing (1000 cards at a time)
- Rate limiting (10 cards/second max)
- Optional: User opts in to migration

### Risk 5: Title Source Confusion
**Impact**: Users toggle between titles and lose context
**Mitigation**:
- Visual indicator (icon/badge) showing active source
- Preserve both titles always (never overwrite)
- Default to original if scraped successfully

## Migration Plan

### Phase 1: Screenshot Quality (Week 1)
1. Add `SCREENSHOTONE_API_KEY` to `.env`
2. Install `screenshotone-api-sdk` dependency
3. Create `lib/screenshot.ts` with fallback chain
4. Update `lib/scraper.ts` to use new capture function
5. Deploy to staging, validate quality + latency
6. Deploy to production with monitoring

**Rollback**: Remove ScreenshotOne integration, revert to Microlink (1 line change)

### Phase 2-5: AI QA, Orchestration, Preservation, Title Control
Each phase follows similar pattern:
1. Implement new capability in isolated module
2. Add feature flag for gradual rollout
3. Test on staging with synthetic data
4. Deploy to production (async enrichment = safe)
5. Monitor validation metrics + error rates

**Rollback**: Feature flags allow instant disable without redeployment

### Phase 6: Batch Migration (Week 6)
1. Create `scripts/migrate-cards.ts` batch processor
2. Add CLI progress bar + resume capability
3. Test on 100 cards in staging
4. Run migration in production (off-peak hours)
5. Validate quality improvement with user samples

**Rollback**: Migration doesn't modify existing data, only adds new fields

## Open Questions

1. **ScreenshotOne Pricing**: Confirm $0.005/screenshot pricing tier for expected volume (1000+/month)
   - **Resolution**: Check ScreenshotOne pricing page before implementation

2. **DSPy Metrics**: What validation metrics best predict user satisfaction?
   - **Resolution**: Start with summary length (50-150 chars) + tag relevance (keyword overlap)

3. **Context Caching TTL**: 24 hours or 7 days for cached GLM responses?
   - **Resolution**: Start with 24 hours, monitor cache hit rates, adjust if <50%

4. **Migration Opt-In**: Should batch migration be automatic or user-initiated?
   - **Resolution**: Automatic for new users, opt-in modal for existing users with 1000+ cards

## Success Criteria

### Phase 1 (Screenshot Quality)
- ✅ 95% of screenshots are 1080p minimum
- ✅ <5s capture time for 95% of URLs
- ✅ Zero downtime (fallback chain working)

### Phase 2 (AI QA)
- ✅ 80%+ validation score on synthetic test set
- ✅ <10% of summaries flagged for human review
- ✅ <3s validation overhead

### Phase 3 (Multi-Model Orchestration)
- ✅ Context-aware summaries (vision informs text)
- ✅ 40%+ cost reduction via caching
- ✅ <5s total enrichment time

### Phase 4 (Content Preservation)
- ✅ 95%+ formatting retention for code, emphasis, line breaks
- ✅ Thread context preserved for Twitter/Reddit
- ✅ Embedded media metadata extracted

### Phase 5 (Title Control)
- ✅ User controls title source on 100% of cards
- ✅ Both titles preserved (no data loss)
- ✅ Toggle updates immediately (<200ms)

### Phase 6 (Batch Migration)
- ✅ 100% of cards re-processed successfully
- ✅ Zero data loss during migration
- ✅ User-reported quality improvement (+20% satisfaction)
