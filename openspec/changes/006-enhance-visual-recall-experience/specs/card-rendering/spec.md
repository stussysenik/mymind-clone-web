# Card Rendering Specification

## ADDED Requirements

### Requirement: Unique Action Buttons
Card components MUST render each action button (archive, delete, restore) exactly once to prevent UX confusion and layout issues.

#### Scenario: TwitterCard renders single archive button
- **WHEN** user hovers over a TwitterCard
- **THEN** exactly one archive button appears in the hover actions area
- **AND** clicking the archive button archives the card without duplicate API calls

#### Scenario: InstagramCard renders single archive button
- **WHEN** user hovers over an InstagramCard
- **THEN** exactly one archive button appears in the hover actions area
- **AND** clicking the archive button archives the card without duplicate API calls

### Requirement: Instagram Carousel Indicator
InstagramCard MUST display a carousel indicator badge when the card contains multiple images, allowing users to identify multi-image posts at a glance.

#### Scenario: Single image Instagram post
- **WHEN** InstagramCard has only one image in `metadata.images[]`
- **THEN** no carousel indicator badge is displayed
- **AND** clicking the card opens detail view with single image

#### Scenario: Multi-image Instagram carousel
- **WHEN** InstagramCard has multiple images in `metadata.images[]`
- **THEN** a badge showing "1/N" (where N is total count) is displayed on the image
- **AND** badge is styled with Instagram gradient theme
- **AND** badge is positioned in top-right or bottom-right corner
- **AND** clicking the card opens detail view with full carousel

### Requirement: Twitter Visual Fidelity
TwitterCard MUST preserve the visual formatting and layout of the original tweet to enable visual recall.

#### Scenario: Tweet with line breaks
- **WHEN** TwitterCard displays a tweet with multiple paragraphs
- **THEN** line breaks are preserved using `whitespace-pre-wrap`
- **AND** spacing between paragraphs matches Twitter's original formatting

#### Scenario: Tweet with hashtags
- **WHEN** TwitterCard displays a tweet containing hashtags
- **THEN** hashtags are highlighted in blue color (#1d9bf0)
- **AND** hashtags are displayed inline with surrounding text

#### Scenario: Tweet with embedded image
- **WHEN** TwitterCard displays a tweet with an attached image
- **THEN** the image is displayed below the tweet text
- **AND** image uses `aspect-video` ratio
- **AND** image loads lazily for performance

#### Scenario: Tweet visual layout
- **WHEN** TwitterCard is rendered
- **THEN** it displays the X logo in the header
- **AND** it shows the author's display name and @username
- **AND** it uses centered layout matching Twitter's design
- **AND** it includes a subtle border or shadow for card distinction

### Requirement: Processing Indicator
Cards MUST display a clear visual indicator when AI enrichment is in progress, using animation and text to convey status.

#### Scenario: Card being enriched
- **WHEN** a card has `metadata.processing === true`
- **THEN** an animated indicator is displayed in the top-right corner
- **AND** indicator includes a rotating spinner icon
- **AND** indicator text reads "Analyzing..."
- **AND** indicator has semi-transparent background for contrast
- **AND** indicator pulses to indicate activity

### Requirement: Hover Actions Accessibility
All card hover actions MUST meet accessibility standards for touch targets and ARIA labels.

#### Scenario: Touch target minimum size
- **WHEN** user hovers over any card
- **THEN** all action buttons (archive, delete, restore, external link) have minimum 44×44px hit area
- **AND** buttons maintain 8px spacing between each other

#### Scenario: Screen reader compatibility
- **WHEN** screen reader user navigates to a card
- **THEN** all action buttons have descriptive ARIA labels
- **AND** card type is announced (e.g., "Twitter card", "Instagram post")
- **AND** card status is announced (e.g., "archived", "processing")

### Requirement: Responsive Card Layout
Card components MUST render without overflow on all viewport sizes from 375px to 1920px width.

#### Scenario: Mobile viewport (375px)
- **WHEN** card is rendered at 375px viewport width
- **THEN** card content fits within viewport without horizontal scroll
- **AND** images scale proportionally
- **AND** text truncates with ellipsis if needed

#### Scenario: Tablet viewport (768px)
- **WHEN** card is rendered at 768px viewport width
- **THEN** card content fits within masonry grid column
- **AND** hover actions are accessible via touch
- **AND** no layout shift occurs on hover

#### Scenario: Desktop viewport (1920px)
- **WHEN** card is rendered at 1920px viewport width
- **THEN** card maintains maximum width constraint
- **AND** content remains legible (not stretched)
- **AND** hover actions appear smoothly with transition
