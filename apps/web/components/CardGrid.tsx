/**
 * MyMind Clone - CardGrid Component
 * 
 * Server Component that fetches cards and passes to client wrapper.
 * The client wrapper merges localStorage cards with server data.
 * 
 * @fileoverview Server Component for card grid display
 */

import { getDemoCards } from '@/lib/demo-data';
import { fetchCards, searchCards, fetchArchivedCards, fetchDeletedCards, isSupabaseConfigured } from '@/lib/supabase';
import { rowToCard } from '@/lib/types';
import { CardGridClient } from './CardGridClient';

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

        if (isSupabaseConfigured()) {
                let rows;
                if (searchQuery) {
                        rows = await searchCards(searchQuery);
                        // TODO: Filter locally if search results include mixed types and we want strictly archive
                } else if (mode === 'archive') {
                        rows = await fetchArchivedCards();
                } else if (mode === 'trash') {
                        rows = await fetchDeletedCards();
                } else {
                        rows = await fetchCards();
                }
                cards = rows?.map(rowToCard) ?? [];
        } else {
                cards = getDemoCards(); // Always get full demo data, client will filter
        }

        // Pass to client wrapper which handles localStorage merge and client-side filtering
        // Client-side filtering provides instant response for platform filters
        return <CardGridClient serverCards={cards} searchQuery={searchQuery} platformFilter={platformFilter || typeFilter} mode={mode} />;
}

export default CardGrid;
