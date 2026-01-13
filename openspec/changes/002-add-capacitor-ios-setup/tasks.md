# Tasks: Add Capacitor iOS Setup

## 1. Dependencies
- [x] 1.1 Install @capacitor/core and @capacitor/cli
- [x] 1.2 Install @capacitor/ios for iOS platform support
- [x] 1.3 Install @capacitor/preferences for Keychain token sharing

## 2. Configuration
- [x] 2.1 Create capacitor.config.ts with app settings
- [x] 2.2 Configure bundleId (com.mymind.app)
- [x] 2.3 Configure webDir pointing to Next.js static export
- [x] 2.4 Configure server settings for local development

## 3. iOS Project Initialization
- [x] 3.1 Run `npx cap add ios` to generate iOS project
- [x] 3.2 Verify iOS project structure is created

## 4. Build Scripts
- [x] 4.1 Add `cap:sync` script to package.json
- [x] 4.2 Add `cap:open:ios` script to package.json
- [x] 4.3 Add `cap:build:ios` script to package.json

## 5. Validation
- [x] 5.1 Run `npx cap sync ios` without errors
- [x] 5.2 Verify capacitor.config.ts compiles
