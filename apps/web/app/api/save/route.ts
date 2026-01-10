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
import { insertCard, updateCard, isSupabaseConfigured, getSupabaseClient } from '@/lib/supabase';
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

/**
 * Upload base64 image to Supabase Storage
 */
async function uploadImageToStorage(base64Data: string, userId: string): Promise<string | null> {
        try {
                // Remove data prefix
                const matches = base64Data.match(/^data:(image\/([a-zA-Z]*));base64,(.*)$/);
                if (!matches || matches.length !== 4) return null;

                const extension = matches[2] === 'jpeg' ? 'jpg' : matches[2];
                const cleanBase64 = matches[3];
                const buffer = Buffer.from(cleanBase64, 'base64');
                const fileName = `${userId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${extension}`;

                const client = getSupabaseClient(true);
                if (!client) return null;

                const { error } = await client.storage
                        .from('images')
                        .upload(fileName, buffer, {
                                contentType: matches[1],
                                upsert: false
                        });

                if (error) {
                        console.error('[Storage] Upload failed:', error);
                        return null;
                }

                const { data: { publicUrl } } = client.storage
                        .from('images')
                        .getPublicUrl(fileName);

                return publicUrl;
        } catch (error) {
                console.error('[Storage] Error:', error);
                return null;
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
                const { url, type: rawType, title, content, imageUrl, tags } = body;
                // If type is 'auto', treat it as undefined so we autodetect
                const type = (rawType as string) === 'auto' ? undefined : rawType;

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
                                deletedAt: null,
                        };

                        return NextResponse.json({
                                success: true,
                                card: mockCard,
                                source: 'mock',
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

                // Upload image if base64
                let finalImageUrl = imageUrl;
                if (imageUrl && imageUrl.startsWith('data:image')) {
                        const uploaded = await uploadImageToStorage(imageUrl, userId);
                        if (uploaded) finalImageUrl = uploaded;
                }

                // STEP 2: Insert card immediately with basic data
                const cardData: Partial<CardRow> = {
                        user_id: userId,
                        type: type ?? quickMeta.type,
                        title: title ?? preview.title ?? quickMeta.title,
                        content: content ?? null,
                        url: url ?? null,
                        image_url: finalImageUrl ?? preview.imageUrl ?? null,
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
                        deletedAt: insertedRow.deleted_at,
                };

                return NextResponse.json({
                        success: true,
                        card: savedCard,
                        source: 'db',
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
