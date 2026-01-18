# Design Document: Visual Recall Experience Enhancements

## Context

MyMind's identity as an "anti-tool" with "Visual First" philosophy requires every interaction to prioritize visual recognition over textual search. Users recall the *shape* of a tweet, the *layout* of an Instagram carousel, the *visual structure* of content before recalling the actual words.

### Current State
- Generic card rendering that doesn't preserve platform-specific visual characteristics
- Single AI prompt for all content types, losing platform nuance
- Text-heavy feedback during AI enrichment with minimal visual cues
- Mobile detail view stacks visual and textual content without user control
- Single theme with no customization options
- Critical bug: Duplicate archive buttons causing UX confusion

### Constraints
- **Speed First**: Every interaction must respond in <200ms
- **Zero Config**: Customization must be optional, defaults must work perfectly
- **Privacy Default**: No third-party tracking, all preferences in localStorage
- **Cross-Platform**: Web-first, but Capacitor WebView must perform identically
- **Visual Primacy**: All content must be visually represented, no list views

## Goals / Non-Goals

### Goals
1. Fix critical duplicate button bug immediately (regression prevention)
2. Achieve visual parity with original platforms (Instagram carousel, Twitter formatting)
3. Platform-aware AI summaries that capture visual essence
4. Clear, instantaneous feedback during all async operations
5. Mobile-optimized detail view for visual vs. textual browsing
6. User-controllable theme customization while maintaining defaults
7. Comprehensive E2E test coverage to prevent regressions

### Non-Goals
- Video playback in detail view (out of scope - only thumbnails)
- Bluesky/Mastodon support (future work)
- Animated GIF preview (future work)
- PDF visual preview (future work)
- Collaborative features (future work)
- Server-side rendering of theme preferences (localStorage only)

## Decisions

### Decision 1: Modular Prompt System Architecture

**Choice**: Create separate prompt template files per platform in `/lib/prompts/`

**Rationale**:
- **Maintainability**: Each platform has unique characteristics (Instagram: visual+hashtags, Twitter: formatting+threads)
- **Extensibility**: Adding new platforms (Bluesky, Mastodon) requires only one new file
- **Version Control**: Prompt evolution can be tracked per platform
- **Type Safety**: TypeScript exports ensure consistent prompt interface

**Structure**:
```typescript
// lib/prompts/index.ts
export { CLASSIFICATION_TOOL } from './classification';
export { INSTAGRAM_PROMPT } from './instagram';
export { TWITTER_PROMPT } from './twitter';
export { WEBSITE_PROMPT } from './website';

// lib/ai.ts
import { INSTAGRAM_PROMPT, TWITTER_PROMPT } from '@/lib/prompts';

function getPromptForPlatform(platform: string, metadata: any) {
  switch (platform) {
    case 'instagram':
      return INSTAGRAM_PROMPT(metadata);
    case 'twitter':
      return TWITTER_PROMPT(metadata);
    default:
      return WEBSITE_PROMPT(metadata);
  }
}
```

**Alternatives Considered**:
- Single prompt with conditional logic: Rejected due to complexity and hard-to-debug conditionals
- LLM-based prompt generation (Common Lisp): Rejected due to team unfamiliarity and added complexity

### Decision 2: AI Feedback State Machine

**Choice**: Implement finite state machine with 6 visual states

**Rationale**:
- **Predictability**: Users know exactly what's happening at any time
- **Visual Primacy**: Each state has distinct visual indicator (color, animation, icon)
- **Performance Transparency**: Progress bar shows save/sync operations completing
- **Error Recovery**: Error state provides retry without losing context

**State Transitions**:
```
idle → typing → saving → saved → idle
         ↓         ↓       ↓
       error    error   error
         ↓         ↓       ↓
      (retry) → saving → saved
```

**Visual Indicators**:
- Idle: No indicator
- Typing: Pulsing teal border (1s interval)
- Saving: Linear progress bar 0→100%, rotating spinner
- Analyzing: Shimmer overlay, stage-based text+icons
- Saved: Green checkmark (bounces in, fades after 1s)
- Error: Red exclamation, "Retry" button

