/**
 * MyMind Clone - CardGrid Component
 * 
 * Server Component that fetches cards and passes to client wrapper.
 * The client wrapper merges localStorage cards with server data.
 * 
 * @fileoverview Server Component for card grid display
 */

import { getDemoCards } from '@/lib/demo-data';
import { fetchCardsPaginated, searchCards, fetchArchivedCards, fetchDeletedCards, isSupabaseConfigured } from '@/lib/supabase';
import { rowToCard } from '@/lib/types';
import { CardGridClient } from './CardGridClient';

const PAGE_SIZE = 20;

// =============================================================================
// PROPS
// =============================================================================

interface CardGridProps {
        /** Search query to filter cards */
        searchQuery?: string;
        /** Platform filter (youtube, twitter, websites, images, notes, etc.) */
        platformFilter?: string;
        /** @deprecated Use platformFilter instead */
        typeFilter?: string;
        /** View mode */
        mode?: 'default' | 'archive' | 'trash';
}

// =============================================================================
// COMPONENT
// =============================================================================

/**
 * Server Component that fetches cards and renders via client wrapper.
 */
export async function CardGrid({ searchQuery, platformFilter, typeFilter, mode = 'default' }: CardGridProps) {
        // Fetch cards from server
        let cards;
        let totalCount = 0;
        let hasMore = false;

        if (isSupabaseConfigured()) {
                if (searchQuery) {
                        // Search doesn't use pagination (returns all matches up to limit)
                        const rows = await searchCards(searchQuery);
                        cards = rows?.map(rowToCard) ?? [];
                        totalCount = cards.length;
                } else if (mode === 'archive') {
                        const rows = await fetchArchivedCards();
                        cards = rows?.map(rowToCard) ?? [];
                        totalCount = cards.length;
                } else if (mode === 'trash') {
                        const rows = await fetchDeletedCards();
                        cards = rows?.map(rowToCard) ?? [];
                        totalCount = cards.length;
                } else {
                        // Default mode: use pagination
                        const result = await fetchCardsPaginated(undefined, PAGE_SIZE, 1);
                        cards = result?.data.map(rowToCard) ?? [];
                        totalCount = result?.total ?? 0;
                        hasMore = result?.hasMore ?? false;
                }
        } else {
                cards = getDemoCards(); // Always get full demo data, client will filter
                totalCount = cards.length;
        }

        // Pass to client wrapper which handles localStorage merge and client-side filtering
        // Client-side filtering provides instant response for platform filters
        return (
                <CardGridClient
                        serverCards={cards}
                        searchQuery={searchQuery}
                        platformFilter={platformFilter || typeFilter}
                        mode={mode}
                        initialTotalCount={totalCount}
                        initialHasMore={hasMore}
                        pageSize={PAGE_SIZE}
                />
        );
}

export default CardGrid;
