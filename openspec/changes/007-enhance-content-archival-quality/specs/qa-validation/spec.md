# QA Validation Capability

## ADDED Requirements

### Requirement: DSPy-Based Prompt Optimization
The system SHALL use DSPy framework to automatically optimize prompts for classification, summarization, and tagging tasks.

#### Scenario: Initialize DSPy optimizer
- **WHEN** the system starts up or the optimizer is triggered manually
- **THEN** the system SHALL load the DSPy optimizer configuration from `lib/validation/dspy-optimizer.ts`
- **AND** the system SHALL define validation metrics: summaryQuality, tagRelevance, contentPreservation
- **AND** the system SHALL bootstrap the optimizer with sample data (50+ cards)

#### Scenario: Optimize classification prompt
- **WHEN** running DSPy optimization for classification prompts
- **THEN** the system SHALL generate 10+ prompt variations using LLM
- **AND** the system SHALL test each variation against validation metrics
- **AND** the system SHALL select the prompt with highest accuracy score (target 80%+)
- **AND** the system SHALL save the optimized prompt to `lib/prompts/optimized/classification.ts`

#### Scenario: Optimize summarization prompt
- **WHEN** running DSPy optimization for summarization prompts
- **THEN** the system SHALL generate prompt variations with length constraints
- **AND** the system SHALL validate summaries against length (50-150 chars) and keyword relevance
- **AND** the system SHALL select the prompt with best balance of conciseness and information density
- **AND** the system SHALL save the optimized prompt to `lib/prompts/optimized/summarization.ts`

#### Scenario: DSPy optimization failure
- **WHEN** DSPy optimization fails due to API errors or insufficient data
- **THEN** the system SHALL log the error and continue with existing prompts
- **AND** the system SHALL NOT block enrichment operations
- **AND** the system SHALL retry optimization at the next scheduled interval

### Requirement: Heuristic Validation Layer
The system SHALL validate AI outputs using heuristic checks for length, keyword density, and sentiment.

#### Scenario: Summary length validation
- **WHEN** validating an AI-generated summary
- **THEN** the system SHALL check that the summary length is between 50 and 150 characters
- **AND** the system SHALL assign a score: 1.0 if within range, 0.5 if 30-50 or 150-200 chars, 0.0 if outside
- **AND** the system SHALL flag summaries with score <0.5 for review

#### Scenario: Tag count validation
- **WHEN** validating AI-generated tags
- **THEN** the system SHALL check that the tag count is between 3 and 5
- **AND** the system SHALL assign a score: 1.0 if 3-5 tags, 0.7 if 2 or 6 tags, 0.3 if 1 or 7+ tags
- **AND** the system SHALL flag tags with score <0.5 for review

#### Scenario: Generic tag detection
- **WHEN** validating AI-generated tags
- **THEN** the system SHALL check for generic terms: "saved", "explore", "website", "link", "content"
- **AND** the system SHALL assign a penalty: -0.2 per generic tag (max -0.6)
- **AND** the system SHALL flag tags with 2+ generic terms for review

#### Scenario: Keyword density validation
- **WHEN** validating a summary against the original content
- **THEN** the system SHALL extract top 5 keywords from the original content
- **AND** the system SHALL check if at least 2 keywords appear in the summary
- **AND** the system SHALL assign a score: 1.0 if 3+ keywords, 0.7 if 2 keywords, 0.3 if 1 keyword, 0.0 if none
- **AND** the system SHALL flag summaries with score <0.5 for review

#### Scenario: Sentiment extremity check
- **WHEN** validating a summary for extreme sentiment
- **THEN** the system SHALL check for highly emotional words: "amazing", "terrible", "incredible", "awful"
- **AND** the system SHALL assign a penalty: -0.1 per extreme word (max -0.3)
- **AND** the system SHALL flag summaries with strong bias (score penalty >0.2)

### Requirement: Symbolic Reasoning Layer
The system SHALL use symbolic reasoning to validate structural patterns and domain-specific rules.

#### Scenario: Title format validation
- **WHEN** validating an AI-generated title
- **THEN** the system SHALL check that the title does not start with generic prefixes: "A ", "An ", "The "
- **AND** the system SHALL check that the title is capitalized appropriately
- **AND** the system SHALL assign a score: 1.0 if well-formatted, 0.7 if minor issues, 0.3 if poor formatting
- **AND** the system SHALL flag titles with score <0.5 for review

#### Scenario: Domain-specific type validation
- **WHEN** validating content classification for a YouTube URL
- **THEN** the system SHALL check that the type is "video" (not "article" or "note")
- **AND** the system SHALL check that tags include "video" or "youtube"
- **AND** the system SHALL assign a score: 1.0 if correct, 0.0 if incorrect type
- **AND** the system SHALL force-correct the type if validation fails

