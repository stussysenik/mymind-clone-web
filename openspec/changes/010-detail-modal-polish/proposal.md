# OpenSpec Proposal: 010-detail-modal-polish

**Status**: Implemented
**Date**: 2026-01-25

## Summary

Visual QA revealed persistent issues across iPhone 4/5, MacBook Pro, and the detail modal UI. This proposal addresses three problem domains:

1. **HTML Entity Bug (Persistent)** - `&amp;` still displays in existing database records
2. **Detail Modal UI Polish** - Visual/Details tab overlap, positioning, and responsive issues
3. **Design System Refinements** - Consistent patterns for the detail view

---

## Problem 1: HTML Entity Still Showing `&amp;`

**Root Cause**: The `decodeHtmlEntities()` fix in `scraper.ts` only affects **NEW scrapes**. Existing records in Supabase still contain encoded entities like `&amp;`.

### Solution: Hybrid (DB Migration + Render-time Decoding)

1. **Render-time decoding** - Defensive decoding in display components:
   - `CardDetailModal.tsx` - title, summary, notes, content
   - `TwitterCard.tsx` - tweet content, title
   - `Card.tsx` - title, description, note content

2. **Database migration** - SQL script to fix existing Supabase records:
   - Located at `supabase/migrations/20260125_decode_html_entities.sql`

---

## Problem 2: Detail Modal UI Issues

### Solution: Sticky Header Structure

Replaced absolute-positioned overlay elements with a proper sticky header for mobile:

**Before:**
- Tab bar: `absolute top-4 left-4 right-16`
- Close button: `absolute top-4 right-4`
- Both overlaid content

**After:**
- Mobile header: `sticky top-0` with flex layout
- Tab control on left, close button on right
- Header styling adapts to current view (dark for Visual, light for Details)
- Content scrolls beneath header independently

**Structure:**
```
┌─────────────────────────────────┐
│  [Visual | Details]         [X] │  ← Sticky header
├─────────────────────────────────┤
│                                 │
│     (Visual or Details          │
│         content area)           │
│                                 │
├─────────────────────────────────┤
│  [+] [Share] [Similar] [🗑]     │  ← Action bar (sticky bottom)
└─────────────────────────────────┘
```

---

## Problem 3: Design System Polish

### Touch Targets
All interactive elements now meet 44px minimum:
- Tab buttons: `min-h-[44px]`
- Close button: `min-w-[44px] min-h-[44px]`
- Tag pills: `min-h-[44px]`
- Expand/collapse buttons: `min-w-[44px] min-h-[44px]`
- Source link: `min-h-[44px] py-2`

### Section Separators
Added `border-b border-gray-100` separators between:
- Title/metadata section
- AI Summary section
- Tags section
- Notes section (no bottom border)

### Title Input
- Responsive text size: `text-lg md:text-xl`
- Proper padding: `px-2 py-1`
- 44px minimum height

---

## Files Modified

| File | Changes |
|------|---------|
| `apps/web/components/CardDetailModal.tsx` | Import decode, sticky header, touch targets, separators |
| `apps/web/components/Card.tsx` | Import and apply decode to title/summary/note |
| `apps/web/components/cards/TwitterCard.tsx` | Import and apply decode to tweet text/title |
| `supabase/migrations/20260125_decode_html_entities.sql` | New migration script |

---

## Verification

```bash
npm run build  # ✓ Compiled successfully
```

### Device Matrix Testing
Target devices (test via Chrome DevTools or Playwright):
- iPhone 4: 320x480
- iPhone 5/SE: 320x568
- iPhone 12 Pro: 390x844
- iPhone 16 Pro: 393x852
- Pixel 5: 393x851
- Pixel 7: 412x915
- MacBook Pro: 1440x900

### Expected Results
1. Twitter cards display `&` not `&amp;` on ALL devices
2. Detail modal Visual/Details tabs don't overlap with content
3. Close button clearly positioned in header (mobile)
4. All touch targets ≥44px
5. Smooth transitions between Visual and Details tabs
