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
import { Search, X, PackagePlus, Loader2 } from 'lucide-react';
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
        placeholder = 'Search your creative brain...',
        onSearch
}: SearchBarProps) {
        const router = useRouter();
        const searchParams = useSearchParams();

        const initialQuery = searchParams.get('q') ?? '';
        const [query, setQuery] = useState(initialQuery);
        const [isFocused, setIsFocused] = useState(false);
        const [isSaving, setIsSaving] = useState(false);

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

        const handleSaveSpace = async () => {
                if (!query.trim()) return;
                setIsSaving(true);
                try {
                        await fetch('/api/save', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                        type: 'note',
                                        title: `Space: ${query}`,
                                        content: `Created from search "${query}"`,
                                        tags: [query]
                                })
                        });
                        router.refresh();
                        // Assume success and clear? Or keep?
                } catch (error) {
                        console.error('Failed to save space', error);
                } finally {
                        setIsSaving(false);
                }
        };

        const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
                if (e.key === 'Escape') {
                        handleClear();
                        (e.target as HTMLInputElement).blur();
                } else if (e.key === 'Enter' && e.shiftKey) {
                        // Shift+Enter to save as space
                        e.preventDefault();
                        handleSaveSpace();
                }
        };

        return (
                <div className="relative w-full">
                        {/* Search Container */}
                        <div
                                className={`
                                        flex items-center gap-3 py-3 px-4 rounded-xl
                                        transition-all duration-200 border
                                        ${isFocused
                                                ? 'bg-white shadow-md border-transparent ring-1 ring-black/5'
                                                : 'bg-gray-50 border-transparent hover:bg-white hover:shadow-sm'
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
            flex-1 bg-transparent text-lg
            placeholder:text-gray-400
            focus:outline-none
            font-medium tracking-tight text-gray-900
          `}
                                        style={{ fontFamily: 'var(--font-serif)' }}
                                        aria-label="Search cards"
                                />

                                {/* Actions */}
                                {query && (
                                        <div className="flex items-center gap-1">
                                                <button
                                                        onClick={handleSaveSpace}
                                                        disabled={isSaving}
                                                        className="p-1 rounded-full hover:bg-black/5 text-[var(--foreground-muted)] transition-colors disabled:opacity-50"
                                                        title="Save as Space"
                                                >
                                                        {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <PackagePlus className="h-4 w-4" />}
                                                </button>
                                                <button
                                                        onClick={handleClear}
                                                        className="p-1 rounded-full hover:bg-black/5 text-[var(--foreground-muted)] transition-colors"
                                                        aria-label="Clear search"
                                                >
                                                        <X className="h-4 w-4" />
                                                </button>
                                        </div>
                                )}
                        </div>
                </div>
        );
}

export default SearchBar;
