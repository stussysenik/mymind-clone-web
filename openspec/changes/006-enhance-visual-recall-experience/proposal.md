# Change: Enhance Visual Recall Experience

## Why

MyMind's core philosophy is "Visual Primacy" - users remember the **formatting** of content before recalling the actual words. Currently, the app has several issues that break visual recall:

1. **Critical Bug**: Duplicate archive buttons in TwitterCard and InstagramCard causing UX confusion
2. **Limited Visual Fidelity**: Twitter cards don't preserve tweet formatting; Instagram carousels only show first image
3. **Generic AI Summaries**: Platform-agnostic prompts fail to capture visual essence (layout, formatting, structure)
4. **Unclear Feedback**: AI processing states are text-heavy without clear visual indicators
5. **Mobile UX Gap**: Detail view doesn't optimize for visual vs. textual content browsing on small screens
6. **No Personalization**: Single theme prevents users from customizing visual environment
7. **Layout Issues**: Overflow problems on various screen sizes break visual consistency

These issues directly contradict the "anti-tool" philosophy and the <200ms speed-first mandate.

## What Changes

### Critical Fixes
- **Remove duplicate archive buttons** in TwitterCard.tsx (lines 132-161) and InstagramCard.tsx (lines 84-188)
- **Fix overflow issues** across all screen sizes (375px to 1920px)

### Instagram Visual Carousel
- Display **all carousel images** in detail view (currently only shows first image)
- Add carousel indicator badge (e.g., "1/10") in grid view
- Implement dot navigation and swipe gestures for image browsing
- Update AI to analyze **all images in carousel**, not just first

### Twitter Visual Fidelity
- Redesign TwitterCard to match **screenshot-style rendering** (centered layout, proper formatting)
- Preserve line breaks and text formatting in tweet display
- Add thread detection and context in scraper
- Implement OCR on tweet images during enrichment

### Platform-Specific AI Prompts
- Create modular prompt system in `/lib/prompts/`:
  - `classification.ts` - Main classification tool
  - `instagram.ts` - Visual-first Instagram analysis
  - `twitter.ts` - Tweet structure + text analysis
  - `website.ts` - Page layout + content extraction
- Extract hashtags from Instagram captions as auto-tags
- Generate multi-image narrative summaries for carousels

### AI Feedback System
- Implement visual state machine with 6 states:
  - Idle (no indicator)
  - Typing (pulsing border)
  - Saving (progress bar + spinner)
  - Analyzing (shimmer animation + stage icons)
  - Saved (green checkmark bounce)
  - Error (red exclamation + retry button)
- Add stage-based feedback with icons (🔍 Reading → 🧠 Analyzing → ✨ Generating → ⏳ Finishing)
- Implement auto-save with field-specific debounce (title: 1s, summary: 2.5s, notes: 500ms)

### Mobile Detail View
- Add visual/textual split navigation on mobile (<768px)
- Implement swipe gestures (left: Visual → Text, right: Text → Visual)
- Add toggle arrows and indicator dots for current view
- Maintain 66/33 split on desktop (>=768px)

### Theme Customization
- Implement dark mode with CSS variables and media query detection
- Create SettingsModal component with customization options:
  - **Background Colors**: 5 presets (Paper White, Warm Cream, Cool Gray, Dark Charcoal, Pure Black)
  - **Fonts**: 3 choices (Current serif+sans, Mono, Sans-only)
  - **Highlight Colors**: 5 accent options (Riso Orange, Teal, Pink, Purple, Blue)
- Store preferences in localStorage
- Live preview during customization

### Comprehensive Testing
- Create 6 new Playwright test files:
  - `duplicate-buttons.spec.ts` - Prevent archive button regression
  - `instagram-carousel.spec.ts` - Verify multi-image display
  - `twitter-visual-fidelity.spec.ts` - Check tweet formatting
  - `ai-feedback-states.spec.ts` - Validate loading states
  - `mobile-detail-view.spec.ts` - Test visual/text toggle
  - `no-overflow.spec.ts` - Verify responsive layout
- Add pre-commit hook to run core tests

## Impact

### Affected Specs
- **card-rendering**: Instagram and Twitter card components (NEW spec)
- **ai-enrichment**: Platform-specific prompt system and multi-image analysis (NEW spec)
- **detail-modal**: Carousel navigation and mobile toggle (NEW spec)
- **theme-system**: Dark mode and customization (NEW spec)
- **testing**: E2E test coverage for visual recall features (NEW spec)

### Affected Code
- `apps/web/components/cards/TwitterCard.tsx` - Remove duplicate buttons (lines 132-161), redesign layout
- `apps/web/components/cards/InstagramCard.tsx` - Remove duplicate buttons (lines 137-188), add carousel indicator
- `apps/web/components/CardDetailModal.tsx` - Enhance carousel, add state machine, mobile toggle
- `apps/web/components/AIThinkingIndicator.tsx` - Stage icons and enhanced animations
- `apps/web/components/SettingsModal.tsx` - **NEW** - Theme customization UI
- `apps/web/lib/scraper.ts` - Thread detection, carousel extraction
- `apps/web/lib/ai.ts` - Platform-specific prompt integration
- `apps/web/lib/prompts/*.ts` - **NEW** - Modular prompt templates
- `apps/web/app/globals.css` - Dark mode variables, state animations
- `apps/web/app/layout.tsx` - Theme class injection
- `apps/web/tests/*.spec.ts` - **NEW** - 6 test files

### Performance Budget
- Save operation: <200ms (maintained)
- AI enrichment: <30s with stage feedback (maintained)
- Image carousel navigation: <100ms (new)
- Mobile toggle animation: <200ms (new)
- Dark mode switch: <100ms (new)

### Breaking Changes
None - all changes are additive or bug fixes

### Migration Required
None - theme preferences default to current design
