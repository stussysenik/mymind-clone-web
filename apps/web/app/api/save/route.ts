/**
 * MyMind Clone - Save API Route
 * 
 * POST endpoint for saving new cards to the database.
 * Uses OPTIMISTIC SAVING:
 * 1. Save card immediately with placeholder data
 * 2. Return to client fast (<200ms)
 * 3. Enrich card with AI in background
 * 
 * @fileoverview Save card API endpoint with async AI processing
 */

import { NextRequest, NextResponse } from 'next/server';
import { insertCard, updateCard, isSupabaseConfigured } from '@/lib/supabase';
import { classifyContent } from '@/lib/ai';
import { getUser } from '@/lib/supabase-server';
import type { SaveCardRequest, SaveCardResponse, CardRow } from '@/lib/types';

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Extract basic metadata from URL (without AI)
 */
function extractQuickMetadata(url: string | null, content: string | null) {
        let title = 'New Card';
        let type: 'article' | 'image' | 'note' | 'product' | 'book' = 'article';

        if (content && !url) {
                type = 'note';
                // Use first line as title (up to 50 chars)
                const firstLine = content.split('\n')[0].trim();
                title = firstLine.length > 50 ? firstLine.substring(0, 50) + '...' : firstLine;
        } else if (url) {
                try {
                        const parsed = new URL(url);
                        // Use domain as title
                        title = parsed.hostname.replace('www.', '');
                } catch {
                        title = 'Link';
                }
        }

        return { title, type };
}

/**
 * Fetch URL metadata (OG image, title) without AI
 */
async function fetchUrlPreview(url: string): Promise<{ title?: string; imageUrl?: string }> {
        try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 3000); // 3s timeout

                const response = await fetch(url, {
                        signal: controller.signal,
                        headers: {
                                'User-Agent': 'Mozilla/5.0 (compatible; MyMindBot/1.0)',
                        },
                });
                clearTimeout(timeoutId);

                const html = await response.text();

                // Extract OG image
                const ogImageMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i) ||
                        html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:image["']/i);
                const imageUrl = ogImageMatch?.[1] || undefined;

                // Extract OG title or page title
                const titleMatch = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i) ||
                        html.match(/<title[^>]*>([^<]+)<\/title>/i);
                const title = titleMatch?.[1]?.trim() || undefined;

                return { title, imageUrl };
        } catch (error) {
                console.log('[Save] URL preview fetch failed:', error);
                return {};
        }
}

// =============================================================================
// ROUTE HANDLER
// =============================================================================

/**
 * POST /api/save
 * 
 * Saves a new card to the database with OPTIMISTIC SAVING.
 * Returns immediately, AI enrichment happens in background.
 */
export async function POST(request: NextRequest): Promise<NextResponse<SaveCardResponse>> {
        try {
                // Parse request body
                const body = (await request.json()) as SaveCardRequest;
                const { url, type, title, content, imageUrl, tags } = body;

                // Validate: at least one of url, content, or imageUrl is required
                if (!url && !content && !imageUrl) {
                        return NextResponse.json(
                                { success: false, error: 'At least one of url, content, or imageUrl is required' },
                                { status: 400 }
                        );
                }

                // If Supabase is not configured, return mock response (demo mode)
                if (!isSupabaseConfigured()) {
                        const mockCard = {
                                id: `mock-${Date.now()}`,
                                userId: 'demo-user',
                                type: type ?? 'note',
                                title: title ?? 'Demo Card',
                                content: content ?? null,
                                url: url ?? null,
                                imageUrl: imageUrl ?? null,
                                metadata: {},
                                tags: tags ?? [],
                                createdAt: new Date().toISOString(),
                                updatedAt: new Date().toISOString(),
                        };

                        return NextResponse.json({
                                success: true,
                                card: mockCard,
                        });
                }

                // Get authenticated user
                const user = await getUser();
                const userId = user?.id ?? 'demo-user';

                // STEP 1: Quick metadata (no AI)
                const quickMeta = extractQuickMetadata(url ?? null, content ?? null);

                // Get URL preview (OG image/title) - fast parallel fetch
                let preview: { title?: string; imageUrl?: string } = {};
                if (url) {
                        preview = await fetchUrlPreview(url);
                }

                // STEP 2: Insert card immediately with basic data
                const cardData: Partial<CardRow> = {
                        user_id: userId,
                        type: type ?? quickMeta.type,
                        title: title ?? preview.title ?? quickMeta.title,
                        content: content ?? null,
                        url: url ?? null,
                        image_url: imageUrl ?? preview.imageUrl ?? null,
                        metadata: {
                                processing: !tags, // Flag as processing if we need AI
                        },
                        tags: tags ?? [], // Empty tags, will be filled by AI
                };

                const insertedRow = await insertCard(cardData);

                if (!insertedRow) {
                        return NextResponse.json(
                                { success: false, error: 'Failed to save card to database' },
                                { status: 500 }
                        );
                }

                // STEP 3: Return immediately to client (< 200ms)
                const savedCard = {
                        id: insertedRow.id,
                        userId: insertedRow.user_id,
                        type: insertedRow.type,
                        title: insertedRow.title,
                        content: insertedRow.content,
                        url: insertedRow.url,
                        imageUrl: insertedRow.image_url,
                        metadata: insertedRow.metadata,
                        tags: insertedRow.tags,
                        createdAt: insertedRow.created_at,
                        updatedAt: insertedRow.updated_at,
                };

                // STEP 4: Enrich with AI in background (don't await)
                if (!tags) {
                        // Fire and forget - don't block response
                        enrichCardWithAI(insertedRow.id, url, content, imageUrl).catch(err => {
                                console.error('[Save] Background AI enrichment failed:', err);
                        });
                }

                return NextResponse.json({
                        success: true,
                        card: savedCard,
                });
        } catch (error) {
                console.error('[API] Save error:', error);

                return NextResponse.json(
                        {
                                success: false,
                                error: error instanceof Error ? error.message : 'Unknown error occurred'
                        },
                        { status: 500 }
                );
        }
}

// =============================================================================
// BACKGROUND AI ENRICHMENT
// =============================================================================

/**
 * Enrich a card with AI-generated tags and metadata.
 * Runs in background after response is sent.
 */
async function enrichCardWithAI(
        cardId: string,
        url: string | null | undefined,
        content: string | null | undefined,
        imageUrl: string | null | undefined
): Promise<void> {
        try {
                console.log('[AI] Starting background enrichment for card:', cardId);

                // Call AI classification
                const classification = await classifyContent(
                        url ?? null,
                        content ?? null,
                        imageUrl
                );

                // Update card with AI results
                await updateCard(cardId, {
                        type: classification.type,
                        title: classification.title,
                        tags: classification.tags,
                        metadata: {
                                summary: classification.summary,
                                processing: false,
                        },
                });

                console.log('[AI] Background enrichment complete for card:', cardId);
        } catch (error) {
                console.error('[AI] Background enrichment failed:', error);

                // Mark card as not processing even on failure
                await updateCard(cardId, {
                        metadata: {
                                processing: false,
                                enrichmentError: error instanceof Error ? error.message : 'Unknown error',
                        },
                });
        }
}

// =============================================================================
// OPTIONS (CORS)
// =============================================================================

/**
 * OPTIONS /api/save
 * 
 * Handles CORS preflight requests from the Chrome extension.
 */
export async function OPTIONS(): Promise<NextResponse> {
        return new NextResponse(null, {
                status: 200,
                headers: {
                        'Access-Control-Allow-Origin': '*',
                        'Access-Control-Allow-Methods': 'POST, OPTIONS',
                        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
                },
        });
}
