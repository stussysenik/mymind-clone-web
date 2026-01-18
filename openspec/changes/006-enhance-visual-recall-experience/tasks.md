# Implementation Tasks

## Phase 1: Bug Fixes & Foundation (Critical Path)

### 1.1 Fix Duplicate Archive Buttons
- [x] 1.1.1 Remove duplicate archive button block in TwitterCard.tsx (lines 150-161)
- [x] 1.1.2 Remove duplicate "Hover Actions" block in InstagramCard.tsx (lines 137-188)
- [x] 1.1.3 Test both cards to ensure single archive button renders correctly
- [x] 1.1.4 Create Playwright test `duplicate-buttons.spec.ts`

### 1.2 Create Prompt Templates Directory
- [x] 1.2.1 Create `/lib/prompts/` directory structure
- [x] 1.2.2 Move existing classification logic to `classification.ts`
- [x] 1.2.3 Set up TypeScript exports and module structure

### 1.3 Audit Overflow Issues
- [ ] 1.3.1 Test all components at viewport sizes: 375px, 768px, 1024px, 1920px
- [ ] 1.3.2 Identify overflow issues in masonry grid and cards
- [ ] 1.3.3 Apply fixes using `max-w-full`, `overflow-hidden`, `line-clamp-X`
- [ ] 1.3.4 Create Playwright test `no-overflow.spec.ts`

## Phase 2: Instagram Visual Carousel

### 2.1 Backend: Carousel Image Extraction
- [ ] 2.1.1 Update Instagram scraper to extract all carousel images to `metadata.images[]`
- [ ] 2.1.2 Add carousel detection logic (check for multiple images in metadata)
- [ ] 2.1.3 Store image order and aspect ratios

### 2.2 Frontend: Grid View Indicator
- [ ] 2.2.1 Add carousel indicator badge to InstagramCard (e.g., "1/10" overlay)
- [ ] 2.2.2 Style badge with Instagram gradient theme
- [ ] 2.2.3 Show badge only when `metadata.images.length > 1`

### 2.3 Frontend: Detail View Carousel
- [ ] 2.3.1 Enhance CardDetailModal to display all `metadata.images[]` for Instagram
- [ ] 2.3.2 Add Previous/Next navigation buttons
- [ ] 2.3.3 Implement dot navigation for quick jumping
- [ ] 2.3.4 Add swipe gestures for mobile (use `react-swipeable` or native touch events)
- [ ] 2.3.5 Maintain original Instagram aspect ratio (square or 4:5)

### 2.4 AI: Multi-Image Analysis
- [ ] 2.4.1 Create `lib/prompts/instagram.ts` with multi-image prompt template
- [ ] 2.4.2 Update `lib/ai.ts` to detect Instagram carousel and use appropriate prompt
- [ ] 2.4.3 Generate holistic summary encompassing all photos in carousel
- [ ] 2.4.4 Extract hashtags from caption as auto-tags

### 2.5 Testing
- [ ] 2.5.1 Create Playwright test `instagram-carousel.spec.ts`
- [ ] 2.5.2 Test with real Instagram carousel URL (10+ images)
- [ ] 2.5.3 Verify all images display in detail view
- [ ] 2.5.4 Verify carousel navigation and swipe gestures work

## Phase 3: Twitter Visual Fidelity

### 3.1 Backend: Tweet Data Enhancement
- [ ] 3.1.1 Add thread detection to `lib/scraper.ts` (check for tweet ID patterns)
- [ ] 3.1.2 Fetch thread context if tweet is part of conversation
- [ ] 3.1.3 Store text formatting metadata (line breaks, hashtag positions)

### 3.2 Frontend: TwitterCard Redesign
- [ ] 3.2.1 Redesign TwitterCard to match Twitter visual layout
- [ ] 3.2.2 Add centered layout with proper spacing
- [ ] 3.2.3 Preserve line breaks in tweet text (`whitespace-pre-wrap` applied)
- [ ] 3.2.4 Highlight hashtags with blue color
- [ ] 3.2.5 Display all embedded media (images/videos)

### 3.3 AI: Twitter-Specific Prompts
- [ ] 3.3.1 Create `lib/prompts/twitter.ts` with tweet analysis template
- [ ] 3.3.2 Implement OCR on tweet images during enrichment
- [ ] 3.3.3 Include thread context in summary if available
- [ ] 3.3.4 Analyze formatting characteristics (hashtags, mentions, line breaks)

