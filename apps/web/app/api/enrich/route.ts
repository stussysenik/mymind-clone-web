/**
 * MyMind Clone - Enrich API Route
 * 
 * POST endpoint for triggering AI enrichment synchronously.
 * This is called by the client immediately after specific actions
 * to ensure the serverless function executes successfully.
 * 
 * Features:
 * - Retry logic with exponential backoff (2 retries)
 * - Error persistence to card metadata for UI feedback
 * - Structured logging for debugging
 * 
 * @fileoverview API endpoint for card AI enrichment
 */

import { NextRequest, NextResponse } from 'next/server';
import { updateCard, getSupabaseClient } from '@/lib/supabase';
import { classifyContent } from '@/lib/ai';
import { getUser } from '@/lib/supabase-server';
import { scrapeUrl } from '@/lib/scraper';

// =============================================================================
// RETRY CONFIGURATION
// =============================================================================

const MAX_RETRIES = 2;
const INITIAL_BACKOFF_MS = 1000; // 1 second

/**
 * Sleep helper for exponential backoff
 */
function sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry wrapper with exponential backoff
 */
async function withRetry<T>(
        fn: () => Promise<T>,
        retries: number = MAX_RETRIES,
        backoffMs: number = INITIAL_BACKOFF_MS
): Promise<T> {
        let lastError: Error | null = null;

        for (let attempt = 0; attempt <= retries; attempt++) {
                try {
                        return await fn();
                } catch (error) {
                        lastError = error instanceof Error ? error : new Error(String(error));

                        if (attempt < retries) {
                                const waitTime = backoffMs * Math.pow(2, attempt);
                                console.log(`[Enrich API] Retry ${attempt + 1}/${retries} after ${waitTime}ms`);
                                await sleep(waitTime);
                        }
                }
        }

        throw lastError;
}

// =============================================================================
// ROUTE HANDLER
// =============================================================================

export async function POST(request: NextRequest) {
        let cardId: string | null = null;

        try {
                const body = await request.json();
                cardId = body.cardId;

                if (!cardId) {
                        return NextResponse.json({ success: false, error: 'cardId required' }, { status: 400 });
                }

                const user = await getUser();
                const userId = user?.id ?? 'demo-user';

                // If strictly requiring auth for production, uncomment this:
                // if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

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

                if (card.user_id !== userId) {
                        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
                }

                console.log(`[Enrich API] Starting enrichment for card: ${cardId}`);

                // 2. Ensure we have content (scrape if missing)
                let contentToAnalyze = card.content;

                // If no content but we have a URL, try scraping it now
                if (!contentToAnalyze && card.url) {
                        try {
                                console.log(`[Enrich API] Content missing, re-scraping URL: ${card.url}`);
                                const scraped = await scrapeUrl(card.url);
                                contentToAnalyze = scraped.content;

                                // Update card with scraped content for future
                                if (contentToAnalyze) {
                                        await updateCard(cardId, {
                                                content: contentToAnalyze,
                                                // Also update title/image if scraper found better ones
                                                title: (!card.title || card.title === 'Link') ? scraped.title : card.title,
                                                image_url: (!card.image_url) ? scraped.imageUrl : card.image_url
                                        });
                                }
                        } catch (scrapeError) {
                                console.warn(`[Enrich API] Re-scrape failed:`, scrapeError);
                        }
                }

                // 3. Run AI Classification with retry logic
                const classification = await withRetry(async () => {
                        return await classifyContent(
                                card.url,
                                contentToAnalyze,
                                card.image_url
                        );
                });

                // 3. Update Card with successful enrichment
                await updateCard(cardId, {
                        type: classification.type,
                        title: classification.title,
                        tags: classification.tags,
                        metadata: {
                                ...card.metadata,
                                summary: classification.summary,
                                platform: classification.platform || card.metadata.platform, // Updates platform if AI found one
                                processing: false,
                                enrichmentError: null,
                                enrichmentFailedAt: null,
                                enrichedAt: new Date().toISOString()
                        }
                });

                console.log(`[Enrich API] Success for card: ${cardId}`);

                return NextResponse.json({
                        success: true,
                        classification
                });

        } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Unknown enrichment error';
                console.error(`[Enrich API] Failed for card ${cardId}:`, errorMessage);

                // Persist error to card metadata so UI can display it
                if (cardId) {
                        try {
                                const client = getSupabaseClient(true);
                                if (client) {
                                        // Fetch current metadata to preserve it
                                        const { data: card } = await client
                                                .from('cards')
                                                .select('metadata')
                                                .eq('id', cardId)
                                                .single();

                                        await updateCard(cardId, {
                                                metadata: {
                                                        ...(card?.metadata || {}),
                                                        processing: false,
                                                        enrichmentError: errorMessage,
                                                        enrichmentFailedAt: new Date().toISOString()
                                                }
                                        });

                                        console.log(`[Enrich API] Error persisted to card ${cardId} metadata`);
                                }
                        } catch (updateError) {
                                console.error(`[Enrich API] Failed to persist error to card ${cardId}:`, updateError);
                        }
                }

                return NextResponse.json({
                        success: false,
                        error: errorMessage
                }, { status: 500 });
        }
}
