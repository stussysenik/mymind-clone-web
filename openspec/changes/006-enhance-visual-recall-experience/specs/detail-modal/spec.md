# Detail Modal Specification

## ADDED Requirements

### Requirement: Instagram Carousel Navigation
The detail modal MUST display all images from Instagram carousels with intuitive navigation controls.

#### Scenario: Carousel with multiple images
- **WHEN** user opens detail view for Instagram card with `metadata.images.length > 1`
- **THEN** carousel displays first image by default
- **AND** Previous/Next arrow buttons are visible
- **AND** dot navigation shows all images (one dot per image)
- **AND** current image index is highlighted in dot navigation
- **AND** swipe left/right navigates to next/previous image

#### Scenario: Carousel navigation via arrows
- **WHEN** user clicks Next arrow button
- **THEN** carousel transitions to next image with smooth animation (<200ms)
- **AND** dot navigation updates to highlight new current image
- **AND** Previous button becomes enabled (if it was first image)
- **AND** Next button becomes disabled if now on last image

#### Scenario: Carousel navigation via dots
- **WHEN** user clicks a specific dot in navigation
- **THEN** carousel jumps to corresponding image
- **AND** transition animation duration scales with distance (max 400ms)
- **AND** dot navigation updates to highlight selected image

#### Scenario: Carousel swipe gestures
- **WHEN** user swipes left on carousel image (mobile)
- **THEN** carousel transitions to next image
- **AND** swipe threshold is 50px horizontal movement
- **AND** vertical swipes do not trigger navigation (allow scroll)

### Requirement: AI Feedback State Machine
The detail modal MUST display clear visual feedback for all async operations using a finite state machine.

#### Scenario: Idle state
- **WHEN** no async operations are in progress
- **THEN** no loading indicator is displayed
- **AND** all form fields are editable
- **AND** no progress bars or spinners are visible

#### Scenario: Typing state
- **WHEN** user types in title, summary, or notes field
- **THEN** field displays pulsing teal border (1s interval)
- **AND** auto-save debounce timer starts (field-specific duration)
- **AND** no "Saving..." text until debounce completes

#### Scenario: Saving state
- **WHEN** auto-save debounce completes and save begins
- **THEN** progress bar appears beneath field (0% → 100%)
- **AND** rotating spinner icon is displayed
- **AND** text reads "Saving..."
- **AND** transition from typing → saving is smooth (no flicker)

#### Scenario: Analyzing state
- **WHEN** AI enrichment is in progress
- **THEN** shimmer animation overlays the card content area
- **AND** stage-based indicator shows current stage (1-4)
- **AND** stage text updates:
  - Stage 1: "🔍 Reading content..." (0-5s)
  - Stage 2: "🧠 Analyzing..." (5-15s)
  - Stage 3: "✨ Generating summary..." (15-25s)
  - Stage 4: "⏳ Finishing up..." (25-30s)

#### Scenario: Saved state
- **WHEN** save operation completes successfully
- **THEN** green checkmark icon bounces in from right
- **AND** text reads "Saved" for 1 second
- **AND** field border pulses green once
- **AND** indicator fades out after 1 second
- **AND** state returns to idle

#### Scenario: Error state
- **WHEN** save or enrichment operation fails
- **THEN** red exclamation icon appears
- **AND** text reads "Failed to save. [Retry]"
- **AND** field border pulses red twice
- **AND** Retry button is clickable and triggers new save attempt
- **AND** error state persists until user retries or dismisses

### Requirement: Mobile Visual/Text Toggle
On mobile viewports (<768px), the detail modal MUST allow users to toggle between visual-focused and text-focused views.

#### Scenario: Mobile visual view (default)
- **WHEN** detail modal opens on mobile viewport (<768px)
- **THEN** visual view is displayed by default
- **AND** image fills screen (maintains aspect ratio)
- **AND** toggle arrows show at top: `[← Visual  Text →]`
- **AND** indicator dots show "Visual" is active (2 dots total)

#### Scenario: Toggle to text view
- **WHEN** user taps right arrow or swipes left on mobile
- **THEN** view transitions to text-focused layout
- **AND** transition animation takes <200ms
- **AND** text view displays: AI summary, Mind Tags, Mind Notes
- **AND** toggle arrows update: `[← Visual  Text →]` (Text is now active)
- **AND** indicator dots highlight "Text" position

#### Scenario: Toggle back to visual view
- **WHEN** user taps left arrow or swipes right on text view
- **THEN** view transitions back to visual-focused layout
- **AND** previous scroll position is restored
- **AND** transition animation takes <200ms

#### Scenario: Desktop split view
- **WHEN** detail modal opens on desktop viewport (>=768px)
- **THEN** visual and text content are displayed side-by-side
- **AND** visual content occupies 66% of width (left side)
- **AND** text content occupies 33% of width (right side)
- **AND** no toggle arrows are displayed (both views always visible)

