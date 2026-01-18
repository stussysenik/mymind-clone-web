# Testing Specification

## ADDED Requirements

### Requirement: Duplicate Button Regression Test
The test suite MUST include a test that prevents the duplicate archive button bug from recurring.

#### Scenario: TwitterCard single archive button
- **WHEN** `duplicate-buttons.spec.ts` is executed
- **THEN** test navigates to page with TwitterCard
- **AND** test counts archive buttons within TwitterCard
- **AND** test asserts exactly 1 archive button exists
- **AND** test fails if 0 or >1 archive buttons are found

#### Scenario: InstagramCard single archive button
- **WHEN** `duplicate-buttons.spec.ts` is executed
- **THEN** test navigates to page with InstagramCard
- **AND** test counts archive buttons within InstagramCard
- **AND** test asserts exactly 1 archive button exists
- **AND** test fails if 0 or >1 archive buttons are found

#### Scenario: All card types coverage
- **WHEN** `duplicate-buttons.spec.ts` is executed
- **THEN** test covers all card types: TwitterCard, InstagramCard, GenericCard
- **AND** test uses data-testid attributes for reliable selection
- **AND** test runs in CI on every commit

### Requirement: Instagram Carousel E2E Test
The test suite MUST verify that Instagram carousels display all images with proper navigation.

#### Scenario: Multi-image carousel display
- **WHEN** `instagram-carousel.spec.ts` is executed
- **THEN** test saves an Instagram carousel URL with 10+ images
- **AND** test waits for enrichment to complete (max 30s timeout)
- **AND** test opens detail view by clicking card
- **AND** test counts carousel dots and verifies count > 1
- **AND** test navigates through all images using Next button
- **AND** test verifies each image is unique (different src)

#### Scenario: Carousel navigation controls
- **WHEN** `instagram-carousel.spec.ts` tests carousel
- **THEN** test verifies Previous button is disabled on first image
- **AND** test verifies Next button is disabled on last image
- **AND** test clicks each dot and verifies correct image displays
- **AND** test performs swipe gesture and verifies navigation works

### Requirement: Twitter Visual Fidelity Test
The test suite MUST verify that tweets are rendered with proper formatting and visual layout.

#### Scenario: Tweet formatting preservation
- **WHEN** `twitter-visual-fidelity.spec.ts` is executed
- **THEN** test saves a tweet URL with line breaks and hashtags
- **AND** test waits for enrichment to complete
- **AND** test opens card and verifies X logo is visible
- **AND** test verifies author name and @username are displayed
- **AND** test verifies tweet text preserves line breaks
- **AND** test verifies hashtags are highlighted in blue

#### Scenario: Tweet media display
- **WHEN** `twitter-visual-fidelity.spec.ts` tests tweet with image
- **THEN** test verifies embedded image is displayed
- **AND** test verifies image uses aspect-video ratio
- **AND** test verifies image loads lazily (not blocking initial render)

### Requirement: AI Feedback States Test
The test suite MUST verify that all AI feedback states transition correctly and display appropriate visual indicators.

#### Scenario: Analyzing state display
- **WHEN** `ai-feedback-states.spec.ts` is executed
- **THEN** test saves a new URL to trigger AI enrichment
- **AND** test verifies "Analyzing..." indicator appears within 1s
- **AND** test verifies shimmer animation is applied to card
- **AND** test verifies stage text updates during enrichment
- **AND** test waits for enrichment to complete (max 30s)
- **AND** test verifies "Analyzing..." indicator disappears

#### Scenario: Saved state display
- **WHEN** `ai-feedback-states.spec.ts` tests field editing
- **THEN** test types in title field
- **AND** test waits for debounce period (1s)
- **AND** test verifies "Saving..." indicator appears
- **AND** test verifies "Saved" checkmark appears after save completes
- **AND** test verifies "Saved" indicator fades after 1s

#### Scenario: Error state and retry
- **WHEN** `ai-feedback-states.spec.ts` simulates save error
- **THEN** test mocks API to return error response
- **AND** test verifies red exclamation icon appears
- **AND** test verifies "Failed to save. [Retry]" text is displayed
- **AND** test clicks Retry button
- **AND** test verifies save is retried and succeeds

### Requirement: Mobile Detail View Toggle Test
The test suite MUST verify that mobile detail view toggle works correctly on small viewports.

