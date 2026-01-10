# MyMind Clone

> **A privacy-first, AI-powered visual knowledge manager.**
> Save anything with one click. Find it naturally. No folders, no manual tags—just pure, visual memory.

![Status: Beta / MVP](https://img.shields.io/badge/Status-Beta%20%2F%20MVP-yellow)
![Next.js 16](https://img.shields.io/badge/Next.js-16-black)
![React 19](https://img.shields.io/badge/React-19-blue)
![Tailwind 4](https://img.shields.io/badge/Tailwind-4-cyan)
![Supabase](https://img.shields.io/badge/Supabase-Auth%20%2B%20DB-emerald)
![AI](https://img.shields.io/badge/AI-GLM--4-purple)

---

## 🧭 Current Status

As of **January 2026**, the project is a **feature-rich MVP** with core functionality complete and advanced features in development.

### ✅ Fully Implemented

#### Core Platform
- **Modern Architecture**: Next.js 16 App Router with React 19 and Server Components
- **Authentication System**: Full Supabase Auth integration with email/password and magic links
- **Protected Routes**: Middleware-based route protection with session management
- **Demo Mode**: Fully functional demo experience with 17 sample cards (no API keys required)

#### Visual Memory System
- **Masonry Grid Layout**: Pinterest-style responsive grid that adapts to screen size
- **10+ Card Types**: `article`, `image`, `note`, `product`, `book`, `video`, `audio`, `twitter`, `reddit`, `website`
- **Platform-Specific Renderers**: Custom components for Twitter/X, Instagram, YouTube, Reddit, IMDB, Letterboxd
- **Search & Filtering**: Full-text search with type and tag filters
- **Real-time Updates**: Optimistic UI with instant feedback (<200ms save time)

#### AI Intelligence
- **Zhipu GLM-4.7 Integration**: Content classification and automatic tagging
- **Smart Enrichment Pipeline**: Background processing that extracts metadata, summaries, and tags
- **Multi-Format Support**: Processes URLs, text notes, and images
- **Cost-Effective AI**: Uses GLM-4 models for high accuracy at low cost

#### Database & APIs
- **Supabase PostgreSQL**: Full RLS (Row Level Security) policies
- **Multiple API Endpoints**:
  - `POST /api/save` - Save new content with async enrichment
  - `GET /api/search` - Full-text search with filters
  - `GET /api/cards` - Retrieve cards with pagination
  - `POST /api/enrich` - Manual AI enrichment trigger
  - `GET /api/diagnose` - Health check and configuration validation

#### Testing & Quality
- **Playwright E2E Suite**: 9 test specs covering critical user flows
- **TypeScript Strict Mode**: Full type safety throughout the codebase
- **Tailwind CSS 4**: Modern, zero-runtime styling

#### Additional Features
- **Multiple Pages**: Auth, spaces, serendipity, trash routes (UI scaffolding complete)
- **Tag Management**: TagScroller component for horizontal filtering
- **User Menu**: Account management interface
- **Toast Notifications**: Feedback system for user actions
- **Detail Modal**: Expanded view for individual cards

### 🚧 In Progress / Partial

- **Smart Spaces**: UI tabs exist (Header), but query parsing and auto-add logic needs backend implementation
- **Tag Filtering**: TagScroller component built, integration with grid filtering in progress
- **Image Storage**: Currently using base64 encoding; migration to Supabase Storage planned

### 📋 Planned Features (Roadmap)

#### Phase 1: Smart Spaces & Organization
- [ ] Query-based smart folders (e.g., `type:article tag:design`)
- [ ] Auto-add cards to matching spaces
- [ ] Space management UI (create, edit, delete)
- [ ] Manual card-to-space assignment

#### Phase 2: Enhanced Search & Discovery
- [ ] List View toggle (grid/list density preference)
- [ ] Advanced search operators (AND, OR, NOT)
- [ ] Faceted search sidebar
- [ ] Search history and saved searches

#### Phase 3: Visual Intelligence
- [ ] GLM-4.6V integration for image OCR and object detection
- [ ] Color extraction and search by color
- [ ] Image similarity search
- [ ] Automatic thumbnail generation

#### Phase 4: Serendipity & Exploration
- [ ] Algorithm to surface under-accessed cards
- [ ] "Random discovery" mode
- [ ] Daily/weekly highlights
- [ ] Related cards suggestions

#### Phase 5: Content Creation
- [ ] Rich text note editor (TipTap or Lexical)
- [ ] Markdown support
- [ ] Focus Mode (fullscreen editing)
- [ ] Bidirectional linking with `[[wiki-style]]` syntax

#### Phase 6: Platform Extensions
- [ ] Chrome extension for one-click saves
- [ ] Web clipper for articles
- [ ] Mobile-responsive PWA
- [ ] Offline support with IndexedDB

#### Phase 7: Data & Export
- [ ] Export to CSV/JSON
- [ ] Backup and restore functionality
- [ ] Bulk operations (delete, move, tag)
- [ ] Import from other platforms (Pocket, Raindrop, etc.)

---

## 🛠 Tech Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Framework** | Next.js 16 (App Router) | Server Components, SSR, API routes |
| **UI Library** | React 19 | Component rendering with concurrent features |
| **Styling** | Tailwind CSS 4 | Utility-first CSS, design tokens |
| **Database** | Supabase (PostgreSQL) | Auth, storage, RLS, full-text search |
| **AI Engine** | Zhipu GLM-4.7 / 4.6V | Content classification, tagging, vision |
| **Testing** | Playwright | End-to-end test automation |
| **Icons** | Lucide React | Lightweight SVG icons |
| **Fonts** | Inter + Libre Baskerville | Sans-serif UI, serif search |

---

## 🏗 Project Structure

```
mymind-clone/
├── apps/
│   └── web/                          # Main Next.js application
│       ├── app/
│       │   ├── api/                  # API routes
│       │   │   ├── cards/            # Card CRUD operations
│       │   │   ├── save/             # Save endpoint with AI enrichment
│       │   │   ├── search/           # Full-text search
│       │   │   ├── enrich/           # Manual AI processing
│       │   │   └── diagnose/         # Health check endpoint
│       │   ├── auth/                 # Authentication pages
│       │   ├── spaces/               # Spaces view (scaffolded)
│       │   ├── serendipity/          # Discovery page (scaffolded)
│       │   ├── trash/                # Deleted items (scaffolded)
│       │   ├── globals.css           # Global styles
│       │   ├── layout.tsx            # Root layout
│       │   └── page.tsx              # Home page with grid
│       ├── components/
│       │   ├── cards/                # Platform-specific card components
│       │   │   ├── TwitterCard.tsx
│       │   │   ├── InstagramCard.tsx
│       │   │   ├── YouTubeCard.tsx
│       │   │   ├── RedditCard.tsx
│       │   │   └── MovieCard.tsx
│       │   ├── AddButton.tsx         # Floating save button
│       │   ├── AddModal.tsx          # Save modal with tabs
│       │   ├── Card.tsx              # Main card router component
│       │   ├── CardGrid.tsx          # Server component grid
│       │   ├── CardGridClient.tsx    # Client-side grid with interactions
│       │   ├── CardDetailModal.tsx   # Expanded card view
│       │   ├── CreateSpace.tsx       # Space creation modal
│       │   ├── Header.tsx            # Navigation with tabs
│       │   ├── SearchBar.tsx         # Serif-styled search input
│       │   ├── TagScroller.tsx       # Horizontal tag filter pills
│       │   ├── Toast.tsx             # Notification system
│       │   └── UserMenu.tsx          # Account dropdown
│       ├── hooks/
│       │   └── useDebounce.ts        # Debounce utility hook
│       ├── lib/
│       │   ├── ai.ts                 # GLM-4 integration and classification
│       │   ├── demo-data.ts          # 17 sample cards for demo mode
│       │   ├── platforms.ts          # Platform detection logic
│       │   ├── supabase.ts           # Supabase client configuration
│       │   └── types.ts              # TypeScript type definitions
│       ├── tests/
│       │   └── mymind.spec.ts        # Playwright E2E tests
│       └── public/                   # Static assets
└── supabase/
    ├── migrations/                   # Database migration files
    └── schema.sql                    # Complete database schema
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- Supabase account (Free tier)
- Zhipu AI API key

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/mymind-clone.git
   cd mymind-clone/apps/web
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   
   Create `.env.local` in the `apps/web` directory:
   ```env
   # Supabase Configuration
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
   SUPABASE_SERVICE_ROLE_KEY=eyJ...
   
   # Zhipu AI Configuration
   ZHIPU_API_KEY=your_glm_api_key
   ZHIPU_API_BASE=https://api.z.ai/api/coding/paas/v4
   ```

4. **Set up the database**
   
   - Create a new project in Supabase
   - Go to the SQL Editor and run the schema from `supabase/schema.sql`
   - Enable email authentication in Authentication → Providers

5. **Run the development server**
   ```bash
   npm run dev
   ```
   
   Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 Testing

Run the Playwright E2E test suite:

```bash
# Run all tests
npx playwright test

# Run tests in UI mode
npx playwright test --ui

# Run tests with headed mode
npx playwright test --headed
```

Test coverage includes:
- Card grid rendering
- Search functionality
- Card type detection
- Authentication flows
- Save operations

---

## 📚 Key Features Deep Dive

### The Save Pipeline

When you save content, the system follows an optimized pipeline:

1. **User Action**: Click save button and paste URL/type note/upload image
2. **Optimistic Save**: API immediately returns `200 OK` with a "processing" state card (<200ms)
3. **Background Enrichment**:
   - Fetches URL metadata (Open Graph tags, titles, descriptions)
   - Detects content type (article, image, video, product, etc.)
   - Sends content to GLM-4.7 for classification and tagging
   - Extracts summary and relevant metadata
4. **Database Update**: Card is updated with enriched data (tags, summary, type)
5. **Real-time Sync**: UI reflects the enriched card on next refresh/poll

This pattern ensures the app feels instant while AI processing happens asynchronously.

### Platform Detection

The system automatically detects content type from URLs:

| Platform | Detected As | Special Features |
|----------|-------------|------------------|
| Twitter/X | `twitter` | X logo, tweet text, author handle |
| YouTube | `video` | Red accent, play button, duration |
| Instagram | `image` | Gradient border, reels support |
| Reddit | `reddit` | Orange accent, upvotes, subreddit |
| IMDB | `movie` | Yellow accent, rating, year |
| Letterboxd | `movie` | Green accent, director, rating |
| Generic Article | `article` | Title, summary, reading time |

### AI Classification

GLM-4.7 automatically:
- **Classifies** content into 10+ types
- **Generates** 3-5 relevant tags
- **Summarizes** content in ~100 tokens
- **Extracts** metadata (author, price, rating, etc.)

Example AI prompt:
```
Analyze this content and classify it as one of: article, image, note, product, book, video, audio, twitter, reddit, website.
Extract a title (max 60 chars), generate 3-5 relevant tags, and write a brief summary (max 100 words).
Respond in JSON format.
```

---

## 🎨 Design Philosophy

The MyMind clone follows these design principles:

1. **Anti-Tool Aesthetic**: Feels like a personal space, not a productivity app
2. **Visual First**: Masonry grid respects content aspect ratios
3. **Serif Typography**: Libre Baskerville for search creates a literary feel
4. **Warm Palette**: Soft off-white background (#F7F6F3) reduces eye strain
5. **Minimal Friction**: No social buttons, no unnecessary UI chrome
6. **Fast Interactions**: Optimistic UI with instant feedback

---

## 📖 Development Guide

### Adding New Card Types

1. Update `CardType` in `lib/types.ts`
2. Add type detection logic in `lib/platforms.ts`
3. Create card component in `components/cards/YourCard.tsx`
4. Add render case in `components/Card.tsx`
5. Update AI classification prompt in `lib/ai.ts`

### Tweaking AI Behavior

Edit the `classifyContent` function in `lib/ai.ts`:
- Adjust classification categories
- Modify tagging strategy
- Change summary length
- Add custom extraction rules

### Database Queries

The system uses Supabase client with type safety:
```typescript
import { supabase } from '@/lib/supabase';

const { data, error } = await supabase
  .from('cards')
  .select('*')
  .eq('user_id', userId)
  .order('created_at', { ascending: false });
```

---

## 🚀 Deployment

### Vercel (Recommended)

1. Push code to GitHub
2. Import project in Vercel
3. Set root directory to `apps/web`
4. Add environment variables
5. Deploy

### Environment Variables Required

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (for API routes) |
| `ZHIPU_API_KEY` | Zhipu GLM API key |
| `ZHIPU_API_BASE` | GLM API base URL |

---

## 📊 Project Metrics

- **Lines of Code**: ~5,000+
- **Components**: 15+ React components
- **API Endpoints**: 5 routes
- **Test Specs**: 9 Playwright tests
- **Card Types Supported**: 10+
- **Database Tables**: 3 (cards, spaces, users)
- **Dependencies**: Production-ready with minimal bloat

---

## 🤝 Contributing

This project is currently in active development. Areas for contribution:
- Smart Spaces query engine
- Browser extension
- Mobile responsive improvements
- Additional card types
- Performance optimization
- Documentation improvements

---

## 📝 License

MIT License - feel free to use this project for your own visual knowledge base.

---

## 🙏 Acknowledgments

- Inspired by [mymind.com](https://mymind.com)
- Built with modern tools: Next.js, Supabase, Zhipu AI
- Design philosophy influenced by anti-pattern movement

---

**Built with 💜 by Senik & Antigravity**

*Last updated: January 2026*