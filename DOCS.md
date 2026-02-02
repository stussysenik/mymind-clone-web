# MyMind Developer Documentation

Quick reference for working with the MyMind codebase.

## Table of Contents
- [Quick Start](#quick-start)
- [Architecture](#architecture)
- [Key Features](#key-features)
- [Testing](#testing)
- [Deployment](#deployment)

---

## Quick Start

### Prerequisites

**Recommended (reproducible):**
- Nix 2.18+ with flakes enabled
- direnv (optional, for auto-activation)

**Alternative:**
- Node.js 20+ (must match Vercel)
- pnpm or bun

**Required Services:**
- Supabase account
- Zhipu AI API key

### Setup
```bash
cd apps/web
npm install  # or bun install
cp .env.example .env.local
# Edit .env.local with your keys
npm run dev
```

Open [localhost:3000](http://localhost:3000)

---

## Nix Development Environment

### Why Nix?
- **Reproducible**: Same Node/pnpm/Python versions everywhere
- **Zero drift**: Matches Vercel production (Node 20.x)
- **Fast onboarding**: `nix develop` and you're ready

### Quick Start
```bash
# Enter dev shell (includes all tools)
nix develop

# Or with direnv (auto-activates on cd)
direnv allow

# Available shells
nix develop .#web      # Web development only
nix develop .#ai       # AI/DSPy development
nix develop .#default  # Full environment
```

### What's Included
| Category | Tools |
|----------|-------|
| Web | Node.js 20.x, pnpm, bun, TypeScript, Biome |
| Testing | Playwright with browsers |
| AI/ML | Python 3.12, pip, virtualenv |
| Dev Tools | ripgrep, fd, jq, lazygit, delta, bat |
| Infrastructure | Supabase CLI, Vercel CLI, GitHub CLI |

### Shell Hooks
The Nix shell includes helpful aliases:
- `help-cc` - Show all available commands
- `lg` - lazygit
- `verify` - Run formatters and type checks
- `audit` - Security audit

### Troubleshooting

**"flake not found"**: Enable flakes in `~/.config/nix/nix.conf`:
```
experimental-features = nix-command flakes
```

**Playwright browsers**: On macOS ARM, uses system Chrome. On Linux, browsers are provided by Nix.

**direnv not activating**: Run `direnv allow` after cloning.

---

## Architecture

### Data Flow: Saving Content
```
User Input → POST /api/save → Scraper → Save to DB → AI Enrichment (async)
```

### Key Components
- **CardGrid**: Masonry layout using CSS Grid
- **Card Types**: 12+ specialized renderers (Instagram, Twitter, etc.)
- **AI Pipeline**: GLM-4.7 for classification and summaries

### Directory Structure
```
apps/web/
├── app/
│   ├── api/
│   │   ├── save/          # Universal save endpoint
│   │   ├── screenshot/    # Self-hosted screenshot API
│   │   └── enrich/        # AI enrichment endpoint
│   └── page.tsx           # Main grid view
├── components/
│   ├── cards/             # Card type renderers
│   ├── CardGrid.tsx       # Masonry layout
│   ├── CardDetailModal.tsx # Detail view
│   └── SettingsModal.tsx  # Theme settings
├── lib/
│   ├── ai.ts              # GLM-4.7 integration
│   ├── prompts/           # Platform-specific prompts
│   │   ├── instagram.ts   # Instagram-specific
│   │   ├── twitter.ts     # Twitter-specific
│   │   └── website.ts     # General website
│   ├── scraper.ts         # URL metadata extraction
│   ├── screenshot-playwright.ts # Self-hosted screenshots
│   └── supabase.ts        # Database client
└── tests/                 # Playwright E2E tests
```

---

## Key Features

### Instagram Carousel Support

**High-Quality Multi-Image Extraction:**
The scraper uses an embed page approach that works without login:
1. Navigate to `instagram.com/p/{shortcode}/embed/captioned/`
2. Click "Next" button to navigate through carousel (triggers lazy-loading)
3. Capture CDN image requests matching `t51.2885-15` pattern
4. Filter for high-resolution versions (1080px+ width)

**Fallback Chain:**
```typescript
// Strategy 1: Embed page with browser navigation (BEST - works without login)
scrapeInstagramViaEmbed(shortcode)

// Strategy 2: Direct post page with Playwright (may require login)
scrapeInstagramCarousel(shortcode)

// Strategy 3: Static embed HTML parsing (fastest but may miss images)
scrapeInstagramEmbed(shortcode)
```

**Detection:**
```typescript
const hasCarousel = card.metadata.images?.length > 1;
```

**Display:**
```typescript
<InstagramCard card={card} /> // Shows "1/X" badge
```

**Navigation:**
- Previous/Next buttons in detail view
- Dot indicators showing position
- Swipe support (mobile)

**Re-extraction Script:**
```bash
# Find and re-extract failed Instagram carousels
node scripts/reextract-instagram-carousels.mjs

# Options:
#   --dry-run     Preview what would be re-extracted
#   --limit N     Only process N cards
#   --force       Re-extract all Instagram cards
```

### Platform-Specific AI

```typescript
import { getInstagramPrompt, getTwitterPrompt, getWebsitePrompt } from '@/lib/prompts';

// Instagram-specific prompt (hashtags, carousel awareness)
const instagramPrompt = getInstagramPrompt(content, imageCount);

// Twitter-specific prompt (threads, formatting)
const twitterPrompt = getTwitterPrompt(content);

// General website prompt
const websitePrompt = getWebsitePrompt(content);
```

**Prompt Features:**
- **Instagram**: Hashtag extraction, carousel context, visual content
- **Twitter**: Thread detection, hashtag highlighting, formatting preservation
- **Website**: General classification, smart tagging

### Dark Mode

**Set theme programmatically:**
```typescript
localStorage.setItem('theme', 'dark');
document.documentElement.setAttribute('data-theme', 'dark');
```

**Available themes:**
- `'light'` — Light mode
- `'dark'` — Dark mode
- `'auto'` — Follow system preference (default)

**CSS usage:**
```css
/* Light mode */
:root {
  --color-bg: #ffffff;
}

/* Dark mode */
:root[data-theme="dark"] {
  --color-bg: #18181b;
}

/* Auto dark mode */
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    --color-bg: #18181b;
  }
}
```

### CardActions Component

Shared component for consistent card action buttons across all platform cards.

**Usage:**
```typescript
import { CardActions } from '@/components/cards/CardActions';

<CardActions
  url={card.url}
  domain={getDomain(card.url)}
  domainColor={card.metadata.accentColor}
  externalLinkPosition="bottom-right"
/>
```

**Features:**
- Globe icon + accent-colored domain link
- External link button with consistent positioning
- Hover states for interactive feedback
- Responsive sizing

**Props:**
| Prop | Type | Description |
|------|------|-------------|
| `url` | `string` | The card's source URL |
| `domain` | `string` | Display domain (e.g., "youtube.com") |
| `domainColor` | `string?` | Accent color for domain text |
| `externalLinkPosition` | `string` | Button position ("bottom-right", "top-right") |

### AI Processing Feedback

The `CardDetailModal` shows stage-based feedback during AI enrichment:

```typescript
// Stage 1: Reading content
{ icon: '🔍', text: 'Reading content...', progress: 10 }

// Stage 2: Analyzing
{ icon: '🧠', text: 'Analyzing...', progress: 40 }

// Stage 3: Generating summary
{ icon: '✨', text: 'Generating summary...', progress: 70 }

// Stage 4: Finishing up
{ icon: '⏳', text: 'Finishing up...', progress: 95 }
```

### Serendipity Mode

A focused discovery experience for exploring your saved content one card at a time.

**Navigation:**
| Key | Action |
|-----|--------|
| `→` / `j` | Next card |
| `←` / `k` | Previous card |
| `Space` / `Enter` | Open card details |
| `Escape` | Close detail modal |

**Mobile Gestures:**
- Swipe left → Next card
- Swipe right → Previous card
- Tap card → Open details

**Features:**
- **Shuffle**: Loads a random set of cards for discovery
- **Progress dots**: Visual position indicator (max 20 visible)
- **Archive/Delete**: Available in detail modal
- **Realtime sync**: Card data updates live during AI enrichment

**Access:**
- Click "Serendipity" in the sidebar
- Direct URL: `/serendipity`

---

## Testing

### Run E2E Tests
```bash
npm run test                    # All tests
npx playwright test --ui        # With UI
npx playwright test carousel    # Specific suite
```

### Test Suites

**instagram-carousel.spec.ts:**
- Carousel indicator badge visibility
- Detail view navigation (Previous/Next, dots)
- Multi-image AI summary generation
- Hashtag extraction as tags

**twitter-visual-fidelity.spec.ts:**
- X logo and author display
- Text formatting preservation (line breaks)
- Hashtag highlighting in blue
- Thread indicator detection
- Embedded media rendering

**duplicate-buttons.spec.ts:**
- Regression prevention for duplicate button bug
- Verifies single "Re-analyze" button in detail view

### Writing Tests

```typescript
import { test, expect } from '@playwright/test';

test('should display carousel indicator', async ({ page }) => {
  await page.goto('http://localhost:3000');

  // Find card with carousel
  const carousel = page.locator('[data-testid="carousel-badge"]').first();
  await expect(carousel).toBeVisible();
  await expect(carousel).toContainText('/');
});
```

---

## Deployment

### Vercel (Web)
```bash
npm run build    # Verify build
git push         # Auto-deploy on main
```

### Environment Variables

Required variables (see `.env.example`):

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx

# Zhipu AI
ZHIPU_API_KEY=xxx
```

### Build Configuration

**next.config.ts:**
```typescript
const config = {
  images: {
    domains: ['images.unsplash.com', /* ... */],
  },
  experimental: {
    serverActions: true,
  },
};
```

---

## API Reference

### POST /api/save

Save a new card with optimistic response.

**Request:**
```json
{
  "url": "https://example.com",
  "source": "web-share-api" | "ios-share-extension" | "manual",
  "auth_token": "xxx" // Required for iOS Share Extension
}
```

**Response (<200ms):**
```json
{
  "success": true,
  "card": {
    "id": "xxx",
    "title": "Example",
    "imageUrl": "https://...",
    "metadata": {
      "processing": true,
      "images": ["url1", "url2"] // For Instagram carousels
    }
  }
}
```

### POST /api/enrich

Enrich a card with AI-generated tags and summary.

**Request:**
```json
{
  "cardId": "xxx"
}
```

**Response:**
```json
{
  "success": true,
  "tags": ["tag1", "tag2"],
  "summary": "AI-generated summary",
  "type": "article"
}
```

---

## Contributing

### Code Style
- Use TypeScript strict mode
- Follow Prettier configuration
- Write tests for new features
- Update documentation

### Pull Request Process
1. Create feature branch from `main`
2. Write code + tests
3. Update documentation
4. Submit PR with clear description

### Commit Convention
Use conventional commits:
- `feat(scope): description` — New feature
- `fix(scope): description` — Bug fix
- `docs(scope): description` — Documentation
- `test(scope): description` — Tests
- `chore(scope): description` — Maintenance

---

## Troubleshooting

### Build Errors

**TypeScript errors:**
```bash
npx tsc --noEmit  # Check types
```

**Missing dependencies:**
```bash
rm -rf node_modules package-lock.json
npm install
```

### Development Issues

**Supabase connection:**
- Verify environment variables
- Check Supabase project status
- Review RLS policies

**AI enrichment not working:**
- Verify Zhipu API key
- Check API rate limits
- Review server logs

---

## Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Zhipu AI API](https://open.bigmodel.cn/)
- [Playwright Testing](https://playwright.dev/)

---

*For more details, see [README.md](README.md) and [CLAUDE.md](CLAUDE.md)*

### Scraper Reliability Features

The scraper includes multiple fallback strategies and fixes for common issues:

**Letterboxd CDATA Handling:**
```typescript
// Letterboxd wraps JSON-LD in CDATA comments
content = content.replace(/\/\*\s*<!\[CDATA\[\s*\*\//, '')
                 .replace(/\/\*\s*\]\]>\s*\*\//, '')
                 .trim();
const json = JSON.parse(content);
```

**Reddit Fallback Chain:**
```typescript
// Strategy 1: Main Reddit API (may be blocked)
fetch(`https://www.reddit.com/r/${subreddit}/...`)

// Strategy 2: old.reddit.com (simpler HTML, less blocking)
fetch(`https://old.reddit.com/r/${subreddit}/...`)
```

**Enrichment Error Handling:**
- `processing: true` + no error = Still analyzing
- `processing: true` + >2 min elapsed = Slow (not failed)
- `enrichmentError` set = Actually failed

### Self-Hosted Screenshots

Zero-cost Playwright screenshots with content-focused selectors.

**API Endpoint:**
```bash
POST /api/screenshot
Body: { "url": "https://example.com" }
Response: { "success": true, "url": "...", "source": "playwright", "platform": "..." }
```

**Platform Configs:**
- Instagram: 375x812 mobile, `article[role="presentation"]`
- Twitter: 1200x800 desktop, `article[data-testid="tweet"]`  
- GitHub: 1920x1080, `.repository-content`
- Generic: Semantic HTML selectors with viewport fallback

**Performance:** 1-2s warm, 3-5s cold, ~720k/month capacity on Vercel Hobby.

**See:** `apps/web/lib/screenshot-playwright.ts`