#### Scenario: Mobile viewport setup
- **WHEN** `mobile-detail-view.spec.ts` is executed
- **THEN** test sets viewport to 375×667 (iPhone SE)
- **AND** test opens detail view for a card
- **AND** test verifies default view is visual (image fills screen)

#### Scenario: Toggle to text view
- **WHEN** `mobile-detail-view.spec.ts` tests view toggle
- **THEN** test clicks right arrow or performs swipe left
- **AND** test verifies transition animation completes within 200ms
- **AND** test verifies text view is now visible
- **AND** test verifies visual view is hidden
- **AND** test verifies indicator dots highlight "Text"

#### Scenario: Toggle back to visual view
- **WHEN** `mobile-detail-view.spec.ts` is on text view
- **THEN** test clicks left arrow or performs swipe right
- **AND** test verifies transition to visual view within 200ms
- **AND** test verifies visual content is visible
- **AND** test verifies text content is hidden

#### Scenario: Desktop viewport no toggle
- **WHEN** `mobile-detail-view.spec.ts` sets viewport to 1024×768
- **THEN** test verifies both visual and text are visible simultaneously
- **AND** test verifies no toggle arrows are displayed
- **AND** test verifies 66/33 split layout is applied

### Requirement: Responsive Overflow Test
The test suite MUST verify that no horizontal overflow occurs on any viewport size.

#### Scenario: Multiple viewport sizes
- **WHEN** `no-overflow.spec.ts` is executed
- **THEN** test iterates through viewports:
  - 375×667 (iPhone SE)
  - 390×844 (iPhone 12 Pro)
  - 768×1024 (iPad)
  - 1024×768 (Desktop)
  - 1920×1080 (Large Desktop)

#### Scenario: No horizontal scroll
- **WHEN** `no-overflow.spec.ts` tests each viewport
- **THEN** test measures document.scrollWidth
- **AND** test measures document.clientWidth
- **AND** test asserts scrollWidth <= clientWidth
- **AND** test fails if horizontal scroll is possible

#### Scenario: Card content overflow
- **WHEN** `no-overflow.spec.ts` inspects individual cards
- **THEN** test verifies long titles are truncated with ellipsis
- **AND** test verifies images scale within card bounds
- **AND** test verifies tag lists use horizontal scroll with hidden scrollbar
- **AND** test verifies no content extends beyond card edges

### Requirement: Pre-Commit Test Hook
Core regression tests MUST run automatically before every commit to prevent bugs from entering the codebase.

#### Scenario: Pre-commit hook setup
- **WHEN** developer sets up project locally
- **THEN** `.husky/pre-commit` hook is installed
- **AND** hook runs `npm run test:core` on every commit attempt
- **AND** commit is blocked if any test fails
- **AND** developer sees failing test output in terminal

#### Scenario: Core test suite
- **WHEN** `npm run test:core` is executed
- **THEN** only critical tests run (faster feedback):
  - `duplicate-buttons.spec.ts`
  - `instagram-carousel.spec.ts`
  - `twitter-visual-fidelity.spec.ts`
  - `ai-feedback-states.spec.ts`
- **AND** tests run in parallel (4 workers)
- **AND** total execution time is < 2 minutes
- **AND** exit code is non-zero if any test fails

### Requirement: Test Data Fixtures
Tests MUST use consistent fixture data to ensure reproducibility and avoid flaky tests.

#### Scenario: Instagram carousel fixture
- **WHEN** `instagram-carousel.spec.ts` needs test data
- **THEN** test uses mock Instagram carousel with known image count
- **AND** mock data includes `metadata.images[]` with 10 URLs
- **AND** mock enrichment response is deterministic
- **AND** test does not depend on live Instagram API

#### Scenario: Twitter fixture
- **WHEN** `twitter-visual-fidelity.spec.ts` needs test data
- **THEN** test uses mock tweet with specific formatting:
  - Multiple paragraphs (line breaks)
  - 3+ hashtags
  - Embedded image URL
- **AND** mock data is stored in `/tests/fixtures/twitter.json`
- **AND** test does not depend on live Twitter API

### Requirement: CI Integration
All tests MUST run in GitHub Actions on every pull request and commit to main branch.

#### Scenario: CI test execution
- **WHEN** developer opens pull request
- **THEN** GitHub Actions workflow triggers
- **AND** all 6 test files execute: duplicate-buttons, instagram-carousel, twitter-visual-fidelity, ai-feedback-states, mobile-detail-view, no-overflow
- **AND** tests run in headless browser (Chromium)
- **AND** screenshots are captured on failure
- **AND** test results are reported in PR checks

