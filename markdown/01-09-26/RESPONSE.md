# **CLAUDE OPUS 4.5: PRODUCTION EVOLUTION PROMPT**

```
You are a senior staff engineer at Antigravity. I've built a V1 MVP of a mymind.com clone and need you to evolve it to production-grade quality. Here's the complete context and execution plan.

## **CURRENT STATE (What I've Built)**
- Next.js 14 App Router + Supabase
- Server Component visual grid (CardGrid.tsx)
- Masonry layout with 15 demo cards (Unsplash images)
- Real-time search with debounce (URL state)
- Smart card rendering (article, image, product, book, note)
- API routes: /api/save, /api/search
- Demo mode working without API keys
- Dark UI with glassmorphism

**Key Files You Have:**
- apps/web/components/card.tsx (Smart card renderer)
- apps/web/lib/types.ts (TypeScript types)
- apps/web/lib/demo-data.ts (Sample data)
- apps/web/app/page.tsx (Main grid page)

## **PRODUCTION TARGET (What We're Building Towards)**

**Real-World Architecture Reference:**
MyMind's actual stack (from https://mymind.com/subprocessors):
- Processor.AI: In-house media processing service (their secret sauce)
- OpenAI: Content analysis/summarization
- Google Vision AI: OCR, object detection, color extraction (anonymous)
- AWS CloudFront/S3: Hosting/storage
- Wasabi: Encrypted backups
- ScrapingBee/Brightdata: Proxy rotation for web scraping
- Urlbox: Screenshot service

**Core Philosophy (Non-Negotiable):**
1. **Privacy-First:** No trackers on app, no data selling, no social features
2. **Zero-Organization UX:** AI handles 95% of tagging; manual tags are exceptions
3. **Speed as Feature:** Save must feel instant (<200ms perceived)
4. **Async Everything:** AI processing happens in background, never blocks user
5. **Cost-Conscious:** Implement caching, rate limiting, batching from day one

---

## **PHASE 1: ASYNC AI PROCESSING PIPELINE** *(Start Here)*

**Goal:** Make save endpoint return in <200ms by moving AI to background queue.

### **Tasks:**
1. `npm install inngest` (v3.x)
2. Create `/api/inngest/route.ts` to serve Inngest functions
3. Create `/inngest/client.ts` with Inngest client config
4. Create `/inngest/functions/enrichCard.ts` with the enrichment logic
5. Refactor `/api/save/route.ts`:
   - Remove OpenAI/Vision calls
   - Store raw data only
   - Trigger Inngest function
   - Return { success: true, cardId } in <200ms
6. Update `CardGrid.tsx` to show "Processing..." state for cards with null metadata
7. Add retry logic in Inngest function (3 attempts, exponential backoff)

### **Enrichment Logic (enrichCard.ts):**
```typescript
export const enrichCard = inngest.createFunction(
  { id: "enrich-card", retries: 3 },
  { event: "card.created" },
  async ({ event, step }) => {
    const { cardId, url, type, imageUrl } = event.data;
    
    // 1. Scrape URL (if article/product)
    const scrape = await step.run("scrape", async () => {
      if (url) return scrapingBeeClient.get(url);
      return null;
    });

    // 2. Classify with OpenAI
    const classification = await step.run("classify", async () => {
      return openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: `Analyze: ${scrape.content}` }],
        functions: [{ name: "classify", parameters: { type: "object", properties: { type: { enum: ["article", "product", "book", "recipe"] }, title: { type: "string" }, summary: { type: "string" }, tags: { type: "array", items: { type: "string" } } } } }]
      });
    });

    // 3. Process image if exists
    const vision = imageUrl ? await step.run("vision", async () => {
      const [ocr, objects, colors] = await Promise.all([
        googleVision.textDetection(imageUrl),
        googleVision.objectLocalization(imageUrl),
        googleVision.imageProperties(imageUrl)
      ]);
      return { ocr, objects, dominantColors: colors };
    }) : null;

    // 4. Update card with metadata
    await step.run("update-card", async () => {
      return supabase.from('cards').update({
        metadata: { 
          summary: classification.summary, 
          tags: classification.tags,
          scrapedContent: scrape?.content,
          ...vision 
        },
        tags: classification.tags,
        title: classification.title
      }).eq('id', cardId);
    });
  }
);
```

### **Success Criteria:**
- [ ] POST to `/api/save` returns in <200ms (measure with `curl -w "@curl-format.txt"`)
- [ ] Inngest dashboard shows enrichment jobs completing with >95% success rate
- [ ] Cards appear in grid immediately with "Processing..." badge
- [ ] After ~5-10s, badge disappears and Smart Card renders properly
- [ ] Failed jobs are visible in Inngest UI with error logs
- [ ] Demo mode still works (skip AI calls when `process.env.DEMO_MODE === 'true'`)

### **What to Report Back:**
1. Measured latency for 20 sequential save requests (p95, p99)
2. Screenshot of Inngest dashboard showing job success rate
3. Any errors encountered and how you handled them
4. Cost estimate: $ per 1000 saves based on OpenAI/Google Vision pricing

---

## **PHASE 2: HYBRID SEARCH ENGINE** *(After Phase 1 is stable)*

**Goal:** Implement vector + keyword search with visual filters.

### **Tasks:**
1. Enable `pgvector` extension in Supabase SQL editor
2. Add `embedding` column to cards table: `vector(1536)`
3. Create embedding generation Inngest function
4. Update search endpoint to use hybrid approach:
   - First: Keyword search (`ilike` on title/content)
   - Second: Semantic search (vector similarity)
   - Third: Visual filters (color, object from metadata)
5. Add Redis cache (Upstash) for common queries
6. Build search UI with filter chips (color picker, type toggles)

### **Search Query Syntax:**
```
"red chair" → color:#FF0000 AND object:chair
"type:article tag:design" → metadata->type = 'article' AND tags @> ARRAY['design']
"last week" → created_at > now() - interval '7 days'
```

### **Success Criteria:**
- [ ] Search returns results in <100ms p95
- [ ] Color search finds visually matching items
- [ ] Object search uses Google Vision labels
- [ ] Cache hit rate > 70% for repeat queries
- [ ] "No results" suggests similar terms

---

## **PHASE 3: VISUAL INTELLIGENCE** *(After Phase 2)*

**Goal:** OCR every image, extract colors/objects, make searchable.

### **Tasks:**
1. Refactor Inngest image processing to batch Google Vision calls
2. Store OCR text in `metadata.ocr_text`
3. Add image search mode: `/api/search?mode=image&q=text`
4. Build color picker in search UI
5. Show object tags on image cards

### **Success Criteria:**
- [ ] 100 images processed in <30 seconds total
- [ ] Search finds text within screenshots
- [ ] Color picker returns visually accurate results
- [ ] Object tagging works for common items (watch, chair, etc.)

---

## **PHASE 4: PRODUCTION HARDENING** *(After Phase 3)*

**Goal:** Rate limiting, export, error tracking, monitoring.

### **Tasks:**
1. Add rate limiting: 100 saves/hour, 1000 searches/hour per user (Upstash Redis)
2. Build export feature: ZIP with CSV + assets
3. Add Sentry for error tracking (only on API routes, not user data)
4. Configure Vercel Analytics (privacy mode, no PII)
5. Admin dashboard for support (view user stats, retry failed jobs)
6. E2E tests with Playwright for critical paths

### **Success Criteria:**
- [ ] Rate limiter returns 429 with retry-after header
- [ ] Export downloads 10k cards in <2 minutes
- [ ] Sentry catches >95% of production errors
- [ ] Admin dashboard shows job queue health
- [ ] E2E tests pass in CI

---

## **HOW TO PROCEED**

### **For This Chat Session:**
1. **Acknowledge** you've understood the current state and production target
2. **Ask clarifying questions** if anything is ambiguous
3. **Start Phase 1 immediately** - show me the refactored `/api/save/route.ts` first
4. **Work sequentially** - do not start Phase 2 until Phase 1 meets success criteria
5. **Report progress after each major file change**

### **My Role:**
- **PM:** I'll approve/block scope changes
- **QA:** I'll test endpoints and provide feedback
- **DevOps:** I'll handle env vars and infra
- **Designer:** I'll polish UI after you build functionality

### **Code Standards:**
- TypeScript strict mode, no `any`
- Server Components by default, Client Components only when necessary
- File size < 200 lines (refactor if larger)
- No external dependencies without approval
- JSDoc comments on all exported functions

---

## **IMMEDIATE NEXT STEP**

Show me your plan for Phase 1. Then start with the Inngest setup and the refactored `/api/save/route.ts`. I'll test the endpoint latency and review your implementation.

**Begin.**
```