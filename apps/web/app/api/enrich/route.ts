/**
 * MyMind Clone - Enrich API Route
 * 
 * POST endpoint for triggering AI enrichment synchronously.
 * This is called by the client immediately after specific actions
 * to ensure the serverless function executes successfully.
 * 
 * @fileoverview API endpoint for card AI enrichment
 */

import { NextRequest, NextResponse } from 'next/server';
import { updateCard, getSupabaseClient } from '@/lib/supabase';
import { classifyContent } from '@/lib/ai';
import { getUser } from '@/lib/supabase-server';

export async function POST(request: NextRequest) {
        try {
                const body = await request.json();
                const { cardId } = body;

                if (!cardId) {
                        return NextResponse.json({ success: false, error: 'cardId required' }, { status: 400 });
                }

                const user = await getUser();
                if (!user) {
                        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
                }

                const client = getSupabaseClient(true);
                if (!client) {
                        return NextResponse.json({ success: false, error: 'DB not configured' }, { status: 500 });
                }

                // 1. Fetch the card to get content/url
                const { data: card, error } = await client
                        .from('cards')
                        .select('*')
                        .eq('id', cardId)
                        .single();

                if (error || !card) {
                        return NextResponse.json({ success: false, error: 'Card not found' }, { status: 404 });
                }

                // Verify ownership
                if (card.user_id !== user.id) {
                        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
                }

                console.log('[Enrich API] Starting enrichment for:', cardId);

                // 2. Run AI Classification (Synchronous Wait)
                // This keeps the lambda alive
                const classification = await classifyContent(
                        card.url,
                        card.content,
                        card.image_url
                );

                // 3. Update Card
                await updateCard(cardId, {
                        type: classification.type,
                        title: classification.title,
                        tags: classification.tags,
                        metadata: {
                                ...card.metadata, // Keep existing metadata
                                summary: classification.summary,
                                processing: false,
                                enrichmentError: null
                        }
                });

                console.log('[Enrich API] Success for:', cardId);

                return NextResponse.json({
                        success: true,
                        classification
                });

        } catch (error) {
                console.error('[Enrich API] Error:', error);

                // Attempt to log error to card if possible
                if (request.body) {
                        // We can't easily fallback here without cardId if JSON parse failed
                }

                return NextResponse.json({
                        success: false,
                        error: error instanceof Error ? error.message : 'Unknown error'
                }, { status: 500 });
        }
}
