# **MYMIND CLONE: FROM POC TONIGHT TO PRODUCTION-GRADE SYSTEM**

## **ESSENTIALIST TECH STACK PHILOSOPHY (The "Ramp-Ready" Path)**

### **Tier 1: "Ship Tonight" Stack** *(What you code now)*
**Principle:** Monolithic simplicity, sync processing, no premature optimization

```
Frontend: Next.js 14 App Router (Vercel)
├── Server Components for grid view (zero JS bundle)
├── Client Components only for: search bar, extension comms
└── No state management beyond useState + useEffect

Backend: Same Next.js project (pages/api)
├── 5 API routes: save, search, spaces, export, auth
├── Edge runtime where possible (geo-routing)
└── No microservices, no queue system

Database: Supabase PostgreSQL (single instance)
├── pgvector extension (for future similarity search)
├── One "cards" table with JSONB metadata column
└── Basic indexes: GIN on tags, GiST on vectors

AI: Direct API calls (sync, but fast enough)
├── OpenAI GPT-4-mini for classification
├── Google Vision API for OCR/object detection
└── No caching, no batching (for now)

Storage: Supabase Storage (S3)
├── Direct browser uploads (signed URLs)
├── No CDN config (use Supabase's native CDN)

Chrome Extension: Plasmo + React
├── Manifest V3 service worker
├── Right-click context menus
└── Direct POST to your API
```

### **Tier 2: "Production Ramp Stack"** *(Evolve into this)*
**Principle:** Async pipelines, edge caching, cost optimization

```
Queue System: Inngest or Qstash
├── Process AI calls asynchronously
├── Retry logic + dead letter queue
└── Rate limiting per user

AI Processing Service: Your "Processor.AI"
├── Hono.js API on Cloudflare Workers
├── Batches Google Vision calls
├── Caches analysis results (Redis)
└── Prompt optimization for cost

Database: Turso (SQLite on edge) + Supabase (source of truth)
├── Edge reads for search (sub-50ms)
├── Async sync from Supabase → Turso
└── Vector embeddings stored in both

Search: Hybrid approach
├── Turso for keyword + tag search
├── Pinecone/Qdrant for vector similarity
└── Redis for common query cache

Extension: Vite + Vanilla JS (drop React)
├── 200ms faster cold start
├── Smaller bundle (no React bloat)
└── Direct WebGL for image previews

Observability: None on Tier 1 → Baselime + Vercel Analytics on Tier 2
```

---

## **PRODUCT REQUIREMENTS DOCUMENT (PRD)**

### **Product Vision**
> "A privacy-first, AI-powered visual knowledge manager that saves anything with one click and finds it through natural, associative search—no folders, no manual tagging, no social features."

### **Core Differentiators**
1. **Zero-Organization UX:** User saves → AI organizes → Search retrieves
2. **Visual Memory Grid:** Pinterest-like layout with mcmaster.com speed
3. **Private Oasis:** No tracking, no ads, no sharing, end-to-end encryption option
4. **Serendipity Engine:** Proactively resurfaces forgotten content

### **Non-Goals** (What We Explicitly WON'T Build)
- Team collaboration features
- Public sharing or social discovery
- Advanced project management (no tasks, no Kanban)
- Real-time multiplayer editing
- Plugin ecosystem or public API (initially)

---

## **FEATURE SCOPE (MVP vs Production)**

### **MVP Features (Tonight's Ship)**
| Feature | Implementation | Acceptance Criteria |
|---------|----------------|---------------------|
| **Chrome Extension Capture** | Right-click → POST /api/save | <500ms capture, works on images/text/URLs |
| **Visual Grid** | Next.js Server Component | 100 items loaded in <800ms Lighthouse score 95+ |
| **Basic Search** | Supabase full-text (title, content) | Search results in <100ms, typo-tolerant |
| **AI Auto-Tag** | OpenAI function calling | Auto-detects: article, product, book, recipe |
| **Smart Cards** | Processor.ai pipeline (mocked) | Renders image + title + summary for articles |
| **Local Text Notes** | Markdown editor (no Focus Mode) | Save/edit in place, basic formatting |

