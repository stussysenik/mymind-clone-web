/**
 * MyMind Clone - useSwipe Hook
 *
 * Custom hook for detecting swipe gestures on touch devices.
 * Returns touch event handlers for swipe left/right detection.
 *
 * @fileoverview Touch swipe gesture detection hook
 */

'use client';

import { useRef, useCallback } from 'react';

interface SwipeHandlers {
	onTouchStart: (e: React.TouchEvent) => void;
	onTouchEnd: (e: React.TouchEvent) => void;
}

/**
 * Hook to detect horizontal swipe gestures.
 *
 * @param onSwipeLeft - Callback fired when user swipes left
 * @param onSwipeRight - Callback fired when user swipes right
 * @param threshold - Minimum swipe distance in pixels (default: 50)
 * @returns Object with touch event handlers to spread onto a component
 *
 * @example
 * const swipeHandlers = useSwipe(
 *   () => setView('text'),   // Swipe left shows text
 *   () => setView('visual')  // Swipe right shows visual
 * );
 * return <div {...swipeHandlers}>Content</div>;
 */
export function useSwipe(
	onSwipeLeft: () => void,
	onSwipeRight: () => void,
	threshold: number = 50
): SwipeHandlers {
	const touchStartX = useRef<number>(0);
	const touchStartY = useRef<number>(0);

	const onTouchStart = useCallback((e: React.TouchEvent) => {
		touchStartX.current = e.touches[0].clientX;
		touchStartY.current = e.touches[0].clientY;
	}, []);

	const onTouchEnd = useCallback((e: React.TouchEvent) => {
		const touchEndX = e.changedTouches[0].clientX;
		const touchEndY = e.changedTouches[0].clientY;

		const diffX = touchEndX - touchStartX.current;
		const diffY = touchEndY - touchStartY.current;

		// Only trigger if horizontal movement is greater than vertical
		// This prevents swipe from triggering during vertical scroll
		if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > threshold) {
			if (diffX > 0) {
				onSwipeRight();
			} else {
				onSwipeLeft();
			}
		}
	}, [onSwipeLeft, onSwipeRight, threshold]);

	return { onTouchStart, onTouchEnd };
}

export default useSwipe;