**Alternatives Considered**:
- Toast notifications: Rejected - breaks visual focus, requires user to look away from content
- XState library: Rejected - overkill for simple 6-state machine, adds dependency
- Inline spinners only: Rejected - not enough feedback granularity

### Decision 3: Instagram Carousel Storage

**Choice**: Store all carousel images in `metadata.images[]` as array of URLs

**Rationale**:
- **Existing Schema**: `metadata` field is JSONB, already supports arrays
- **No Migration**: Backwards compatible with single-image posts
- **Performance**: Fetching metadata fetches all images in one query
- **Order Preservation**: Array order matches Instagram carousel order

**Data Shape**:
```typescript
interface CardMetadata {
  images?: string[]; // All carousel images (first is primary)
  author?: string;
  platform?: string;
  processing?: boolean;
}
```

**Scraper Logic**:
```typescript
// lib/scraper.ts
async function scrapeInstagram(url: string) {
  // ... existing logic
  if (isCarousel) {
    metadata.images = extractAllCarouselImages(html);
  } else {
    metadata.images = [primaryImage];
  }
}
```

**Alternatives Considered**:
- Separate `carousel_images` table: Rejected - over-engineering for simple array
- Store only image count, fetch on-demand: Rejected - breaks <200ms mandate for detail view
- Base64 encode thumbnails: Rejected - blob storage is cheaper and faster

### Decision 4: Mobile Detail View Toggle

**Choice**: Implement swipe-based toggle between "Visual" and "Text" views

**Rationale**:
- **Touch-First**: Swipe is native mobile gesture, no learning curve
- **Screen Real Estate**: Mobile screens too small for 66/33 split
- **Visual Primacy**: Default to visual view (image fills screen)
- **Fallback**: Arrow buttons for accessibility and non-touch devices

**Responsive Breakpoints**:
- `< 768px`: Toggle view (full screen visual OR text)
- `>= 768px`: Side-by-side split (66% visual, 33% text)

**Implementation**:
```typescript
// CardDetailModal.tsx
const [mobileView, setMobileView] = useState<'visual' | 'text'>('visual');
const isMobile = useMediaQuery('(max-width: 767px)');

<div className={isMobile ? 'mobile-toggle' : 'desktop-split'}>
  {isMobile ? (
    mobileView === 'visual' ? <VisualContent /> : <TextContent />
  ) : (
    <>
      <VisualContent />
      <TextContent />
    </>
  )}
</div>
```

**Alternatives Considered**:
- Accordion: Rejected - not intuitive for mobile, requires multiple taps
- Tabs: Rejected - visual overhead, not touch-optimized
- Vertical scroll: Rejected - loses focus, hard to find text section

### Decision 5: Theme System Architecture

**Choice**: CSS variables + localStorage for theme preferences

**Rationale**:
- **Performance**: CSS variables change instantly (<100ms render)
- **SSR Compatible**: Theme class applied in `layout.tsx` before hydration
- **No Flash**: Inline script reads localStorage before first paint
- **Accessibility**: Respects `prefers-color-scheme` by default

**CSS Variable Naming**:
```css
:root {
  --background: #f7f6f3;
  --foreground: #1a1a1a;
  --foreground-muted: #6b6b6b;
  --accent-primary: #ff6b4a;
  --border: #e0e0e0;
}

[data-theme="dark"] {
  --background: #1a1a1a;
  --foreground: #e0e0e0;
  --foreground-muted: #a0a0a0;
  --accent-primary: #ff7f63;
  --border: #333333;
}
```

**localStorage Schema**:
```typescript
interface ThemePreferences {
  mode: 'light' | 'dark' | 'auto';
  background: string; // Preset name or custom hex
  font: 'serif-sans' | 'mono' | 'sans';
  accentColor: string; // Preset name or custom hex
}
```

**Alternatives Considered**:
- Tailwind's built-in dark mode: Rejected - too opinionated, doesn't support custom backgrounds/fonts
- Server-side user preferences: Rejected - adds auth dependency, breaks privacy-first mandate
- CSS-in-JS (styled-components): Rejected - runtime overhead, breaks <100ms requirement

### Decision 6: Playwright Test Strategy

