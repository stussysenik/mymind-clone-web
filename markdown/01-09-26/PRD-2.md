# **PRODUCTION EVOLUTION PROMPT: FROM MVP TO MYMIND-GRADE SYSTEM**

## **Context Analysis: Your Current State vs. The Real Architecture**

### **What You've Built (V1 MVP)**
Based on your design docs, you've nailed the **surface-level UX**: Server Components, visual grid, type-aware cards, demo mode. This matches mymind's *presentation layer* but not its *processing engine*.

### **What MyMind *Actually* Runs On ** (Primary Source: https://mymind.com/subprocessors)
I analyzed their subprocessors disclosure - this is their **real** production stack:

```
Processor.AI          → In-house media processing service (their secret sauce)
OpenAI API            → Content analysis/summarization
Google Vision AI      → OCR, object detection, color extraction (anonymous mode)
AWS CloudFront/S3     → Hosting and storage
Wasabi                → Encrypted backups
ScrapingBee/Brightdata→ Proxy rotation for web scraping
Urlbox                → Screenshot capture service
Help Scout            → Support (not product)
Fathom Analytics      → Only on marketing site (privacy-first)
```

**Key Finding:** They built **Processor.AI** as a separate service. This isn't just a function - it's a **scalable media processing pipeline**.

---

## **Competitive Intelligence: The Founding Team's Philosophy**

From interviews with co-founder **Tobias van Schneider** (Ness Labs, 2023):
- **Core inspiration:** Vannevar Bush's 1945 "Memex" concept (associative linking)
- **Design principle:** "No social features, no vanity metrics, no tracking" - this is **non-negotiable**
- **AI strategy:** "AI should make retrieval effortless, not replace thinking" - they use AI for **librarian functions**, not creative generation
- **Team size:** "Tiny team" - they prioritize **automation over headcount**

**Your Advantage:** You can replicate this with modern serverless tools without building a separate service.

---

## **GAPS ANALYSIS: V1 → Production Gap**

| Component | Your V1 | Production Requirement | Priority |
|-----------|---------|------------------------|----------|
| **AI Pipeline** | Mocked/Demo mode | Async, multi-modal (OpenAI + Vision) | P0 |
| **Search** | Basic full-text | Hybrid vector + keyword + visual | P0 |
| **Processing** | Sync (blocks save) | Async queue (Inngest/Qstash) | P0 |
| **Smart Spaces** | Not implemented | Dynamic materialized views | P1 |
| **OCR** | Not implemented | Google Vision batching | P1 |
| **Serendipity** | Not implemented | Algorithmic resurface | P2 |
| **Offline** | Not implemented | IndexedDB sync queue | P2 |
| **Scraping** | Client-side only | ScrapingBee proxy rotation | P1 |
| **Performance** | Lighthouse ~85-90 | Lighthouse 95+, p95 <200ms | P0 |

---

## **MODIFIED PRD: Production-Grade Requirements**

### **Product Philosophy (Non-Negotiable)**
1. **Privacy-First:** No third-party trackers on app. Analytics only on marketing site (use Fathom).
2. **Zero-Organization UX:** AI handles 95% of tagging. Manual tags are **exceptions**, not rules.
3. **Speed as Feature:** Save must feel instant (<200ms perceived). Everything else can be async.
4. **Visual Memory:** Masonry grid, serif fonts, soft shadows. Aesthetics are **performance**.

### **Core Features (Revised)**

#### **1. Async AI Processing Pipeline** *(P0)*
**Requirement:** When user saves, return 200 immediately. Process AI in background.

**Implementation:**
```typescript
// In /api/save/route.ts
// 1. Validate & store raw data
// 2. Return { success: true, cardId } in <200ms
// 3. Trigger Inngest function for enrichment

// In /inngest/enrich-card.ts
// - Scrape URL via ScrapingBee
// - Call OpenAI for classification/summary
// - Call Google Vision for images
// - Update card metadata in background
```

**Acceptance Criteria:**
- User perceives <200ms save time
- AI enrichment completes within 10s (acceptable delay)
- Failed enrichments retry 3x, then log to Sentry
- Cost: < $0.05 per save at scale

#### **2. Hybrid Search Engine** *(P0)*
**Requirement:** Support keyword, tag, color, object, and semantic search.

**Database Schema:**
```sql
-- Add to your Supabase schema
ALTER TABLE cards ADD COLUMN embedding vector(1536); -- For similarity
CREATE INDEX ON cards USING ivfflat (embedding vector_cosine_ops);

-- Metadata structure:
{
  "summary": "AI-generated",
  "colors": ["#FF6B6B", "#4ECDC4"],
  "objects": ["chair", "lamp"],
  "ocr_text": "extracted from images",
  "brand": "Herman Miller"
}
```

