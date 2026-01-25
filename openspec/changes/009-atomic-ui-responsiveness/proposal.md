# 009 - Atomic UI Responsiveness & Physics-Based Animation Overhaul

**Status**: Completed
**Created**: 2026-01-25
**Type**: Enhancement

## Problem Statement

From the device matrix screenshots (iPhone 4 320px → HiDPI laptop 1440px), critical UI issues existed:

1. **Inconsistent visual hierarchy** - Elements appeared/disappeared arbitrarily across breakpoints
2. **Brand consistency lost** - "digital consumption experiment" had no systematic visibility rules
3. **No atomic weight system** - Elements lacked prioritization for device constraints
4. **Animation inconsistency** - No unified physics-based animation paradigm
5. **Settings/Profile access varied** - Not consistently accessible across all breakpoints
6. **Touch targets non-compliant** - Many buttons below 44px minimum on mobile

## Solution

### Atomic Weight System (1-10)

| Weight | Priority | Elements |
|--------|----------|----------|
| **10** | Critical | Logo icon, Search input, FAB, Card visuals |
| **9** | Primary | User avatar, Card title, Search container |
| **8** | Primary Nav | Tab icons, Theme toggle |
| **7** | Secondary Nav | Overflow menu, TagScroller container |
| **6** | Content Secondary | Source domain, Smart toggle, Pills |
| **5** | Content Optional | Tab labels, Card summary, Scroll arrows |
| **4** | Tertiary | Archive/Trash links, Save button |
| **3** | Decorative | Brand text ("digital consumption...") |
| **2** | Extended | User email, Footer |

### Breakpoint Visibility Thresholds

```
xs (≤374px): Show weight ≥ 9 only
sm (≤639px): Show weight ≥ 7
md (≤767px): Show weight ≥ 5
lg (≤1023px): Show weight ≥ 3
xl (>1023px): Show all weights
```

### Physics-Based Animation System

New animation tokens added to `globals.css`:

```css
/* Physics curves */
--ease-gentle-spring: cubic-bezier(0.4, 0.8, 0.74, 1.0);
--ease-snappy: cubic-bezier(0.23, 1, 0.32, 1);
--ease-elastic: cubic-bezier(0.68, -0.6, 0.32, 1.6);
--ease-anticipate: cubic-bezier(0.38, -0.4, 0.74, 1);

/* Duration scale */
--duration-instant: 75ms;
--duration-fast: 150ms;
--duration-normal: 250ms;
--duration-slow: 400ms;

/* Touch targets */
--touch-target-min: 44px;
--touch-target-comfortable: 48px;
```

### Animation Classes

- `.physics-press` - Tactile button feedback (scale 0.98 on active)
- `.elastic-tap` - Mobile tap with overshoot
- `.animate-fade-up` - Content entrance (translateY + opacity)
- `.animate-scale-in` - Modal/tooltip entrance
- `.stagger-children` - Cascading list animations
- `.physics-pulse` - Skeleton loading animation
- `.touch-target` - Ensures 44px minimum on mobile
- `.momentum-scroll` - iOS-style smooth scrolling

## Files Changed

| File | Changes |
|------|---------|
| `apps/web/app/globals.css` | Added physics tokens, animation classes, atomic weight CSS, touch target utilities |
| `apps/web/hooks/useMediaQuery.ts` | Added `useAtomicWeight` hook with visibility helpers |
| `apps/web/components/Header.tsx` | Applied atomic weights, touch targets, physics animations |
| `apps/web/components/TagScroller.tsx` | Added pill limits, fade indicators, momentum scroll |
| `apps/web/components/UserMenu.tsx` | Consistent settings access, touch targets |
| `apps/web/components/ThemeToggle.tsx` | Physics animations, touch targets |
| `apps/web/components/Card.tsx` | Card animations, hover effects, touch-compliant actions |

## Device Matrix Testing

| Device | Width | Expected Behavior |
|--------|-------|-------------------|
| iPhone 4 | 320px | Logo + tabs (icons) + avatar + FAB only |
| iPhone SE | 375px | + Theme toggle visible |
| iPhone 12 Pro | 390px | + Tab labels appear |
| iPhone 16 Pro | 393px | Same as 12 Pro |
| iPad | 768px | + Archive/Trash direct links |
| iPad Air | 820px | + Brand text "digital consumption..." |
| MacBook Pro | 1440px | Full UI visible |

## Performance Budget

- Panel transitions < 200ms
- Touch feedback < 75ms (instant)
- No layout shift during animations
- Smooth 60fps scrolling on TagScroller
