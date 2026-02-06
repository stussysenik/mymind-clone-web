## ADDED Requirements

### Requirement: Twitter API-Based Content Extraction
The system SHALL extract tweet content using the FxTwitter API as primary source and Twitter Syndication API as fallback, without launching a headless browser.

#### Scenario: Tweet with images saved successfully
- **WHEN** a user saves a Twitter/X URL containing images
- **THEN** the system extracts tweet text, author info, and image URLs via FxTwitter API in <1s
- **AND** persists tweet images to Supabase Storage
- **AND** displays the tweet with native images in the masonry grid

#### Scenario: Text-only tweet saved successfully
- **WHEN** a user saves a Twitter/X URL with no media
- **THEN** the system extracts tweet text and author info via API
- **AND** renders a styled text card without a broken image placeholder

#### Scenario: FxTwitter API fails, syndication fallback succeeds
- **WHEN** the FxTwitter API returns an error or times out
- **THEN** the system falls back to the Twitter Syndication API
- **AND** still extracts tweet text, author info, and media URLs

#### Scenario: Both APIs fail, graceful degradation
- **WHEN** both FxTwitter and Syndication APIs fail
- **THEN** the system falls back to oEmbed for text extraction
- **AND** uses Microlink for a screenshot preview as last resort

## MODIFIED Requirements

### Requirement: Twitter Card Mobile Preview
The Twitter card component SHALL display tweet author avatars from API metadata and handle multi-image tweets with an image count badge, ensuring no broken image states on mobile.

#### Scenario: Multi-image tweet displays correctly
- **WHEN** a saved tweet contains multiple images
- **THEN** the card displays the first image with a count badge (e.g., "1/4")
- **AND** images are sized responsively for mobile viewports

#### Scenario: Author avatar displays from API data
- **WHEN** a tweet is saved with author avatar URL from FxTwitter
- **THEN** the TwitterCard displays the author's profile picture
- **AND** falls back to the X logo if avatar URL fails to load
