# Enrichment Pipeline Specification Delta

## MODIFIED Requirements

### Requirement: Retry Timer Behavior
The enrichment retry mechanism SHALL properly reset the progress timer when user clicks Retry.

#### Scenario: Timer resets on retry
- **WHEN** user clicks Retry button in AIThinkingIndicator
- **THEN** the progress bar resets to 0%
- **AND** the "~Xs remaining" timer resets to estimated total
- **AND** the interval starts advancing from the new start time

#### Scenario: Retry uses fresh start time
- **WHEN** retry is initiated
- **THEN** `startTime` is set to `Date.now()`, not original `createdAt`
- **AND** elapsed time calculates from the new start time

#### Scenario: Progress bar advances during retry
- **WHEN** enrichment retry is in progress
- **THEN** the progress bar continuously advances based on elapsed time
- **AND** stage labels update (Fetching → Analyzing → Extracting → Finalizing)

### Requirement: Timeout Detection
The AIThinkingIndicator SHALL detect when enrichment is taking longer than expected.

Timeout thresholds:
- Warning: 30 seconds
- Stuck: 60 seconds (or 3x estimated time, whichever is greater)

#### Scenario: Warning state after 30 seconds
- **WHEN** enrichment has been processing for >30 seconds
- **THEN** indicator shows amber/warning color
- **AND** label shows "Taking longer..."

#### Scenario: Stuck state after timeout
- **WHEN** enrichment exceeds timeout threshold (max of 45s or 3x estimated)
- **THEN** indicator shows red/stuck color
- **AND** label shows "May have failed"
- **AND** Retry and "Write manually" options appear

### Requirement: Circuit Breaker Awareness
The retry mechanism SHALL provide feedback when DSPy circuit breaker is open.

#### Scenario: Retry fails due to circuit breaker
- **WHEN** user clicks Retry
- **AND** DSPy circuit breaker is open
- **THEN** show appropriate error message
- **AND** indicate when circuit will reset (cooldown remaining)
