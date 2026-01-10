/**
 * MyMind Clone - Search API
 * 
 * Search cards with query, type, and tag filters.
 * Uses Supabase full-text search when configured.
 * 
 * @fileoverview GET /api/search endpoint
 */

import { NextRequest, NextResponse } from 'next/server';
import { searchCards, searchCardsByTag, isSupabaseConfigured } from '@/lib/supabase';
import { expandSearchQuery } from '@/lib/ai';
import { getDemoCards } from '@/lib/demo-data';
import { rowToCard } from '@/lib/types';
import type { Card } from '@/lib/types';

// =============================================================================
// TYPES
// =============================================================================

interface SearchResponse {
        success: boolean;
        cards: Card[];
        total: number;
        error?: string;
}

// =============================================================================
// HANDLER
// =============================================================================

export async function GET(request: NextRequest): Promise<NextResponse<SearchResponse>> {
        try {
                const { searchParams } = new URL(request.url);
                let query = searchParams.get('q') ?? '';
                const type = searchParams.get('type');
                const tag = searchParams.get('tag');

                let cards: Card[];

                // Detect hashtag search - strip # and search tags directly
                const isTagSearch = query.startsWith('#');
                const tagQuery = isTagSearch ? query.slice(1).toLowerCase() : null;

                if (isSupabaseConfigured()) {
                        // Search Supabase
                        if (isTagSearch && tagQuery) {
                                // Direct tag search - match tags array
                                const rows = await searchCardsByTag(tagQuery);
                                cards = rows?.map(rowToCard) ?? [];
                        } else if (query) {
                                // Full text search with semantic expansion
                                const searchTerms = await expandSearchQuery(query);
                                const rows = await searchCards(searchTerms);
                                cards = rows?.map(rowToCard) ?? [];
                        } else {
                                // No query - return recent cards (will be done on client side usually)
                                cards = [];
                        }
                } else {
                        // Fallback to demo data
                        cards = getDemoCards();

                        // Apply text or tag search
                        if (isTagSearch && tagQuery) {
                                cards = cards.filter(card =>
                                        card.tags.some(t => t.toLowerCase().includes(tagQuery))
                                );
                        } else if (query) {
                                const q = query.toLowerCase();
                                cards = cards.filter(card =>
                                        card.title?.toLowerCase().includes(q) ||
                                        card.content?.toLowerCase().includes(q) ||
                                        card.tags.some(t => t.toLowerCase().includes(q))
                                );
                        }
                }

                // Apply type filter
                if (type && type !== 'all') {
                        cards = cards.filter(card => card.type === type);
                }

                // Apply additional tag filter (from ?tag= param)
                if (tag) {
                        cards = cards.filter(card =>
                                card.tags.some(t => t.toLowerCase() === tag.toLowerCase())
                        );
                }

                return NextResponse.json({
                        success: true,
                        cards,
                        total: cards.length,
                });
        } catch (error) {
                console.error('[API] Search error:', error);
                return NextResponse.json(
                        {
                                success: false,
                                cards: [],
                                total: 0,
                                error: error instanceof Error ? error.message : 'Search failed',
                        },
                        { status: 500 }
                );
        }
}
