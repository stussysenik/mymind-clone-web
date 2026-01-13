# iOS Share Extension Setup Guide

This guide covers the manual Xcode configuration required to enable the Share Extension.

## Prerequisites

- Xcode 15 or later
- Apple Developer account (for signing)
- macOS with Xcode Command Line Tools

## Steps

### 1. Open Project in Xcode

```bash
cd apps/web
npm run cap:open:ios
```

### 2. Add Share Extension Target

1. In Xcode, select the project in the navigator
2. Click "+" at bottom of targets list
3. Choose "Share Extension" template
4. Name it "ShareExtension"
5. Bundle ID: `com.mymind.app.ShareExtension`
6. When prompted, activate the scheme

### 3. Configure App Group

**For Main App Target:**
1. Select "App" target
2. Go to "Signing & Capabilities"
3. Click "+ Capability"
4. Add "App Groups"
5. Create group: `group.com.mymind.app`

**For ShareExtension Target:**
1. Select "ShareExtension" target
2. Go to "Signing & Capabilities"
3. Add "App Groups"
4. Select: `group.com.mymind.app`

### 4. Configure Keychain Sharing

**For Main App Target:**
1. Select "App" target
2. Go to "Signing & Capabilities"
3. Add "Keychain Sharing"
4. Add keychain group: `com.mymind.app.auth`

**For ShareExtension Target:**
1. Select "ShareExtension" target
2. Go to "Signing & Capabilities"
3. Add "Keychain Sharing"
4. Add keychain group: `com.mymind.app.auth`

### 5. Replace ShareExtension Files

Delete the default files Xcode created and copy:

- `ShareExtension/ShareViewController.swift`
- `ShareExtension/Info.plist`
- `ShareExtension/MainInterface.storyboard`

### 6. Update ShareViewController API Endpoint

In `ShareViewController.swift`, update the API endpoint:

```swift
// For development (local server)
private let apiEndpoint = "http://localhost:3000/api/save"

// For production
private let apiEndpoint = "https://your-domain.com/api/save"
```

### 7. Sign Both Targets

1. Select each target and configure signing
2. Use your Apple Developer team
3. Ensure both targets use same team

### 8. Build and Test

1. Select iPhone simulator or device
2. Build and run the main app
3. Log in to sync auth token to Keychain
4. Open Safari, navigate to any page
5. Tap Share, select "MyMind"
6. Verify URL saves successfully

## Troubleshooting

### "Please log in to MyMind app first"
- The auth token is not in Keychain
- Log out and log back in to the main app
- Ensure App Group is configured correctly

### Extension doesn't appear in Share Sheet
- Check NSExtensionActivationRule in Info.plist
- Rebuild and reinstall the app
- Reset simulator: Device > Erase All Content

### Network errors in extension
- Check API endpoint URL is correct
- For local development, use `http://` not `https://`
- Ensure server is running and accessible

## Production Checklist

- [ ] Update API endpoint to production URL
- [ ] Configure App Store Connect for Share Extension
- [ ] Test on real device with production server
- [ ] Submit app for review (extensions reviewed separately)
