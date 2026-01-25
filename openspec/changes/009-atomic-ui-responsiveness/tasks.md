# 009 - Implementation Tasks

## Phase 1: Design Tokens & Utilities ✅

- [x] **1.1** Add physics animation tokens to `globals.css`
  - Added `--ease-gentle-spring`, `--ease-snappy`, `--ease-elastic`, `--ease-anticipate`
  - Added duration scale (`--duration-instant`, `--duration-fast`, etc.)
  - Added touch target variables

- [x] **1.2** Add physics animation classes
  - `.physics-press` - Tactile button feedback
  - `.elastic-tap` - Mobile tap with overshoot
  - `.animate-fade-up` - Content entrance
  - `.animate-scale-in` - Modal/tooltip entrance
  - `.stagger-children` - Cascading list animations
  - `.physics-pulse` - Skeleton loading

- [x] **1.3** Create `useAtomicWeight` hook
  - `isVisible(weight)` - Check if element should show at current breakpoint
  - `getMinWeight()` - Get minimum visible weight
  - Convenience helpers: `showCritical`, `showPrimary`, `showDecorative`, etc.

- [x] **1.4** Add touch target utility classes
  - `.touch-target` - 44px minimum on mobile
  - `.touch-target-comfortable` - 48px minimum
  - `.touch-hitbox` - Extends clickable area

## Phase 2: Header Atomic Refactor ✅

- [x] **2.1** Apply weight system to Header.tsx
  - Logo icon (10) - always visible
  - Brand text (3) - visible lg+ only
  - Tab icons (8) - always visible
  - Tab labels (5) - visible md+ only

- [x] **2.2** Touch target compliance
  - All buttons have `touch-target` class
  - Padding increased to `p-2.5` on mobile
  - Touch events added for mobile press states

- [x] **2.3** Settings in overflow menu
  - Added Settings link to mobile overflow menu
  - Divider between Settings and Archive/Trash

- [x] **2.4** Physics animations
  - Applied `physics-press` to all interactive elements
  - Using `animate-scale-in` for dropdown menus

## Phase 3: TagScroller Graceful Degradation ✅

- [x] **3.1** Fade edge indicators
  - `.fade-edge-left`, `.fade-edge-right`, `.fade-edge-both` classes
  - Dynamic class based on scroll position

- [x] **3.2** Pill limits by breakpoint
  - xs: 3 pills
  - sm: 5 pills
  - md: 6 pills
  - lg+: all pills
  - "+N more" button to expand

- [x] **3.3** Momentum scroll
  - `.momentum-scroll` class with `-webkit-overflow-scrolling: touch`
  - Smooth scroll behavior

- [x] **3.4** Elastic-tap animation
  - Applied `elastic-tap` to all pills
  - Touch events for mobile press states

## Phase 4: Settings/Profile Consistency ✅

- [x] **4.1** UserMenu Settings always accessible
  - Settings link in dropdown menu
  - Clear visual hierarchy with dividers

- [x] **4.2** Overflow menu on mobile
  - Settings in Header overflow menu
  - Touch-compliant menu items

- [x] **4.3** Avatar sizing
  - 32px avatar with proper contrast
  - Touch target compliant button wrapper

- [x] **4.4** Email visibility
  - Weight 2 (Extended)
  - Only visible on xl+ viewports
  - Full email shown in dropdown always

## Phase 5: Card Grid Animations ✅

- [x] **5.1** Staggered fade-up animation
  - Cards use `animate-fade-up` class
  - CSS stagger available via `.stagger-children`

- [x] **5.2** Physics-press hover states
  - Cards have `physics-press` and lift on hover
  - `hover:-translate-y-1` with snappy easing

- [x] **5.3** Skeleton loading
  - `.physics-pulse` animation for loading states
  - Subtle scale animation

- [x] **5.4** Touch-compliant card actions
  - Archive/Delete/Restore buttons enlarged on mobile
  - `p-2.5 md:p-2` padding pattern
  - 44px minimum touch targets

## Phase 6: Global Audit & Testing ✅

- [x] **6.1** Build verification
  - `npm run build` passes
  - No TypeScript errors
  - No runtime issues

- [x] **6.2** Component updates
  - ThemeToggle updated with `physics-press` and `touch-target`
  - All interactive elements consistently styled

## Summary

All implementation tasks completed successfully. The atomic weight system provides consistent, predictable responsive behavior across all breakpoints while physics-based animations deliver satisfying tactile feedback.
