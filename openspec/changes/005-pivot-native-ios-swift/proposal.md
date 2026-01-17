# Proposal: Pivot to Native iOS Swift Development

**Status:** Implemented
**Created:** 2026-01-17
**Author:** Claude Code

## Summary

Pivot from Capacitor WebView wrapper to fully native iOS Swift app for better performance, native UX, and simpler Share Extension integration.

## Background

The initial iOS strategy used Capacitor to wrap the Next.js PWA in a WebView. While this preserved 100% of the web codebase, we encountered:

1. **Share Extension complexity** - Keychain sharing between WebView and native extension was fragile
2. **Performance constraints** - WebView cold start times exceeded targets
3. **UX limitations** - Difficult to achieve native iOS feel in WebView

## Decision

Build a fully native iOS app using SwiftUI that:
- Connects directly to the same Supabase backend as web
- Uses native iOS Keychain for auth token sharing
- Provides native Share Extension with optimal performance

## Implementation

### Monorepo Changes (`mymind-clone`)

1. **Archived Capacitor experiment**
   - Moved `apps/web/ios/` → `apps/web/ios-capacitor-archive/`
   - Added README explaining why archived
   - Removed Capacitor dependencies from `package.json`
   - Created stub `lib/capacitor/keychain.ts` for web compatibility

2. **Removed mixed iOS approach**
   - Deleted `apps/ios/` from monorepo (native code doesn't belong here)

### Separate iOS Repository (`mymind-ios`)

Created new repository at `~/Desktop/mymind-ios` with:

```
mymind-ios/
├── MyMind/
│   ├── MyMindApp.swift
│   ├── Models/
│   │   └── Card.swift           # Matches Supabase schema
│   ├── Views/
│   │   ├── ContentView.swift
│   │   ├── MasonryGridView.swift
│   │   ├── CardView.swift
│   │   └── Auth/
│   │       └── LoginView.swift
│   ├── ViewModels/
│   │   ├── AuthViewModel.swift
│   │   └── CardsViewModel.swift
│   └── Services/
│       ├── SupabaseService.swift
│       └── KeychainService.swift
├── ShareExtension/
│   ├── ShareViewController.swift
│   └── Info.plist
├── README.md
└── .gitignore
```

## Architecture

- **Framework:** SwiftUI + Combine
- **Architecture:** MVVM
- **Backend:** Direct Supabase SDK connection
- **Auth:** Apple Sign In + Google OAuth
- **Share Extension:** Native UIKit with shared Keychain

## Verification Plan

1. Share Extension works: Share URL from Safari → appears in Supabase
2. Auth persists: Login in app → Share Extension has access to token
3. Data syncs: Save from iOS → visible on web PWA (and vice versa)
4. Performance: Share Extension cold start < 500ms

## Related Files

- Archived Capacitor: `apps/web/ios-capacitor-archive/`
- iOS app: `~/Desktop/mymind-ios/`
- Web PWA: `apps/web/`
