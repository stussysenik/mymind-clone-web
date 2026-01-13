<div align="center">

# MyMind

### Your visual memory, reimagined.

**Save anything. Find it naturally. No folders. No friction.**

[![Status](https://img.shields.io/badge/Status-Beta-yellow?style=flat-square)](https://github.com/yourusername/mymind-clone)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react)](https://react.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3FCF8E?style=flat-square&logo=supabase)](https://supabase.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)

[Demo](https://mymind-clone.vercel.app) · [Documentation](docs/) · [Report Bug](https://github.com/yourusername/mymind-clone/issues)

</div>

---

## Why MyMind?

Most knowledge tools feel like work. Folders to manage. Tags to remember. Hierarchies to maintain.

**MyMind is different.** It's an anti-tool—a visual space where you throw things and find them later through the way your brain actually works: visually, associatively, naturally.

- **Save in one click** — URLs, notes, images. No organizing required.
- **AI does the work** — Automatic tagging, summaries, and classification.
- **Find visually** — A beautiful masonry grid that feels like browsing your own mind.
- **Privacy-first** — Your data stays yours. Row-level security. No third-party tracking.

---

## Features

### Core Experience

| Feature | Description |
|---------|-------------|
| **Visual Grid** | Pinterest-style masonry layout that respects content aspect ratios |
| **Smart Save** | Paste any URL—AI extracts metadata, generates tags, writes summaries |
| **12+ Card Types** | Articles, videos, tweets, products, books, movies, and more |
| **Instant Search** | Full-text search with type and tag filtering |
| **Spaces** | Organize cards into collections (manual or rule-based) |
| **Archive & Trash** | Full lifecycle: Active → Archive → Trash → Delete |

### AI Intelligence

- **GLM-4.7 Integration** — Content classification, tagging, and summarization
- **Platform Detection** — Twitter, YouTube, Reddit, IMDB, and more get special treatment
- **Editable AI** — Don't like a summary? Click and fix it.
- **Background Processing** — Save is instant (<200ms), enrichment happens async

### iOS Share Sheet <sup>NEW</sup>

Save from any iOS app directly to MyMind:

```
Safari → Share → MyMind → ✓ Saved
```

Native Swift extension with Keychain auth sharing. [Full setup guide →](docs/features/ios-share-sheet.md)

---

## Quick Start

### Prerequisites

- [Bun](https://bun.sh/) or Node.js 20+
- [Supabase](https://supabase.com/) account (free tier works)
- [Zhipu AI](https://open.bigmodel.cn/) API key

### Installation

```bash
# Clone and enter project
git clone https://github.com/yourusername/mymind-clone.git
cd mymind-clone/apps/web

# Install dependencies
bun install

# Set up environment
cp .env.example .env.local
# Edit .env.local with your keys

# Run database migrations
# (See supabase/schema.sql)

# Start development server
bun dev
```

Open [localhost:3000](http://localhost:3000) — or try demo mode with no API keys required.

### Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
ZHIPU_API_KEY=your_glm_api_key
```

---

## Tech Stack

| Layer | Choice | Why |
|-------|--------|-----|
| **Framework** | Next.js 16 | App Router, Server Components, Edge API routes |
| **UI** | React 19 | Concurrent features, Server Components |
| **Styling** | Tailwind CSS 4 | Zero-runtime, design tokens |
| **Database** | Supabase | PostgreSQL + Auth + RLS + Realtime |
| **AI** | Zhipu GLM-4.7 | Cost-effective, high-quality classification |
| **Mobile** | Capacitor | iOS native shell with Share Extension |
| **Testing** | Playwright | E2E test automation |

---

## Architecture

### Save Pipeline

```
User pastes URL
       │
       ▼
┌─────────────────┐
│  POST /api/save │ ──► Immediate 200 OK (<200ms)
└────────┬────────┘     with optimistic card
         │
         ▼ (async)
┌─────────────────┐
│  Fetch metadata │ ──► Open Graph, title, images
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   GLM-4.7 AI    │ ──► Classify, tag, summarize
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Database update │ ──► Card enriched, UI refreshes
└─────────────────┘
```

### Project Structure

```
apps/web/
├── app/
│   ├── api/          # Edge API routes
│   │   ├── save/     # Save + AI enrichment
│   │   ├── search/   # Full-text search
│   │   └── cards/    # CRUD operations
│   ├── (auth)/       # Login, signup
│   └── page.tsx      # Main grid view
├── components/
│   ├── cards/        # Platform-specific renderers
│   ├── Card.tsx      # Card router
│   └── CardGrid.tsx  # Masonry layout
├── lib/
│   ├── ai.ts         # GLM integration
│   └── supabase.ts   # Database client
├── ios/              # Capacitor iOS project
│   └── App/ShareExtension/
└── tests/            # Playwright E2E
```

---

## Testing

```bash
# Run all tests
npx playwright test

# Interactive UI mode
npx playwright test --ui

# Specific test file
npx playwright test tests/ios-share-api.spec.ts
```

Test coverage: Authentication, search, card rendering, save operations, API endpoints.

---

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import in Vercel
3. Set root directory: `apps/web`
4. Add environment variables
5. Deploy

### iOS App

Requires macOS + Xcode. See [iOS Setup Guide](apps/web/ios/SETUP.md).

---

## Roadmap

- [x] Core masonry grid with 12+ card types
- [x] AI-powered save pipeline
- [x] Full-text search with filters
- [x] iOS Share Sheet extension
- [ ] Chrome browser extension
- [ ] Smart Spaces (query-based collections)
- [ ] Image OCR with GLM-4.6V
- [ ] Offline support (PWA + IndexedDB)
- [ ] Import from Pocket, Raindrop, etc.

---

## Design Philosophy

> "The best tool is the one that disappears."

1. **Anti-tool aesthetic** — Feels like a personal space, not a productivity app
2. **Visual-first** — Content speaks for itself in a masonry grid
3. **Zero friction** — No folders to create, no tags to assign manually
4. **Speed obsession** — Every interaction under 200ms
5. **Privacy default** — Your data, your control, no tracking

---

## Contributing

Areas where help is welcome:

- Chrome extension development
- Smart Spaces query engine
- Additional platform parsers
- Performance optimization
- Mobile responsiveness

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

---

## Documentation

| Document | Description |
|----------|-------------|
| [SECURITY.md](SECURITY.md) | API key protection, best practices |
| [DEPLOY.md](DEPLOY.md) | Deployment guide with troubleshooting |
| [iOS Share Sheet](docs/features/ios-share-sheet.md) | Native iOS integration guide |

---

## License

MIT — Use freely for your own visual knowledge base.

---

<div align="center">

**Built with 💜 by [Senik](https://github.com/senik) & [Antigravity](https://github.com/antigravity)**

Inspired by [mymind.com](https://mymind.com)

</div>
