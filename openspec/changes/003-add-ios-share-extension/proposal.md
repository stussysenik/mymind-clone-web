# Change: Add iOS Share Extension

## Why
The iOS Share Sheet vision requires a native Share Extension that appears in the iOS share sheet and allows users to save URLs from any app. The extension must:
1. Read shared URLs from extensionContext
2. Retrieve auth token from shared Keychain (via App Group)
3. POST to /api/save endpoint
4. Show visual feedback (success/error)

## What Changes
- Create ShareExtension target in Xcode project
- Implement ShareViewController.swift (~50 LOC)
- Configure App Group for Keychain sharing
- Create Share Extension Info.plist with URL type activation rules
- Add Keychain helper for token retrieval

## Impact
- Affected specs: share-extension (new capability)
- Affected code:
  - `ios/App/ShareExtension/ShareViewController.swift` - Main extension code
  - `ios/App/ShareExtension/Info.plist` - Extension configuration
  - `ios/App/App.xcodeproj/project.pbxproj` - Add new target
- Requires Xcode for testing (cannot fully test in CI)
