/**
 * MyMind Clone - useDebounce Hook
 * 
 * Custom hook for debouncing values. Useful for search inputs
 * to avoid making API calls on every keystroke.
 * 
 * @fileoverview Debounce hook for performance optimization
 */

import { useState, useEffect } from 'react';

/**
 * Debounces a value by the specified delay.
 * Returns the value only after it has stopped changing for the delay duration.
 * 
 * @param value - The value to debounce
 * @param delay - Delay in milliseconds (default: 300ms)
 * @returns The debounced value
 * 
 * @example
 * ```tsx
 * const [searchTerm, setSearchTerm] = useState('');
 * const debouncedSearch = useDebounce(searchTerm, 300);
 * 
 * useEffect(() => {
 *   // This only runs when debouncedSearch changes
 *   fetchSearchResults(debouncedSearch);
 * }, [debouncedSearch]);
 * ```
 */
export function useDebounce<T>(value: T, delay: number = 300): T {
        const [debouncedValue, setDebouncedValue] = useState<T>(value);

        useEffect(() => {
                // Set up a timer to update the debounced value after the delay
                const timer = setTimeout(() => {
                        setDebouncedValue(value);
                }, delay);

                // Clean up the timer if value changes before delay completes
                return () => {
                        clearTimeout(timer);
                };
        }, [value, delay]);

        return debouncedValue;
}

export default useDebounce;