### **Production Features (Week 1-4)**
| Feature | Implementation | Performance Target |
|---------|----------------|-------------------|
| **Associative Search** | pgvector + Redis | Color search, object queries <50ms |
| **Smart Spaces** | Materialized views + triggers | Auto-update on new saves <200ms |
| **OCR Everything** | Google Vision batching | Process 100 images in <30s |
| **Serendipity** | Under-accessed item algorithm | Surface 10 items/day, 50% keep rate |
| **Focus Mode** | Fullscreen editor + bidirectional links | 60fps typing, instant backlink discovery |
| **Offline PWA** | IndexedDB sync queue | Read-only offline, sync on reconnect |
| **Export** | Zip download (CSV + assets) | Export 10k items in <2min |

---

## **IMPLEMENTATION ROADMAP (Agent-Friendly Task Groups)**

### **Phase 0: Foundation (2 hours)**
```bash
# Command for agent:
"Initialize Next.js 14 + Supabase project with:
- App Router setup
- Supabase client config (env vars)
- Basic auth (NextAuth + GitHub)
- Chrome extension scaffold (Plasmo)
- Vercel deployment config"

# Files to create:
apps/
  web/
    app/
      layout.tsx
      page.tsx              # Visual grid
      api/save/route.ts     # Core save endpoint
    lib/
      supabase.ts
      openai.ts
    components/
      CardGrid.tsx          # Server Component
      SaveButton.tsx        # Client Component
  extension/
    src/
      background.ts         # Service worker
      content.ts            # Context menu injection
      popup.tsx             # Mini UI for extension
```

### **Phase 1: Capture Pipeline (3 hours)**
```typescript
// Task group for agent:
// 1. Implement Chrome extension message passing
// 2. Build /api/save endpoint (accepts {url, type, content})
// 3. Create DB schema: cards table, tags table
// 4. Add OpenAI function calling for classification
// 5. Save raw data to Supabase Storage

// Acceptance criteria:
// - Extension captures URL in <500ms
// - API returns 200 in <2s total
// - Card appears in grid after refresh
// - Auto-tagged with correct type (article/product/note)
```

### **Phase 2: Visual Grid & Search (4 hours)**
```typescript
// Task group for agent:
// 1. Server Component CardGrid: SELECT * FROM cards
// 2. Implement React query for client-side search
// 3. Add Supabase full-text search index
// 4. Build search input with debounce (use-debounce)
// 5. Style grid: CSS Grid, aspect-ratio, lazy loading

// Performance targets:
// - First Contentful Paint < 0.8s
// - Search query < 100ms
// - 100 cards render < 30ms
```

### **Phase 3: AI Enrichment (4 hours)**
```typescript
// Task group for agent:
// 1. Integrate Google Vision API (OCR + object detection)
// 2. Process images async (store results in metadata JSONB)
// 3. Add color extraction (dominantColors from Vision)
// 4. Generate card summaries (OpenAI completion)
// 5. Build "Smart Card" renderer (article, product, book templates)

// Cost guardrails:
// - Cache Vision results (check DB before API call)
// - Use GPT-4-mini for summaries ($0.15 per 1M tokens)
// - Limit summary generation to 100 tokens max
```

### **Phase 4: Smart Spaces (3 hours)**
```typescript
// Task group for agent:
// 1. Create spaces table (name, query, is_smart)
// 2. Build UI: sidebar with Spaces list
// 3. Implement saved search logic (parse query string)
// 4. Add auto-add trigger on new saves (if matches space query)
// 5. Manual add/remove from spaces

// Query syntax:
// "type:article tag:design color:blue"
// Translated to: WHERE metadata->>type = 'article' AND tags @> ARRAY['design']
```

### **Phase 5: Serendipity & Focus Mode (4 hours)**
```typescript
// Task group for agent:
// 1. Serendipity: Algorithm to SELECT low-accessed cards
// 2. Build full-screen swipe UI (mobile-first)
// 3. Focus Mode: Fullscreen editor (TipTap or Lexical)
// 4. Bidirectional linking: Parse [[note-title]] syntax
// 5. Backlinks panel (show cards linking to current)

// Algorithm sketch:
// SELECT * FROM cards 
// WHERE last_viewed < NOW() - INTERVAL '30 days'
// ORDER BY RANDOM() LIMIT 10
```

