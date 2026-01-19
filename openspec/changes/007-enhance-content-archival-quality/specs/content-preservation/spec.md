# Content Preservation Capability

## ADDED Requirements

### Requirement: Original Formatting Metadata Storage
The system SHALL preserve original content formatting (line breaks, emphasis, code blocks) in card metadata.

#### Scenario: Extract line breaks from content
- **WHEN** scraping text content from a URL or saving a note
- **THEN** the system SHALL detect line breaks (newlines, `<br>` tags, `<p>` tags)
- **AND** the system SHALL store the line break positions in `card.metadata.formatting.lineBreaks`
- **AND** the system SHALL preserve the line breaks when displaying the card content

#### Scenario: Extract code blocks with syntax highlighting
- **WHEN** scraping content that contains code blocks (e.g., GitHub, Stack Overflow)
- **THEN** the system SHALL detect code blocks (`<pre>`, `<code>`, Markdown backticks)
- **AND** the system SHALL extract the programming language hint (e.g., `language-javascript`)
- **AND** the system SHALL store code blocks in `card.metadata.formatting.codeBlocks` with language metadata
- **AND** the system SHALL render code blocks with syntax highlighting in the UI

#### Scenario: Extract emphasis (bold, italic, links)
- **WHEN** scraping HTML content with emphasis tags (`<strong>`, `<em>`, `<a>`)
- **THEN** the system SHALL extract the emphasized text and its type (bold, italic, link)
- **AND** the system SHALL store the emphasis metadata in `card.metadata.formatting.emphasis`
- **AND** the system SHALL preserve the emphasis when rendering the content

#### Scenario: Content has no special formatting
- **WHEN** content is plain text with no line breaks, code, or emphasis
- **THEN** the system SHALL NOT store formatting metadata (keep `card.metadata.formatting` undefined)
- **AND** the system SHALL render the content as plain text without processing

### Requirement: Thread Context Extraction
The system SHALL preserve conversation thread context for Twitter and Reddit posts.

#### Scenario: Extract Twitter thread parent
- **WHEN** scraping a Twitter/X reply tweet
- **THEN** the system SHALL extract the parent tweet ID from the API response
- **AND** the system SHALL store the parent ID in `card.metadata.threadContext.parentTweetId`
- **AND** the system SHALL fetch and display the parent tweet when the card is opened

#### Scenario: Extract Twitter thread structure
- **WHEN** scraping a Twitter/X thread (multiple tweets by the same author)
- **THEN** the system SHALL extract the tweet IDs in the thread
- **AND** the system SHALL store the reply count in `card.metadata.threadContext.replies`
- **AND** the system SHALL provide navigation UI to view the full thread

#### Scenario: Extract Reddit thread context
- **WHEN** scraping a Reddit comment or post
- **THEN** the system SHALL extract the subreddit name (e.g., "r/programming")
- **AND** the system SHALL extract the parent comment ID if it's a reply
- **AND** the system SHALL store the context in `card.metadata.threadContext`
- **AND** the system SHALL provide a link to the full Reddit thread

#### Scenario: Single post (not a thread)
- **WHEN** scraping a standalone tweet or post (no parent, no replies)
- **THEN** the system SHALL NOT store thread context metadata
- **AND** the system SHALL render the card as a single post without thread UI

### Requirement: Embedded Media Metadata Extraction
The system SHALL extract metadata for embedded videos, iframes, and interactive content.

#### Scenario: Extract video URL from Twitter
- **WHEN** scraping a Twitter/X post with an embedded video
- **THEN** the system SHALL extract the video URL from the API response
- **AND** the system SHALL store the video URL in `card.metadata.embeddedMedia.videoUrl`
- **AND** the system SHALL display a video thumbnail with play button in the card

#### Scenario: Extract video URL from Instagram
- **WHEN** scraping an Instagram Reel or video post
- **THEN** the system SHALL extract the video URL from the embed HTML
- **AND** the system SHALL store the video URL in `card.metadata.embeddedMedia.videoUrl`
- **AND** the system SHALL display a video thumbnail with play button in the card

#### Scenario: Extract YouTube embed code
- **WHEN** scraping a page with an embedded YouTube video (iframe)
- **THEN** the system SHALL extract the embed code and video ID
- **AND** the system SHALL store the embed code in `card.metadata.embeddedMedia.embedCode`
- **AND** the system SHALL provide an option to play the video inline

