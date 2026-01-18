# AI Enrichment Specification

## ADDED Requirements

### Requirement: Platform-Specific Prompt System
The AI enrichment system MUST use platform-specific prompt templates that capture the unique visual and structural characteristics of each content platform.

#### Scenario: Instagram content enrichment
- **WHEN** a card with `platform === 'instagram'` is enriched
- **THEN** the Instagram-specific prompt template is used
- **AND** prompt emphasizes visual description before caption
- **AND** prompt instructs extraction of hashtags from caption
- **AND** prompt includes OCR analysis of image text if present

#### Scenario: Twitter content enrichment
- **WHEN** a card with `platform === 'twitter'` is enriched
- **THEN** the Twitter-specific prompt template is used
- **AND** prompt instructs preservation of formatting characteristics
- **AND** prompt includes analysis of hashtags and mentions
- **AND** prompt considers thread context if available

#### Scenario: Generic website enrichment
- **WHEN** a card with unknown or generic platform is enriched
- **THEN** the website-specific prompt template is used
- **AND** prompt emphasizes page layout and hero image
- **AND** prompt extracts dominant colors from screenshot
- **AND** prompt identifies page structure (article, landing page, docs)

### Requirement: Instagram Carousel Analysis
When enriching Instagram carousel posts, the system MUST analyze all images in the carousel and generate a holistic summary.

#### Scenario: Multi-image carousel enrichment
- **WHEN** Instagram card has `metadata.images.length > 1`
- **THEN** AI analyzes all images in `metadata.images[]` array
- **AND** summary describes the visual narrative across all images
- **AND** summary leads with "This Instagram carousel contains N images"
- **AND** individual photo descriptions are stored in metadata for semantic search

#### Scenario: Single image Instagram post
- **WHEN** Instagram card has `metadata.images.length === 1`
- **THEN** AI analyzes only the single image
- **AND** summary focuses on single photo composition and caption

### Requirement: Hashtag Extraction
The system MUST automatically extract hashtags from Instagram captions and convert them to card tags for organization.

#### Scenario: Instagram caption with hashtags
- **WHEN** Instagram card is enriched with caption containing hashtags
- **THEN** all hashtags are extracted using regex pattern `#[\w]+`
- **AND** hashtags are added to card's `tags[]` array
- **AND** hashtag symbol (#) is removed from tag values
- **AND** tags are converted to lowercase for consistency

#### Scenario: Instagram caption without hashtags
- **WHEN** Instagram card is enriched with caption containing no hashtags
- **THEN** no tags are auto-generated from caption
- **AND** AI-suggested tags are still added based on content analysis

### Requirement: Twitter Thread Detection
The system MUST detect when a tweet is part of a thread and include thread context in the enrichment.

#### Scenario: Tweet with thread context
- **WHEN** scraper detects tweet is part of a thread (reply or continuation)
- **THEN** scraper fetches related tweets in the thread
- **AND** thread context is stored in `metadata.thread_context`
- **AND** AI summary includes "This tweet is part of a thread" indicator
- **AND** summary considers full thread context, not just single tweet

#### Scenario: Standalone tweet
- **WHEN** scraper detects tweet is not part of a thread
- **THEN** no thread context is fetched
- **AND** AI summary analyzes only the single tweet content

### Requirement: OCR on Tweet Images
When enriching tweets with embedded images, the system MUST run OCR to extract any text visible in the images.

#### Scenario: Tweet with text-heavy image
- **WHEN** tweet contains an image with visible text (screenshot, infographic)
- **THEN** OCR is run on the image using GLM-4.6V
- **AND** extracted text is stored in `metadata.ocr_text`
- **AND** extracted text is included in AI summary
- **AND** OCR text is searchable via full-text search

#### Scenario: Tweet with photo (no text)
- **WHEN** tweet contains an image without significant text
- **THEN** OCR may return empty or minimal text
- **AND** AI summary focuses on visual content of photo
- **AND** no error is raised for empty OCR results

### Requirement: Enrichment Performance
AI enrichment MUST complete within 30 seconds with visible progress feedback at each stage.

#### Scenario: Successful enrichment under 30s
- **WHEN** card is submitted for AI enrichment
- **THEN** enrichment completes within 30 seconds
- **AND** progress updates are emitted every 5 seconds
- **AND** final summary is stored in card's `summary` field

#### Scenario: Enrichment timeout
- **WHEN** AI enrichment takes longer than 30 seconds
- **THEN** request is aborted with timeout error
- **AND** partial results are saved if available
- **AND** card is marked for retry with exponential backoff
- **AND** user sees "Enrichment timeout - retrying" message

### Requirement: Prompt Template Modularity
Prompt templates MUST be organized in separate files per platform to enable independent versioning and maintenance.

#### Scenario: Adding new platform
- **WHEN** new platform support is added (e.g., Bluesky)
- **THEN** developer creates `/lib/prompts/bluesky.ts` file
- **AND** exports platform-specific prompt function
- **AND** updates `/lib/ai.ts` to import and use new prompt
- **AND** no changes required to existing platform prompts

#### Scenario: Updating Instagram prompt
- **WHEN** Instagram prompt template needs refinement
- **THEN** developer edits only `/lib/prompts/instagram.ts`
- **AND** changes do not affect Twitter or website prompts
- **AND** version history is tracked via Git commits to single file

### Requirement: Classification Tool Definition
The classification tool definition MUST provide clear, structured schema for AI to extract card metadata.

#### Scenario: Tool definition structure
- **WHEN** AI classification is invoked
- **THEN** tool definition includes fields: title, summary, tags, category, platform
- **AND** each field has type definition and description
- **AND** tags field specifies array of strings (3-5 tags recommended)
- **AND** platform field includes enum of supported platforms

### Requirement: Enrichment Error Handling
The system MUST gracefully handle AI enrichment errors without breaking the save flow.

#### Scenario: AI API rate limit
- **WHEN** GLM API returns rate limit error (429)
- **THEN** enrichment is queued for retry with exponential backoff
- **AND** card is saved with `metadata.processing = true`
- **AND** user sees "AI enrichment queued" indicator
- **AND** retry attempts continue until success (max 3 retries)

#### Scenario: AI API network error
- **WHEN** GLM API request fails due to network issue
- **THEN** enrichment is retried immediately (1 retry)
- **AND** if retry fails, card is saved without AI summary
- **AND** user sees "Enrichment failed - retry available" message
- **AND** user can manually trigger re-enrichment from detail view

#### Scenario: Invalid AI response
- **WHEN** GLM API returns malformed or invalid JSON
- **THEN** error is logged with full request/response
- **AND** fallback summary is generated from URL and content
- **AND** card is saved with basic metadata
- **AND** monitoring alert is triggered for investigation