### **Phase 6: Production Hardening (Ongoing)**
```typescript
// Task group for agent:
// 1. Migrate to Inngest for async processing
// 2. Add Turso edge cache (read replicas)
// 3. Implement rate limiting (Upstash Redis)
// 4. Add Vercel Analytics (privacy-focused)
// 5. Build export feature (CSV + asset zip)

// Performance SLA:
// - p95 latency < 200ms
// - 99.9% uptime
// - < $50/month AI costs at 1000 saves/month
```

---

## **ANTIGRAVITY AGENT PROMPT** *(Optimized for their input limits)*

```
You are a senior full-stack engineer building "mymind-clone" to production-grade standards. Follow this spec EXACTLY.

## PRODUCT VISION
Build a privacy-first, AI-powered visual knowledge manager. Core mantra: "Save anything with one click. Find it naturally. No folders, no manual tags."

## TECH STACK (Tier 1 - Ship Tonight)
- Next.js 14 App Router (deploy to Vercel)
- Supabase (PostgreSQL + Storage)
- OpenAI GPT-4-mini + Google Vision API
- Plasmo Chrome Extension
- TypeScript strict mode
- Tailwind CSS
- NO additional dependencies napproval

## ARCHITECTURE CONSTRAINTS
1. Monolithic single project (no microservices)
2. Sync processing acceptable for MVP (<2s per save)
3. Server Components for ALL read paths (zero JS by default)
4. Client Components ONLY for: search input, extension comms, editor
5. No state management beyond React hooks
6. ENV vars: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_KEY, OPENAI_API_KEY, GOOGLE_VISION_KEY

## FILE STRUCTURE (Create all files)
apps/
  web/
    app/
      layout.tsx              # Root layout with auth
      page.tsx                # Visual grid (Server Component)
      api/save/route.ts       # POST {url, type, content}
      api/search/route.ts     # GET ?q=keyword
      api/spaces/route.ts     # CRUD for spaces
    lib/
      supabase.ts             # Client + admin clients
      ai.ts                   # OpenAI + Google Vision wrappers
      scraper.ts              # Uses ScrapingBee (free tier)
    components/
      CardGrid.tsx            # Server Component: SELECT * FROM cards
      Card.tsx                # Client: hover actions, delete
      SearchBar.tsx           # Client: debounced search
      ExtensionSave.tsx       # Receives messages from extension
    hooks/
      useDebounce.ts          # 300ms delay
  extension/
    src/
      background.ts           # Context menu handler
      content.ts              # Injects save button on pages
      popup.tsx               # Optional: mini UI

## DATABASE SCHEMA (Run this SQL in Supabase)
CREATE TABLE cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  type text NOT NULL, -- 'article', 'image', 'note', 'product', 'book'
  title text,
  content text,
  url text,
  image_url text,
  metadata jsonb, -- {summary, colors, objects, ocr_text}
  tags text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_cards_user ON cards(user_id);
CREATE INDEX idx_cards_tags ON cards USING GIN(tags);
CREATE INDEX idx_cards_metadata ON cards USING GIN(metadata);

CREATE TABLE spaces (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL,
  name text NOT NULL,
  query text, -- Smart Space query string
  is_smart boolean DEFAULT false
);

## IMPLEMENTATION PHASES (Execute in order)

### PHASE 0: BOILERPLATE (2h)
- `npx create-next-app@latest web --app --typescript --tailwind`
- `npm create plasmo extension`
- Set up Supabase project, copy keys
- Configure NextAuth with GitHub
- Deploy to Vercel, verify hello world

### PHASE 1: CAPTURE PIPELINE (3h)
1. In `extension/src/background.ts`: Add contextMenus.onClicked handler
   - POST to `https://your-app.vercel.app/api/save`
   - Payload: {url, type, content, screenshot?}
2. In `web/app/api/save/route.ts`: 
   - Validate user session
   - Scrape URL (use ScrapingBee API)
   - Call classifyContent(content) → returns {type, title, tags}
   - Store to Supabase Storage if image
   - INSERT into cards table
   - Return 200 in <2000ms
3. In `web/components/CardGrid.tsx`: 
   - Server Component: await supabase.from('cards').select('*')
   - Render masonry grid with <Image fill>

### PHASE 2: SEARCH (2h)
1. In `web/components/SearchBar.tsx`:
   - useState + useDebounce(300ms)
   - Fetch `/api/search?q=${term}`
