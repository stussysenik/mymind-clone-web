## ADDED Requirements

### Requirement: Share Extension UI
The iOS Share Extension SHALL provide a minimal UI that shows visual feedback when sharing URLs to MyMind.

#### Scenario: User shares URL successfully
- **WHEN** user selects MyMind from iOS share sheet
- **AND** shares a valid URL
- **THEN** the extension shows a brief loading indicator
- **AND** displays a checkmark animation on success
- **AND** automatically dismisses within 1 second

#### Scenario: Share fails due to network error
- **WHEN** user shares a URL
- **AND** the network request fails
- **THEN** the extension shows an error message
- **AND** provides a retry or cancel option

#### Scenario: Share fails due to authentication
- **WHEN** user shares a URL
- **AND** no valid auth token exists in Keychain
- **THEN** the extension shows "Please log in to MyMind app first"
- **AND** provides a cancel button

### Requirement: URL Extraction
The Share Extension SHALL extract URLs from the iOS extensionContext to save to MyMind.

#### Scenario: URL shared from Safari
- **WHEN** user shares from Safari
- **THEN** the extension extracts the page URL
- **AND** sends it to /api/save

#### Scenario: URL shared from other apps
- **WHEN** user shares content containing a URL
- **THEN** the extension extracts the first URL found
- **AND** sends it to /api/save

#### Scenario: Non-URL content shared
- **WHEN** user shares content without any URL
- **THEN** the extension shows "No URL found to save"
- **AND** allows user to cancel

### Requirement: Keychain Token Access
The Share Extension SHALL retrieve the auth token from shared Keychain using App Group.

#### Scenario: Token exists in Keychain
- **WHEN** the main app has stored an auth token
- **AND** user shares a URL
- **THEN** the extension reads the token from shared Keychain
- **AND** includes it in the /api/save request

#### Scenario: Token missing from Keychain
- **WHEN** the user has not logged in to the main app
- **AND** tries to share a URL
- **THEN** the extension detects missing token
- **AND** displays authentication required message

### Requirement: API Integration
The Share Extension SHALL POST to /api/save with the correct request format.

#### Scenario: Successful save request
- **WHEN** extension sends POST to /api/save
- **THEN** the request includes url, source="ios-share-extension", and auth_token
- **AND** the server responds with success

#### Scenario: Extension waits for response
- **WHEN** extension sends save request
- **THEN** it waits for server response (max 10 seconds timeout)
- **AND** shows loading indicator during wait

### Requirement: Share Extension Configuration
The Share Extension Info.plist SHALL be configured to activate only for URL content.

#### Scenario: URL type activation
- **WHEN** examining ShareExtension/Info.plist
- **THEN** NSExtensionActivationRule specifies URL type
- **AND** the extension only appears when sharing URLs
