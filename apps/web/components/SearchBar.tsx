/**
 * MyMind Clone - SearchBar Component
 * 
 * Serif italic search input matching mymind.com aesthetic.
 * "Search my mind..." placeholder in elegant serif typography.
 * 
 * @fileoverview Search input with mymind-inspired styling
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, X } from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';

// =============================================================================
// PROPS
// =============================================================================

interface SearchBarProps {
        /** Placeholder text */
        placeholder?: string;
        /** Callback when search query changes */
        onSearch?: (query: string) => void;
}

// =============================================================================
// COMPONENT
// =============================================================================

/**
 * Search bar with serif italic placeholder.
 */
export function SearchBar({
        placeholder = 'Search my mind...',
        onSearch
}: SearchBarProps) {
        const router = useRouter();
        const searchParams = useSearchParams();

        const initialQuery = searchParams.get('q') ?? '';
        const [query, setQuery] = useState(initialQuery);
        const [isFocused, setIsFocused] = useState(false);

        const debouncedQuery = useDebounce(query, 300);

        /**
         * Updates URL with search query.
         */
        const updateUrl = useCallback((searchQuery: string) => {
                const params = new URLSearchParams(searchParams.toString());

                if (searchQuery) {
                        params.set('q', searchQuery);
                } else {
                        params.delete('q');
                }

                router.push(`?${params.toString()}`, { scroll: false });
        }, [router, searchParams]);

        useEffect(() => {
                updateUrl(debouncedQuery);
                onSearch?.(debouncedQuery);
        }, [debouncedQuery, onSearch, updateUrl]);

        const handleClear = () => {
                setQuery('');
        };

        const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
                if (e.key === 'Escape') {
                        handleClear();
                        (e.target as HTMLInputElement).blur();
                }
        };

        return (
                <div className="relative w-full">
                        {/* Search Container */}
                        <div
                                className={`
          flex items-center gap-3 py-3 px-4
          border-b-2 transition-colors duration-200
          ${isFocused
                                                ? 'border-[var(--accent-primary)]'
                                                : 'border-transparent hover:border-[var(--border)]'
                                        }
        `}
                        >
                                {/* Search Icon */}
                                <Search
                                        className={`
            h-5 w-5 flex-shrink-0 transition-colors
            ${isFocused ? 'text-[var(--accent-primary)]' : 'text-[var(--foreground-muted)]'}
          `}
                                />

                                {/* Input Field */}
                                <input
                                        type="text"
                                        value={query}
                                        onChange={(e) => setQuery(e.target.value)}
                                        onFocus={() => setIsFocused(true)}
                                        onBlur={() => setIsFocused(false)}
                                        onKeyDown={handleKeyDown}
                                        placeholder={placeholder}
                                        className={`
            flex-1 bg-transparent text-xl
            placeholder:text-[var(--foreground-muted)] placeholder:italic
            focus:outline-none
            font-serif italic
          `}
                                        style={{ fontFamily: 'var(--font-serif)' }}
                                        aria-label="Search cards"
                                />

                                {/* Clear Button */}
                                {query && (
                                        <button
                                                onClick={handleClear}
                                                className="p-1 rounded-full hover:bg-black/5 text-[var(--foreground-muted)] transition-colors"
                                                aria-label="Clear search"
                                        >
                                                <X className="h-4 w-4" />
                                        </button>
                                )}
                        </div>
                </div>
        );
}

export default SearchBar;