#### Scenario: Extract Vimeo or other iframe embeds
- **WHEN** scraping a page with an iframe embed (Vimeo, CodePen, etc.)
- **THEN** the system SHALL extract the iframe src URL
- **AND** the system SHALL store the embed code in `card.metadata.embeddedMedia.embedCode`
- **AND** the system SHALL sanitize the embed code to prevent XSS attacks

#### Scenario: No embedded media present
- **WHEN** scraping content with no videos or iframes
- **THEN** the system SHALL NOT store embedded media metadata
- **AND** the system SHALL render the card without video controls

### Requirement: Content Display with Formatting
The system SHALL render preserved formatting, thread context, and embedded media in the card UI.

#### Scenario: Display content with line breaks
- **WHEN** displaying a card with `card.metadata.formatting.lineBreaks` set
- **THEN** the system SHALL render the content with preserved line breaks
- **AND** the system SHALL use `white-space: pre-wrap` CSS for natural wrapping
- **AND** the system SHALL maintain the visual structure of the original content

#### Scenario: Display code blocks with syntax highlighting
- **WHEN** displaying a card with `card.metadata.formatting.codeBlocks` set
- **THEN** the system SHALL render code blocks with syntax highlighting using Prism.js or Shiki
- **AND** the system SHALL display the programming language label (e.g., "JavaScript")
- **AND** the system SHALL provide a copy button for code blocks

#### Scenario: Display emphasized text
- **WHEN** displaying a card with `card.metadata.formatting.emphasis` set
- **THEN** the system SHALL render bold text as `<strong>` tags
- **AND** the system SHALL render italic text as `<em>` tags
- **AND** the system SHALL render links as clickable `<a>` tags with external icon

#### Scenario: Display thread context navigation
- **WHEN** displaying a card with `card.metadata.threadContext` set
- **THEN** the system SHALL show a "View Full Thread" button above the content
- **AND** the system SHALL display the reply count (e.g., "3 replies")
- **AND** the system SHALL link to the original thread on the source platform

#### Scenario: Display embedded video thumbnail
- **WHEN** displaying a card with `card.metadata.embeddedMedia.videoUrl` set
- **THEN** the system SHALL show a video thumbnail with a play button overlay
- **AND** the system SHALL open the video in a modal or inline player when clicked
- **AND** the system SHALL provide a fallback link to the original video if playback fails

### Requirement: Content Preservation for Multi-Image Posts
The system SHALL preserve all images in Instagram carousels and multi-image Twitter posts.

#### Scenario: Save Instagram carousel images
- **WHEN** scraping an Instagram carousel post with multiple images
- **THEN** the system SHALL extract all image URLs from the carousel
- **AND** the system SHALL store all image URLs in `card.metadata.images` array
- **AND** the system SHALL display a carousel UI in the card detail view
- **AND** the system SHALL show image count indicator (e.g., "1 / 5")

#### Scenario: Save Twitter multi-image post
- **WHEN** scraping a Twitter/X post with 2-4 images
- **THEN** the system SHALL extract all image URLs (append `:orig` for original quality)
- **AND** the system SHALL store all image URLs in `card.metadata.images` array
- **AND** the system SHALL display a grid or carousel UI in the card detail view

#### Scenario: Navigate carousel images
- **WHEN** a user views a card with multiple images (`card.metadata.images.length > 1`)
- **THEN** the system SHALL provide left/right navigation arrows
- **AND** the system SHALL support swipe gestures on mobile
- **AND** the system SHALL show the current image index (e.g., "3 / 5")

### Requirement: Formatting Retention Rate Measurement
The system SHALL measure the percentage of original formatting retained after scraping and enrichment.

#### Scenario: Calculate formatting retention rate
- **WHEN** measuring content preservation quality
- **THEN** the system SHALL compare the original HTML structure to the stored metadata
- **AND** the system SHALL calculate the retention rate as: (preserved_elements / total_elements) * 100
- **AND** the system SHALL target a retention rate of 95% or higher

#### Scenario: Track formatting loss
- **WHEN** formatting is lost during scraping or enrichment
- **THEN** the system SHALL log the lost formatting types (line breaks, code, emphasis)
- **AND** the system SHALL increment the formatting loss counter
- **AND** the system SHALL alert if retention rate drops below 90%

#### Scenario: Validate preserved content
- **WHEN** testing content preservation on sample URLs
- **THEN** the system SHALL manually verify that formatting is preserved correctly
- **AND** the system SHALL check that code blocks have correct syntax highlighting
- **AND** the system SHALL check that thread context links work correctly
