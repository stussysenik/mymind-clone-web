/**
 * Design Tokens System
 *
 * Centralized design tokens for colors, fonts, and theme customization.
 * Used by ThemeProvider and SettingsModal for runtime CSS variable updates.
 *
 * @fileoverview Design tokens with persistence and runtime application
 */

// =============================================================================
// TYPES
// =============================================================================

export interface DesignTokens {
  // Theme mode
  mode: 'light' | 'dark' | 'system';

  // Accent colors
  accentPrimary: string;
  accentHover: string;

  // Background colors (optional overrides - null means use theme defaults)
  background: string | null;
  backgroundSecondary: string | null;
  cardBg: string | null;

  // Foreground colors (optional overrides)
  foreground: string | null;
  foregroundMuted: string | null;

  // Typography
  fontSans: string;
  fontSerif: string;
}

// =============================================================================
// PRESET FONTS
// =============================================================================

export const PRESET_FONTS = {
  sans: [
    { name: 'Inter', value: "'Inter', system-ui, -apple-system, sans-serif" },
    { name: 'System UI', value: 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif' },
    { name: 'Roboto', value: "'Roboto', system-ui, sans-serif" },
    { name: 'Open Sans', value: "'Open Sans', system-ui, sans-serif" },
    { name: 'Nunito', value: "'Nunito', system-ui, sans-serif" },
  ],
  serif: [
    { name: 'Libre Baskerville', value: "'Libre Baskerville', 'Georgia', 'Charter', serif" },
    { name: 'Georgia', value: "'Georgia', 'Charter', serif" },
    { name: 'Merriweather', value: "'Merriweather', 'Georgia', serif" },
    { name: 'Playfair Display', value: "'Playfair Display', 'Georgia', serif" },
    { name: 'Lora', value: "'Lora', 'Georgia', serif" },
  ],
} as const;

// =============================================================================
// PRESET ACCENT COLORS
// =============================================================================

export const PRESET_ACCENTS = [
  { name: 'Riso Orange', primary: '#FF6B4A', hover: '#E35332' },
  { name: 'Ocean Blue', primary: '#2B579A', hover: '#1E3D6B' },
  { name: 'Forest Green', primary: '#00A99D', hover: '#008F85' },
  { name: 'Sunset Pink', primary: '#FF48B0', hover: '#E33A9C' },
  { name: 'Royal Purple', primary: '#9D7AD2', hover: '#8562C0' },
  { name: 'Slate Gray', primary: '#6B7280', hover: '#4B5563' },
] as const;

// =============================================================================
// DEFAULTS
// =============================================================================

export const DEFAULT_TOKENS: DesignTokens = {
  mode: 'light',
  accentPrimary: '#FF6B4A',
  accentHover: '#E35332',
  background: null,
  backgroundSecondary: null,
  cardBg: null,
  foreground: null,
  foregroundMuted: null,
  fontSans: "'Inter', system-ui, -apple-system, sans-serif",
  fontSerif: "'Libre Baskerville', 'Georgia', 'Charter', serif",
};

// Light theme defaults (for reference when applying custom backgrounds)
export const LIGHT_THEME_DEFAULTS = {
  background: '#F7F6F3',
  backgroundSecondary: '#EFEEEB',
  cardBg: '#FFFFFF',
  foreground: '#2D2D2D',
  foregroundMuted: '#6B6B6B',
};

// Dark theme defaults (for reference when applying custom backgrounds)
export const DARK_THEME_DEFAULTS = {
  background: '#1A1A1A',
  backgroundSecondary: '#252525',
  cardBg: '#252525',
  foreground: '#E0E0E0',
  foregroundMuted: '#A0A0A0',
};

// =============================================================================
// STORAGE
// =============================================================================

const STORAGE_KEY = 'mymind-design-tokens';

/**
 * Load design tokens from localStorage
 */
export function loadDesignTokens(): DesignTokens {
  if (typeof window === 'undefined') return DEFAULT_TOKENS;

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Merge with defaults to handle new properties
      return { ...DEFAULT_TOKENS, ...parsed };
    }
  } catch (e) {
    console.error('[DesignTokens] Failed to load from localStorage:', e);
  }

  return DEFAULT_TOKENS;
}

/**
 * Save design tokens to localStorage
 */
export function saveDesignTokens(tokens: DesignTokens): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tokens));
  } catch (e) {
    console.error('[DesignTokens] Failed to save to localStorage:', e);
  }
}

// =============================================================================
// RUNTIME APPLICATION
// =============================================================================

/**
 * Apply design tokens to CSS custom properties
 */
