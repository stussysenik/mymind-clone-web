# Archived: Capacitor iOS Experiment

**Status:** Archived (January 2026)
**Reason:** Pivoted to native iOS Swift development

---

## Why This Was Archived

This directory contains our initial attempt at iOS support using Capacitor to wrap the Next.js PWA in a native WebView shell. While Capacitor successfully preserved 100% of the web codebase, we encountered several limitations:

### Limitations Encountered

1. **Share Extension Complexity**
   - Required extensive native Swift code for proper iOS Share Sheet integration
   - WebView-to-native bridge added latency and complexity
   - Keychain sharing between WebView and Share Extension proved fragile

2. **Performance Constraints**
   - WebView cold start times exceeded our <500ms target for Share Extension
   - Bridge overhead for frequent Supabase real-time updates
   - Memory pressure from running full Next.js app in WebView

3. **Native Feel**
   - Difficult to achieve iOS-native animations and gestures
   - WebView scrolling behavior differs from native UIKit/SwiftUI
   - Limited access to iOS-specific features (widgets, Live Activities)

### What Worked Well

- Zero rewrite of existing web components
- Shared authentication via Capacitor Preferences API
- Same Supabase backend worked seamlessly

---

## Decision: Native Swift

After evaluating the trade-offs, we decided to build a fully native iOS app using SwiftUI because:

1. **Share Extension** - Native Swift gives best performance for share sheet
2. **Native UX** - iOS users expect native gestures, animations, haptics
3. **Future-proof** - Widgets, Live Activities, App Intents require native code
4. **Supabase Swift SDK** - Direct database access without API bridge

The new native iOS app lives at `apps/ios/` and shares the same Supabase backend.

---

## Contents of This Archive

```
ios-capacitor-archive/
├── App/                    # Capacitor-generated Xcode project
│   ├── App/                # Main app target
│   ├── ShareExtension/     # Share Extension target (partial implementation)
│   ├── CapApp-SPM/         # Swift Package Manager config
│   └── App.xcodeproj
├── capacitor-cordova-ios-plugins/
├── capacitor.config.ts     # Capacitor configuration
├── SETUP.md                # Original setup instructions
└── debug.xcconfig
```

### Key Files for Reference

- `App/ShareExtension/ShareViewController.swift` - Share Extension implementation
- `App/App/KeychainBridge.swift` - Native keychain access via bridge
- `capacitor.config.ts` - Capacitor configuration with server URL

---

## If You Need to Restore This

If future requirements change and Capacitor becomes viable again:

1. Move this directory back to `apps/web/ios/`
2. Move `capacitor.config.ts` back to `apps/web/`
3. Re-add Capacitor dependencies to `apps/web/package.json`:
   ```json
   "@capacitor/cli": "^8.0.0",
   "@capacitor/core": "^8.0.0",
   "@capacitor/ios": "^8.0.0",
   "@capacitor/preferences": "^8.0.0"
   ```
4. Run `npx cap sync ios`

---

## Related Links

- Native iOS app: `apps/ios/`
- OpenSpec: `openspec/changes/005-pivot-native-ios-swift/`
- Web PWA (production): `apps/web/`