### Requirement: Auto-Save Debouncing
The detail modal MUST implement field-specific auto-save debouncing to optimize save operations and reduce API calls.

#### Scenario: Title field auto-save
- **WHEN** user types in title field
- **THEN** save is debounced for 1 second after last keystroke
- **AND** typing state is shown during debounce period
- **AND** save triggers automatically after 1s of inactivity

#### Scenario: Summary field auto-save
- **WHEN** user types in summary field
- **THEN** save is debounced for 2.5 seconds after last keystroke
- **AND** longer debounce allows for full sentence editing
- **AND** save triggers automatically after 2.5s of inactivity

#### Scenario: Notes field auto-save
- **WHEN** user types in notes field
- **THEN** save is debounced for 500ms after last keystroke
- **AND** faster debounce enables rapid note-taking
- **AND** save triggers automatically after 500ms of inactivity

#### Scenario: Multiple fields edited
- **WHEN** user edits title, then summary within debounce window
- **THEN** only one save operation is triggered with both changes
- **AND** save waits for longest debounce period to elapse
- **AND** progress bar shows combined save operation

### Requirement: Carousel Image Aspect Ratio
Instagram carousel images MUST maintain their original aspect ratio (square or 4:5) to preserve visual recall.

#### Scenario: Square Instagram post (1:1)
- **WHEN** Instagram image has 1:1 aspect ratio
- **THEN** carousel container uses `aspect-square` class
- **AND** image fills container without distortion
- **AND** no letterboxing or cropping is applied

#### Scenario: Portrait Instagram post (4:5)
- **WHEN** Instagram image has 4:5 aspect ratio
- **THEN** carousel container adjusts to 4:5 ratio
- **AND** image fills container without distortion
- **AND** surrounding UI adapts to taller image

### Requirement: Carousel Performance
Carousel navigation MUST respond within 100ms to maintain visual primacy and speed-first mandate.

#### Scenario: Instant navigation
- **WHEN** user clicks Next button or swipes to next image
- **THEN** image transition begins within 100ms
- **AND** transition animation completes within 200ms (total 300ms)
- **AND** no layout shift or content jump occurs during transition

#### Scenario: Image lazy loading
- **WHEN** carousel contains more than 3 images
- **THEN** only first 3 images are preloaded
- **AND** remaining images load when user navigates to within 1 image
- **AND** placeholder with shimmer is shown while image loads
- **AND** loading time does not block navigation (user can skip ahead)

### Requirement: Accessibility for Modal Interactions
All modal interactions MUST be keyboard accessible and screen reader compatible.

#### Scenario: Keyboard navigation in carousel
- **WHEN** user focuses on carousel and presses arrow keys
- **THEN** Left arrow navigates to previous image
- **AND** Right arrow navigates to next image
- **AND** focus indicator is clearly visible on current control
- **AND** Escape key closes detail modal

#### Scenario: Screen reader carousel announcements
- **WHEN** screen reader user navigates carousel
- **THEN** current image position is announced (e.g., "Image 3 of 10")
- **AND** alt text for current image is read
- **AND** navigation controls have descriptive ARIA labels:
  - Previous: "Previous image"
  - Next: "Next image"
  - Dots: "Jump to image N"

#### Scenario: Mobile toggle accessibility
- **WHEN** screen reader user interacts with mobile toggle
- **THEN** current view is announced (e.g., "Visual view active")
- **AND** toggle arrows have ARIA labels ("Show text view", "Show visual view")
- **AND** view change is announced when toggled

### Requirement: Modal Responsive Spacing
The detail modal MUST maintain consistent spacing across all viewport sizes without overflow.

#### Scenario: Mobile viewport spacing (375px)
- **WHEN** detail modal is displayed at 375px width
- **THEN** outer padding is 16px on all sides
- **AND** inner content padding is 12px
- **AND** section gaps are 8px
- **AND** no horizontal scroll is possible

#### Scenario: Desktop viewport spacing (1920px)
- **WHEN** detail modal is displayed at 1920px width
- **THEN** modal has max-width of 1400px and is centered
- **AND** outer padding is 24px
- **AND** visual/text split maintains 66/33 ratio
- **AND** content does not stretch to fill entire width

### Requirement: ALL CAPS Enforcement (Optional)
The detail modal MUST support optional ALL CAPS enforcement for user-generated text fields.

#### Scenario: ALL CAPS enabled
- **WHEN** user has ALL CAPS preference enabled
- **THEN** all text in summary and notes fields is transformed to uppercase on save
- **AND** transformation happens before API call
- **AND** original case is preserved in database (transformation is display-only)

#### Scenario: ALL CAPS disabled (default)
- **WHEN** user has ALL CAPS preference disabled
- **THEN** text is saved with original case (mixed, lower, or upper)
- **AND** no transformation is applied
