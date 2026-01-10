/**
 * MyMind Clone - CardGrid Component
 * 
 * Server Component that fetches cards and passes to client wrapper.
 * The client wrapper merges localStorage cards with server data.
 * 
 * @fileoverview Server Component for card grid display
 */

import { getDemoCards } from '@/lib/demo-data';
import { fetchCards, searchCards, isSupabaseConfigured } from '@/lib/supabase';
import { rowToCard } from '@/lib/types';
import { CardGridClient } from './CardGridClient';

// =============================================================================
// PROPS
// =============================================================================

interface CardGridProps {
        /** Search query to filter cards */
        searchQuery?: string;
        /** Type filter */
        typeFilter?: string;
}

// =============================================================================
// COMPONENT
// =============================================================================

/**
 * Server Component that fetches cards and renders via client wrapper.
 */
export async function CardGrid({ searchQuery, typeFilter }: CardGridProps) {
        // Fetch cards from server
        let cards;

        if (isSupabaseConfigured()) {
                const rows = searchQuery
                        ? await searchCards(searchQuery)
                        : await fetchCards();
                cards = rows?.map(rowToCard) ?? [];
        } else {
                cards = getDemoCards(); // Always get full demo data, client will filter
        }

        // Apply type filter on server side
        if (typeFilter) {
                cards = cards.filter((card) => card.type === typeFilter);
        }

        // Pass to client wrapper which handles localStorage merge
        return <CardGridClient serverCards={cards} searchQuery={searchQuery} />;
}

export default CardGrid;