**Choice**: Create 6 targeted test files instead of monolithic test suite

**Rationale**:
- **Fast Feedback**: Run only relevant tests in pre-commit hook
- **Clear Ownership**: Each file tests one feature, easy to debug failures
- **Parallelization**: Playwright can run tests in parallel (6 workers)
- **Regression Prevention**: `duplicate-buttons.spec.ts` prevents exact bug from recurring

**Test Organization**:
```
tests/
├── duplicate-buttons.spec.ts       # Critical: prevents regression
├── instagram-carousel.spec.ts      # Feature: multi-image display
├── twitter-visual-fidelity.spec.ts # Feature: formatting preservation
├── ai-feedback-states.spec.ts      # UX: loading state validation
├── mobile-detail-view.spec.ts      # UX: toggle functionality
└── no-overflow.spec.ts             # Layout: responsive validation
```

**Pre-Commit Hook**:
```json
// package.json
{
  "scripts": {
    "test:core": "playwright test duplicate-buttons instagram-carousel twitter-visual-fidelity ai-feedback-states --workers=4"
  }
}
```

**Alternatives Considered**:
- Vitest for unit tests: Rejected - E2E tests more valuable for visual recall features
- Manual testing only: Rejected - regression risk too high with visual changes
- Storybook visual regression: Rejected - doesn't test real data or API integration

## Risks / Trade-offs

### Risk 1: GLM-4.6V Rate Limits (Multi-Image Analysis)

**Impact**: HIGH - Instagram carousels with 10+ images could hit API rate limits

**Mitigation**:
- Cache OCR results in `metadata.ocr_text` field (persist across enrichments)
- Batch process carousel images (analyze 3 at a time instead of sequentially)
- Add exponential backoff with retry logic
- Consider using GLM-4.7 (text-only) for carousel summaries if image analysis fails

**Monitoring**: Log API response times and rate limit headers

### Risk 2: Twitter API Changes Breaking Syndication

**Impact**: MEDIUM - Tweet content extraction could fail silently

**Mitigation**:
- Implement Puppeteer screenshot fallback (Option B from plan)
- Store tweet JSON from syndication API for future re-enrichment
- Add health check for Twitter scraper in CI
- Display "Unable to load tweet" with link to original if scraping fails

**Monitoring**: Track scraper success rate in logs

### Risk 3: Carousel Images Slow to Load on Mobile

**Impact**: MEDIUM - Could break <200ms visual primacy mandate

**Mitigation**:
- Lazy load images: only load when carousel dot is clicked
- Use progressive JPEG or WebP format with blur placeholder
- Implement image CDN with automatic format conversion (Cloudflare Images)
- Preload first 3 images in carousel, lazy load rest

**Monitoring**: Lighthouse CI in WebView, track LCP for carousel navigation

### Risk 4: Dark Mode Color Contrast Fails WCAG AA

**Impact**: LOW - Accessibility regression

**Mitigation**:
- Test all dark mode colors with Axe DevTools before commit
- Use contrast checker (e.g., WebAIM) during design phase
- Add automated accessibility tests in Playwright
- Document contrast ratios in `globals.css` comments

**Monitoring**: Pre-commit Axe audit, fail build if contrast <4.5:1

### Risk 5: Playwright Tests Flaky Due to Timing

**Impact**: MEDIUM - CI failures block deployment

**Mitigation**:
- Use `waitForSelector` with explicit timeout (30s max)
- Avoid `waitForTimeout` (use condition-based waits)
- Mock AI enrichment in tests (use fixture data)
- Add retry logic for flaky network-dependent tests

**Monitoring**: Track test failure rate in CI, fix flaky tests immediately

### Trade-off 1: Modular Prompts vs. Single Dynamic Prompt

**Choice**: Modular prompts (separate files)

**Benefit**: Maintainability, version control, type safety
**Cost**: More files to manage, potential duplication across prompts

**Justification**: Long-term maintainability outweighs initial complexity, especially as more platforms are added (Bluesky, Mastodon, Threads).

### Trade-off 2: localStorage vs. Database for Theme Preferences

**Choice**: localStorage (client-side only)