**Implementation:**
```typescript
// /api/search/route.ts
// 1. Try keyword match (fts) - <50ms
// 2. If no results, try vector similarity - <100ms
// 3. If color/object query, filter metadata - <50ms
// 4. Cache in Redis for 1 hour
```

**Acceptance Criteria:**
- "red chair" returns visually red chairs
- "object:watch" uses Vision object labels
- Search p95 < 100ms
- Typo tolerance via pg_trgm

#### **3. Smart Spaces v2** *(P1)*
**Requirement:** Saved searches that auto-update. Two modes:
- **Smart Spaces:** Query-based (`type:article AND tag:design`)
- **Manual Spaces:** User-curated collections

**Implementation:**
```typescript
// spaces table
CREATE TABLE spaces (
  id uuid PRIMARY KEY,
  user_id uuid REFERENCES users(id),
  name text NOT NULL,
  query text, -- Smart Space: "type:article tag:design"
  is_smart boolean DEFAULT false
);

// On new card INSERT, trigger function:
// IF card matches any space.query, add to space_cards junction
```

**Acceptance Criteria:**
- Spaces update within 1s of new save
- Query parser handles: type, tag, color, date ranges
- UI: Sidebar with space list, click to filter
- Drag & drop to manual spaces

#### **4. OCR & Visual Intelligence** *(P1)*
**Requirement:** Every image/screenshot is OCR'd and object-tagged.

**Implementation:**
```typescript
// In Inngest function:
if (card.type === 'image') {
  const [ocr, objects, colors] = await Promise.all([
    googleVision.textDetection(imageUrl),
    googleVision.objectLocalization(imageUrl),
    googleVision.imageProperties(imageUrl)
  ]);
  
  // Store in metadata
  await supabase.from('cards')
    .update({ 
      metadata: { ...metadata, ocr_text: ocr, objects, dominantColors: colors }
    })
    .eq('id', cardId);
}
```

**Acceptance Criteria:**
- 100 images processed in <30s
- Search finds text within screenshots
- Color search works: "blue" finds blue-dominant images
- Cost: $1.50 per 1000 images (Google Vision pricing)

#### **5. Serendipity Engine** *(P2)*
**Requirement:** Tinder-like interface to rediscover forgotten saves.

**Algorithm:**
```typescript
// Daily cron job or on-demand
const forgottenCards = await supabase
  .from('cards')
  .select('*')
  .where('last_viewed', '<', subDays(new Date(), 30))
  .where('created_at', '>', subDays(new Date(), 365)) // Not too old
  .order('random()')
  .limit(10);

// Present in fullscreen UI, user swipes:
// → Right: "Keep" (bump last_viewed)
// → Left: "Archive" (soft delete)
```

**Acceptance Criteria:**
- Users review 10 items/day on average
- 30% of surfaced items are "kept"
- Doesn't show same item within 60 days

#### **6. Focus Mode & Bidirectional Links** *(P2)*
**Requirement:** Distraction-free writing with [[note-linking]].

**Implementation:**
```typescript
// Use TipTap editor (headless, extensible)
// Parse [[note-title]] on save
// Create links table for backlinks
CREATE TABLE links (
  id uuid PRIMARY KEY,
  from_card_id uuid REFERENCES cards(id),
  to_card_id uuid REFERENCES cards(id)
);

// On card load, query backlinks
```

