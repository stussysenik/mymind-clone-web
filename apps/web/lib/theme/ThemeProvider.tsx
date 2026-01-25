'use client';

/**
 * Theme Provider
 *
 * Manages light/dark mode theme state with:
 * - localStorage persistence
 * - System preference detection
 * - Hydration-safe initialization
 *
 * @fileoverview Theme context provider for light/dark mode
 */

import { createContext, useContext, useEffect, useState, useCallback } from 'react';

// =============================================================================
// TYPES
// =============================================================================

export type Theme = 'light' | 'dark' | 'system';

interface ThemeContextValue {
  theme: Theme;
  resolvedTheme: 'light' | 'dark';
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const STORAGE_KEY = 'mymind-theme';
const DEFAULT_THEME: Theme = 'system';

// =============================================================================
// CONTEXT
// =============================================================================

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

// =============================================================================
// PROVIDER
// =============================================================================

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: Theme;
}

export function ThemeProvider({
  children,
  defaultTheme = DEFAULT_THEME,
}: ThemeProviderProps) {
  // Initialize with default to avoid hydration mismatch
  const [theme, setThemeState] = useState<Theme>(defaultTheme);
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');
  const [mounted, setMounted] = useState(false);

  // Resolve system preference
  const getSystemTheme = useCallback((): 'light' | 'dark' => {
    if (typeof window === 'undefined') return 'light';
    return window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  }, []);

  // Compute resolved theme based on current theme setting
  const computeResolvedTheme = useCallback(
    (t: Theme): 'light' | 'dark' => {
      return t === 'system' ? getSystemTheme() : t;
    },
    [getSystemTheme]
  );

  // Apply theme to document
  const applyTheme = useCallback((resolved: 'light' | 'dark') => {
    if (typeof document === 'undefined') return;

    const root = document.documentElement;

    // Remove both, then add the correct one
    root.removeAttribute('data-theme');

    if (resolved === 'dark') {
      root.setAttribute('data-theme', 'dark');
    } else {
      root.setAttribute('data-theme', 'light');
    }

    // Also set color-scheme for native elements
    root.style.colorScheme = resolved;
  }, []);

  // Set theme and persist
  const setTheme = useCallback(
    (newTheme: Theme) => {
      setThemeState(newTheme);

      // Persist to localStorage
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, newTheme);
      }

      // Compute and apply resolved theme
      const resolved = computeResolvedTheme(newTheme);
      setResolvedTheme(resolved);
      applyTheme(resolved);
    },
    [computeResolvedTheme, applyTheme]
  );

  // Toggle between light and dark (skips system)
  const toggleTheme = useCallback(() => {
    const newTheme = resolvedTheme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
  }, [resolvedTheme, setTheme]);

  // Initialize on mount (client-side only)
  useEffect(() => {
    // Read from localStorage
    const stored = localStorage.getItem(STORAGE_KEY) as Theme | null;
    const initial = stored || defaultTheme;

    setThemeState(initial);

    // Compute and apply resolved theme
    const resolved = computeResolvedTheme(initial);
    setResolvedTheme(resolved);
    applyTheme(resolved);

    setMounted(true);
  }, [defaultTheme, computeResolvedTheme, applyTheme]);

  // Listen for system preference changes
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleChange = () => {
      if (theme === 'system') {
        const resolved = getSystemTheme();
        setResolvedTheme(resolved);
        applyTheme(resolved);
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme, getSystemTheme, applyTheme]);

  // Prevent flash by not rendering until mounted
  // The CSS handles initial theme via media query
  const value: ThemeContextValue = {
    theme,
    resolvedTheme,
    setTheme,
    toggleTheme,
  };

  return (
    <ThemeContext.Provider value={value}>
      {/* Render children even before mount - CSS handles initial state */}
      {children}
    </ThemeContext.Provider>
  );
}

// =============================================================================
// HOOK
// =============================================================================

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

// =============================================================================
// SCRIPT FOR PREVENTING FLASH
// =============================================================================

/**
 * Inline script to prevent FOUC (Flash of Unstyled Content)
 * This should be injected into the HTML head
 */
export const themeScript = `
(function() {
  try {
    var theme = localStorage.getItem('${STORAGE_KEY}');
    var resolved = theme === 'dark' ? 'dark' :
                   theme === 'light' ? 'light' :
                   window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', resolved);
    document.documentElement.style.colorScheme = resolved;
  } catch (e) {}
})();
`;
