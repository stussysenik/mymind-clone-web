# Theme System Specification

## ADDED Requirements

### Requirement: Dark Mode Support
The application MUST support both light and dark color modes with automatic detection and manual override.

#### Scenario: Auto dark mode detection
- **WHEN** user's OS is set to dark mode (`prefers-color-scheme: dark`)
- **THEN** application automatically applies dark theme
- **AND** all components use dark mode CSS variables
- **AND** no flash of light content (FOLC) occurs on page load

#### Scenario: Manual dark mode toggle
- **WHEN** user manually toggles dark mode in settings
- **THEN** theme switches within 100ms
- **AND** preference is saved to localStorage as `theme.mode: 'dark'`
- **AND** manual preference overrides OS preference

#### Scenario: Manual light mode override
- **WHEN** user has OS dark mode enabled but manually selects light mode
- **THEN** application uses light theme despite OS preference
- **AND** preference persists across sessions
- **AND** user can reset to "Auto" to re-enable OS detection

### Requirement: CSS Variable Architecture
Theme colors MUST be defined as CSS variables to enable instant theme switching without page reload.

#### Scenario: Light theme variables
- **WHEN** light theme is active
- **THEN** CSS variables are set:
  - `--background: #f7f6f3` (Paper White)
  - `--foreground: #1a1a1a` (Dark Text)
  - `--foreground-muted: #6b6b6b` (Muted Text)
  - `--accent-primary: #ff6b4a` (Riso Orange)
  - `--border: #e0e0e0` (Light Border)

#### Scenario: Dark theme variables
- **WHEN** dark theme is active
- **THEN** CSS variables are set:
  - `--background: #1a1a1a` (Dark Charcoal)
  - `--foreground: #e0e0e0` (Light Text)
  - `--foreground-muted: #a0a0a0` (Muted Light Text)
  - `--accent-primary: #ff7f63` (Lighter Orange for contrast)
  - `--border: #333333` (Dark Border)

#### Scenario: CSS variable update performance
- **WHEN** user switches theme
- **THEN** CSS variables update within 100ms
- **AND** all components using variables re-render automatically
- **AND** no visible flash or flicker occurs

### Requirement: Background Color Customization
Users MUST be able to choose from 5 preset background colors to personalize their visual environment.

