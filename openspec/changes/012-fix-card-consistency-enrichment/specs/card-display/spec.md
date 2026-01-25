# Card Display Specification Delta

## ADDED Requirements

### Requirement: Universal Domain Link Display
All platform-specific card components SHALL display a blue highlighted domain link showing the source website.

The domain link SHALL:
- Use the accent color: `text-[var(--accent-primary)]`
- Include a Globe icon prefix
- Be positioned consistently in the card's content area
- Be extracted from the card's URL property

#### Scenario: Card shows domain link
- **WHEN** a card is rendered for any platform (YouTube, Letterboxd, IMDB, Goodreads, Amazon, StoryGraph, etc.)
- **THEN** the card displays the domain (e.g., "youtube.com", "letterboxd.com") in blue accent color

#### Scenario: Domain extracted from URL
- **WHEN** card.url is "https://www.letterboxd.com/film/kpop-demon-hunters/"
- **THEN** domain displayed is "letterboxd.com" (www prefix removed)

### Requirement: Standardized External Link Position
All platform-specific card components SHALL position the external link button in the bottom-right corner.

#### Scenario: External link button placement
- **WHEN** a card is rendered with a URL
- **THEN** the external link button appears in the bottom-right corner
- **AND** uses the shared `ExternalLinkButton` component with `position="bottom-right"`

## MODIFIED Requirements

### Requirement: Card Hover Actions
Card hover actions (archive, delete, restore) SHALL be consistently implemented across all platform cards using the shared `CardActions` component.

The actions SHALL:
- Appear in the top-right corner on hover
- Use the `CardActions` component from `cards/CardActions.tsx`
- Support light/dark variants based on card background

#### Scenario: Hover actions on all cards
- **WHEN** user hovers over any platform card (YouTube, Letterboxd, IMDB, etc.)
- **THEN** archive, delete, and restore buttons appear in top-right corner

#### Scenario: Light variant for light backgrounds
- **WHEN** card has a light background (e.g., GenericCard, TwitterCard)
- **THEN** CardActions uses `variant="light"`

#### Scenario: Dark variant for dark backgrounds
- **WHEN** card has a dark/image background (e.g., YouTubeCard, MovieCard)
- **THEN** CardActions uses `variant="dark"`
