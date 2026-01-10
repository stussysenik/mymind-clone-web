/**
 * MyMind Clone - CardGridClient Component
 * 
 * Client wrapper for CardGrid that merges localStorage cards
 * with server-fetched cards. Handles client-side state.
 * 
 * @fileoverview Client-side card grid with localStorage integration, list view, and optimization
 */

'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { LayoutGrid, List as ListIcon } from 'lucide-react';
import type { Card } from '@/lib/types';
import { getLocalCards, deleteLocalCard, archiveLocalCard, unarchiveLocalCard } from '@/lib/local-storage';
import { supabaseBrowser } from '@/lib/supabase';
import { Card as CardComponent } from './Card';
import { CardDetailModal } from './CardDetailModal';

// =============================================================================
// PROPS
// =============================================================================

interface CardGridClientProps {
        /** Cards fetched from server (demo data or Supabase) */
        serverCards: Card[];
        /** Search query for filtering */
        searchQuery?: string;
        /** Type filter for instant client-side filtering */
        typeFilter?: string;
        /** Display mode: default (active), archive, or trash */
        mode?: 'default' | 'archive' | 'trash';
}

// =============================================================================
// COMPONENT
// =============================================================================

/**
 * Client-side wrapper that merges localStorage cards with server cards.
 */
