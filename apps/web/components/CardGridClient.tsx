/**
 * MyMind Clone - CardGridClient Component
 *
 * Client wrapper for CardGrid that merges localStorage cards
 * with server-fetched cards. Handles client-side state.
 *
 * Now uses PLATFORM-BASED filtering instead of type-based filtering.
 *
 * @fileoverview Client-side card grid with localStorage integration, list view, and optimization
 */

'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { LayoutGrid, List as ListIcon, Sparkles, X, Plus, Minus } from 'lucide-react';
import type { Card } from '@/lib/types';
import { getLocalCards, deleteLocalCard, archiveLocalCard, unarchiveLocalCard } from '@/lib/local-storage';
import { supabaseBrowser } from '@/lib/supabase';
import { hasMatchingColor } from '@/lib/color-utils';
import { detectPlatform, Platform } from '@/lib/platforms';
import { Card as CardComponent } from './Card';
import { CardDetailModal } from './CardDetailModal';
import { TagScroller } from './TagScroller';

// =============================================================================
// PROPS
// =============================================================================

interface CardGridClientProps {
        /** Cards fetched from server (demo data or Supabase) */
        serverCards: Card[];
        /** Search query for filtering */
        searchQuery?: string;
        /** Platform filter for instant client-side filtering (youtube, twitter, websites, images, notes, etc.) */
        platformFilter?: string;
        /** @deprecated Use platformFilter instead */
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
export function CardGridClient({ serverCards, searchQuery, platformFilter, typeFilter, mode = 'default' }: CardGridClientProps) {
        // Use platformFilter (new) or fall back to typeFilter (deprecated)
        const activeFilter = platformFilter || typeFilter;
        const router = useRouter();
        const searchParams = useSearchParams();
        const [localCards, setLocalCards] = useState<Card[]>([]);
        const [mounted, setMounted] = useState(false);
        const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
        const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set());
        const [selectedCard, setSelectedCard] = useState<Card | null>(null);

        // Card size slider state (1 = default, range: 0.7 to 1.5)
        // Maps to column counts: smaller value = more columns (compact), larger = fewer columns (expanded)
        const [cardSize, setCardSize] = useState<number>(1);

        // Similarity Search State
        const similarityId = searchParams.get('similar');
        const [similarCards, setSimilarCards] = useState<Card[]>([]);
        const [isCreatingSpace, setIsCreatingSpace] = useState(false);
        const [newSpaceName, setNewSpaceName] = useState('');

        // Smart Search State
        const searchMode = searchParams.get('mode');
        const currentQuery = searchParams.get('q') ?? searchQuery;
        const [smartResults, setSmartResults] = useState<Card[]>([]);

        // Color Search State
        const colorFilter = searchParams.get('color');

        // Fetch similar cards when similarityId changes
        useEffect(() => {
                if (!similarityId) {
                        setSimilarCards([]);
                        return;
                }

                const fetchSimilar = async () => {
                        try {
                                const res = await fetch(`/api/similar?cardId=${similarityId}&topK=20`);
                                const data = await res.json();
                                if (data.success && data.cards) {
                                        setSimilarCards(data.cards);
                                }
                        } catch (err) {
                                console.error('Failed to fetch similar cards:', err);
                        }
                };

                fetchSimilar();
        }, [similarityId]);

        // Smart Search Fetching
        useEffect(() => {
                if (searchMode !== 'smart' || !currentQuery) {
                        setSmartResults([]);
                        return;
                }

                const fetchSmart = async () => {
                        try {
                                const res = await fetch('/api/search', {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ query: currentQuery, mode: 'smart', topK: 50 })
                                });
                                const data = await res.json();
                                if (data.success && data.cards) {
                                        setSmartResults(data.cards);
                                }
                        } catch (err) {
                                console.error('Failed to smart search:', err);
                        }
                };

