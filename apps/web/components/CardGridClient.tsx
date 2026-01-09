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
import { useRouter } from 'next/navigation';
import { LayoutGrid, List as ListIcon } from 'lucide-react';
import type { Card } from '@/lib/types';
import { getLocalCards, deleteLocalCard } from '@/lib/local-storage';
import { Card as CardComponent } from './Card';

// =============================================================================
// PROPS
// =============================================================================

interface CardGridClientProps {
        /** Cards fetched from server (demo data or Supabase) */
        serverCards: Card[];
        /** Search query for filtering */
        searchQuery?: string;
}

// =============================================================================
// COMPONENT
// =============================================================================

/**
 * Client-side wrapper that merges localStorage cards with server cards.
 */
export function CardGridClient({ serverCards, searchQuery }: CardGridClientProps) {
        const router = useRouter();
        const [localCards, setLocalCards] = useState<Card[]>([]);
        const [mounted, setMounted] = useState(false);
        const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
        const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set());

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
                        const response = await fetch(`/api/cards/${cardId}`, {
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

        // Memoize filtered cards to prevent expensive re-calculations
        const uniqueCards = useMemo(() => {
                // Merge local and server cards (local cards first)
                const allCards = [...localCards, ...serverCards];

                // Filter by search query if provided
                let filtered = allCards;
                if (searchQuery) {
                        const query = searchQuery.toLowerCase();
                        filtered = allCards.filter(card =>
                                card.title?.toLowerCase().includes(query) ||
                                card.content?.toLowerCase().includes(query) ||
                                card.tags.some(tag => tag.toLowerCase().includes(query))
                        );
                }

                // Remove duplicates by ID and filter out deleted IDs
                const unique: Card[] = [];
                const seenIds = new Set<string>();

                for (const card of filtered) {
                        if (!seenIds.has(card.id) && !deletedIds.has(card.id)) {
                                seenIds.add(card.id);
                                unique.push(card);
                        }
                }

                return unique;
        }, [localCards, serverCards, searchQuery, deletedIds]);

        // Empty state
        if (uniqueCards.length === 0) {
                return (
                        <div className="flex flex-col items-center justify-center py-20">
                                <div className="mb-4 p-4 rounded-full bg-gray-100">
                                        <svg
                                                className="h-8 w-8 text-gray-400"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                        >
                                                <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={1.5}
                                                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                                                />
                                        </svg>
                                </div>
                                <h3 className="mb-1 text-lg font-medium text-[var(--foreground)]">
                                        No cards found
                                </h3>
                                <p className="text-sm text-[var(--foreground-muted)]">
                                        {searchQuery
                                                ? `No results for "${searchQuery}"`
                                                : 'Save something to get started'}
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
                                                        <CardComponent card={card} onDelete={() => handleDelete(card.id)} />
                                                </div>
                                        ))}
                                </div>
                        ) : (
                                <div className="flex flex-col gap-4 max-w-3xl mx-auto">
                                        {uniqueCards.map((card) => (
                                                /* List View Item - Reusing CardComponent effectively but wrapped to limit width */
                                                <div key={card.id} className="w-full">
                                                        <CardComponent card={card} onDelete={() => handleDelete(card.id)} />
                                                </div>
                                        ))}
                                </div>
                        )}
                </div>
        );
}

export default CardGridClient;
