'use client';

/**
 * Theme Toggle Component
 *
 * Toggle button for switching between light, dark, and system themes.
 * Shows Sun icon for light, Moon for dark, Monitor for system.
 *
 * @fileoverview Theme toggle button with tactile feedback
 */

import { Sun, Moon, Monitor } from 'lucide-react';
import { useTheme, type Theme } from '@/lib/theme/ThemeProvider';
import { useState, useEffect } from 'react';

// =============================================================================
// COMPONENT
// =============================================================================

interface ThemeToggleProps {
  /** Show label text (default: false) */
  showLabel?: boolean;
  /** Additional CSS classes */
  className?: string;
}

export function ThemeToggle({ showLabel = false, className = '' }: ThemeToggleProps) {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Cycle through themes: light -> dark -> system -> light
  const cycleTheme = () => {
    const nextTheme: Record<Theme, Theme> = {
      light: 'dark',
      dark: 'system',
      system: 'light',
    };
    setTheme(nextTheme[theme]);
  };

  // Quick toggle between light/dark (for simple use)
  const quickToggle = () => {
    setTheme(resolvedTheme === 'light' ? 'dark' : 'light');
  };

  // Get icon based on current theme
  const getIcon = () => {
    if (!mounted) {
      // SSR fallback - show sun by default
      return <Sun className="h-5 w-5" />;
    }

    switch (theme) {
      case 'light':
        return <Sun className="h-5 w-5" />;
      case 'dark':
        return <Moon className="h-5 w-5" />;
      case 'system':
        return <Monitor className="h-5 w-5" />;
    }
  };

  // Get label text
  const getLabel = (): string => {
    if (!mounted) return 'Theme';

    switch (theme) {
      case 'light':
        return 'Light';
      case 'dark':
        return 'Dark';
      case 'system':
        return 'System';
    }
  };

  // Get tooltip text
  const getTooltip = (): string => {
    if (!mounted) return 'Toggle theme';

    const next: Record<Theme, string> = {
      light: 'Switch to dark mode',
      dark: 'Switch to system preference',
      system: 'Switch to light mode',
    };
    return next[theme];
  };

  return (
    <button
      onClick={cycleTheme}
      onDoubleClick={quickToggle}
      className={`
        p-2.5 rounded-lg text-[var(--foreground-muted)]
        physics-press touch-target
        hover:text-[var(--foreground)] hover:bg-black/5
        dark:hover:bg-white/10
        transition-colors duration-150
        ${className}
      `}
      title={getTooltip()}
      aria-label={getTooltip()}
    >
      <span className="flex items-center gap-2">
        {getIcon()}
        {showLabel && (
          <span className="text-sm font-medium hidden sm:inline">
            {getLabel()}
          </span>
        )}
      </span>
    </button>
  );
}

export default ThemeToggle;
