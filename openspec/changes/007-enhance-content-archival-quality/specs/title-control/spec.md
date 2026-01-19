# Title Control Capability

## ADDED Requirements

### Requirement: Dual Title Storage
The system SHALL store both original (scraped) and AI-generated titles for all cards to enable user choice.

#### Scenario: Save card with successful scrape
- **WHEN** a URL is saved and scraping succeeds with a valid title
- **THEN** the system SHALL store the scraped title in `card.metadata.originalTitle`
- **AND** the system SHALL store the AI-generated title in `card.metadata.aiTitle` (during enrichment)
- **AND** the system SHALL set `card.metadata.titleSource` to 'original' (default preference)
- **AND** the system SHALL set `card.title` to the original title for display

#### Scenario: Save card with failed scrape
- **WHEN** a URL is saved but scraping fails or returns no title
- **THEN** the system SHALL set `card.metadata.originalTitle` to null
- **AND** the system SHALL store the AI-generated title in `card.metadata.aiTitle` (during enrichment)
- **AND** the system SHALL set `card.metadata.titleSource` to 'ai' (fallback to AI)
- **AND** the system SHALL set `card.title` to the AI-generated title for display

#### Scenario: Save note without URL
- **WHEN** a user saves a note (no URL)
- **THEN** the system SHALL extract the first line as `card.metadata.originalTitle`
- **AND** the system SHALL store the AI-generated title in `card.metadata.aiTitle` (during enrichment)
- **AND** the system SHALL set `card.metadata.titleSource` to 'original' (user-provided content)
- **AND** the system SHALL set `card.title` to the first line for display

#### Scenario: Both titles are identical
- **WHEN** the original and AI-generated titles are identical (exact match)
- **THEN** the system SHALL store both titles (no deduplication)
- **AND** the system SHALL allow the user to toggle between sources (even if identical)
- **AND** the toggle UI SHALL indicate that both titles are the same

### Requirement: Title Source Toggle UI
The system SHALL provide a toggle control in the card detail view to switch between original and AI-generated titles.

#### Scenario: Display title toggle button
- **WHEN** a user opens CardDetailModal for a card with both originalTitle and aiTitle
- **THEN** the system SHALL display a toggle button (⇄ icon) next to the title
- **AND** the button SHALL show a tooltip: "Switch between original and AI-generated title"
- **AND** the button SHALL be positioned to the right of the title

#### Scenario: Hide title toggle for cards with single title
- **WHEN** a user opens CardDetailModal for a card with only originalTitle OR only aiTitle
- **THEN** the system SHALL NOT display the toggle button
- **AND** the system SHALL display the available title without toggle UI

#### Scenario: Toggle from original to AI title
- **WHEN** a user clicks the toggle button while viewing the original title
- **THEN** the system SHALL switch to display the AI-generated title
- **AND** the system SHALL update `card.metadata.titleSource` to 'ai'
- **AND** the system SHALL call PATCH `/api/cards/[id]/title-source` to persist the change
- **AND** the system SHALL update the card display immediately (optimistic UI)

#### Scenario: Toggle from AI to original title
- **WHEN** a user clicks the toggle button while viewing the AI-generated title
- **THEN** the system SHALL switch to display the original title
- **AND** the system SHALL update `card.metadata.titleSource` to 'original'
- **AND** the system SHALL call PATCH `/api/cards/[id]/title-source` to persist the change
- **AND** the system SHALL update the card display immediately (optimistic UI)

#### Scenario: Toggle update fails
- **WHEN** the PATCH request to update title source fails (network error, server error)
- **THEN** the system SHALL revert the title display to the previous source
- **AND** the system SHALL show an error toast: "Failed to update title preference. Please try again."
- **AND** the system SHALL log the error for monitoring

### Requirement: Title Source Persistence API
The system SHALL provide an API endpoint to update the title source preference for a card.

#### Scenario: Update title source to AI
- **WHEN** a PATCH request is sent to `/api/cards/[id]/title-source` with `{ titleSource: 'ai' }`
- **THEN** the system SHALL validate that the card has `metadata.aiTitle` set
- **AND** the system SHALL update `card.metadata.titleSource` to 'ai'
- **AND** the system SHALL update `card.title` to `card.metadata.aiTitle`
- **AND** the system SHALL return 200 OK with the updated card

#### Scenario: Update title source to original
- **WHEN** a PATCH request is sent to `/api/cards/[id]/title-source` with `{ titleSource: 'original' }`
- **THEN** the system SHALL validate that the card has `metadata.originalTitle` set
- **AND** the system SHALL update `card.metadata.titleSource` to 'original'
- **AND** the system SHALL update `card.title` to `card.metadata.originalTitle`
- **AND** the system SHALL return 200 OK with the updated card

#### Scenario: Update title source for unavailable title
- **WHEN** a PATCH request attempts to set titleSource to 'original' but `metadata.originalTitle` is null
- **THEN** the system SHALL return 400 Bad Request with error: "Original title not available"
- **AND** the system SHALL NOT update the card
- **AND** the system SHALL suggest using 'ai' as the title source

