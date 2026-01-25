/**
 * MyMind Clone - useMediaQuery Hook
 *
 * Custom hook for responsive design that listens to CSS media query changes.
 * Used primarily for detecting mobile vs desktop viewports.
 *
 * @fileoverview Media query detection hook
 */

'use client';

import { useState, useEffect } from 'react';

/**
 * Hook to detect if a CSS media query matches.
 *
 * @param query - CSS media query string (e.g., "(max-width: 767px)")
 * @returns boolean indicating if the media query matches
 *
 * @example
 * const isMobile = useMediaQuery('(max-width: 767px)');
 */
export function useMediaQuery(query: string): boolean {
	const [matches, setMatches] = useState(false);

	useEffect(() => {
		// Check if window is available (SSR safety)
		if (typeof window === 'undefined') return;

		const media = window.matchMedia(query);

		// Set initial value
		setMatches(media.matches);

		// Create listener function
		const listener = (e: MediaQueryListEvent) => {
			setMatches(e.matches);
		};

		// Add event listener
		media.addEventListener('change', listener);

		// Cleanup
		return () => media.removeEventListener('change', listener);
	}, [query]);

	return matches;
}

/**
 * Hook providing granular breakpoint detection for responsive design.
 *
 * Breakpoints:
 * - isXs: <= 374px (iPhone SE/4, very small phones)
 * - isSm: <= 639px (Small phones)
 * - isMd: <= 767px (Tablets portrait, large phones)
 * - isLg: <= 1023px (Tablets landscape)
 *
 * @example
 * const { isMobile, isXs, isSm } = useBreakpoint();
 * // isMobile is true for anything <= 767px
 */
export function useBreakpoint() {
	const isXs = useMediaQuery('(max-width: 374px)');   // iPhone SE/4
	const isSm = useMediaQuery('(max-width: 639px)');   // Small phones
	const isMd = useMediaQuery('(max-width: 767px)');   // Tablets portrait
	const isLg = useMediaQuery('(max-width: 1023px)');  // Tablets landscape

	return {
		isXs,
		isSm,
		isMd,
		isLg,
		isMobile: isMd,
		isDesktop: !isMd
	};
}

/**
 * Atomic Weight System for responsive element visibility.
 *
 * Weight hierarchy (1-10):
 * - 10: Critical (Logo icon, Search input, FAB, Card visuals)
 * - 9: Primary (User avatar, Card title, Search container)
 * - 8: Primary Nav (Tab icons, Theme toggle)
 * - 7: Secondary Nav (Overflow menu, TagScroller container)
 * - 6: Content Secondary (Source domain, Smart toggle, Pills)
 * - 5: Content Optional (Tab labels, Card summary, Scroll arrows)
 * - 4: Tertiary (Archive/Trash links, Save button)
 * - 3: Decorative (Brand text "digital consumption...")
 * - 2: Extended (User email, Footer)
 *
 * Breakpoint visibility thresholds:
 * - xs (≤374px): Show weight ≥ 9 only
 * - sm (≤639px): Show weight ≥ 7
 * - md (≤767px): Show weight ≥ 5
 * - lg (≤1023px): Show weight ≥ 4 (decorative hidden on tablets)
 * - xl (>1023px): Show all weights
 */
export function useAtomicWeight() {
	const { isXs, isSm, isMd, isLg } = useBreakpoint();

	/**
	 * Determines if an element should be visible based on its weight and current viewport.
	 *
	 * @param weight - The atomic weight of the element (1-10)
	 * @returns boolean indicating if the element should be visible
	 */
	const isVisible = (weight: number): boolean => {
		// xs (≤374px): Show weight ≥ 9 only
		if (isXs) return weight >= 9;
		// sm (≤639px): Show weight ≥ 7
		if (isSm) return weight >= 7;
		// md (≤767px): Show weight ≥ 5
		if (isMd) return weight >= 5;
		// lg (≤1023px): Show weight ≥ 4 (decorative hidden on tablets)
		if (isLg) return weight >= 4;
		// xl (>1023px): Show all weights
		return true;
	};

	/**
	 * Returns the minimum weight threshold for the current viewport.
	 */
	const getMinWeight = (): number => {
		if (isXs) return 9;
		if (isSm) return 7;
		if (isMd) return 5;
		if (isLg) return 4; // Decorative (3) hidden on tablets
		return 1;
	};

	/**
	 * Returns the CSS class for an atomic weight value.
	 */
	const getWeightClass = (weight: number): string => {
		return `atomic-weight-${weight}`;
	};

	return {
		isVisible,
		getMinWeight,
		getWeightClass,
		// Convenience helpers for common weights
		showCritical: true,           // Weight 10
		showPrimary: isVisible(9),    // Weight 9
		showPrimaryNav: isVisible(8), // Weight 8
		showSecondaryNav: isVisible(7), // Weight 7
		showContentSecondary: isVisible(6), // Weight 6
		showContentOptional: isVisible(5), // Weight 5
		showTertiary: isVisible(4),   // Weight 4
		showDecorative: isVisible(3), // Weight 3
		showExtended: isVisible(2),   // Weight 2
	};
}

export default useMediaQuery;
