# Change: Content Quality QA Enhancement

## Why

User testing revealed 6 qualitative issues degrading the MyMind experience:

1. **Title concatenation bug** - Instagram titles like "amarcord.officialYou've surely seen o..." where username merges with caption
2. **AI summary quality** - Raw caption text appears instead of analytical summaries
3. **Screenshot pop-ups** - Twitter/Instagram login walls captured in screenshots
4. **Image carousel quality** - Instagram carousels show low-res thumbnails, not original resolution
5. **Light/dark mode** - CSS variables exist (`[data-theme="dark"]`) but no UI toggle to switch
6. **Content consistency** - No type-safe contracts defining expected data per platform

This extends proposal 007 (content archival quality) with specific QA fixes for identified issues.

## What Changes

### Phase 1: Content Source Signatures (Foundation)
Type-safe contracts defining what each platform scraper should produce:
- Create `/lib/content-signatures/` with interfaces per platform
- Compile-time validation for scraper outputs
- Explicit author/title separation requirements

### Phase 2: Fix Title Concatenation Bug
In `lib/scraper.ts` Instagram handling (lines 210-230):
- Extract author SEPARATELY from caption text
- Remove username prefix from caption before using as title
- Return `author` and `title` as distinct fields

### Phase 3: AI Summary Quality Improvement
Platform-specific analytical prompts:
- Create `/lib/prompts/summary.ts` with platform-aware prompt templates
- Update `generateSummary()` to detect platform and use appropriate prompt
- Validate summary quality (50-500 chars, analytical not truncation)

### Phase 4: Screenshot Pop-up Handling
In `lib/screenshot-playwright.ts`:
- Add `dismissPopups()` function with platform-specific selectors
- Twitter: Close "Don't miss what's happening" modal
- Instagram: Dismiss "Sign up to see photos" wall
- Wait for content to stabilize after popup dismissal

### Phase 5: Instagram Carousel Image Quality
Enhanced image extraction in `lib/scraper.ts`:
- Parse `edge_sidecar_to_children` from embed scripts for carousel images
- Extract `display_url` at full resolution for each carousel slide
- Fallback chain: GraphQL → embed scripts → og:image

### Phase 6: Light/Dark Mode Toggle
UI implementation for existing CSS variables:
- Create `ThemeProvider.tsx` with localStorage persistence
- Create `ThemeToggle.tsx` component (Sun/Moon icons)
- Add to Header.tsx navigation

### Phase 7: DSPy Python Microservice (Sprint 2)
Full DSPy integration for AI optimization:
- Create `/services/dspy-service/` FastAPI service
- Prompt optimization signatures
- HTTP client in Next.js app

## Impact

### Affected Specs
- `content-signatures` - NEW: Type-safe platform contracts
- `scraper` - MODIFIED: Author/title separation, carousel extraction
- `ai-summary` - MODIFIED: Platform-aware analytical prompts
- `screenshot` - MODIFIED: Popup dismissal before capture
- `theming` - NEW: Theme toggle UI component

### Affected Code
| File | Changes |
|------|---------|
| `lib/content-signatures/` (NEW) | Platform contracts |
| `lib/scraper.ts:210-230` | Fix author/title separation |
| `lib/ai.ts:744-769` | Platform-aware generateSummary |
| `lib/prompts/summary.ts` (NEW) | Analytical prompt templates |
| `lib/screenshot-playwright.ts` | Add dismissPopups() |
| `lib/theme/ThemeProvider.tsx` (NEW) | Theme context |
| `components/ThemeToggle.tsx` (NEW) | UI toggle |
| `components/Header.tsx` | Add theme toggle |
| `app/layout.tsx` | Wrap with ThemeProvider |

### Dependencies
- No new npm packages required
- Existing Playwright for popup handling
- Future: `dspy` (Python microservice)

### Success Metrics
- Instagram titles: No username prefix in first 80 chars
- AI summaries: 50-500 chars of ANALYSIS (not caption truncation)
- Screenshots: Zero login modals visible
- Theme: Toggle persists in localStorage, applies on page load
- Carousels: All images at original resolution

### Risks
- Popup selectors may change (Instagram/Twitter update UI frequently)
  - Mitigation: Graceful fallback to full viewport screenshot
- AI summary quality is subjective
  - Mitigation: Length + keyword heuristics for validation

## Implementation Order

### Sprint 1 (This PR)
1. Content Source Signatures
2. Fix Title Concatenation Bug
3. Screenshot Pop-up Handling
4. AI Summary Quality Improvement
5. Light/Dark Mode Toggle

### Sprint 2
6. Instagram Carousel Image Quality
7. DSPy Python Microservice
8. Batch migration of existing cards
