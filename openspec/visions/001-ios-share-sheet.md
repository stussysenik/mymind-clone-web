# Vision: iOS Share Sheet Integration

## The End Goal

When this vision is FULLY realized, a user can:

1. **Be anywhere on their iPhone** (Safari, Twitter, YouTube, any app)
2. **Tap the Share button** and see "MyMind" in the share sheet
3. **Tap MyMind** and the URL is instantly saved
4. **Open MyMind app** and see the saved item with:
   - Visual preview (screenshot/thumbnail)
   - AI-generated summary and tags
   - Proper card in masonry grid

The entire flow must feel **instant** (<500ms perceived latency) with **zero friction**.

---

## Success Criteria (All Must Be True)

### User Experience
- [ ] Share extension appears in iOS share sheet
- [ ] Tapping it saves content with visual feedback (checkmark animation)
- [ ] No login required if already authenticated in main app
- [ ] Works offline (queues for sync)
- [ ] Saved items appear in main app within 2 seconds

### Technical
- [ ] Share Extension is <50 LOC Swift (minimal native code)
- [ ] Auth token shared via iOS Keychain (Capacitor Preferences → Keychain)
- [ ] POST /api/save responds in <200ms
- [ ] Visual preview generated server-side (GLM-4.7 or screenshot service)
- [ ] Optimistic UI updates (SWR cache invalidation)

### Testing
- [ ] Playwright E2E tests for web share flow pass
- [ ] XCTest for Share Extension (can be simulated)
- [ ] Performance budget verified via chrome-devtools MCP
- [ ] Manual iOS simulator test documented

### Code Quality
- [ ] All TypeScript strict mode, no `any` types
- [ ] API endpoint has proper error handling
- [ ] Capacitor iOS project builds without warnings
- [ ] Share Extension target properly signed (dev cert)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    iOS Share Sheet                          │
│                         │                                   │
│                         ▼                                   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │          Share Extension (Swift, ~50 LOC)           │   │
│  │  - Reads URL from extensionContext                  │   │
│  │  - Gets auth token from shared Keychain             │   │
│  │  - POSTs to /api/save                               │   │
│  │  - Shows success checkmark                          │   │
│  └─────────────────────────────────────────────────────┘   │
│                         │                                   │
│                         ▼                                   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              POST /api/save (Edge Function)          │   │
│  │  Request:                                           │   │
│  │  {                                                  │   │
│  │    url: string,                                     │   │
│  │    source: "ios-share-extension",                   │   │
│  │    auth_token: string                               │   │
│  │  }                                                  │   │
│  │                                                     │   │
│  │  Response (<200ms):                                 │   │
│  │  {                                                  │   │
│  │    id: string,                                      │   │
│  │    status: "queued",                                │   │
│  │    optimistic: true                                 │   │
│  │  }                                                  │   │
│  └─────────────────────────────────────────────────────┘   │
│                         │                                   │
│                         ▼                                   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │           Background Processing (async)              │   │
│  │  - Fetch URL metadata (title, description, image)   │   │
│  │  - Generate visual preview                          │   │
│  │  - AI summarization (GLM-4.7)                       │   │
│  │  - Auto-tagging                                     │   │
│  │  - Store in Supabase                                │   │
│  └─────────────────────────────────────────────────────┘   │
│                         │                                   │
│                         ▼                                   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              Main App (Capacitor WebView)            │   │
│  │  - Receives Supabase realtime update                │   │
│  │  - SWR cache invalidation                           │   │
│  │  - New card appears in masonry grid                 │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## Spec Chain (Expected Breakdown)

The AI should create specs in roughly this order (may vary based on discoveries):

1. **Spec: /api/save endpoint** - Core API with auth validation, <200ms response
2. **Spec: Background processing queue** - Async metadata/preview/AI processing
3. **Spec: Capacitor iOS setup** - Initialize Capacitor, configure iOS project
4. **Spec: Keychain token sharing** - Auth token sync between app and extension
5. **Spec: Share Extension UI** - Swift extension with minimal UI
6. **Spec: Realtime sync** - Supabase subscription for new items
7. **Spec: E2E tests** - Full flow tests (web simulation + manual iOS)

Each spec should be small enough to implement in 1-4 iterations.

---

## Performance Budget

| Operation | Budget | Measurement |
|-----------|--------|-------------|
| Share Extension launch | <500ms | XCTest timing |
| POST /api/save response | <200ms | chrome-devtools Network |
| Item appears in app | <2000ms | Playwright timing |
| Masonry re-render | <100ms | chrome-devtools Performance |

---

## Files Expected to be Created/Modified

### New Files
- `apps/web/app/api/save/route.ts` - API endpoint
- `apps/web/lib/background-processor.ts` - Async processing
- `ios/App/ShareExtension/ShareViewController.swift` - Extension
- `ios/App/ShareExtension/Info.plist` - Extension config
- `tests/e2e/share-flow.spec.ts` - Playwright tests

### Modified Files
- `capacitor.config.ts` - iOS configuration
- `apps/web/lib/supabase/queries.ts` - Add save mutation
- `apps/web/components/masonry/MasonryGrid.tsx` - Handle new items

---

## Out of Scope (Do NOT Implement)

- Android share (separate vision)
- Image/file sharing (URLs only for now)
- Multiple account support
- Share extension settings UI
- Widget integration

---

## Definition of Done

Output `VISION_ACHIEVED` when:
1. All success criteria checkboxes above are checked
2. All Playwright tests pass
3. Capacitor iOS build succeeds
4. Manual verification documented (screenshot in logs)
5. Code committed with descriptive messages
6. No TypeScript errors, no console warnings

---

## Notes for Autonomous Execution

- If Capacitor iOS setup fails, research with brave-search first
- If GLM-4.7 integration is complex, stub it and create separate spec
- Commit after each working increment
- Use dev-browser for visual verification of web flows
- Use chrome-devtools for all performance measurements
- Create new specs when you discover gaps - don't try to do too much in one spec