                fetchSmart();
        }, [searchMode, currentQuery]);





        // Create Space from Similar Cards
        const handleCreateSpaceFromSimilar = async () => {
                if (!newSpaceName.trim() || similarCards.length === 0) return;

                const tagName = newSpaceName.trim().toLowerCase().replace(/\s+/g, '-');

                // Optimistic UI update not needed as we redirect

                // Batch update tags for all visible similar cards
                // We'll do this sequentially for simplicity, or could add a bulk API endpoint later
                try {
                        await Promise.all(similarCards.map(card => {
                                const newTags = [...(card.tags || []), tagName];
                                // Dedup tags just in case
                                const uniqueTags = Array.from(new Set(newTags));

                                return fetch(`/api/cards/${card.id}`, {
                                        method: 'PATCH',
                                        body: JSON.stringify({ tags: uniqueTags })
                                });
                        }));

                        // Navigate to the new space
                        router.push(`/?q=%23${tagName}`);
                } catch (err) {
                        console.error('Failed to create space:', err);
                }
        };

        // Load localStorage cards and card size preference on mount
        useEffect(() => {
                setMounted(true);
                setLocalCards(getLocalCards());
                // Load card size preference
                const savedSize = localStorage.getItem('mymind_card_size');
                if (savedSize) {
                        const parsed = parseFloat(savedSize);
                        if (!isNaN(parsed) && parsed >= 0.7 && parsed <= 1.5) {
                                setCardSize(parsed);
                        }
                }
        }, []);

        // Save card size to localStorage when changed
        useEffect(() => {
                if (mounted) {
                        localStorage.setItem('mymind_card_size', String(cardSize));
                }
        }, [cardSize, mounted]);

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

        // Helper to get platform for a card (from metadata or detect from URL)
        const getCardPlatform = (card: Card): Platform => {
                // First check metadata.platform (set at save time)
                if (card.metadata?.platform) {
                        return card.metadata.platform as Platform;
                }
                // Fall back to detecting from URL
                if (card.url) {
                        return detectPlatform(card.url);
                }
                return 'unknown';
        };

        // Memoize filtered cards to prevent expensive re-calculations
        const uniqueCards = useMemo(() => {
                // Match based on similarity mode or regular mode
                let allCards: Card[] = [];

                if (similarityId) {
                        allCards = similarCards;
                } else if (searchMode === 'smart' && smartResults.length > 0) {
                        // In smart mode, we use the fetched results directly
                        allCards = smartResults;
                } else {
                        // Merge local and server cards (local cards first)
                        allCards = [...localCards, ...serverCards];
                }

                // Apply platform filter FIRST (instant, no API call)
                if (activeFilter) {
                        allCards = allCards.filter(card => {
                                const cardPlatform = getCardPlatform(card);

                                // Handle fallback category filters
                                if (activeFilter === 'websites') {
                                        // "Websites" = unknown platform + article type
                                        return cardPlatform === 'unknown' && card.type === 'article';
                                }
                                if (activeFilter === 'images') {
                                        return card.type === 'image';
                                }
                                if (activeFilter === 'notes') {
                                        return card.type === 'note';
                                }

                                // Handle legacy type-based filters for backwards compatibility
                                if (activeFilter === 'article') {
                                        return cardPlatform === 'unknown' && card.type === 'article';
                                }
                                if (activeFilter === 'image') {
                                        return card.type === 'image';
                                }
                                if (activeFilter === 'video') {
                                        return card.type === 'video';
                                }
                                if (activeFilter === 'social') {
                                        return card.type === 'social';
                                }
                                if (activeFilter === 'movie') {
                                        return card.type === 'movie';
                                }
                                if (activeFilter === 'book') {
                                        return card.type === 'book';
                                }
                                if (activeFilter === 'product') {
                                        return card.type === 'product';
                                }

                                // Platform-specific filter (youtube, twitter, instagram, etc.)
                                return cardPlatform === activeFilter;
                        });
                }

                // Apply color filter if present
                if (colorFilter) {
                        allCards = allCards.filter(card =>
                                hasMatchingColor(card.metadata?.colors, colorFilter, 30)
                        );
                }

                // Filter by search query if provided (ONLY for exact mode)
                // In smart mode, the API already did the filtering/ranking
                const shouldFilterLocally = searchMode !== 'smart' && currentQuery;

                let filtered = allCards;
                if (shouldFilterLocally && currentQuery) {
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
        }, [localCards, serverCards, searchQuery, deletedIds, mode, activeFilter, searchParams, similarityId, similarCards, searchMode, smartResults, currentQuery, colorFilter]);


        // Calculate platform counts for dynamic TagScroller pills (before platform filter is applied)
        const platformCounts = useMemo(() => {
                // Merge local and server cards to get all cards
                let allCards: Card[] = [];

                if (similarityId) {
                        allCards = similarCards;
                } else if (searchMode === 'smart' && smartResults.length > 0) {
                        allCards = smartResults;
                } else {
                        allCards = [...localCards, ...serverCards];
                }

                // Apply color filter if present (but NOT platform filter)
                if (colorFilter) {
                        allCards = allCards.filter(card =>
                                hasMatchingColor(card.metadata?.colors, colorFilter, 30)
                        );
                }

                // Filter by mode
                allCards = allCards.filter(card => {
                        const isArchived = !!card.archivedAt;
                        if (mode === 'archive') return isArchived;
                        if (mode === 'trash') return true; // serverCards already filtered
                        return !isArchived;
                });

                // Remove duplicates and deleted
                const seenIds = new Set<string>();
                const unique = allCards.filter(card => {
                        if (seenIds.has(card.id) || deletedIds.has(card.id)) return false;
                        seenIds.add(card.id);
                        return true;
                });

                // Count by platform (for platform pills like YouTube, Twitter, etc.)
                // Also count special categories: images, notes (by type, not platform)
                const counts: Record<string, number> = {};
                for (const card of unique) {
                        // Handle special non-platform categories by type
                        if (card.type === 'image') {
                                counts['image'] = (counts['image'] || 0) + 1;
                                continue;
                        }
                        if (card.type === 'note') {
                                counts['note'] = (counts['note'] || 0) + 1;
                                continue;
                        }

                        // For all other cards, count by platform
                        const platform = getCardPlatform(card);
                        counts[platform] = (counts[platform] || 0) + 1;
                }
                return counts;
        }, [localCards, serverCards, deletedIds, mode, colorFilter, similarityId, similarCards, searchMode, smartResults]);

        // Sync selected card with updated server cards (for realtime/AI updates)
        // Must be AFTER uniqueCards is defined
        useEffect(() => {
                if (selectedCard) {
                        const updated = uniqueCards.find(c => c.id === selectedCard.id);
                        if (updated && updated !== selectedCard) {
                                setSelectedCard(updated);
                        }
                }
        }, [uniqueCards, selectedCard]);

        // Calculate masonry styles based on card size using inline styles
        // This bypasses Tailwind CSS generation issues with dynamic responsive classes
        // cardSize 0.7 = compact (more columns), 1.0 = default, 1.5 = expanded (fewer columns)
        const [windowWidth, setWindowWidth] = useState(0);

        // Track window resize for responsive column calculation
        // Set actual width on mount — before mount, CSS classes handle columns
        useEffect(() => {
                setWindowWidth(window.innerWidth);
                const handleResize = () => setWindowWidth(window.innerWidth);
                window.addEventListener('resize', handleResize);
                return () => window.removeEventListener('resize', handleResize);
        }, []);

        // Calculate column count based on viewport and card size
        // Returns null before mount — CSS columns are used as SSR fallback
        const masonryStyle = useMemo(() => {
                if (windowWidth === 0) return null; // Not mounted yet, use CSS fallback

                // Base columns per breakpoint (default at cardSize = 1.0)
                let baseColumns: number;
                if (windowWidth < 640) baseColumns = 1;        // mobile
                else if (windowWidth < 768) baseColumns = 2;   // sm
                else if (windowWidth < 1024) baseColumns = 3;  // md
                else if (windowWidth < 1280) baseColumns = 4;  // lg
                else if (windowWidth < 1536) baseColumns = 5;  // xl
                else baseColumns = 6;                          // 2xl

                // Adjust columns based on card size (subtle adjustment)
                // cardSize 0.7 = +1 column, cardSize 1.5 = -1 column
                const columnAdjustment = Math.round((1 - cardSize) * 2);
                const columns = Math.max(1, Math.min(8, baseColumns + columnAdjustment));

                // Gap scales inversely with card size (compact = tighter gap)
                const gap = cardSize <= 0.9 ? 12 : cardSize >= 1.2 ? 20 : 16;

                return {
                        columnCount: columns,
                        columnGap: `${gap}px`,
                };
        }, [windowWidth, cardSize]);

        // Optimistic rendering: Show server cards immediately while hydrating.
        // We removed the (!mounted) check to prevent the "double loading" effect (Server Skeleton -> Client Skeleton -> Content).
        // Since localCards are empty initially, hydration logic is safe.


        return (
                <div className="w-full" data-testid="card-grid">
                        {/* Dynamic Platform Pills */}
                        <div className="border-b border-[var(--border)] mb-6">
                                <TagScroller platformCounts={platformCounts} />
                        </div>

                        {/* Similarity Mode Banner */}
                        {similarityId && (
                                <div className="mb-8 p-6 bg-purple-50 rounded-2xl border border-purple-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 animate-in slide-in-from-top-4">
                                        <div>
                                                <h3 className="text-purple-900 font-serif text-xl flex items-center gap-2 mb-1">
                                                        <Sparkles className="w-5 h-5 text-purple-600" />
                                                        Similar Minds
                                                </h3>
                                                <p className="text-purple-700/80 text-sm">
                                                        {uniqueCards.length > 0
                                                                ? `Showing ${uniqueCards.length} items semantically related to your selection`
                                                                : 'Searching for similar items...'}
                                                </p>
                                        </div>

                                        <div className="flex items-center gap-3 w-full md:w-auto">
                                                {isCreatingSpace ? (
                                                        <div className="flex items-center gap-2 flex-1 md:flex-none">
                                                                <input
                                                                        autoFocus
                                                                        type="text"
                                                                        className="px-3 py-2 rounded-lg border border-purple-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                                                                        placeholder="Name your space..."
                                                                        value={newSpaceName}
                                                                        onChange={e => setNewSpaceName(e.target.value)}
                                                                        onKeyDown={e => {
                                                                                if (e.key === 'Enter') handleCreateSpaceFromSimilar();
                                                                                if (e.key === 'Escape') setIsCreatingSpace(false);
                                                                        }}
                                                                />
                                                                <button
                                                                        onClick={handleCreateSpaceFromSimilar}
                                                                        className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors"
                                                                >
                                                                        Create
                                                                </button>
                                                                <button
                                                                        onClick={() => setIsCreatingSpace(false)}
                                                                        className="p-2 text-purple-600 hover:bg-purple-100 rounded-lg transition-colors"
                                                                >
                                                                        <X className="w-4 h-4" />
                                                                </button>
                                                        </div>
                                                ) : (
                                                        <button
                                                                onClick={() => setIsCreatingSpace(true)}
                                                                className="flex items-center gap-2 px-4 py-2 bg-white text-purple-700 border border-purple-200 rounded-lg text-sm font-medium hover:bg-purple-50 hover:border-purple-300 transition-all shadow-sm"
                                                        >
                                                                <Plus className="w-4 h-4" />
                                                                Create Space from These
                                                        </button>
                                                )}

                                                <button
                                                        onClick={() => router.push('/')}
                                                        className="px-4 py-2 text-gray-500 hover:text-gray-900 text-sm font-medium transition-colors"
                                                >
                                                        Clear
                                                </button>
                                        </div>
                                </div>
                        )}

                        {/* Smart Search Banner */}
                        {searchMode === 'smart' && currentQuery && !similarityId && (
                                <div className="mb-8 flex items-center justify-between animate-in fade-in slide-in-from-top-2">
                                        <div className="flex items-center gap-3">
                                                <div className="p-2 bg-purple-100/50 rounded-full">
                                                        <Sparkles className="w-4 h-4 text-purple-600" />
                                                </div>
                                                <div>
                                                        <h3 className="text-gray-900 font-medium text-lg leading-tight">
                                                                Smart Results for <span className="text-purple-700 italic">"{currentQuery}"</span>
                                                        </h3>
                                                        <p className="text-gray-500 text-sm">
                                                                {uniqueCards.length > 0
                                                                        ? `Found ${uniqueCards.length} matches based on meaning`
                                                                        : 'Analyzing meaning...'}
                                                        </p>
                                                </div>
                                        </div>
                                        <button
                                                onClick={() => {
                                                        const params = new URLSearchParams(searchParams.toString());
                                                        params.delete('mode');
                                                        router.push(`?${params.toString()}`);
                                                }}
                                                className="px-3 py-1.5 text-gray-400 hover:text-gray-900 text-xs font-medium border border-transparent hover:border-gray-200 rounded-lg transition-all"
                                        >
                                                Exit Smart Mode
                                        </button>
                                </div>
                        )}

                        {/* Controls Bar (Only show if we have cards) */}
                        {uniqueCards.length > 0 && (
                                <div className="flex items-center justify-between mb-6">
                                        {/* Items count */}
                                        <p className="text-xs text-[var(--foreground-muted)]">
                                                {mounted && localCards.length > 0 && !similarityId
                                                        ? `${localCards.length} saved locally • `
                                                        : ''}
                                                {uniqueCards.length} items
                                        </p>

                                        <div className="flex items-center gap-4">
                                                {/* Card Size Slider (only show in grid view) */}
                                                {viewMode === 'grid' && (
                                                        <div className="flex items-center gap-1.5 sm:gap-2">
                                                                <Minus className="h-3 w-3 text-[var(--foreground-muted)]" />
                                                                <input
                                                                        type="range"
                                                                        min="0.7"
                                                                        max="1.5"
                                                                        step="0.1"
                                                                        value={cardSize}
                                                                        onChange={(e) => setCardSize(parseFloat(e.target.value))}
                                                                        className="card-size-slider"
                                                                        aria-label="Card size"
                                                                        title={`Card size: ${cardSize < 0.9 ? 'Compact' : cardSize > 1.2 ? 'Expanded' : 'Default'}`}
                                                                />
                                                                <Plus className="h-3 w-3 text-[var(--foreground-muted)]" />
                                                        </div>
                                                )}

                                                {/* View Toggle */}
                                                <div className="flex items-center bg-[var(--surface-secondary)] p-1 rounded-lg">
                                                        <button
                                                                onClick={() => setViewMode('grid')}
                                                                className={`p-1.5 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-[var(--surface-card)] shadow-sm text-[var(--foreground)]' : 'text-[var(--foreground-muted)] hover:text-[var(--foreground)]'
                                                                        }`}
                                                                aria-label="Grid View"
                                                        >
                                                                <LayoutGrid className="h-4 w-4" />
                                                        </button>
                                                        <button
                                                                onClick={() => setViewMode('list')}
                                                                className={`p-1.5 rounded-md transition-colors ${viewMode === 'list' ? 'bg-[var(--surface-card)] shadow-sm text-[var(--foreground)]' : 'text-[var(--foreground-muted)] hover:text-[var(--foreground)]'
                                                                        }`}
                                                                aria-label="List View"
                                                        >
                                                                <ListIcon className="h-4 w-4" />
                                                        </button>
                                                </div>
                                        </div>
                                </div>
                        )}

                        {/* Empty State / Grid */}
                        {uniqueCards.length === 0 ? (
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
                                                {similarityId ? 'No similar cards found' : 'Your mind is waiting'}
                                        </h3>
                                        <p className="text-gray-500 max-w-md mx-auto mb-8 leading-relaxed">
                                                {searchQuery
                                                        ? `We couldn't find anything matching "${searchQuery}". Try a broader search or explore your spaces.`
                                                        : similarityId
                                                                ? "We analyzed the vectors but couldn't find anything similar enough yet. Try enriching more cards!"
                                                                : (() => {
                                                                        const filter = searchParams.get('platform') || searchParams.get('type');
                                                                        // Get a human-readable label for the filter
                                                                        const label = filter ? (
                                                                                filter === 'websites' ? 'websites' :
                                                                                filter === 'images' ? 'images' :
                                                                                filter === 'notes' ? 'notes' :
                                                                                filter === 'youtube' ? 'YouTube videos' :
                                                                                filter === 'twitter' ? 'tweets' :
                                                                                filter === 'instagram' ? 'Instagram posts' :
                                                                                filter === 'reddit' ? 'Reddit posts' :
                                                                                filter === 'letterboxd' ? 'Letterboxd reviews' :
                                                                                filter === 'goodreads' ? 'Goodreads books' :
                                                                                'items'
                                                                        ) : 'items';
                                                                        return `This space is empty using the current filter. Save some ${label} to fill your creative brain.`;
                                                                })()
                                                }
                                        </p>
                                </div>
                        ) : (
                                <>
                                        {viewMode === 'grid' ? (
                                                <div
                                                className={masonryStyle ? 'masonry-golden' : 'columns-1 gap-4 sm:columns-2 lg:columns-3 xl:columns-4 2xl:columns-5'}
                                                style={masonryStyle ?? undefined}
                                        >
                                                        {uniqueCards.map((card) => (
                                                                <div key={card.id} className="mb-4 break-inside-avoid">
                                                                        <CardComponent
                                                                                card={card}
                                                                                onDelete={() => handleDelete(card.id)}
                                                                                onArchive={mode === 'default' ? () => handleArchive(card.id) : undefined}
                                                                                onRestore={mode === 'trash' ? () => handleRestore(card.id) : mode === 'archive' ? () => handleUnarchive(card.id) : undefined}
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
                                                                                onArchive={mode === 'default' ? () => handleArchive(card.id) : undefined}
                                                                                onRestore={mode === 'trash' ? () => handleRestore(card.id) : mode === 'archive' ? () => handleUnarchive(card.id) : undefined}
                                                                                onClick={() => setSelectedCard(card)}
                                                                        />
                                                                </div>
                                                        ))}
                                                </div>
                                        )}
                                </>
                        )}

                        {/* Detail Modal */}
                        <CardDetailModal
                                key={selectedCard?.id ?? 'empty'}
                                card={selectedCard}
                                isOpen={!!selectedCard}
                                onClose={() => {
                                        router.refresh();
                                        setSelectedCard(null);
                                }}
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
