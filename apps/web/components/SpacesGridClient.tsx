/**
 * MyMind Clone - Spaces Grid Client Component
 * 
 * Client component that wraps the space cards and handles hiding/deletion.
 * Uses localStorage to persist hidden spaces (non-destructive).
 * 
 * @fileoverview Client wrapper for spaces grid with hide functionality
 */

'use client';

import { useState, useEffect } from 'react';
import { PackageOpen, Eye } from 'lucide-react';
import { SpaceCard } from './SpaceCard';

const HIDDEN_SPACES_KEY = 'mymind_hidden_spaces';

interface SpacesGridClientProps {
        spaces: Array<{ tag: string; count: number }>;
}

export function SpacesGridClient({ spaces }: SpacesGridClientProps) {
        const [hiddenSpaces, setHiddenSpaces] = useState<string[]>([]);
        const [showHidden, setShowHidden] = useState(false);
        const [mounted, setMounted] = useState(false);

        // Load hidden spaces from localStorage on mount
        useEffect(() => {
                setMounted(true);
                try {
                        const stored = localStorage.getItem(HIDDEN_SPACES_KEY);
                        if (stored) {
                                setHiddenSpaces(JSON.parse(stored));
                        }
                } catch (e) {
                        console.error('Failed to load hidden spaces:', e);
                }
        }, []);

        // Save hidden spaces to localStorage
        const saveHiddenSpaces = (hidden: string[]) => {
                try {
                        localStorage.setItem(HIDDEN_SPACES_KEY, JSON.stringify(hidden));
                } catch (e) {
                        console.error('Failed to save hidden spaces:', e);
                }
        };

        const handleHideSpace = (tag: string) => {
                const updated = [...hiddenSpaces, tag];
                setHiddenSpaces(updated);
                saveHiddenSpaces(updated);
        };

        const handleRestoreSpace = (tag: string) => {
                const updated = hiddenSpaces.filter(t => t !== tag);
                setHiddenSpaces(updated);
                saveHiddenSpaces(updated);
        };

        const handleRestoreAll = () => {
                setHiddenSpaces([]);
                saveHiddenSpaces([]);
        };

        // Don't render until mounted to avoid hydration mismatch
        if (!mounted) {
                return <SpacesGridSkeleton />;
        }

        const visibleSpaces = spaces.filter(s => !hiddenSpaces.includes(s.tag));
        const hiddenSpacesList = spaces.filter(s => hiddenSpaces.includes(s.tag));

        if (visibleSpaces.length === 0 && hiddenSpacesList.length === 0) {
                return (
                        <div className="flex flex-col items-center justify-center py-20 text-center">
                                <div className="bg-gray-100 p-4 rounded-full mb-4">
                                        <PackageOpen className="w-8 h-8 text-gray-400" />
                                </div>
                                <h3 className="text-lg font-medium text-[var(--foreground)]">No spaces yet</h3>
                                <p className="text-[var(--foreground-muted)] max-w-sm mt-1">
                                        Save some cards with tags to see them appear here as Spaces.
                                </p>
                        </div>
                );
        }

        return (
                <div>
                        {/* Visible Spaces Grid */}
                        {visibleSpaces.length > 0 ? (
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                                        {visibleSpaces.map(({ tag, count }) => (
                                                <SpaceCard
                                                        key={tag}
                                                        tag={tag}
                                                        count={count}
                                                        onDelete={handleHideSpace}
                                                />
                                        ))}
                                </div>
                        ) : (
                                <div className="flex flex-col items-center justify-center py-12 text-center">
                                        <p className="text-[var(--foreground-muted)]">
                                                All spaces are hidden
                                        </p>
                                </div>
                        )}

                        {/* Hidden Spaces Section */}
                        {hiddenSpacesList.length > 0 && (
                                <div className="mt-12 pt-8 border-t border-gray-200">
                                        <div className="flex items-center justify-between mb-4">
                                                <button
                                                        onClick={() => setShowHidden(!showHidden)}
                                                        className="flex items-center gap-2 text-sm text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors"
                                                >
                                                        <Eye className="w-4 h-4" />
                                                        {hiddenSpacesList.length} hidden space{hiddenSpacesList.length !== 1 ? 's' : ''}
                                                        <span className="text-xs">({showHidden ? 'click to hide' : 'click to show'})</span>
                                                </button>
                                                {showHidden && (
                                                        <button
                                                                onClick={handleRestoreAll}
                                                                className="text-xs text-[var(--accent-primary)] hover:underline"
                                                        >
                                                                Restore all
                                                        </button>
                                                )}
                                        </div>

                                        {showHidden && (
                                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 opacity-60">
                                                        {hiddenSpacesList.map(({ tag, count }) => (
                                                                <div
                                                                        key={tag}
                                                                        className="relative aspect-square bg-gray-50 rounded-xl border border-dashed border-gray-200 p-4 flex flex-col justify-between"
                                                                >
                                                                        <div className="text-gray-400 capitalize text-sm">{tag}</div>
                                                                        <div className="flex justify-between items-end">
                                                                                <span className="text-xs text-gray-400">{count} items</span>
                                                                                <button
                                                                                        onClick={() => handleRestoreSpace(tag)}
                                                                                        className="text-xs text-[var(--accent-primary)] hover:underline"
                                                                                >
                                                                                        Restore
                                                                                </button>
                                                                        </div>
                                                                </div>
                                                        ))}
                                                </div>
                                        )}
                                </div>
                        )}
                </div>
        );
}

function SpacesGridSkeleton() {
        return (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                        {Array.from({ length: 8 }).map((_, i) => (
                                <div key={i} className="aspect-square bg-white rounded-xl border border-[var(--border)] p-6 space-y-4">
                                        <div className="w-12 h-12 rounded-lg bg-gray-100 animate-pulse" />
                                        <div className="space-y-2 pt-8">
                                                <div className="h-5 w-24 bg-gray-100 animate-pulse rounded" />
                                                <div className="h-3 w-12 bg-gray-100 animate-pulse rounded" />
                                        </div>
                                </div>
                        ))}
                </div>
        );
}

export default SpacesGridClient;