#### Scenario: Background color presets
- **WHEN** user opens theme customization settings
- **THEN** 5 background color options are displayed:
  - "Paper White" (#F7F6F3) - Current default
  - "Warm Cream" (#FFF8E7)
  - "Cool Gray" (#E8ECF0)
  - "Dark Charcoal" (#1A1A1A)
  - "Pure Black" (#000000) - OLED optimized

#### Scenario: Apply custom background
- **WHEN** user selects "Warm Cream" background
- **THEN** `--background` CSS variable updates to #FFF8E7
- **AND** change is visible immediately (within 100ms)
- **AND** preference is saved to localStorage as `theme.background: 'warm-cream'`
- **AND** foreground colors auto-adjust for contrast if needed

#### Scenario: OLED dark mode
- **WHEN** user selects "Pure Black" background
- **THEN** `--background` is set to #000000
- **AND** `--foreground` is adjusted to #e8e8e8 for WCAG AA contrast
- **AND** OLED devices benefit from true black (power saving)

### Requirement: Font Customization
Users MUST be able to choose from 3 font configurations to match their reading preferences.

#### Scenario: Font preset options
- **WHEN** user opens font customization settings
- **THEN** 3 font options are displayed:
  - "Serif + Sans" (Current: Libre Baskerville + Inter)
  - "Monospace" (JetBrains Mono for all text)
  - "Sans-Serif" (Inter for all text)

#### Scenario: Apply monospace font
- **WHEN** user selects "Monospace" font
- **THEN** all text elements use JetBrains Mono
- **AND** font-family CSS variable updates: `--font-primary: 'JetBrains Mono'`
- **AND** letter-spacing is adjusted for monospace readability
- **AND** preference is saved to localStorage as `theme.font: 'mono'`

#### Scenario: Font loading performance
- **WHEN** user switches font
- **THEN** font loads within 500ms (using `next/font` preload)
- **AND** `font-display: swap` prevents invisible text
- **AND** no layout shift occurs during font swap

### Requirement: Highlight Color Customization
Users MUST be able to choose from 5 accent colors for links, buttons, and interactive elements.

#### Scenario: Highlight color presets
- **WHEN** user opens highlight color settings
- **THEN** 5 accent color options are displayed:
  - "Riso Orange" (#FF6B4A) - Current default
  - "Teal" (#00A99D)
  - "Pink" (#FF6BB5)
  - "Purple" (#9B6BFF)
  - "Blue" (#4A90E2)

#### Scenario: Apply teal highlight
- **WHEN** user selects "Teal" highlight color
- **THEN** `--accent-primary` CSS variable updates to #00A99D
- **AND** all links, buttons, and active states use teal
- **AND** change is visible immediately (within 100ms)
- **AND** preference is saved to localStorage as `theme.accentColor: 'teal'`

#### Scenario: Contrast adjustment for dark mode
- **WHEN** user has dark mode enabled with custom highlight color
- **THEN** highlight color is automatically lightened for contrast
- **AND** adjusted color still meets WCAG AA ratio (4.5:1 minimum)
- **AND** original color preference is preserved

### Requirement: Settings Modal UI
Theme customization MUST be accessible via a floating settings button with intuitive UI.

#### Scenario: Settings button placement
- **WHEN** user views any page
- **THEN** floating settings button is visible in bottom-right corner
- **AND** button has gear icon and 48×48px touch target
- **AND** button is positioned 24px from bottom and right edges
- **AND** button is above other floating elements (z-index priority)

#### Scenario: Settings modal open
- **WHEN** user clicks settings button
- **THEN** modal opens with smooth slide-up animation (200ms)
- **AND** modal displays theme customization options:
  - Mode toggle (Light / Auto / Dark)
  - Background color swatches
  - Font selector dropdown
  - Highlight color swatches
- **AND** modal has semi-transparent backdrop
- **AND** clicking backdrop or Escape key closes modal

#### Scenario: Live preview in settings
- **WHEN** user hovers over a background color swatch
- **THEN** preview tooltip shows color name and hex value
- **AND** selecting swatch applies change immediately
- **AND** user sees real-time update in background UI (behind modal)

### Requirement: Theme Persistence
Theme preferences MUST persist across sessions using localStorage.

#### Scenario: Save theme on change
- **WHEN** user modifies any theme setting
- **THEN** preference is saved to localStorage immediately
- **AND** localStorage key is `mymind_theme_preferences`
- **AND** value is JSON object with keys: mode, background, font, accentColor

#### Scenario: Load theme on init
- **WHEN** application loads
- **THEN** theme preferences are read from localStorage
- **AND** CSS variables are set before first paint (no FOLC)
- **AND** if no preferences exist, defaults are used:
  - mode: 'auto'
  - background: 'paper-white'
  - font: 'serif-sans'
  - accentColor: 'riso-orange'

#### Scenario: Cross-device non-sync
- **WHEN** user changes theme on Device A
- **THEN** preferences are stored only on Device A
- **AND** Device B retains its own separate preferences
- **AND** no cloud sync or account dependency exists (privacy-first)

### Requirement: Accessibility Compliance
All theme combinations MUST meet WCAG AA contrast standards (4.5:1 minimum).

#### Scenario: Contrast validation
- **WHEN** user selects any theme combination
- **THEN** foreground/background contrast ratio is >= 4.5:1
- **AND** accent color contrast is >= 4.5:1 for text
- **AND** accent color contrast is >= 3:1 for large text (18px+)

#### Scenario: Contrast ratio failure
- **WHEN** user selects combination that fails contrast (e.g., yellow on white)
- **THEN** system auto-adjusts accent color lightness
- **AND** warning toast appears: "Accent color adjusted for contrast"
- **AND** adjusted color is shown in settings for transparency

#### Scenario: Axe DevTools audit
- **WHEN** developer runs Axe DevTools in any theme
- **THEN** zero critical or serious color contrast violations
- **AND** all interactive elements have sufficient contrast
- **AND** focus indicators are visible (3:1 minimum contrast)

### Requirement: Reduced Motion Support
Theme transitions and animations MUST respect user's motion preferences.

#### Scenario: Prefers reduced motion
- **WHEN** user has `prefers-reduced-motion: reduce` enabled
- **THEN** theme switch has no transition animation
- **AND** color change is instant (0ms duration)
- **AND** settings modal uses fade instead of slide animation
- **AND** all other animations are disabled or reduced

#### Scenario: No motion preference
- **WHEN** user has no reduced motion preference
- **THEN** theme switch has smooth 100ms transition
- **AND** settings modal slides up in 200ms
- **AND** color swatch hover has 150ms transition

### Requirement: Theme Reset
Users MUST be able to reset theme to default settings with one action.

#### Scenario: Reset to defaults
- **WHEN** user clicks "Reset to Defaults" button in settings
- **THEN** confirmation dialog appears: "Reset theme to defaults?"
- **AND** if confirmed, all preferences revert to:
  - mode: 'auto'
  - background: 'paper-white'
  - font: 'serif-sans'
  - accentColor: 'riso-orange'
- **AND** localStorage is updated with defaults
- **AND** UI updates immediately to reflect reset

### Requirement: Theme Export/Import (Future-Proof)
Theme preferences schema MUST support future export/import functionality.

#### Scenario: Theme data structure
- **WHEN** theme preferences are stored
- **THEN** localStorage value is valid JSON with schema:
  ```json
  {
    "version": "1.0",
    "mode": "light" | "dark" | "auto",
    "background": string,
    "font": string,
    "accentColor": string
  }
  ```
- **AND** version field enables future schema migrations
- **AND** structure is human-readable for manual editing