export function applyDesignTokens(tokens: DesignTokens): void {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;

  // Resolve system preference for theme
  const getSystemTheme = (): 'light' | 'dark' =>
    window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';

  const resolvedTheme = tokens.mode === 'system' ? getSystemTheme() : tokens.mode;

  // Apply theme mode
  root.setAttribute('data-theme', resolvedTheme);
  root.style.colorScheme = resolvedTheme;

  // Apply accent colors
  root.style.setProperty('--accent-primary', tokens.accentPrimary);
  root.style.setProperty('--accent-hover', tokens.accentHover);
  root.style.setProperty('--accent-light', hexToRgba(tokens.accentPrimary, 0.1));

  // Apply custom backgrounds (if set)
  if (tokens.background) {
    root.style.setProperty('--background', tokens.background);
  } else {
    root.style.removeProperty('--background');
  }

  if (tokens.backgroundSecondary) {
    root.style.setProperty('--background-secondary', tokens.backgroundSecondary);
  } else {
    root.style.removeProperty('--background-secondary');
  }

  if (tokens.cardBg) {
    root.style.setProperty('--card-bg', tokens.cardBg);
  } else {
    root.style.removeProperty('--card-bg');
  }

  // Apply custom foreground colors (if set)
  if (tokens.foreground) {
    root.style.setProperty('--foreground', tokens.foreground);
  } else {
    root.style.removeProperty('--foreground');
  }

  if (tokens.foregroundMuted) {
    root.style.setProperty('--foreground-muted', tokens.foregroundMuted);
  } else {
    root.style.removeProperty('--foreground-muted');
  }

  // Apply fonts
  root.style.setProperty('--font-sans', tokens.fontSans);
  root.style.setProperty('--font-serif', tokens.fontSerif);
}

/**
 * Reset design tokens to defaults
 */
export function resetDesignTokens(): DesignTokens {
  saveDesignTokens(DEFAULT_TOKENS);
  applyDesignTokens(DEFAULT_TOKENS);
  return DEFAULT_TOKENS;
}

// =============================================================================
// UTILITIES
// =============================================================================

/**
 * Convert hex color to rgba
 */
function hexToRgba(hex: string, alpha: number): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return `rgba(255, 107, 74, ${alpha})`;

  const r = parseInt(result[1], 16);
  const g = parseInt(result[2], 16);
  const b = parseInt(result[3], 16);

  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * Darken a hex color by a percentage (for generating hover states)
 */
export function darkenColor(hex: string, percent: number = 15): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return hex;

  const r = Math.max(0, parseInt(result[1], 16) - Math.round(255 * percent / 100));
  const g = Math.max(0, parseInt(result[2], 16) - Math.round(255 * percent / 100));
  const b = Math.max(0, parseInt(result[3], 16) - Math.round(255 * percent / 100));

  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

/**
 * Check if a color is light or dark (for contrast calculations)
 */
export function isLightColor(hex: string): boolean {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return true;

  const r = parseInt(result[1], 16);
  const g = parseInt(result[2], 16);
  const b = parseInt(result[3], 16);

  // Calculate relative luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5;
}

// =============================================================================
// INLINE SCRIPT FOR FOUC PREVENTION
// =============================================================================

/**
 * Inline script to prevent FOUC (Flash of Unstyled Content)
 * Applies saved design tokens before React hydration
 */
export const designTokensScript = `
(function() {
  try {
    var stored = localStorage.getItem('${STORAGE_KEY}');
    var tokens = stored ? JSON.parse(stored) : null;

    // Apply theme mode
    var theme = tokens?.mode || localStorage.getItem('mymind-theme') || 'system';
    var resolved = theme === 'dark' ? 'dark' :
                   theme === 'light' ? 'light' :
                   window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', resolved);
    document.documentElement.style.colorScheme = resolved;

    // Apply custom tokens if present
    if (tokens) {
      var root = document.documentElement.style;
      if (tokens.accentPrimary) root.setProperty('--accent-primary', tokens.accentPrimary);
      if (tokens.accentHover) root.setProperty('--accent-hover', tokens.accentHover);
      if (tokens.background) root.setProperty('--background', tokens.background);
      if (tokens.backgroundSecondary) root.setProperty('--background-secondary', tokens.backgroundSecondary);
      if (tokens.cardBg) root.setProperty('--card-bg', tokens.cardBg);
      if (tokens.foreground) root.setProperty('--foreground', tokens.foreground);
      if (tokens.foregroundMuted) root.setProperty('--foreground-muted', tokens.foregroundMuted);
      if (tokens.fontSans) root.setProperty('--font-sans', tokens.fontSans);
      if (tokens.fontSerif) root.setProperty('--font-serif', tokens.fontSerif);
    }
  } catch (e) {}
})();
`;
