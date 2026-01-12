/**
 * MyMind Clone - Similar Cards API Route
 * 
 * GET endpoint for finding semantically similar cards.
 * Uses Pinecone vector search with integrated embeddings.
 * 
 * @fileoverview API endpoint for semantic similarity search
 */

import { NextRequest, NextResponse } from 'next/server';
import { querySimilar, isPineconeConfigured } from '@/lib/pinecone';
import { getUser } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
        try {
                // Check if Pinecone is configured
                if (!isPineconeConfigured()) {
                        return NextResponse.json({
                                success: false,
                                error: 'Vector search not configured',
                                matches: [],
                        });
                }

                const user = await getUser();
                if (!user) {
                        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
                }

                // Get query parameters
                const { searchParams } = new URL(request.url);
                const cardId = searchParams.get('cardId');
                const text = searchParams.get('text');
                const topK = parseInt(searchParams.get('topK') || '5', 10);

                if (!cardId && !text) {
                        return NextResponse.json({
                                success: false,
                                error: 'Either cardId or text parameter required',
                        }, { status: 400 });
                }

                // If text is provided, query directly
                // If cardId is provided, we need to fetch the card and build the query text
                let queryText = text || '';
                let excludeId: string | undefined;

                if (cardId && !text) {
                        // Import supabase dynamically to get card content
                        const { getSupabaseClient } = await import('@/lib/supabase');
                        const { buildEmbeddingText } = await import('@/lib/pinecone');

                        const client = getSupabaseClient(true);
                        if (!client) {
                                return NextResponse.json({ success: false, error: 'DB not configured' }, { status: 500 });
                        }

                        const { data: card, error } = await client
                                .from('cards')
                                .select('title, content, tags, metadata, image_url')
                                .eq('id', cardId)
                                .single();

                        if (error || !card) {
                                return NextResponse.json({ success: false, error: 'Card not found' }, { status: 404 });
                        }

                        queryText = buildEmbeddingText({
                                title: card.title,
                                content: card.content,
                                tags: card.tags,
                                metadata: card.metadata,
                        });
                        excludeId = cardId;  // Don't return the queried card itself
                }

                // Query Pinecone for similar records
                const matches = await querySimilar(queryText, topK, excludeId);

                // Fetch full card data for the matches from Supabase
                const matchIds = matches.map(m => m.id);

                if (matchIds.length === 0) {
                        return NextResponse.json({ success: true, matches: [], cards: [] });
                }

                // Import supabase dynamically
                const { getSupabaseClient } = await import('@/lib/supabase');
                const client = getSupabaseClient(true);

                if (!client) {
                        // Fallback to just returning metadata if DB fails (shouldn't happen)
                        return NextResponse.json({
                                success: true,
                                matches: matches.map(m => ({
                                        id: m.id,
                                        score: m.score,
                                        ...m.metadata
                                }))
                        });
                }

                const { data: cards, error: dbError } = await client
                        .from('cards')
                        .select('*')
                        .in('id', matchIds);

                if (dbError) {
                        console.error('[Similar API] DB Error:', dbError);
                        return NextResponse.json({ success: false, error: 'Database error' }, { status: 500 });
                }

                // Sort cards by similarity score (Pinecone order)
                const sortedCards = cards?.sort((a, b) => {
                        const scoreA = matches.find(m => m.id === a.id)?.score || 0;
                        const scoreB = matches.find(m => m.id === b.id)?.score || 0;
                        return scoreB - scoreA;
                }) || [];

                return NextResponse.json({
                        success: true,
                        matches: matches,    // Raw pinecone matches with scores
                        cards: sortedCards,  // Full card objects
                });

        } catch (error) {
                console.error('[Similar API] Error:', error);
                return NextResponse.json({
                        success: false,
                        error: error instanceof Error ? error.message : 'Unknown error',
                }, { status: 500 });
        }
}