**Benefit**: Zero auth dependency, instant load, privacy-first
**Cost**: Preferences don't sync across devices

**Justification**: Aligns with "anti-tool" philosophy - no forced sync, no account required. Users who want sync can use Capacitor cloud storage (future enhancement).

### Trade-off 3: Swipe Gestures vs. Tap-Only Navigation

**Choice**: Swipe gestures (with arrow button fallback)

**Benefit**: Native mobile UX, faster interaction
**Cost**: Accessibility concern for motor-impaired users, added complexity

**Justification**: Swipe is standard for image galleries (Instagram, Photos app). Arrow buttons ensure accessibility. Swipe threshold is generous (50px) to prevent accidental triggers.

## Migration Plan

### Phase 1: Backwards-Compatible Changes (Safe to Deploy)
1. Fix duplicate archive buttons (no data migration)
2. Add `metadata.images[]` field (backwards compatible - existing posts have `undefined`)
3. Create prompt template files (no breaking changes to `lib/ai.ts` interface)
4. Add CSS variables (existing classes still work)

### Phase 2: Feature Rollout (Opt-In)
1. Instagram carousel displays first image by default (existing behavior)
2. Detail view shows all images if `metadata.images.length > 1` (graceful degradation)
3. Theme customization defaults to current design (no visual change until user opts in)
4. Mobile toggle defaults to visual view (current behavior)

### Phase 3: Re-Enrichment (Optional)
1. Re-run AI enrichment on existing Instagram posts to populate `metadata.images[]`
2. Re-run AI enrichment on existing tweets to apply new Twitter-specific prompts
3. User-triggered: "Refresh" button in detail view to re-enrich any card

### Rollback Strategy
If critical issues arise:
1. **Duplicate Buttons**: Revert commits to `TwitterCard.tsx` and `InstagramCard.tsx`
2. **Carousel**: Set `metadata.images = [metadata.images[0]]` to fallback to single image
3. **Theme**: Remove `data-theme` attribute, restore hardcoded colors
4. **Prompts**: Revert `lib/ai.ts` to use original generic prompt

All changes are additive or scoped to UI components - no database schema changes required.

### Data Migration Script (Optional)
```typescript
// scripts/migrate-carousel-images.ts
// Only run if we want to backfill existing Instagram posts

import { supabase } from '@/lib/supabase';
import { scrapeInstagram } from '@/lib/scraper';

async function migrateCarouselImages() {
  const { data: instagramCards } = await supabase
    .from('cards')
    .select('*')
    .ilike('url', '%instagram.com%')
    .is('metadata->images', null); // Only cards without images array

  for (const card of instagramCards) {
    const metadata = await scrapeInstagram(card.url);
    await supabase
      .from('cards')
      .update({ metadata })
      .eq('id', card.id);
  }
}
```

**Run Once**: After deployment, run manually in staging, then production.

## Open Questions

1. **Q**: Should we support GIF playback in Instagram carousel?
   **A**: Out of scope for this change - only static images. Future enhancement.

2. **Q**: Should theme preferences sync via Supabase user settings?
   **A**: No - localStorage only for privacy. Future enhancement if users request it.

3. **Q**: Should we implement Common Lisp prompt optimizer?
   **A**: No - team lacks Lisp expertise. Stick to TypeScript prompts for maintainability.

4. **Q**: Should we add ALL CAPS enforcement as default or opt-in?
   **A**: Opt-in via user preference toggle. Some users prefer mixed case.

5. **Q**: Should we use react-swipeable library or native touch events?
   **A**: Start with `react-swipeable` (battle-tested). Fallback to native if bundle size concern.

6. **Q**: Should we support custom color pickers or only presets?
   **A**: Only presets for MVP. Custom pickers add complexity and can break contrast ratios.

7. **Q**: Should carousel images be lazy-loaded or preloaded?
   **A**: Hybrid: Preload first 3 images, lazy load rest. Measure LCP impact in Lighthouse.

8. **Q**: Should we retry failed OCR on tweet images?
   **A**: Yes - add exponential backoff (3 retries max). Log failures for monitoring.

## Success Metrics