2. In `web/app/api/search/route.ts`:
   - Use Supabase full-text: `ilike('%${q}%')`
   - Return top 50 results
3. Add `loading="lazy"` to all images

### PHASE 3: AI MAGIC (4h)
1. In `web/lib/ai.ts`:
   - `classifyContent(text: string): Promise<{type, title, tags}>`
     - Use OpenAI function calling with strict schema
   - `extractImageData(imageUrl): Promise<{colors, objects, ocr}>`
     - Call Google Vision API (batchAnnotate)
2. In `web/app/api/save/route.ts`:
   - After saving card, trigger AI enrichment (fire-and-forget)
   - UPDATE metadata column with AI results
3. In `web/components/Card.tsx`:
   - Display Smart Card based on type
   - Article: show summary overlay
   - Product: show price if available

### PHASE 4: SPACES (3h)
1. Create `web/app/spaces/page.tsx`
2. Sidebar list of spaces (fetch from DB)
3. Clicking space runs saved query filter
4. Add "Save to Space" button on each card

### PHASE 5: POLISH (2h)
- Dark mode (Tailwind dark: prefix)
- Keyboard shortcuts: `/` for search, `N` for new note
- Error boundaries + loading skeletons
- Basic rate limiting: 100 saves/hour per user

## CODE QUALITY STANDARDS
- TypeScript: strict mode, no `any`
- File size limit: 200 lines max per component
- No inline styles (use Tailwind only)
- No client-side JS for grid (Server Components ONLY)
- Error handling: try/catch at API boundaries, return 500 with JSON

## PERFORMANCE BUDGET
- Page load: < 800ms (Lighthouse 95+)
- API response: p95 < 200ms
- Extension capture: < 500ms perceived
- Bundle size: < 100kb JS total
- Image optimization: next/image mandatory

## ACCEPTANCE CRITERIA
✅ Save 20 items in 10 seconds via extension
✅ Search returns results <100ms with 1000 cards
✅ Grid renders 100 cards in <30ms
✅ Smart Cards render correctly for articles, products, books
✅ No hydration errors in console
✅ Deployed to Vercel, accessible via URL
✅ Extension published to Chrome (unpacked)

## NEXT STEPS (Tier 2 - Don't code yet)
- Migrate to Inngest for async processing
- Add Turso edge caching
- Implement Serendipity algorithm
- Build Focus Mode editor
- Add export feature

DO NOT BUILD THESE NOW. Focus on MVP first.

Start with PHASE 0. Work sequentially. Do not skip steps. Report progress after each phase.
```

---

## **AGENT EXECUTION STRATEGY**

### **How to Feed This to Antigravity:**
1. **System Prompt** → Paste into "Project Settings" > "System Instructions"
2. **Task List** → Paste into "Tasks" tab in sequence
3. **Code Review** → Use "@review" after each phase for checkpoint
4. **Testing** → Run `vercel dev` locally, then deploy

### **Token Optimization Tips:**
- **One-shot:** Antigravity has ~32k token limit. The above is ~28k.
- **Trim if needed:** Remove "NEXT STEPS" section for initial input
- **Progressive disclosure:** Give PHASE 0-1 first, then feed subsequent phases after completion

### **Expected Timeline with Agent:**
- **PHASE 0:** 1.5 hours (automated scaffolding)
- **PHASE 1:** 2 hours (API + extension comms)
- **PHASE 2:** 1.5 hours (search + grid)
- **PHASE 3:** 3 hours (AI integration debugging)
- **PHASE 4:** 2 hours (spaces UI)
- **PHASE 5:** 1 hour (polish)

**Total: ~11 hours** (realistic for agent-assisted dev)

---

## **KEY DECISION: Essentialist vs. Production**

**Tonight (Essentialist):** You ship a monolithic Supabase app that processes AI sync. It's slow on save (2s) but fast on read (<100ms). **This is acceptable.**

**Tomorrow (Production):** You add Inngest queue. Save becomes <200ms (fire-and-forget), AI processes in background. **This is the evolution.**

**The Agent Prompt is designed for Tier 1** because Antigravity excels at shipping working code fast. **Don't confuse the agent with Tier 2 details yet** - that'll cause analysis paralysis.

**Final Command:** Copy the Antigravity prompt above exactly as written. Paste it into a new project. Click "Start Building." Your POC will be live by midnight.

Ready to ship?