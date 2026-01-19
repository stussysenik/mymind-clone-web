# Change: Enhance Content Archival Quality

## Why

Current content preservation suffers from three critical quality gaps:
1. **Low-resolution screenshots**: Microlink fallback produces ~480p images insufficient for archival purposes
2. **No AI validation**: AI outputs (summaries, tags, titles) are trusted blindly without quality checks
3. **Missing user control**: Users cannot choose between original and AI-generated titles per card

User feedback confirms: "Content saving is giving us meaningless noise" and "Screenshots and assets are very low-quality." This degrades the core value proposition of MyMind as a visual knowledge manager.

## What Changes

This change implements a phased enhancement to content archival quality:

### Phase 1: Screenshot Quality (Priority)
- Replace Microlink with ScreenshotOne API for 1080p+ archival-quality screenshots
- Implement fallback chain: ScreenshotOne → Microlink (graceful degradation)
- Add retry logic with exponential backoff for reliability

### Phase 2: AI Quality Assurance Pipeline
- Layer 1: DSPy framework for automated prompt optimization
- Layer 2: Heuristic validation (length, keyword, sentiment checks)
- Layer 3: Symbolic reasoning for structural pattern matching
- Layer 4: Human-in-the-loop flagging for low-confidence outputs

### Phase 3: Multi-Model AI Orchestration
- Coordinate GLM-4.6V (vision) + GLM-4.7 (text) intelligently
- Pass vision model outputs as context to text model for coherent summaries
- Implement context caching to reduce costs by 40%+ ($0.11/1M vs $0.60/1M)

### Phase 4: Content Preservation
- Store original formatting metadata (line breaks, emphasis, code highlighting)
- Preserve thread context for Twitter/Reddit conversations
- Extract embedded media metadata (video URLs, embed codes)

### Phase 5: Title Source Control
- Add `metadata.titleSource`, `originalTitle`, `aiTitle` fields to CardMetadata
- UI toggle in CardDetailModal to switch between sources
- Default: original title if scraped successfully, otherwise AI-generated

### Phase 6: Batch Migration
- Re-process all existing cards with new pipeline
- Implement progress tracking and resume capability
- Rate limiting to avoid API throttling

## Impact

### Affected Specs
- `asset-capture` - NEW: High-quality screenshot capture capability
- `ai-orchestration` - NEW: Multi-model coordination and parameter tuning
- `qa-validation` - NEW: 4-layer AI quality assurance pipeline
- `content-preservation` - NEW: Original formatting and thread context retention
- `title-control` - NEW: User control over title source per card

### Affected Code
- `apps/web/lib/scraper.ts` - Add ScreenshotOne integration with fallback chain
- `apps/web/lib/ai.ts` - Multi-model coordination, parameter tuning, context caching
- `apps/web/app/api/save/route.ts` - Enhanced content preservation during save
- `apps/web/app/api/enrich/route.ts` - QA validation pipeline execution
- `apps/web/components/CardDetailModal.tsx` - Title source toggle UI
- `apps/web/lib/validation/` (NEW) - DSPy + heuristic validation modules
- `apps/web/lib/types.ts` - Extend CardMetadata interface

### Database Schema
- Add `titleSource`, `originalTitle`, `aiTitle` to CardMetadata JSONB field (no migration needed, backward-compatible)

### Dependencies
- Add `screenshotone-api-sdk` for screenshot capture
- Add `dspy-ai` for prompt optimization (Phase 2)

### Success Metrics
- Screenshot quality: 1080p minimum (vs ~480p Microlink baseline)
- Content preservation: 95%+ of original formatting retained
- AI accuracy: 80%+ on validation metrics (vs ~60% estimated baseline)
- Cost efficiency: 40%+ reduction via context caching
- User satisfaction: Title control on 100% of cards

### Risks
- ScreenshotOne API rate limits or downtime (mitigated by Microlink fallback)
- DSPy optimization adds 1-2s latency (mitigated by async enrichment)
- Context caching complexity (mitigated by phased rollout)
- Migration cost if processing 10k+ existing cards (rate limited, batched)

### Migration Path
- All phases are backward-compatible (JSONB fields extend gracefully)
- Existing cards continue working without re-processing
- Phase 6 batch migration is optional but recommended for quality improvement