#### Scenario: CI failure blocking merge
- **WHEN** any test fails in CI
- **THEN** PR check status is "failed"
- **AND** merge button is disabled (if branch protection enabled)
- **AND** developer must fix tests before merge

### Requirement: Test Coverage Metrics
Test suite MUST provide code coverage metrics for critical paths.

#### Scenario: Coverage reporting
- **WHEN** `npm run test:coverage` is executed
- **THEN** coverage report is generated for:
  - `/components/cards/TwitterCard.tsx`
  - `/components/cards/InstagramCard.tsx`
  - `/components/CardDetailModal.tsx`
  - `/lib/ai.ts`
- **AND** coverage report shows % of lines, branches, functions covered
- **AND** minimum coverage threshold is 80% for modified files

### Requirement: Accessibility Testing
Tests MUST include automated accessibility checks using Axe.

#### Scenario: Axe audit in detail modal
- **WHEN** `ai-feedback-states.spec.ts` opens detail modal
- **THEN** test runs Axe accessibility scan
- **AND** test asserts zero critical or serious violations
- **AND** test specifically checks:
  - Color contrast (WCAG AA)
  - ARIA labels on buttons
  - Focus indicators
  - Keyboard navigation

#### Scenario: Axe audit in dark mode
- **WHEN** theme system test runs in dark mode
- **THEN** test runs Axe scan with dark theme active
- **AND** test asserts dark mode maintains WCAG AA contrast
- **AND** test fails if contrast ratio < 4.5:1 for text

### Requirement: Performance Testing
Tests MUST validate that performance budgets are met (<200ms interactions).

#### Scenario: Save operation performance
- **WHEN** `ai-feedback-states.spec.ts` tests auto-save
- **THEN** test measures time from keystroke to "Saving..." indicator
- **AND** test asserts latency < 200ms (optimistic UI)
- **AND** test measures time from "Saving..." to "Saved"
- **AND** test asserts save completes within 1s for small payloads

#### Scenario: Carousel navigation performance
- **WHEN** `instagram-carousel.spec.ts` tests image navigation
- **THEN** test measures time from Next click to image transition start
- **AND** test asserts navigation begins within 100ms
- **AND** test measures transition animation duration
- **AND** test asserts total time (click to display) < 300ms

### Requirement: Visual Regression Prevention
Tests MUST use screenshots to detect unintended visual changes.

#### Scenario: Card screenshot comparison
- **WHEN** `duplicate-buttons.spec.ts` runs
- **THEN** test captures screenshot of TwitterCard
- **AND** test compares against baseline image
- **AND** test fails if pixel difference > 1% (allowing for anti-aliasing)
- **AND** diff image is generated for review on failure

#### Scenario: Theme screenshot comparison
- **WHEN** theme system test runs
- **THEN** test captures screenshots in light and dark mode
- **AND** test compares against baseline images
- **AND** test fails if unintended color changes detected
- **AND** developer can update baselines if change is intentional

### Requirement: Test Stability
Tests MUST be reliable and not produce false positives (flaky tests).

#### Scenario: Explicit waits only
- **WHEN** any test needs to wait for async operation
- **THEN** test uses `waitForSelector` with condition
- **AND** test does NOT use `waitForTimeout` (arbitrary delays)
- **AND** test has maximum timeout of 30s for AI enrichment, 5s for UI

#### Scenario: Flaky test detection
- **WHEN** CI runs test suite
- **THEN** each test runs 2 times (retry once on failure)
- **AND** test is marked flaky if passes on retry
- **AND** flaky tests are reported in CI summary
- **AND** developers must fix flaky tests within 1 sprint

### Requirement: Test Documentation
Each test file MUST include clear documentation of what is tested and why.

#### Scenario: Test file header
- **WHEN** developer opens any .spec.ts file
- **THEN** file begins with JSDoc comment explaining:
  - Purpose of test suite
  - Features being tested
  - Critical scenarios covered
- **AND** each test has descriptive name in "should..." format
- **AND** complex assertions have inline comments explaining logic

#### Scenario: Test maintainability
- **WHEN** developer needs to update a test
- **THEN** selectors use data-testid attributes (not brittle class names)
- **AND** test logic is isolated in helper functions
- **AND** assertions use semantic matchers (e.g., `toBeVisible`, not `toHaveCSS`)
- **AND** test can be understood without reading implementation code
