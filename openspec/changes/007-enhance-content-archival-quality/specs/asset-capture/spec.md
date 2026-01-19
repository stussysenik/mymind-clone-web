# Asset Capture Capability

## ADDED Requirements

### Requirement: High-Resolution Screenshot Capture
The system SHALL capture archival-quality screenshots with a minimum resolution of 1080p (1920x1080 pixels) for all saved URLs.

#### Scenario: ScreenshotOne API captures 1080p+ screenshot
- **WHEN** a user saves a URL via web interface or iOS Share Extension
- **THEN** the system SHALL use ScreenshotOne API to capture a screenshot with at least 1080p resolution
- **AND** the system SHALL store the screenshot URL in `card.imageUrl`
- **AND** the capture time SHALL be less than 5 seconds for 95% of URLs

#### Scenario: ScreenshotOne API is unavailable
- **WHEN** ScreenshotOne API returns a 5xx error or times out after 5 seconds
- **THEN** the system SHALL gracefully fall back to Microlink screenshot capture
- **AND** the system SHALL log the failure for monitoring
- **AND** the user SHALL NOT experience any error (transparent fallback)

#### Scenario: Both ScreenshotOne and Microlink fail
- **WHEN** both ScreenshotOne and Microlink APIs fail to capture a screenshot
- **THEN** the system SHALL set `card.imageUrl` to null
- **AND** the system SHALL still save the card with text content and URL
- **AND** the system SHALL log the failure with URL and error details

### Requirement: Exponential Backoff Retry Logic
The system SHALL implement exponential backoff for screenshot capture failures to handle transient API errors.

#### Scenario: First attempt fails with 5xx error
- **WHEN** ScreenshotOne API returns a 5xx error on the first attempt
- **THEN** the system SHALL wait 1 second before retrying
- **AND** the system SHALL attempt the capture again with the same parameters

#### Scenario: Second attempt fails
- **WHEN** ScreenshotOne API returns a 5xx error on the second attempt
- **THEN** the system SHALL wait 2 seconds before retrying
- **AND** the system SHALL attempt the capture a third time

#### Scenario: Third attempt fails
- **WHEN** ScreenshotOne API returns a 5xx error on the third attempt
- **THEN** the system SHALL fall back to Microlink without further retries
- **AND** the system SHALL log the URL and error for investigation

#### Scenario: First attempt succeeds
- **WHEN** ScreenshotOne API returns a successful screenshot on the first attempt
- **THEN** the system SHALL NOT attempt any retries
- **AND** the system SHALL return the screenshot URL immediately

### Requirement: Platform-Specific Screenshot Optimization
The system SHALL optimize screenshot capture based on the source platform to preserve visual fidelity.

#### Scenario: YouTube video screenshot
- **WHEN** the URL is from youtube.com or youtu.be
- **THEN** the system SHALL use ScreenshotOne with video playback enabled
- **AND** the system SHALL capture the video thumbnail at maximum resolution (maxresdefault.jpg)
- **AND** the system SHALL preserve the aspect ratio (16:9)

#### Scenario: Instagram post screenshot
- **WHEN** the URL is from instagram.com
- **THEN** the system SHALL capture the entire post including caption
- **AND** the system SHALL use ScreenshotOne with mobile viewport (375x812)
- **AND** the system SHALL capture all carousel images if present

#### Scenario: Twitter/X post screenshot
- **WHEN** the URL is from twitter.com or x.com
- **THEN** the system SHALL capture the entire tweet thread if present
- **AND** the system SHALL use ScreenshotOne with desktop viewport (1200x800)
- **AND** the system SHALL preserve embedded images at original resolution

#### Scenario: Generic website screenshot
- **WHEN** the URL is from any other domain
- **THEN** the system SHALL use ScreenshotOne with desktop viewport (1920x1080)
- **AND** the system SHALL capture the full page or first viewport
- **AND** the system SHALL preserve the original styling and layout

### Requirement: Screenshot Capture Configuration
The system SHALL provide configuration options for screenshot capture quality and behavior.

#### Scenario: ScreenshotOne API key is configured
- **WHEN** `SCREENSHOTONE_API_KEY` environment variable is set
- **THEN** the system SHALL use ScreenshotOne API as the primary capture method
- **AND** the system SHALL use the configured API key for authentication

#### Scenario: ScreenshotOne API key is not configured
- **WHEN** `SCREENSHOTONE_API_KEY` environment variable is not set or empty
- **THEN** the system SHALL skip ScreenshotOne and use Microlink directly
- **AND** the system SHALL log a warning about missing API key configuration

#### Scenario: Screenshot quality setting
- **WHEN** capturing a screenshot via ScreenshotOne
- **THEN** the system SHALL use PNG format for lossless quality
- **AND** the system SHALL set image quality to 95 or higher
- **AND** the system SHALL enable JavaScript rendering for dynamic content

### Requirement: Screenshot Capture Monitoring
The system SHALL provide visibility into screenshot capture performance and failures.

#### Scenario: Successful screenshot capture
- **WHEN** ScreenshotOne successfully captures a screenshot
- **THEN** the system SHALL log the capture time and image URL
- **AND** the system SHALL increment the success metric counter

#### Scenario: Screenshot capture failure
- **WHEN** screenshot capture fails after all retries and fallbacks
- **THEN** the system SHALL log the error with URL, status code, and error message
- **AND** the system SHALL increment the failure metric counter
- **AND** the system SHALL include the error in Sentry alerts if configured

#### Scenario: Rate limit warning
- **WHEN** ScreenshotOne API returns rate limit headers (X-RateLimit-Remaining < 100)
- **THEN** the system SHALL log a warning about approaching rate limit
- **AND** the system SHOULD consider throttling new screenshot requests
- **AND** the system MAY fall back to Microlink temporarily to preserve rate limit buffer