#### Scenario: Invalid title source value
- **WHEN** a PATCH request is sent with an invalid titleSource value (not 'original' or 'ai')
- **THEN** the system SHALL return 400 Bad Request with error: "Invalid titleSource. Must be 'original' or 'ai'"
- **AND** the system SHALL NOT update the card

### Requirement: Title Source Visual Indicators
The system SHALL provide clear visual feedback about which title source is currently displayed.

#### Scenario: Show original title indicator
- **WHEN** displaying a card with `metadata.titleSource` set to 'original'
- **THEN** the system SHALL show a badge or icon (📄) next to the title
- **AND** the system SHALL show a tooltip on hover: "Original title from source"
- **AND** the badge SHALL use a distinct color (e.g., blue)

#### Scenario: Show AI-generated title indicator
- **WHEN** displaying a card with `metadata.titleSource` set to 'ai'
- **THEN** the system SHALL show a badge or icon (🤖) next to the title
- **AND** the system SHALL show a tooltip on hover: "AI-generated title"
- **AND** the badge SHALL use a distinct color (e.g., purple)

#### Scenario: Indicate title quality in toggle button
- **WHEN** a user hovers over the title toggle button
- **THEN** the system SHALL show both titles in a tooltip for comparison:
  - "Original: [originalTitle]"
  - "AI: [aiTitle]"
- **AND** the system SHALL highlight the currently active title

#### Scenario: No title source indicator for cards without choice
- **WHEN** displaying a card with only one title available (originalTitle OR aiTitle)
- **THEN** the system SHALL NOT display any title source badge or indicator
- **AND** the system SHALL display the title without visual decoration

### Requirement: Title Source Default Behavior
The system SHALL set intelligent defaults for title source based on content quality.

#### Scenario: Original title is high-quality (scraped successfully)
- **WHEN** the original title is scraped successfully and is not generic (e.g., "Untitled", "Page", URL)
- **THEN** the system SHALL set `metadata.titleSource` to 'original' by default
- **AND** the system SHALL prioritize user-provided or scraped titles over AI

#### Scenario: Original title is low-quality or generic
- **WHEN** the original title is generic (e.g., "Untitled", "Page", "Document") or empty
- **THEN** the system SHALL set `metadata.titleSource` to 'ai' by default
- **AND** the system SHALL use the AI-generated title as more informative

#### Scenario: Original title is URL
- **WHEN** the original title is identical to the URL (scraping failed)
- **THEN** the system SHALL set `metadata.titleSource` to 'ai' by default
- **AND** the system SHALL use the AI-generated title as more readable

#### Scenario: AI enrichment not yet complete
- **WHEN** a card is saved but AI enrichment is still in progress (`metadata.processing` is true)
- **THEN** the system SHALL use the original title (if available) or placeholder "Enriching..."
- **AND** the system SHALL update the title source once enrichment completes
- **AND** the system SHALL notify the user when the AI title is available

### Requirement: Title Source Backward Compatibility
The system SHALL handle existing cards without title source metadata gracefully.

#### Scenario: Existing card without titleSource metadata
- **WHEN** displaying a card that was created before title control was implemented
- **THEN** the system SHALL treat the card as having only one title (originalTitle)
- **AND** the system SHALL NOT display the toggle button
- **AND** the system SHALL set `metadata.titleSource` to 'original' lazily (on next update)

#### Scenario: Enrich existing card to add AI title
- **WHEN** an existing card is re-enriched with the new AI pipeline
- **THEN** the system SHALL add `metadata.aiTitle` while preserving `card.title` as `originalTitle`
- **AND** the system SHALL set `metadata.titleSource` to 'original' (preserve user's current view)
- **AND** the system SHALL enable the toggle button for future use

#### Scenario: Migrate existing cards during batch migration
- **WHEN** running batch migration script on existing cards
- **THEN** the system SHALL set `metadata.originalTitle` to the current `card.title`
- **AND** the system SHALL generate `metadata.aiTitle` using the AI pipeline
- **AND** the system SHALL set `metadata.titleSource` to 'original' (preserve current state)
- **AND** the system SHALL NOT change the displayed title (no user disruption)

### Requirement: Title Source User Preference Persistence
The system SHALL remember the user's title source preference across sessions.

#### Scenario: User preference persists on reload
- **WHEN** a user toggles a card's title to AI and reloads the page
- **THEN** the system SHALL load the card with `metadata.titleSource` set to 'ai'
- **AND** the system SHALL display the AI-generated title (user's preference preserved)
- **AND** the toggle button SHALL reflect the correct state

#### Scenario: User preference syncs across devices
- **WHEN** a user toggles a card's title on device A and opens the same card on device B
- **THEN** the system SHALL display the same title source on both devices (synced via database)
- **AND** the user SHALL have a consistent experience across devices

#### Scenario: Global title preference (future consideration)
- **WHEN** a user consistently prefers AI titles over original titles (or vice versa)
- **THEN** the system MAY offer a global preference setting in the future
- **AND** the per-card preference SHALL always override the global preference
- **Note**: Global preference is NOT part of this change, but the architecture should support it