### 3.4 Testing
- [ ] 3.4.1 Create Playwright test `twitter-visual-fidelity.spec.ts`
- [ ] 3.4.2 Test with tweet containing images, hashtags, line breaks
- [ ] 3.4.3 Verify X logo, author display, and text formatting
- [ ] 3.4.4 Test thread detection with multi-tweet conversation

## Phase 4: AI Feedback & UX Polish

### 4.1 State Machine Implementation
- [ ] 4.1.1 Define AIState type in CardDetailModal with 6 states
- [ ] 4.1.2 Implement state transitions (idle → typing → saving → saved)
- [ ] 4.1.3 Add error state with retry functionality

### 4.2 Visual Feedback Indicators
- [ ] 4.2.1 Add pulsing border for "typing" state (teal color)
- [ ] 4.2.2 Implement progress bar for "saving" state (0-100%)
- [ ] 4.2.3 Create shimmer animation for "analyzing" state
- [ ] 4.2.4 Add green checkmark bounce animation for "saved" state
- [ ] 4.2.5 Add red exclamation for "error" state with retry button

### 4.3 AIThinkingIndicator Enhancement
- [ ] 4.3.1 Add stage-based icons (🔍, 🧠, ✨, ⏳)
- [ ] 4.3.2 Update text for each stage:
  - Stage 1: "Reading content..."
  - Stage 2: "Analyzing..."
  - Stage 3: "Generating summary..."
  - Stage 4: "Finishing up..."
- [ ] 4.3.3 Apply shimmer animation to card background during AI enrichment

### 4.4 Auto-Save Behavior
- [ ] 4.4.1 Implement field-specific debounce:
  - Title: 1s debounce
  - Summary: 2.5s debounce
  - Notes: 500ms debounce
- [ ] 4.4.2 Add ALL CAPS enforcement option (user preference toggle)
- [ ] 4.4.3 Show "Saved" feedback that fades after 1s

### 4.5 Animations
- [ ] 4.5.1 Add keyframes to `globals.css` for state transitions:
  - Pulse animation for borders
  - Bounce animation for checkmark
  - Shimmer animation for analyzing state
- [ ] 4.5.2 Ensure animations respect `prefers-reduced-motion`

### 4.6 Testing
- [ ] 4.6.1 Create Playwright test `ai-feedback-states.spec.ts`
- [ ] 4.6.2 Test all state transitions
- [ ] 4.6.3 Verify auto-save debounce timing
- [ ] 4.6.4 Test error state and retry button

## Phase 5: Mobile Enhancements

### 5.1 Mobile Toggle Implementation
- [ ] 5.1.1 Add toggle state to CardDetailModal (visual | text)
- [ ] 5.1.2 Create toggle UI with arrows: `[← Visual  Text →]`
- [ ] 5.1.3 Add indicator dots showing current view (2 dots)

### 5.2 Swipe Gestures
- [ ] 5.2.1 Install `react-swipeable` or implement native touch events
- [ ] 5.2.2 Implement swipe left (Visual → Text)
- [ ] 5.2.3 Implement swipe right (Text → Visual)
- [ ] 5.2.4 Add smooth transition animation (<200ms)

### 5.3 Responsive Layout
- [ ] 5.3.1 Apply toggle view for `< 768px` (mobile)
- [ ] 5.3.2 Maintain side-by-side split for `>= 768px` (tablet/desktop)
- [ ] 5.3.3 Test at breakpoints: 375px, 390px, 768px, 1024px

### 5.4 Safe Area Insets
- [ ] 5.4.1 Add `pb-safe` for iOS devices with bottom bars
- [ ] 5.4.2 Respect notch area on iPhone X and later

### 5.5 Testing
- [ ] 5.5.1 Create Playwright test `mobile-detail-view.spec.ts`
- [ ] 5.5.2 Test toggle functionality at 375px width
- [ ] 5.5.3 Verify swipe gestures work correctly
- [ ] 5.5.4 Check smooth transition between views

## Phase 6: Theme & Customization

### 6.1 Dark Mode Implementation
- [ ] 6.1.1 Add CSS variables to `globals.css`:
  - `--background`, `--foreground`, `--foreground-muted`
  - `--accent-primary`, `--border`