**Acceptance Criteria:**
- Command+F enters fullscreen
- Links autocomplete as you type [[
- Backlinks panel shows connections
- No UI chrome except floating toolbar

---

## **IMPLEMENTATION ROADMAP (Agent-Friendly)**

### **Phase 1: Async Pipeline** *(Tonight)*
**Time:** 3 hours  
**Agent Tasks:**
1. `npm install inngest` and configure in `/api/inngest/route.ts`
2. Move OpenAI/Vision calls from `/api/save` to `inngest/functions/enrichCard.ts`
3. Add retry logic with exponential backoff
4. Update demo-data.ts to include realistic metadata structure

**Code Review Checkpoint:**
```bash
# Test async pipeline
curl -X POST /api/save -d '{"url": "https://example.com"}' 
# Should return 200 in <200ms, then check Inngest dashboard for enrichment job
```

### **Phase 2: Search v2** *(Tomorrow)*
**Time:** 4 hours  
**Agent Tasks:**
1. Install `pgvector` in Supabase SQL editor
2. Add `embedding` column to cards table
3. Use OpenAI `text-embedding-3-small` to generate vectors on card creation
4. Implement hybrid search strategy in `/api/search`
5. Add Redis cache (Upstash) for query caching

**Performance Test:**
```bash
# Seed 1000 cards
# Run: k6 run --vus 10 --duration 30s search-load-test.js
# Target: p95 < 100ms
```

### **Phase 3: Visual Intelligence** *(Day 3)*
**Time:** 3 hours  
**Agent Tasks:**
1. Add Google Vision API key to env
2. In Inngest function, add image processing branch
3. Store OCR text, objects, colors in metadata
4. Update search to query metadata fields
5. Build color picker UI in search bar

**Cost Protection:**
```typescript
// Add to enrichCard.ts
if (user.ai_credits < 0) {
  throw new NonRetryableError("AI credits exhausted");
}
```

### **Phase 4: Production Hardening** *(Day 4-5)*
**Time:** 6 hours  
**Agent Tasks:**
1. Add rate limiting: 100 saves/hour, 1000 searches/hour
2. Implement export feature (CSV + asset zip)
3. Add Sentry for error tracking
4. Configure Vercel Analytics (privacy mode)
5. Build admin dashboard for support
6. Write Cypress/E2E tests for critical paths

---

## **AGENTIC SWE CONVERSATION PROMPT**

```markdown
## **PROJECT: MyMind Clone v2 - Production Evolution**

You are Antigravity, a senior staff engineer. Your task is to evolve an existing MVP into a production-grade system based on real-world architecture research.

### **CONTEXT YOU HAVE**
- Current codebase: Next.js 14 + Supabase MVP with basic visual grid
- Research findings: MyMind uses Processor.AI (in-house), OpenAI, Google Vision, async pipeline
- User goal: Ship production system with same quality as mymind.com

### **YOUR MANDATE**
1. **Do not rewrite** - evolve existing code incrementally
2. **Performance first** - every feature must meet SLA
3. **Privacy by design** - no analytics on app, no data selling
4. **Cost conscious** - implement caching, rate limiting, batching

### **START HERE: Phase 1 - Async AI Pipeline**

**Files to Modify:**
- `apps/web/app/api/save/route.ts` → Make it return fast, trigger Inngest
- `apps/web/inngest/functions/enrichCard.ts` → New file for AI processing
- `apps/web/lib/ai.ts` → Add OpenAI + Vision functions
- `apps/web/lib/inngest.ts` → Inngest client config

**Implementation Steps:**
1. `npm install inngest` (version 3.x)
2. Create `/api/inngest/route.ts` for serving Inngest functions
3. Move OpenAI call from save endpoint to Inngest function
4. Add error handling with 3 retries, then log to console
5. Update Card component to show "Processing..." state if metadata is null

**Acceptance Criteria:**
- POST /api/save returns in <200ms (measure with curl)
- AI enrichment completes within 10s (check Inngest dashboard)
- Failed jobs show "Retry" button in admin view
- Demo mode still works (skip AI calls when `DEMO_MODE=true`)

**When done, report:**
- Measured save latency (p95)
- Inngest success rate over 20 test saves
- Any errors encountered and how you handled them

**Next Phase:** Will be unlocked after you complete Phase 1 checkpoint.

**Resources:**
- Inngest docs: https://www.inngest.com/docs
- MyMind subprocessors: https://mymind.com/subprocessors (reference architecture)
- Google Vision Node.js: https://googleapis.dev/nodejs/vision/latest/

**Begin with Phase 1. Work sequentially. Do not skip ahead.**
```

---

## **SYSTEM ENGINEERING NOTES FOR YOU (Human)**

### **Why This Approach Wins**
1. **Agent Constraints:** Antigravity works best with **sequential, testable tasks**. Giving it the full PRD at once causes task explosion.
2. **Real-World Accuracy:** MyMind's subprocessors page is **primary source** - not blog speculation. This ensures you're building what they actually use.
3. **Incremental Validation:** Each phase has measurable outcomes. You can stop after Phase 2 if you hit your "good enough" threshold.
4. **Cost Control:** The prompts include cost guardrails ($0.05/save, $1.50/1000 images) so your hobby project doesn't become a $500/month bill.

### **Conversation Strategy**
1. **Attach the prompt** as `instruction.md` to Antigravity project
2. **First message:** "Let's start Phase 1. I've attached the instruction file."
3. **After each phase:** Run the acceptance tests, provide feedback, then say "Proceed to Phase 2"
4. **If stuck:** Ask agent to "Research the specific error and propose 3 solutions"

### **Your Role**
- **PM:** Prioritize phases (maybe you don't need Serendipity)
- **QA:** Run the acceptance criteria tests
- **DevOps:** Manage env vars, Supabase config, Vercel settings
- **Designer:** Polish UI after agent builds functionality

The agent builds the engine. You make it beautiful and keep it running.

---

## **FINAL CHECKLIST BEFORE YOU RUN**

- [ ] Supabase project created with pgvector enabled
- [ ] OpenAI API key with $10 credit
- [ ] Google Vision API key (enable Vision + Storage APIs)
- [ ] Inngest account (free tier)
- [ ] Vercel project linked to GitHub
- [ ] Chrome extension ID whitelisted in CORS
- [ ] Sentry key (optional, for Phase 4)

**Ready to evolve? Attach the prompt and start Phase 1.**