### Quantitative
- **Zero** duplicate archive button bug reports after deployment
- **100%** of Instagram carousels display all images in detail view
- **90%+** of tweets preserve original formatting (line breaks, hashtags)
- **<200ms** save operation (optimistic UI)
- **<30s** AI enrichment with visible progress
- **<100ms** carousel navigation latency
- **<200ms** mobile toggle transition
- **<100ms** dark mode switch
- **4.5:1** minimum color contrast ratio (WCAG AA)
- **6/6** Playwright tests passing in CI

### Qualitative
- Users can identify saved Instagram posts from first carousel image alone
- Tweet formatting "looks like Twitter" without reading domain
- AI feedback is understandable without reading text (visual cues only)
- Mobile detail view feels "native" (no jarring layout shifts)
- Theme customization feels "instant" (no loading spinner)
- No horizontal scroll on any screen size

### User Feedback Signals (Post-Launch)
- "The carousel finally works!" (Instagram multi-image support)
- "Tweets look way better now" (visual fidelity)
- "I can finally use dark mode!" (customization)
- "The mobile view is so much better" (toggle UX)
- Reduced support requests about duplicate buttons

## Technical Dependencies

### New Dependencies
- `react-swipeable` (optional, ~5KB gzipped) - For mobile swipe gestures

### Existing Dependencies (No Changes)
- Next.js 16 (App Router)
- React 19
- Tailwind CSS 4
- Supabase (PostgreSQL + Auth)
- GLM-4.6V API (AI enrichment)
- Playwright (E2E testing)

### Infrastructure (No Changes)
- Vercel (Next.js deployment)
- Supabase (database + storage)
- Zhipu AI (GLM-4.6V/4.7 API)

## Performance Budget Validation

All changes must meet:
- **Save operation**: <200ms (SWR optimistic update)
- **AI enrichment**: <30s (with stage feedback every 5s)
- **Carousel navigation**: <100ms (CSS transition only)
- **Mobile toggle**: <200ms (Tailwind transition)
- **Dark mode switch**: <100ms (CSS variable update)
- **Image load**: <1s per image (LCP target)

**Validation Method**: Lighthouse CI in Capacitor WebView + Chrome DevTools profiler

## Accessibility Requirements

- **WCAG AA Compliance**: All color combinations must meet 4.5:1 contrast ratio
- **Keyboard Navigation**: All interactive elements reachable via Tab key
- **Screen Reader**: ARIA labels on all buttons, images have alt text
- **Focus Visible**: Clear focus indicators (`:focus-visible` ring)
- **Reduced Motion**: All animations respect `prefers-reduced-motion` media query
- **Touch Targets**: Minimum 44×44px (iOS standard)

**Validation Method**: Axe DevTools scan + manual keyboard navigation test

## Deployment Strategy

### Stage 1: Fix Critical Bug (Deploy Immediately)
- Merge PR with only duplicate button fix
- Deploy to production same day
- Monitor for any card rendering issues

### Stage 2: Instagram Carousel (Deploy Next)
- Merge PR with carousel support
- Deploy to production after QA pass
- Monitor Instagram scraper success rate

### Stage 3: Twitter Visual + AI Prompts (Deploy Together)
- Merge PR with Twitter redesign + prompt system
- Deploy to production after QA pass
- Monitor AI enrichment success rate

### Stage 4: Mobile UX + Theme (Deploy Together)
- Merge PR with mobile toggle + theme system
- Deploy to production after QA pass
- Monitor localStorage usage

### Stage 5: Testing + Documentation (Continuous)
- Add Playwright tests incrementally with each PR
- Update README.md and docs with each feature
- Ensure pre-commit hook runs before all merges

**Rollback Plan**: Each stage is independently revertible via Git revert.

## Conclusion

This design balances **visual primacy** (core philosophy) with **pragmatic engineering** (maintainability, performance, testability). All decisions optimize for:
1. User recall through visual fidelity
2. Sub-200ms interaction speed
3. Privacy-first, zero-config defaults
4. Comprehensive regression prevention via E2E tests

The modular architecture (prompts, state machine, theme system) enables future platform additions (Bluesky, Mastodon) without rewriting core logic.