#### Scenario: GitHub code content validation
- **WHEN** validating content classification for a GitHub URL
- **THEN** the system SHALL check that the type is "article" or "note"
- **AND** the system SHALL check that tags include "code", "developer", or "open-source"
- **AND** the system SHALL assign a score: 1.0 if tags present, 0.5 if missing code-related tags

#### Scenario: Content-title consistency check
- **WHEN** validating a title against the content
- **THEN** the system SHALL extract key nouns from the content (top 5)
- **AND** the system SHALL check if at least one key noun appears in the title
- **AND** the system SHALL assign a score: 1.0 if consistent, 0.5 if weak match, 0.0 if unrelated
- **AND** the system SHALL flag inconsistent titles (score <0.5) for review

### Requirement: Human-in-the-Loop Flagging
The system SHALL flag low-confidence AI outputs for human review and provide a feedback mechanism.

#### Scenario: Calculate confidence score
- **WHEN** validation pipeline completes for a card
- **THEN** the system SHALL calculate the final confidence score as weighted average:
  - DSPy validation: 40% weight
  - Heuristic validation: 30% weight
  - Symbolic reasoning: 30% weight
- **AND** the system SHALL store the score in `card.metadata.validationScore` (0.0-1.0)
- **AND** the system SHALL store validation flags in `card.metadata.validationFlags` array

#### Scenario: Flag low-confidence output
- **WHEN** the validation confidence score is below 0.7
- **THEN** the system SHALL add "needs-review" to `card.metadata.validationFlags`
- **AND** the system SHALL mark the card for human review in the UI
- **AND** the system SHALL include the card in a weekly review digest

#### Scenario: Display validation warning in UI
- **WHEN** a user opens CardDetailModal for a card with validationScore <0.7
- **THEN** the system SHALL display a warning icon (⚠️) next to the AI-generated content
- **AND** the system SHALL show a tooltip: "AI-generated content has low confidence. Please verify accuracy."
- **AND** the system SHALL provide a "Report Issue" button to flag incorrect outputs

#### Scenario: User reports incorrect AI output
- **WHEN** a user clicks "Report Issue" on a low-confidence card
- **THEN** the system SHALL log the card ID, validation score, and user feedback
- **AND** the system SHALL add the card to a training dataset for DSPy re-optimization
- **AND** the system SHALL display a confirmation message: "Thank you for your feedback!"

### Requirement: Validation Pipeline Integration
The system SHALL integrate the 4-layer validation pipeline into the enrichment workflow without blocking card saves.

#### Scenario: Run validation pipeline during enrichment
- **WHEN** a card is being enriched in /api/enrich (async)
- **THEN** the system SHALL run validation layers sequentially:
  1. DSPy prompt optimization (if enabled)
  2. Heuristic checks (length, keywords, sentiment)
  3. Symbolic reasoning (structure, domain rules)
  4. Confidence score calculation and flagging
- **AND** the total validation overhead SHALL be less than 3 seconds
- **AND** the enrichment SHALL complete even if validation has warnings

#### Scenario: Validation pipeline timeout
- **WHEN** validation pipeline takes longer than 5 seconds
- **THEN** the system SHALL cancel the validation process
- **AND** the system SHALL set `card.metadata.validationScore` to 0.5 (neutral)
- **AND** the system SHALL add "validation-timeout" to `card.metadata.validationFlags`
- **AND** the enrichment SHALL complete with AI outputs (unvalidated)

#### Scenario: Validation pipeline failure
- **WHEN** validation pipeline encounters an unrecoverable error
- **THEN** the system SHALL log the error with card ID and stack trace
- **AND** the system SHALL set `card.metadata.validationScore` to 0.5 (neutral)
- **AND** the system SHALL add "validation-error" to `card.metadata.validationFlags`
- **AND** the enrichment SHALL complete with AI outputs (unvalidated)

### Requirement: Validation Metrics Tracking
The system SHALL track validation performance metrics to measure accuracy and improvement over time.

#### Scenario: Track validation accuracy
- **WHEN** running validation on a card
- **THEN** the system SHALL log the validation score for each layer (DSPy, heuristic, symbolic)
- **AND** the system SHALL log the final confidence score
- **AND** the system SHALL calculate the average validation score across all cards (daily)

#### Scenario: Track flagged cards rate
- **WHEN** cards are flagged for human review (score <0.7)
- **THEN** the system SHALL increment the flagged cards counter
- **AND** the system SHALL calculate the flagged rate as a percentage of total cards
- **AND** the system SHALL alert if flagged rate exceeds 10%

#### Scenario: Track user feedback rate
- **WHEN** users report incorrect AI outputs via "Report Issue"
- **THEN** the system SHALL increment the user feedback counter
- **AND** the system SHALL calculate the feedback rate as a percentage of flagged cards
- **AND** the system SHALL alert if feedback rate exceeds 5% (indicates quality issues)
