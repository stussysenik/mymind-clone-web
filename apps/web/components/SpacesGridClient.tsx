/**
 * MyMind Clone - Spaces Grid Client Component
 * 
 * Client component that wraps the space cards and handles hiding/deletion.
 * Uses localStorage to persist hidden spaces (non-destructive).
 * Now also supports permanent deletion (destructive) with confirmation.
 * 
 * @fileoverview Client wrapper for spaces grid with hide/delete functionality
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PackageOpen, Eye, Trash2 } from 'lucide-react';
import { SpaceCard } from './SpaceCard';

const HIDDEN_SPACES_KEY = 'mymind_hidden_spaces';

interface SpacesGridClientProps {
        spaces: Array<{ tag: string; count: number }>;
}

export function SpacesGridClient({ spaces }: SpacesGridClientProps) {
        const router = useRouter();
        const [hiddenSpaces, setHiddenSpaces] = useState<string[]>([]);
        const [showHidden, setShowHidden] = useState(false);
        const [mounted, setMounted] = useState(false);
        const [deleteConfirmTag, setDeleteConfirmTag] = useState<string | null>(null);
        const [isDeleting, setIsDeleting] = useState(false);

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

        // Permanently delete all cards in a space
        const handleDeleteSpace = async (tag: string) => {
                setIsDeleting(true);
                try {
                        const response = await fetch('/api/spaces/delete', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ tag }),
                        });

                        if (response.ok) {
                                // Also remove from hidden list if it was there
                                const updated = hiddenSpaces.filter(t => t !== tag);
                                setHiddenSpaces(updated);
                                saveHiddenSpaces(updated);

                                router.refresh();
                        } else {
                                const data = await response.json();
                                console.error('[SpacesGrid] Delete failed:', data.error);
                        }
                } catch (err) {
                        console.error('[SpacesGrid] Delete error:', err);
                } finally {
                        setIsDeleting(false);
                        setDeleteConfirmTag(null);
                }
        };

        // If no spaces at all, show empty state immediately (no hydration mismatch possible)
        if (spaces.length === 0) {
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

        // Show skeleton only while waiting for client-side hydration with actual spaces
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
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                                        {visibleSpaces.map(({ tag, count }) => (
                                                <SpaceCard
                                                        key={tag}
                                                        tag={tag}
                                                        count={count}
                                                        onHide={handleHideSpace}
                                                        onDelete={() => setDeleteConfirmTag(tag)}
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
                                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 opacity-60">
                                                        {hiddenSpacesList.map(({ tag, count }) => (
                                                                <div
                                                                        key={tag}
                                                                        className="relative bg-gray-50 rounded-xl border border-dashed border-gray-200 p-3 flex items-center gap-3"
                                                                >
                                                                        {/* Text content */}
                                                                        <div className="flex-1 min-w-0">
                                                                                <div className="text-gray-400 capitalize text-sm truncate">{tag}</div>
                                                                                <span className="text-xs text-gray-400">{count} items</span>
                                                                        </div>
                                                                        {/* Actions */}
                                                                        <div className="flex gap-2 shrink-0">
                                                                                <button
                                                                                        onClick={() => handleRestoreSpace(tag)}
                                                                                        className="text-xs text-[var(--accent-primary)] hover:underline"
                                                                                >
                                                                                        Restore
                                                                                </button>
                                                                                <button
                                                                                        onClick={() => setDeleteConfirmTag(tag)}
                                                                                        className="text-xs text-red-500 hover:underline"
                                                                                >
                                                                                        Delete
                                                                                </button>
                                                                        </div>
                                                                </div>
                                                        ))}
                                                </div>
                                        )}
                                </div>
                        )}

                        {/* Delete Confirmation Dialog */}
                        {deleteConfirmTag && (
                                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                                        <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl animate-in fade-in zoom-in-95">
                                                <div className="flex items-center gap-3 mb-4">
                                                        <div className="p-2 bg-red-100 rounded-full">
                                                                <Trash2 className="w-5 h-5 text-red-500" />
                                                        </div>
                                                        <h3 className="text-lg font-bold text-gray-900">Delete Space?</h3>
                                                </div>

                                                <p className="text-sm text-gray-600 mb-2">
                                                        You are about to delete the space <strong className="text-gray-900 capitalize">&quot;{deleteConfirmTag}&quot;</strong>.
                                                </p>

                                                <div className="p-3 bg-red-50 border border-red-200 rounded-lg mb-6">
                                                        <p className="text-sm text-red-600 font-medium">
                                                                ⚠️ This will permanently delete ALL {spaces.find(s => s.tag === deleteConfirmTag)?.count || 0} posts in this space.
                                                        </p>
                                                        <p className="text-xs text-red-500 mt-1">
                                                                This action cannot be undone.
                                                        </p>
                                                </div>

                                                <div className="flex gap-3">
                                                        <button
                                                                onClick={() => setDeleteConfirmTag(null)}
                                                                disabled={isDeleting}
                                                                className="flex-1 py-2.5 px-4 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors disabled:opacity-50"
                                                        >
                                                                Cancel
                                                        </button>
                                                        <button
                                                                onClick={() => handleDeleteSpace(deleteConfirmTag)}
                                                                disabled={isDeleting}
                                                                className="flex-1 py-2.5 px-4 bg-red-500 text-white rounded-xl font-medium hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                                                        >
                                                                {isDeleting ? (
                                                                        <>
                                                                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                                                Deleting...
                                                                        </>
                                                                ) : (
                                                                        'Delete All Posts'
                                                                )}
                                                        </button>
                                                </div>
                                        </div>
                                </div>
                        )}
                </div>
        );
}

function SpacesGridSkeleton() {
        return (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                        {Array.from({ length: 12 }).map((_, i) => (
                                <div key={i} className="bg-white rounded-xl border border-[var(--border)] p-3 flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-gray-100 animate-pulse shrink-0" />
                                        <div className="flex-1 space-y-1.5">
                                                <div className="h-4 w-20 bg-gray-100 animate-pulse rounded" />
                                                <div className="h-3 w-12 bg-gray-100 animate-pulse rounded" />
                                        </div>
                                </div>
                        ))}
                </div>
        );
}

export default SpacesGridClient;
