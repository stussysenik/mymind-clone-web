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
import { Search, X, PackagePlus, Loader2, Sparkles } from 'lucide-react';
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
        const initialMode = searchParams.get('mode') === 'smart' ? 'smart' : 'exact';

        const [query, setQuery] = useState(initialQuery);
        const [mode, setMode] = useState<'exact' | 'smart'>(initialMode);
        const [isFocused, setIsFocused] = useState(false);
        const [isSaving, setIsSaving] = useState(false);

        const debouncedQuery = useDebounce(query, 300);

        // Sync local state when URL changes externally (e.g. tag click)
        useEffect(() => {
                const urlQuery = searchParams.get('q') || '';

                // Only update if different AND we aren't focused (to avoid overwriting while typing)
                // This prevents the race condition where debounced URL update reverts local state
                if (!isFocused && urlQuery !== query) {
                        setQuery(urlQuery);
                }
                if (!isFocused && urlQuery !== query) {
                        setQuery(urlQuery);
                }

                // Sync mode if changed externally
                const urlMode = searchParams.get('mode') === 'smart' ? 'smart' : 'exact';
                if (urlMode !== mode) {
                        setMode(urlMode);
                }
                // eslint-disable-next-line react-hooks/exhaustive-deps
        }, [searchParams, isFocused]); // query excluded to avoid cycle, verify logic

        // Update URL when debounced query changes
        useEffect(() => {
                const currentQ = searchParams.get('q') || '';

                // Prevent infinite loop: Only push if query is actually different
                if (debouncedQuery !== currentQ) {
                        const params = new URLSearchParams(searchParams.toString());
                        if (debouncedQuery) {
                                params.set('q', debouncedQuery);
                        } else {
                                params.delete('q');
                        }
                        if (mode === 'smart') {
                                params.set('mode', 'smart');
                        } else {
                                params.delete('mode');
                        }

                        console.log('[SearchBar] Updating URL:', debouncedQuery, mode);
                        router.push(`?${params.toString()}`, { scroll: false });
                }



                onSearch?.(debouncedQuery);
                // eslint-disable-next-line react-hooks/exhaustive-deps
        }, [debouncedQuery, mode, router, onSearch]); // Exclude searchParams to avoid loop when URL changes externally

        // Clean up: Removed separate updateUrl callback to simplify recursion risk


        const handleClear = () => {
                setQuery('');
                // Ensure we keep focus or handle it? 
                // If user clicks clear, they might want to type again immediately.
                // The button onClick will take focus momentarily but we can refocus input?
                // Actually, usually clearer to just clear.
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
                } else if (e.key === 'Enter' && !e.shiftKey) {
                        // Immediate URL update on Enter (bypass debounce for explicit submit intent)
                        e.preventDefault();
                        const params = new URLSearchParams(searchParams.toString());
                        if (query.trim()) {
                                params.set('q', query.trim());
                        } else {
                                params.delete('q');
                        }
                        if (mode === 'smart') {
                                params.set('mode', 'smart');
                        }
                        console.log('[SearchBar] Enter pressed, immediate URL update:', query.trim(), mode);
                        router.push(`?${params.toString()}`, { scroll: false });
                        onSearch?.(query.trim());
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
					transition-all duration-300 ease-out border
                                        ${isFocused
                                                ? 'bg-white shadow-xl ring-1 ring-black/5 transform -translate-y-0.5'
                                                : 'bg-white/50 border border-gray-100 hover:bg-white hover:shadow-md'
                                        }
                                        ${mode === 'smart' ? 'ring-1 ring-purple-500/30 shadow-[0_4px_20px_-12px_rgba(168,85,247,0.4)]' : ''}
				`}
                        >

                                {/* Search Icon */}
                                <Search
                                        className={`
            h-5 w-5 flex-shrink-0 transition-colors
            ${isFocused ? (mode === 'smart' ? 'text-purple-600' : 'text-gray-900') : 'text-gray-400'}
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

                                {/* Smart Toggle */}
                                <button
                                        onClick={() => {
                                                const newMode = mode === 'exact' ? 'smart' : 'exact';
                                                const params = new URLSearchParams(searchParams.toString());
                                                if (newMode === 'smart') {
                                                        params.set('mode', 'smart');
                                                } else {
                                                        params.delete('mode');
                                                }
                                                // Removed optimistic update to prevent race with useEffect sync
                                                // setMode(newMode); 
                                                router.push(`?${params.toString()}`, { scroll: false });
                                        }}
                                        className={`
                                                flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium transition-all
                                                ${mode === 'smart'
                                                        ? 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                                                        : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                                                }
                                        `}
                                        title={mode === 'smart' ? "Disable Smart Search" : "Enable Smart Search (AI)"}
                                        aria-label="Toggle Search Mode"
                                        type="button"
                                >
                                        <Sparkles className={`w-3 h-3 ${mode === 'smart' ? 'fill-purple-400' : ''}`} />
                                        {mode === 'smart' ? 'Smart' : 'Exact'}
                                </button>

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
                                                        type="button" // Important preventing form submit
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
