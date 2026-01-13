# Change: Add Capacitor iOS Setup

## Why
The iOS Share Sheet vision requires wrapping the Next.js web app in a native iOS container using Capacitor. This enables:
1. Distribution via App Store
2. Access to native APIs (Keychain, Share Extension)
3. WebView-based rendering preserving all existing SSR and UI

## What Changes
- Install Capacitor core packages (@capacitor/core, @capacitor/ios)
- Create capacitor.config.ts with iOS configuration
- Initialize iOS native project structure
- Configure app bundleId, name, and server settings
- Add npm scripts for Capacitor commands

## Impact
- Affected specs: capacitor-ios (new capability)
- Affected code:
  - `apps/web/package.json` - Add Capacitor dependencies
  - `apps/web/capacitor.config.ts` - New Capacitor config file
  - `apps/web/ios/` - Generated iOS project (git-tracked for customization)
- No breaking changes to web functionality
