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
import { updateCard, getSupabaseClient, getUniqueTags } from '@/lib/supabase';
import { classifyContent, normalizeTagsToExisting, analyzeImage } from '@/lib/ai';
import { getUser } from '@/lib/supabase-server';
import { scrapeUrl } from '@/lib/scraper';
import { upsertRecord, buildEmbeddingText } from '@/lib/pinecone';
import { cleanMovieTitle, isMoviePlatform } from '@/lib/dspy-client';
import { createEnrichmentTiming, updateEnrichmentTiming, type EnrichmentTiming } from '@/lib/enrichment-timing';
import { detectPlatform } from '@/lib/platforms';

// =============================================================================
// RETRY CONFIGURATION
// =============================================================================

const MAX_RETRIES = 2;
const INITIAL_BACKOFF_MS = 1000; // 1 second
const MAX_ENRICHMENT_MS = 50000; // 50s overall timeout (safety net for serverless limits)

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

                // Check for service key bypass (for migration scripts)
                const serviceKey = request.headers.get('x-service-key');
                const isServiceRequest = serviceKey === process.env.SUPABASE_SERVICE_ROLE_KEY;

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

                // Skip user check for service requests (migration scripts)
                if (!isServiceRequest && card.user_id !== userId) {
                        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
                }

                console.log(`[Enrich API] Starting enrichment for card: ${cardId}`);

                // Initialize timing tracking
                const platform = detectPlatform(card.url);
                const imageCount = card.metadata?.images?.length || (card.image_url ? 1 : 0);
                const contentLength = (card.content?.length || 0) + (card.title?.length || 0);
                const timing = createEnrichmentTiming(platform, contentLength, !!card.image_url, imageCount);

                // IMPORTANT: Set processing=true at START so UI shows loading state immediately
                // This is crucial for retry scenarios where processing was previously false
                await updateCard(cardId, {
                        metadata: {
                                ...card.metadata,
                                processing: true,  // Show loading indicator in UI
                                enrichmentError: undefined,  // Clear any previous error
                                enrichmentFailedAt: undefined,  // Clear previous failure timestamp
                                enrichmentTiming: {
                                        startedAt: timing.startedAt,
                                        estimatedTotalMs: timing.estimatedTotalMs,
                                        platform: timing.platform,
                                }
                        }
                });

                // Wrap enrichment in overall timeout to prevent serverless function timeout
                const enrichmentResult = await Promise.race([
                        (async () => {
                // 2. Ensure we have content (scrape if missing)
                let contentToAnalyze = card.content;
                let scrapedDate: string | undefined;

                // If no content but we have a URL, try scraping it now
                const scrapeStartTime = Date.now();
                if (!contentToAnalyze && card.url) {
                        try {
                                console.log(`[Enrich API] Content missing, re-scraping URL: ${card.url}`);
                                const scraped = await scrapeUrl(card.url);
                                contentToAnalyze = scraped.content;
                                scrapedDate = scraped.publishedAt;

                                // Update card with scraped content for future
                                if (contentToAnalyze) {
                                        // Only update title if user hasn't manually edited it
                                        const shouldUpdateScrapedTitle = !card.metadata?.titleEditedAt && (!card.title || card.title === 'Link');
                                        await updateCard(cardId, {
                                                content: contentToAnalyze,
                                                // Also update title/image if scraper found better ones (but preserve user edits)
                                                ...(shouldUpdateScrapedTitle && scraped.title ? { title: scraped.title } : {}),
                                                image_url: (!card.image_url) ? scraped.imageUrl : card.image_url,
                                                // We don't update metadata here to avoid race conditions, we'll do it in the final update
                                        });
                                }
                        } catch (scrapeError) {
                                console.warn(`[Enrich API] Re-scrape failed:`, scrapeError);
                        }
                }
                const scrapeMs = Date.now() - scrapeStartTime;
                console.log(`[Enrich API] Scrape completed in ${scrapeMs}ms`);

                // 3. Run AI Classification & Image Analysis (parallel)
                // For Instagram carousels, pass image count for better prompt generation
                const finalImageCount = card.metadata?.images?.length || 1;

                const classifyStartTime = Date.now();
                const [classification, imageAnalysis] = await Promise.all([
                        withRetry(async () => {
                                return await classifyContent(
                                        card.url,
                                        contentToAnalyze,
                                        card.image_url,
                                        finalImageCount
                                );
                        }),
                        // Analyze image if we have one (and it's not a placeholder/falback)
                        card.image_url ? analyzeImage(card.image_url).catch((err: unknown) => {
                                console.warn('[Enrich API] Image analysis failed:', err);
                                return null;
                        }) : Promise.resolve(null)
                ]);
                const classifyMs = Date.now() - classifyStartTime;
                console.log(`[Enrich API] Classification completed in ${classifyMs}ms`);

                // 4. Normalize tags against existing database tags ("Gardener Bot")
                // Defensive: ensure classification.tags is always an array before iteration
                let finalTags: string[] = Array.isArray(classification?.tags) ? classification.tags : [];
                try {
                        const existingTags = await getUniqueTags(userId);
                        const existingTagNames = (existingTags ?? []).map(t => t.tag);
                        if (existingTagNames.length > 0 && finalTags.length > 0) {
                                finalTags = await normalizeTagsToExisting(finalTags, existingTagNames);
                        }
                } catch (normError) {
                        console.warn('[Enrich API] Tag normalization skipped:', normError);
                }

                // 5. Update Card with successful enrichment
                // CRITICAL: Re-fetch latest metadata to prevent overwriting concurrent user updates (e.g. notes)
                const { data: latestCard } = await client
                        .from('cards')
                        .select('metadata, tags')
                        .eq('id', cardId)
                        .single();

                const currentMetadata = latestCard?.metadata || card.metadata;
                // Ensure both tag arrays are valid before merging
                const currentTags = Array.isArray(latestCard?.tags) ? latestCard.tags : (Array.isArray(card.tags) ? card.tags : []);
                const mergedTags = Array.from(new Set([...currentTags, ...finalTags]));

                // Check if user has manually edited title/summary - preserve their edits
                const shouldUpdateTitle = !currentMetadata.titleEditedAt;
                const shouldUpdateSummary = !currentMetadata.summaryEditedAt;

                // Smart Title Logic:
                // - Platforms with explicit titles (YouTube, Reddit, articles, etc.): Keep scraped title
                // - Caption-only platforms (Instagram, Twitter): Use AI-generated title
                // - Movie platforms (IMDB, Letterboxd): Clean title to remove metadata cruft
                const platformsWithExplicitTitles = ['youtube', 'reddit', 'article', 'letterboxd', 'imdb', 'goodreads', 'amazon', 'storygraph'];
                const detectedPlatform = classification.platform || currentMetadata.platform || '';
                const hasExplicitTitle = platformsWithExplicitTitles.includes(detectedPlatform.toLowerCase());
                const existingTitleIsGood = card.title && card.title !== 'Link' && card.title.length > 3;

                // Determine which title to use
                let finalTitle: string | undefined;
                if (shouldUpdateTitle) {
                        if (hasExplicitTitle && existingTitleIsGood) {
                                // Platform has explicit title and we already have a good one
                                // For movie platforms, clean the title to remove metadata cruft
                                if (isMoviePlatform(detectedPlatform) && card.title) {
                                        const cleaned = cleanMovieTitle(card.title);
                                        finalTitle = cleaned.title;
                                        // Store extracted year and rating in metadata if available
                                        if (cleaned.year && !currentMetadata.year) {
                                                currentMetadata.year = cleaned.year;
                                        }
                                        if (cleaned.rating && !currentMetadata.rating) {
                                                currentMetadata.rating = cleaned.rating;
                                        }
                                        console.log(`[Enrich API] Cleaned movie title: "${card.title}" -> "${cleaned.title}"`);
                                } else {
                                        finalTitle = undefined; // Don't update
                                }
                        } else {
                                // Caption-only platform or no good title - use AI-generated
                                finalTitle = classification.title;
                        }
                }

                // Calculate total processing time
                const totalMs = Date.now() - timing.startedAt;
                console.log(`[Enrich API] Total enrichment time: ${totalMs}ms (scrape: ${scrapeMs}ms, classify: ${classifyMs}ms)`);

                await updateCard(cardId, {
                        type: classification.type,
                        // Smart title: only update if we determined a new title should be used
                        ...(finalTitle ? { title: finalTitle } : {}),
                        tags: mergedTags,
                        metadata: {
                                ...currentMetadata,
                                // Only update summary if user hasn't manually edited it
                                ...(shouldUpdateSummary ? { summary: classification.summary } : {}),
                                platform: classification.platform || currentMetadata.platform,
                                publishedAt: scrapedDate || currentMetadata.publishedAt,
                                colors: imageAnalysis?.colors,
                                objects: imageAnalysis?.objects,
                                ocrText: imageAnalysis?.ocrText,
                                processing: false,
                                enrichmentError: null,
                                enrichmentFailedAt: null,
                                enrichedAt: new Date().toISOString(),
                                // Store actual timing for historical analysis and ETA improvement
                                enrichmentTiming: {
                                        startedAt: timing.startedAt,
                                        estimatedTotalMs: timing.estimatedTotalMs,
                                        platform: timing.platform,
                                        scrapeMs,
                                        classifyMs,
                                        totalMs,
                                        completedAt: Date.now(),
                                }
                        }
                });

                // 6. Upsert to Pinecone for semantic similarity (non-blocking)
                const embeddingText = buildEmbeddingText({
                        title: classification.title,
                        tags: finalTags,
                        metadata: { summary: classification.summary },
                });

                // Truncate URL and ensure metadata size safety for Pinecone
                const safeImageUrl = (card.image_url && card.image_url.length < 1000) ? card.image_url : null;

                upsertRecord({
                        id: cardId,
                        text: embeddingText,
                        metadata: {
                                title: classification.title || '',
                                type: classification.type,
                                tags: finalTags,
                                image_url: safeImageUrl || '', // Prevent oversized metadata
                        },
                }).catch(err => console.warn('[Enrich API] Pinecone upsert failed:', err));

                console.log(`[Enrich API] Success for card: ${cardId}`);

                return { success: true, classification };
                        })(),
                        new Promise<never>((_, reject) =>
                                setTimeout(() => reject(new Error(`Enrichment timed out after ${MAX_ENRICHMENT_MS / 1000}s`)), MAX_ENRICHMENT_MS)
                        ),
                ]);

                return NextResponse.json(enrichmentResult);

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