export function CardGridClient({ serverCards, searchQuery, typeFilter, mode = 'default' }: CardGridClientProps) {
        const router = useRouter();
        const searchParams = useSearchParams();
        const [localCards, setLocalCards] = useState<Card[]>([]);
        const [mounted, setMounted] = useState(false);
        const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
        const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set());
        const [selectedCard, setSelectedCard] = useState<Card | null>(null);

        // Load localStorage cards on mount
        useEffect(() => {
                setMounted(true);
                setLocalCards(getLocalCards());
        }, []);

        // Listen for storage events to sync across tabs
        useEffect(() => {
                const handleStorage = (e: StorageEvent) => {
                        if (e.key === 'mymind_cards') {
                                setLocalCards(getLocalCards());
                        }
                };

                window.addEventListener('storage', handleStorage);
                return () => window.removeEventListener('storage', handleStorage);
        }, []);

        // Realtime updates from Supabase
        useEffect(() => {
                if (!supabaseBrowser) return;

                const channel = supabaseBrowser
                        .channel('realtime_cards')
                        .on('postgres_changes', { event: '*', schema: 'public', table: 'cards' }, () => {
                                router.refresh();
                        })
                        .subscribe();

                return () => {
                        supabaseBrowser?.removeChannel(channel);
                };
        }, [router]);

        /**
         * Handle card deletion.
         */
        const handleDelete = async (cardId: string) => {
                // Optimistically hide
                setDeletedIds(prev => new Set(prev).add(cardId));

                // Check if it's a local card (starts with 'local-' or 'mock-')
                if (cardId.startsWith('local-') || cardId.startsWith('mock-')) {
                        deleteLocalCard(cardId);
                        setLocalCards(prev => prev.filter(c => c.id !== cardId));
                        return;
                }

                // For Supabase cards, call the delete API
                try {
                        const url = mode === 'trash' ? `/api/cards/${cardId}?permanent=true` : `/api/cards/${cardId}`;
                        const response = await fetch(url, {
                                method: 'DELETE',
                        });

                        if (response.ok) {
                                router.refresh(); // Soft refresh
                        } else {
                                console.error('Failed to delete card');
                                // Revert optimistic delete if needed, but for now we assume success
                        }
                } catch (error) {
                        console.error('Delete error:', error);
                }
        };

        const handleRestore = async (cardId: string) => {
                // Optimistically hide
                setDeletedIds(prev => new Set(prev).add(cardId));

                try {
                        const response = await fetch(`/api/cards/${cardId}/restore`, {
                                method: 'POST',
                        });

                        if (response.ok) {
                                router.refresh();
                        }
                } catch (error) {
                        console.error('Restore error:', error);
                }
        };

        const handleArchive = async (cardId: string) => {
                setDeletedIds(prev => new Set(prev).add(cardId));

                if (cardId.startsWith('local-') || cardId.startsWith('mock-')) {
                        archiveLocalCard(cardId);
                        // Update local state to reflect change immediately without reload
                        setLocalCards(prev => prev.map(c => c.id === cardId ? { ...c, archivedAt: new Date().toISOString() } : c));
                        return;
                }

                try {
                        await fetch(`/api/cards/${cardId}/archive`, { method: 'POST' });
                        router.refresh();
                } catch (error) {
                        console.error('Archive error:', error);
                }
        };

        const handleUnarchive = async (cardId: string) => {
                setDeletedIds(prev => new Set(prev).add(cardId));

                if (cardId.startsWith('local-') || cardId.startsWith('mock-')) {
                        unarchiveLocalCard(cardId);
                        setLocalCards(prev => prev.map(c => c.id === cardId ? { ...c, archivedAt: null } : c));
                        return;
                }

                try {
                        await fetch(`/api/cards/${cardId}/unarchive`, { method: 'POST' });
                        router.refresh();
                } catch (error) {
                        console.error('Unarchive error:', error);
                }
        };

        // Memoize filtered cards to prevent expensive re-calculations
        const uniqueCards = useMemo(() => {
                // Merge local and server cards (local cards first)
                let allCards = [...localCards, ...serverCards];

                // Apply type filter FIRST (instant, no API call)
                // Map UI type names to database type values
                if (typeFilter) {
                        const typeMap: Record<string, string[]> = {
                                'article': ['article', 'webpages'],
                                'image': ['image', 'images'],
                                'video': ['video', 'videos'],
                                'product': ['product', 'products'],
                                'book': ['book', 'books'],
                                'note': ['note'],
                                'twitter': ['twitter', 'posts'],
                        };

                        // Check if typeFilter matches any mapped type
                        const matchTypes = Object.entries(typeMap)
                                .filter(([, aliases]) => aliases.includes(typeFilter))
                                .map(([key]) => key);

                        if (matchTypes.length > 0) {
                                allCards = allCards.filter(card => matchTypes.includes(card.type));
                        } else {
                                // Direct match as fallback
                                allCards = allCards.filter(card => card.type === typeFilter);
                        }
                }

                // Filter by search query if provided
                // checking params directly allows for instant client-side filtering without waiting for server roundtrip
                const currentQuery = searchParams.get('q') ?? searchQuery;

                let filtered = allCards;
                if (currentQuery) {
                        const query = currentQuery.toLowerCase();
                        // Handle #tag search client-side too
                        if (query.startsWith('#')) {
                                const tagQuery = query.slice(1);
                                filtered = allCards.filter(card =>
                                        card.tags.some(tag => tag.toLowerCase().includes(tagQuery))
                                );
                        } else {
                                filtered = allCards.filter(card =>
                                        card.title?.toLowerCase().includes(query) ||
                                        card.content?.toLowerCase().includes(query) ||
                                        card.tags.some(tag => tag.toLowerCase().includes(query))
                                );
                        }
                }

                // Remove duplicates by ID and filter out deleted IDs
                const unique: Card[] = [];
                const seenIds = new Set<string>();

                for (const card of filtered) {
                        // Filter by mode
                        const isArchived = !!card.archivedAt;
                        // Deleted status is handled by server-side fetching for Supabase, 
                        // but for 'local' cards we might need to check if we care about soft-delete property if we added it?
                        // Currently local cards just delete from array.

                        let shouldShow = false;
                        if (mode === 'archive') {
                                shouldShow = isArchived;
                        } else if (mode === 'trash') {
                                // For trash, Supabase returns deleted items. 
                                // Local cards are permanently deleted so they won't show here unless we implemented soft delete for local.
                                // We'll just show what's passed (serverCards) plus any local cards if we had soft delete.
                                shouldShow = true; // serverCards are already filtered by mode='trash'
                        } else {
                                // Default mode: show only NON-archived
                                shouldShow = !isArchived;
                        }

                        if (shouldShow && !seenIds.has(card.id) && !deletedIds.has(card.id)) {
                                seenIds.add(card.id);
                                unique.push(card);
                        }
                }

                return unique;
        }, [localCards, serverCards, searchQuery, deletedIds, mode, typeFilter, searchParams]);

        // Optimistic rendering: Show server cards immediately while hydrating.
        // We removed the (!mounted) check to prevent the "double loading" effect (Server Skeleton -> Client Skeleton -> Content).
        // Since localCards are empty initially, hydration logic is safe.


        // Empty state (only shown after mount confirms there's truly nothing)
        if (uniqueCards.length === 0) {
                return (
                        <div className="flex flex-col items-center justify-center py-32 text-center animate-in fade-in duration-500">
                                <div className="relative mb-6">
                                        <div className="absolute inset-0 bg-[var(--accent-primary)]/20 blur-xl rounded-full"></div>
                                        <div className="relative p-6 rounded-2xl bg-white shadow-xl border border-gray-100">
                                                <svg
                                                        className="h-10 w-10 text-[var(--accent-primary)]"
                                                        fill="none"
                                                        stroke="currentColor"
                                                        viewBox="0 0 24 24"
                                                >
                                                        <path
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                strokeWidth={1.5}
                                                                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                                                        />
                                                </svg>
                                        </div>
                                </div>
                                <h3 className="mb-2 text-2xl font-serif text-[var(--foreground)]">
                                        Your mind is waiting
                                </h3>
                                <p className="text-gray-500 max-w-md mx-auto mb-8 leading-relaxed">
                                        {searchQuery
                                                ? `We couldn't find anything matching "${searchQuery}". Try a broader search or explore your spaces.`
                                                : (() => {
                                                        const type = searchParams.get('type');
                                                        const label = type ? (
                                                                type === 'webpages' ? 'websites' :
                                                                        type === 'videos' ? 'videos' :
                                                                                type === 'images' ? 'images' :
                                                                                        type === 'articles' ? 'articles' :
                                                                                                type === 'products' ? 'products' :
                                                                                                        type === 'books' ? 'books' : 'items'
                                                        ) : 'items';
                                                        return `This space is empty using the current filter. Save some ${label} to fill your creative brain.`;
                                                })()
                                        }
                                </p>
                        </div>
                );
        }

        return (
                <div className="w-full">
                        {/* Controls Bar */}
                        <div className="flex items-center justify-between mb-6">
                                {/* Items count */}
                                <p className="text-xs text-[var(--foreground-muted)]">
                                        {mounted && localCards.length > 0
                                                ? `${localCards.length} saved locally • `
                                                : ''}
                                        {uniqueCards.length} items
                                </p>

                                {/* View Toggle */}
                                <div className="flex items-center bg-gray-100 p-1 rounded-lg">
                                        <button
                                                onClick={() => setViewMode('grid')}
                                                className={`p-1.5 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-white shadow-sm text-black' : 'text-gray-500 hover:text-black'
                                                        }`}
                                                aria-label="Grid View"
                                        >
                                                <LayoutGrid className="h-4 w-4" />
                                        </button>
                                        <button
                                                onClick={() => setViewMode('list')}
                                                className={`p-1.5 rounded-md transition-colors ${viewMode === 'list' ? 'bg-white shadow-sm text-black' : 'text-gray-500 hover:text-black'
                                                        }`}
                                                aria-label="List View"
                                        >
                                                <ListIcon className="h-4 w-4" />
                                        </button>
                                </div>
                        </div>

                        {/* Layouts */}
                        {viewMode === 'grid' ? (
                                <div className="columns-1 gap-4 sm:columns-2 lg:columns-3 xl:columns-4 2xl:columns-5">
                                        {uniqueCards.map((card) => (
                                                <div key={card.id} className="mb-4 break-inside-avoid">
                                                        <CardComponent
                                                                card={card}
                                                                onDelete={() => handleDelete(card.id)}
                                                                onRestore={mode === 'trash' ? () => handleRestore(card.id) : undefined}
                                                                onClick={() => setSelectedCard(card)}
                                                        />
                                                </div>
                                        ))}
                                </div>
                        ) : (
                                <div className="flex flex-col gap-4 max-w-3xl mx-auto">
                                        {uniqueCards.map((card) => (
                                                /* List View Item - Reusing CardComponent effectively but wrapped to limit width */
                                                <div key={card.id} className="w-full">
                                                        <CardComponent
                                                                card={card}
                                                                onDelete={() => handleDelete(card.id)}
                                                                onRestore={mode === 'trash' ? () => handleRestore(card.id) : undefined}
                                                                onClick={() => setSelectedCard(card)}
                                                        />
                                                </div>
                                        ))}
                                </div>
                        )}
                        {/* Detail Modal */}
                        <CardDetailModal
                                card={selectedCard}
                                isOpen={!!selectedCard}
                                onClose={() => setSelectedCard(null)}
                                onDelete={(id) => {
                                        handleDelete(id);
                                        setSelectedCard(null);
                                }}
                                onRestore={
                                        mode === 'trash' ? (id) => {
                                                handleRestore(id);
                                                setSelectedCard(null);
                                        } : mode === 'archive' ? (id) => {
                                                handleUnarchive(id);
                                                setSelectedCard(null);
                                        } : undefined
                                }
                                onArchive={
                                        mode === 'default' ? (id) => {
                                                handleArchive(id);
                                                setSelectedCard(null);
                                        } : undefined
                                }
                                availableSpaces={Array.from(new Set(uniqueCards.flatMap(c => c.tags))).sort()}
                        />
                </div>
        );
}

export default CardGridClient;