- [ ] 6.1.2 Create dark mode palette with proper contrast ratios
- [ ] 6.1.3 Add `@media (prefers-color-scheme: dark)` query
- [ ] 6.1.4 Test all components in dark mode

### 6.2 SettingsModal Component
- [ ] 6.2.1 Create `components/SettingsModal.tsx`
- [ ] 6.2.2 Add floating settings button (bottom-right corner)
- [ ] 6.2.3 Implement background color picker (5 presets)
- [ ] 6.2.4 Implement font selector (3 choices)
- [ ] 6.2.5 Implement highlight color picker (5 options)
- [ ] 6.2.6 Add dark mode manual toggle

### 6.3 Live Preview
- [ ] 6.3.1 Update preview as user changes settings
- [ ] 6.3.2 Apply changes instantly without page reload

### 6.4 Persistence
- [ ] 6.4.1 Store theme preferences in localStorage
- [ ] 6.4.2 Load preferences on app initialization
- [ ] 6.4.3 Inject theme class in `app/layout.tsx`

### 6.5 Accessibility
- [ ] 6.5.1 Verify color contrast meets WCAG AA (4.5:1 for text)
- [ ] 6.5.2 Test with Axe DevTools
- [ ] 6.5.3 Add keyboard navigation for settings modal

### 6.6 Font Loading
- [ ] 6.6.1 Use `next/font` for performance
- [ ] 6.6.2 Preload selected fonts
- [ ] 6.6.3 Add font-display: swap for FOUT prevention

## Phase 7: Testing & Documentation

### 7.1 Test Suite Completion
- [ ] 7.1.1 Ensure all 6 new test files are complete:
  - `duplicate-buttons.spec.ts`
  - `instagram-carousel.spec.ts`
  - `twitter-visual-fidelity.spec.ts`
  - `ai-feedback-states.spec.ts`
  - `mobile-detail-view.spec.ts`
  - `no-overflow.spec.ts`

### 7.2 Pre-Commit Hook
- [ ] 7.2.1 Add test script to `package.json`:
  - `test:core` - Run critical regression tests
- [ ] 7.2.2 Create Git hook (`.husky/pre-commit` or simple hook)
- [ ] 7.2.3 Configure hook to run `npm run test:core`

### 7.3 Test Execution
- [ ] 7.3.1 Run full Playwright test suite
- [ ] 7.3.2 Fix any failing tests
- [ ] 7.3.3 Verify all tests pass in CI environment

### 7.4 Performance Validation
- [ ] 7.4.1 Test save operation: <200ms optimistic UI
- [ ] 7.4.2 Test AI enrichment: <30s with stage feedback
- [ ] 7.4.3 Test carousel navigation: <100ms response
- [ ] 7.4.4 Test mobile toggle: <200ms animation
- [ ] 7.4.5 Test dark mode switch: <100ms render

### 7.5 Accessibility Audit
- [ ] 7.5.1 Run Axe DevTools on all pages
- [ ] 7.5.2 Verify WCAG AA compliance
- [ ] 7.5.3 Test keyboard navigation
- [ ] 7.5.4 Test screen reader compatibility

### 7.6 Documentation
- [ ] 7.6.1 Update README.md with new features:
  - Instagram carousel support
  - Twitter visual fidelity
  - Theme customization
  - Mobile detail view toggle
- [ ] 7.6.2 Document platform-specific prompts in code comments
- [ ] 7.6.3 Add JSDoc comments to new components
- [ ] 7.6.4 Create user guide for theme customization

### 7.7 Database Migration (if needed)
- [ ] 7.7.1 Check if schema changes required for carousel metadata
- [ ] 7.7.2 Create migration script if needed
- [ ] 7.7.3 Test migration on staging environment

## Completion Criteria

All tasks must be completed with:
- ✓ Zero duplicate archive buttons on any card type
- ✓ Instagram carousel displays all images with navigation
- ✓ Twitter cards preserve formatting and visual layout
- ✓ AI feedback shows clear visual states (not just text)
- ✓ Mobile detail view toggles smoothly between visual/text
- ✓ Theme customization works with live preview
- ✓ All 6 Playwright tests passing
- ✓ No horizontal overflow on any viewport (375px - 1920px)
- ✓ Performance budget maintained (<200ms save, <30s AI enrichment)
- ✓ WCAG AA accessibility compliance
