# Tasks: Add iOS Share Extension

## 1. Project Setup
- [x] 1.1 Create ShareExtension directory in ios/App/
- [x] 1.2 Create ShareViewController.swift file
- [x] 1.3 Create Info.plist with activation rules

## 2. Share Extension Implementation
- [x] 2.1 Implement URL extraction from extensionContext
- [x] 2.2 Implement Keychain token retrieval from App Group
- [x] 2.3 Implement POST request to /api/save
- [x] 2.4 Implement success/error UI feedback

## 3. Keychain Integration
- [x] 3.1 Create Keychain helper TypeScript module
- [x] 3.2 Document App Group identifier configuration
- [x] 3.3 Document token storage flow from main app

## 4. Configuration
- [x] 4.1 Configure NSExtensionActivationRule for URLs
- [x] 4.2 Create MainInterface.storyboard
- [x] 4.3 Document Xcode manual setup steps (ios/SETUP.md)

## 5. Validation
- [x] 5.1 Swift code structure is correct
- [x] 5.2 Manual testing steps documented

Note: Full Xcode project configuration requires manual steps documented in ios/SETUP.md.
Share Extension target must be added manually in Xcode.
