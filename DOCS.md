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
- Node.js 20+
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

