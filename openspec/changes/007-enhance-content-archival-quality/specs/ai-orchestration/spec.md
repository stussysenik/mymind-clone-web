# AI Orchestration Capability

## ADDED Requirements

### Requirement: Multi-Model Coordination
The system SHALL coordinate GLM-4.6V (vision) and GLM-4.7 (text) models to generate context-aware summaries and classifications.

#### Scenario: Image-based content classification
- **WHEN** a card has an imageUrl and content is being enriched
- **THEN** the system SHALL first call GLM-4.6V to analyze the image
- **AND** the system SHALL extract colors, objects, and visual vibe from the vision model
- **AND** the system SHALL pass the vision analysis as context to GLM-4.7 for text classification
- **AND** the text model SHALL generate a summary informed by the visual content

#### Scenario: Text-only content classification
- **WHEN** a card has no imageUrl or image fetch fails
- **THEN** the system SHALL skip GLM-4.6V vision analysis
- **AND** the system SHALL use GLM-4.7 directly for text-based classification
- **AND** the classification SHALL be based solely on URL and text content

#### Scenario: Vision model failure
- **WHEN** GLM-4.6V returns an error or times out
- **THEN** the system SHALL log the failure and continue with text-only classification
- **AND** the system SHALL NOT retry the vision model to avoid cascading delays
- **AND** the enrichment SHALL complete successfully with text-only analysis

### Requirement: Context Caching for Cost Optimization
The system SHALL implement context caching to reduce GLM API costs by 40% or more.

#### Scenario: First-time content enrichment
- **WHEN** a card is being enriched for the first time
- **THEN** the system SHALL generate a cache key from imageUrl hash and content hash
- **AND** the system SHALL call GLM API with the full context
- **AND** the system SHALL store the response in cache with 24-hour TTL
- **AND** the API cost SHALL be $0.60 per 1M input tokens (standard rate)

#### Scenario: Cached content enrichment
- **WHEN** a card is being enriched and the cache key exists in cache
- **THEN** the system SHALL use the cached context from previous calls
- **AND** the system SHALL call GLM API with cached context reference
- **AND** the API cost SHALL be $0.11 per 1M cached tokens (reduced rate)
- **AND** the enrichment SHALL complete with 40%+ cost savings

#### Scenario: Cache miss after TTL expiration
- **WHEN** the cache key exists but the TTL has expired (>24 hours)
- **THEN** the system SHALL treat it as a first-time enrichment
- **AND** the system SHALL regenerate the cache entry with fresh context
- **AND** the system SHALL log the cache miss for monitoring

#### Scenario: Cache key collision
- **WHEN** two different cards generate the same cache key (rare hash collision)
- **THEN** the system SHALL include the card ID in the cache key to ensure uniqueness
- **AND** the system SHALL prevent incorrect cached responses from being used

### Requirement: Model Parameter Tuning
The system SHALL optimize GLM API parameters (temperature, top_p, max_tokens) based on content type for improved accuracy.

#### Scenario: Classification task parameter tuning
- **WHEN** performing content classification (type, tags, title)
- **THEN** the system SHALL use temperature=0.3 for deterministic results
- **AND** the system SHALL use top_p=0.9 to balance creativity and accuracy
- **AND** the system SHALL use max_tokens=2000 to allow complete responses

#### Scenario: Summary generation parameter tuning
- **WHEN** generating a content summary
- **THEN** the system SHALL use temperature=0.5 for balanced creativity
- **AND** the system SHALL use top_p=0.85 for focused summarization
- **AND** the system SHALL use max_tokens=150 to ensure concise summaries

#### Scenario: Tag generation parameter tuning
- **WHEN** generating semantic tags
- **THEN** the system SHALL use temperature=0.7 for diverse tag suggestions
- **AND** the system SHALL use top_p=0.9 to allow creative tag combinations
- **AND** the system SHALL use max_tokens=50 to ensure 3-5 tags

### Requirement: Optimized Prompt Templates
The system SHALL use DSPy-optimized prompt templates for classification, summarization, and tagging tasks.

#### Scenario: Classification prompt optimization
- **WHEN** classifying content with GLM-4.7
- **THEN** the system SHALL load the optimized classification prompt from `lib/prompts/optimized/classification.ts`
- **AND** the prompt SHALL include vision context if available
- **AND** the prompt SHALL be formatted according to DSPy best practices

#### Scenario: Summarization prompt optimization
- **WHEN** generating a content summary with GLM-4.7
- **THEN** the system SHALL load the optimized summarization prompt from `lib/prompts/optimized/summarization.ts`
- **AND** the prompt SHALL include content length constraints (50-150 chars)
- **AND** the prompt SHALL emphasize conciseness and information density

#### Scenario: Tagging prompt optimization
- **WHEN** generating semantic tags with GLM-4.7
- **THEN** the system SHALL load the optimized tagging prompt from `lib/prompts/optimized/tagging.ts`
- **AND** the prompt SHALL request 3-5 tags (no generic terms)
- **AND** the prompt SHALL include one abstract "vibe" tag

### Requirement: Vision-Text Pipeline Error Handling
The system SHALL handle errors gracefully in the multi-model pipeline without blocking enrichment.

#### Scenario: Vision model timeout
- **WHEN** GLM-4.6V times out after 10 seconds
- **THEN** the system SHALL cancel the vision request
- **AND** the system SHALL proceed with text-only classification
- **AND** the enrichment SHALL complete in <15 seconds total

#### Scenario: Text model rate limit error
- **WHEN** GLM-4.7 returns a 429 rate limit error
- **THEN** the system SHALL wait for the retry-after duration from response headers
- **AND** the system SHALL retry the request once after the wait period
- **AND** the system SHALL fall back to rule-based classification if the retry fails

#### Scenario: Invalid API response format
- **WHEN** GLM API returns a response that cannot be parsed as valid JSON
- **THEN** the system SHALL log the raw response for debugging
- **AND** the system SHALL retry the request once with the same parameters
- **AND** the system SHALL fall back to rule-based classification if parsing fails again

### Requirement: Enrichment Performance Monitoring
The system SHALL track performance metrics for multi-model coordination to ensure <5s total enrichment time.

#### Scenario: Vision model latency tracking
- **WHEN** calling GLM-4.6V for image analysis
- **THEN** the system SHALL record the request start and end times
- **AND** the system SHALL log the latency in milliseconds
- **AND** the system SHALL alert if latency exceeds 5 seconds for 95th percentile

#### Scenario: Text model latency tracking
- **WHEN** calling GLM-4.7 for classification or summarization
- **THEN** the system SHALL record the request start and end times
- **AND** the system SHALL log the latency in milliseconds
- **AND** the system SHALL alert if latency exceeds 3 seconds for 95th percentile

#### Scenario: Total enrichment time tracking
- **WHEN** enriching a card with the full pipeline (vision + text + validation)
- **THEN** the system SHALL record the total enrichment time from start to finish
- **AND** the system SHALL log the breakdown: vision (Xms), text (Yms), validation (Zms)
- **AND** the system SHALL alert if total time exceeds 5 seconds for 95th percentile

#### Scenario: Context cache hit rate monitoring
- **WHEN** tracking context caching performance
- **THEN** the system SHALL log cache hits and misses for each enrichment
- **AND** the system SHALL calculate the cache hit rate as a percentage
- **AND** the system SHALL alert if cache hit rate drops below 50%
