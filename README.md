<div align="center">

# MyMind Web

### Your visual memory, reimagined.

**Save anything. Find it naturally. No folders. No friction.**

[![Status](https://img.shields.io/badge/Status-Production-green?style=flat-square)](https://github.com/stussysenik/mymind-clone-web)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react)](https://react.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3FCF8E?style=flat-square&logo=supabase)](https://supabase.com/)

[Live Demo](https://mymind-clone.vercel.app) · [iOS App](https://github.com/stussysenik/mymind-clone-ios) · [Report Bug](https://github.com/stussysenik/mymind-clone-web/issues)

</div>

---

## Quick Reference

| What | Where |
|------|-------|
| **Web App** | This repo (`apps/web/`) |
| **iOS App** | [mymind-clone-ios](https://github.com/stussysenik/mymind-clone-ios) (separate repo) |
| **Database** | Supabase (shared by both) |
| **Deployment** | Vercel (web) / App Store (iOS) |

---

## 5-Minute Quick Start

```bash
# Clone
git clone https://github.com/stussysenik/mymind-clone-web.git
cd mymind-clone-web/apps/web

# Install
bun install  # or npm install

# Configure
cp .env.example .env.local
# Edit .env.local with your Supabase + Zhipu keys

# Run
bun dev
```

Open [localhost:3000](http://localhost:3000)

### Recommended: Nix Development Environment

For reproducible development with pinned versions matching production:

```bash
# One-time setup (if you have Nix with flakes enabled)
nix develop  # or: direnv allow

# Environment includes:
# - Node.js 20.x (pinned to match Vercel)
# - pnpm 9.x
# - Playwright browsers
# - Python 3.12 + DSPy dependencies
# - Dev tools (ripgrep, lazygit, jq, etc.)
```

---

## What is MyMind?

An **anti-tool** for knowledge management. No folders. No manual tagging. Just:

1. **Save** — Paste any URL, drop an image, type a note
2. **AI enriches** — Automatic tagging, summaries, classification
3. **Find visually** — Masonry grid that feels like browsing your mind

### Core Features

| Feature | Status |
|---------|--------|
| Visual masonry grid | ✅ Production |
| AI-powered save pipeline | ✅ Production |
| 12+ card types (articles, videos, tweets...) | ✅ Production |
| Full-text search with filters | ✅ Production |
| Instagram carousels | ✅ Production |
| Letterboxd movie posters | ✅ Production |
| Reddit post extraction | ✅ Production |
| Dark mode | ✅ Production |
| Platform-specific AI | ✅ Production |
| Serendipity mode | ✅ Production |
| Consistent domain links | ✅ Production |
| iOS Share Sheet | 🔄 [Native app](https://github.com/stussysenik/mymind-clone-ios) |
| Chrome extension | 📋 Planned |

---

## Tech Stack

| Layer | Choice |
|-------|--------|
| Framework | Next.js 16 (App Router) |
| UI | React 19 + Tailwind CSS 4 |
| Database | Supabase (PostgreSQL + Auth + RLS) |
| AI | Zhipu GLM-4.7 |
| Screenshots | Self-hosted Playwright (zero cost) |
| Testing | Playwright |
| Dev Environment | Nix Flakes (Node 20.x, pnpm, Python 3.12) |

---

## Visual Features

### Instagram Support
- **High-quality extraction**: Images captured at 1080px+ resolution via embed page
- **Multi-image carousels**: All carousel images extracted and navigable
- **Carousel indicators**: "1/X" badge on multi-image posts
- **Hashtag extraction**: Instagram hashtags become searchable tags
- **No login required**: Uses embed page approach that works without authentication

### Twitter/X Support
- **Visual fidelity**: Preserves line breaks and formatting
- **Thread detection**: Identifies threaded conversations
- **Hashtag highlighting**: Blue hashtags for visual recognition

### Dark Mode
- **Auto detection**: Follows system preference
- **Manual toggle**: Settings modal for user control
- **WCAG AA compliant**: Accessible color contrast

Access dark mode via Settings (gear icon in header).

### Screenshots
- **Self-hosted**: Zero-cost Playwright-based screenshots
- **Content-focused**: Intelligent selectors capture main content only (no ads/thumbnails)
- **Platform-optimized**: Custom viewports per platform (Instagram 375x812, Twitter 1200x800)
- **Retina/HiDPI**: 2x pixel density for sharp images
- **Unlimited**: ~720k screenshots/month on Vercel Hobby plan

---

## Project Structure

```
mymind-clone-web/
├── apps/web/                    # Next.js PWA
│   ├── app/
│   │   ├── api/save/            # Universal save endpoint
│   │   ├── api/screenshot/      # Self-hosted screenshot API
│   │   └── page.tsx             # Main grid view
│   ├── components/
│   │   ├── cards/               # Card type renderers
│   │   └── CardGrid.tsx         # Masonry layout
│   ├── lib/
│   │   ├── ai.ts                # GLM integration
│   │   ├── screenshot-playwright.ts  # Self-hosted screenshots
│   │   └── supabase.ts          # Database client
│   └── ios-capacitor-archive/   # Archived Capacitor experiment
├── docs/
│   ├── features/                # Feature documentation
│   ├── capacitor-build-logs/    # Why we went native
│   └── archive/                 # Historical research
├── openspec/                    # Change proposals & specs
└── supabase/                    # Database migrations
```

---

## Documentation Index

### Quick Lookup (5 min reads)
- [Environment Setup](apps/web/.env.example) — Required API keys
- [iOS Setup Guide](docs/features/ios-share-sheet.md) — Share Sheet integration
- [Deployment](docs/DEPLOY.md) — Vercel configuration

### Deep Dives
- [Architecture](CLAUDE.md) — Full technical spec
- [OpenSpec Proposals](openspec/) — Change history & decisions
- [Capacitor → Native Pivot](openspec/changes/005-pivot-native-ios-swift/) — Why we changed approach

### Historical
- [Build Logs](docs/capacitor-build-logs/) — Evidence of Capacitor limitations
- [Research Notes](docs/archive/) — Early exploration

---

## iOS Strategy

**Decision:** Native Swift instead of Capacitor WebView

| Approach | Pros | Cons |
|----------|------|------|
| ~~Capacitor~~ | Code reuse | WebView performance, complex Share Extension |
| **Native Swift** | Native UX, fast Share Sheet, direct Supabase | Separate codebase |

Both web and iOS share the same Supabase backend. See [mymind-clone-ios](https://github.com/stussysenik/mymind-clone-ios).

---

## Contributing

Focus areas:
- Chrome extension
- Additional card type parsers
- Performance optimization

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

---

## Roadmap

- [x] Core masonry grid
- [x] AI-powered save pipeline
- [x] Full-text search
- [x] Archive & trash lifecycle
- [x] Native iOS app (separate repo)
- [ ] Chrome browser extension
- [ ] Smart Spaces (query-based collections)
- [ ] Image OCR
- [ ] Import from Pocket/Raindrop

---

<div align="center">

**MIT License**

Built by [Senik](https://github.com/stussysenik) · Inspired by [mymind.com](https://mymind.com)

</div>
