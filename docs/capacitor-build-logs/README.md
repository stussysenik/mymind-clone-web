# Capacitor Build Logs (Archived)

These build logs document the Capacitor iOS experiment from January 2026.

## Why Keep These?

These logs provide evidence of why we pivoted from Capacitor WebView to native Swift:

1. **Build complexity** - Multiple build attempts needed to get Share Extension working
2. **Keychain bridge issues** - Native-to-WebView communication required custom Objective-C/Swift bridging
3. **Performance concerns** - WebView cold start times and memory pressure

## Log Files

| File | Description |
|------|-------------|
| `Build App_2026-01-16T23-29-28.txt` | Initial app build attempt |
| `Build App_2026-01-16T23-33-35.txt` | Follow-up app build |
| `Build ShareExtension_2026-01-16T23-31-43.txt` | First Share Extension build |
| `Build ShareExtension_2026-01-17T00-04-20.txt` | Share Extension with Keychain fixes |
| `Build ShareExtension_2026-01-17T00-08-53.txt` | Final Share Extension attempt |

## Decision Outcome

After these experiments, we decided to build a fully native iOS app using SwiftUI.

See:
- `apps/web/ios-capacitor-archive/` - Archived Capacitor code
- `openspec/changes/005-pivot-native-ios-swift/` - Pivot proposal
- `../mymind-clone-ios/` - New native iOS app (separate repo)
