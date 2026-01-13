## ADDED Requirements

### Requirement: iOS Share Extension Authentication
The /api/save endpoint SHALL support authentication via auth_token in the request body when the source is "ios-share-extension", enabling the iOS Share Extension to save cards without cookie-based authentication.

#### Scenario: Share Extension saves URL with valid token
- **WHEN** POST /api/save is called with:
  - `url`: "https://example.com/article"
  - `source`: "ios-share-extension"
  - `auth_token`: valid Supabase JWT token
- **THEN** the system validates the token against Supabase
- **AND** extracts the user_id from the token
- **AND** saves the card for that user
- **AND** returns success response with card data in <200ms

#### Scenario: Share Extension with invalid token
- **WHEN** POST /api/save is called with:
  - `source`: "ios-share-extension"
  - `auth_token`: invalid or expired token
- **THEN** the system returns 401 Unauthorized
- **AND** the response includes error message "Invalid or expired authentication token"

#### Scenario: Share Extension with missing token
- **WHEN** POST /api/save is called with:
  - `source`: "ios-share-extension"
  - `auth_token`: undefined or empty
- **THEN** the system returns 401 Unauthorized
- **AND** the response includes error message "Authentication token required for share extension"

### Requirement: Request Source Tracking
The /api/save endpoint SHALL accept an optional `source` field to identify the origin of save requests for analytics and debugging purposes.

#### Scenario: Web request without source
- **WHEN** POST /api/save is called without a `source` field
- **THEN** the system treats it as source "manual" (default)
- **AND** processes the request using cookie-based authentication

#### Scenario: Chrome extension request with source
- **WHEN** POST /api/save is called with `source`: "chrome-extension"
- **THEN** the system logs the source for analytics
- **AND** processes the request using existing CORS/cookie authentication

### Requirement: Backward Compatibility
The /api/save endpoint SHALL maintain full backward compatibility with existing clients that do not send source or auth_token fields.

#### Scenario: Legacy request format
- **WHEN** POST /api/save is called with only url/content/imageUrl fields
- **THEN** the system processes the request using existing authentication flow
- **AND** returns the same response format as before
