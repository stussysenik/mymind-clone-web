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
import { createClient } from '@supabase/supabase-js';
import { insertCard, updateCard, isSupabaseConfigured, getSupabaseClient } from '@/lib/supabase';
import { getUser } from '@/lib/supabase-server';
import type { SaveCardRequest, SaveCardResponse, CardRow, SaveSource, CardType } from '@/lib/types';
import { detectPlatform, Platform } from '@/lib/platforms';

// =============================================================================
// PLATFORM TO TYPE MAPPING
// =============================================================================

/**
 * Maps detected platforms to their corresponding card types.
 * This ensures YouTube URLs get type 'video', not 'article'.
 */
const PLATFORM_TYPE_MAP: Record<Platform, CardType> = {
	'youtube': 'video',
	'tiktok': 'video',
	'twitter': 'social',
	'instagram': 'social',
	'reddit': 'social',
	'linkedin': 'social',
	'mastodon': 'social',
	'letterboxd': 'movie',
	'imdb': 'movie',
	'goodreads': 'book',
	'storygraph': 'book',
	'amazon': 'product',
	'spotify': 'audio',
	'pinterest': 'image',
	'github': 'article',
	'medium': 'article',
	'substack': 'article',
	'unknown': 'article',
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Validate auth token and return user ID.
 * Used for iOS Share Extension authentication.
 */
async function validateAuthToken(authToken: string): Promise<{ userId: string | null; error: string | null }> {
	if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
		return { userId: null, error: 'Supabase not configured' };
	}

	try {
		// Create a Supabase client with the provided token
		const supabase = createClient(
			process.env.NEXT_PUBLIC_SUPABASE_URL,
			process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
			{
				global: {
					headers: {
						Authorization: `Bearer ${authToken}`,
					},
				},
			}
		);

		// Verify the token by getting the user
		const { data: { user }, error } = await supabase.auth.getUser(authToken);

		if (error || !user) {
			return { userId: null, error: 'Invalid or expired authentication token' };
		}

		return { userId: user.id, error: null };
	} catch (error) {
		console.error('[Auth] Token validation error:', error);
		return { userId: null, error: 'Token validation failed' };
	}
}

/**
 * Extract basic metadata from URL (without AI)
 * Now includes platform detection for correct type assignment.
 */
function extractQuickMetadata(url: string | null, content: string | null): { title: string; type: CardType; platform: Platform } {
	let title = 'New Card';
	let type: CardType = 'article';
	let platform: Platform = 'unknown';

	if (content && !url) {
		type = 'note';
		// Use first line as title (up to 50 chars)
		const firstLine = content.split('\n')[0].trim();
		title = firstLine.length > 50 ? firstLine.substring(0, 50) + '...' : firstLine;
	} else if (url) {
		// Detect platform from URL and map to correct type
		platform = detectPlatform(url);
		type = PLATFORM_TYPE_MAP[platform];
		try {
			const parsed = new URL(url);
			// Use domain as title
			title = parsed.hostname.replace('www.', '');
		} catch {
			title = 'Link';
		}
	}

	return { title, type, platform };
}

import { scrapeUrl } from '@/lib/scraper';
import { captureWithPlaywright, getMicrolinkFallback } from '@/lib/screenshot-playwright';
import { uploadScreenshotToStorage } from '@/lib/supabase';
import { scrapeInstagramQuick, extractInstagramImages } from '@/lib/instagram-scraper';

/**
 * Fetch URL metadata (OG image, title, content) using scraper
 */
async function fetchUrlPreview(url: string): Promise<{ title?: string; imageUrl?: string; content?: string }> {
	try {
		const scraped = await scrapeUrl(url);
		return {
			title: scraped.title,
			imageUrl: scraped.imageUrl ?? undefined,
			content: scraped.content
		};
	} catch (error) {
		console.log('[Save] URL scrape failed:', error);
		// Fallback to minimal screenshot if scrape fails
		return {
			imageUrl: `https://api.microlink.io/?url=${encodeURIComponent(url)}&screenshot=true&meta=false&embed=screenshot.url`
		};
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

/**
 * Background carousel extraction for Instagram
 * Runs AFTER initial card is saved, updates card with all images
 */
async function extractInstagramCarouselBackground(cardId: string, shortcode: string): Promise<void> {
	try {
		console.log(`[Save] Background: Starting carousel extraction for ${shortcode}`);

		// Use the full extraction function with fallback chain (embed scraper first, then direct page)
		const url = `https://www.instagram.com/p/${shortcode}/`;
		const result = await extractInstagramImages(url);

		if (result && result.images.length > 0) {
			console.log(`[Save] Background: Extracted ${result.images.length} images, caption: "${result.caption?.slice(0, 50)}..."`);

			// Fetch current card to merge metadata properly
			const client = getSupabaseClient(true);
			if (!client) {
				console.error('[Save] Background: No Supabase client');
				return;
			}

			const { data: currentCard } = await client
				.from('cards')
				.select('metadata, title, content')
				.eq('id', cardId)
				.single();

			const currentMetadata = currentCard?.metadata || {};

			// Generate title from caption (max 80 chars)
			const generatedTitle = result.caption
				? result.caption.slice(0, 80).trim() || 'Instagram Post'
				: 'Instagram Post';

			// Update card with all carousel images and metadata
			await updateCard(cardId, {
				image_url: result.images[0], // Primary image
				// Only update title if it's still the placeholder
				...(currentCard?.title === 'Instagram Post' || !currentCard?.title
					? { title: generatedTitle }
					: {}),
				// Only update content if empty
				...((!currentCard?.content || currentCard?.content === '')
					? { content: result.caption }
					: {}),
				metadata: {
					...currentMetadata,
					images: result.images,
					author: result.author,
					platform: 'instagram',
					slideCount: result.slideCount,
					isCarousel: result.images.length > 1,
					carouselExtracted: true,
					carouselPending: false,
					carouselExtractedAt: new Date().toISOString(),
				}
			});

			console.log(`[Save] Background: Card ${cardId} updated with ${result.images.length} images`);
		} else {
			console.warn(`[Save] Background: No images extracted for ${shortcode}`);

			// Mark as failed so we don't keep retrying
			const client = getSupabaseClient(true);
			if (client) {
				const { data: currentCard } = await client
					.from('cards')
					.select('metadata')
					.eq('id', cardId)
					.single();

				await updateCard(cardId, {
					metadata: {
						...(currentCard?.metadata || {}),
						carouselPending: false,
						carouselExtractionFailed: true,
						carouselExtractionError: 'No images extracted',
					}
				});
			}
		}
	} catch (error) {
		console.error(`[Save] Background carousel extraction failed:`, error);

		// Mark extraction as failed
		try {
			const client = getSupabaseClient(true);
			if (client) {
				const { data: currentCard } = await client
					.from('cards')
					.select('metadata')
					.eq('id', cardId)
					.single();

				await updateCard(cardId, {
					metadata: {
						...(currentCard?.metadata || {}),
						carouselPending: false,
						carouselExtractionFailed: true,
						carouselExtractionError: error instanceof Error ? error.message : 'Unknown error',
					}
				});
			}
		} catch (updateErr) {
			console.error('[Save] Background: Failed to update error status:', updateErr);
		}
	}
}

/**
 * Quick Instagram extraction - returns immediately with first image
 * Full carousel is extracted in background
 */
async function scrapeInstagramQuickly(url: string): Promise<{
	title: string;
	imageUrl: string | null;
	content: string;
	author: string;
	isCarousel: boolean;
	shortcode: string;
}> {
	// Extract shortcode
	const shortcodeMatch = url.match(/\/(p|reel|tv)\/([A-Za-z0-9_-]+)/);
	const shortcode = shortcodeMatch?.[2] || '';

	if (!shortcode) {
		return {
			title: 'Instagram Post',
			imageUrl: null,
			content: '',
			author: '',
			isCarousel: false,
			shortcode: '',
		};
	}

	try {
		const result = await scrapeInstagramQuick(shortcode);

		if (result) {
			return {
				title: result.caption?.slice(0, 80) || 'Instagram Post',
				imageUrl: result.firstImage,
				content: result.caption,
				author: result.author,
				isCarousel: result.isCarousel,
				shortcode,
			};
		}
	} catch (error) {
		console.warn('[Save] Quick Instagram extraction failed:', error);
	}

	// Fallback
	return {
		title: 'Instagram Post',
		imageUrl: null,
		content: '',
		author: '',
		isCarousel: true, // Assume carousel to trigger background extraction
		shortcode,
	};
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
		const { url, type: rawType, title, content, imageUrl, tags, source, auth_token } = body;
		// If type is 'auto', treat it as undefined so we autodetect
		const type = (rawType as string) === 'auto' ? undefined : rawType;

		// Log request source for analytics
		const requestSource: SaveSource = source ?? 'manual';
		console.log(`[Save] Request from source: ${requestSource}`);

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
				archivedAt: null,
			};

			return NextResponse.json({
				success: true,
				card: mockCard,
				source: 'mock',
			});
		}

		// Authenticate user based on request source
		let userId: string;

		if (requestSource === 'ios-share-extension') {
			// iOS Share Extension: Validate auth_token from request body
			if (!auth_token) {
				return NextResponse.json(
					{ success: false, error: 'Authentication token required for share extension' },
					{ status: 401 }
				);
			}

			const { userId: tokenUserId, error: tokenError } = await validateAuthToken(auth_token);
			if (tokenError || !tokenUserId) {
				return NextResponse.json(
					{ success: false, error: tokenError ?? 'Invalid or expired authentication token' },
					{ status: 401 }
				);
			}

			userId = tokenUserId;
			console.log(`[Save] iOS Share Extension authenticated user: ${userId}`);
		} else {
			// Web/Chrome Extension: Use cookie-based auth
			const user = await getUser();
			userId = user?.id ?? 'demo-user';
		}

		// STEP 1: Quick metadata (no AI)
		const quickMeta = extractQuickMetadata(url ?? null, content ?? null);

		// Get URL preview (OG image/title/content) - fast parallel fetch
		let preview: {
			title?: string;
			imageUrl?: string;
			content?: string;
			description?: string;
			images?: string[];
			isCarousel?: boolean;
			shortcode?: string;
			authorName?: string;
			authorHandle?: string;
			authorAvatar?: string;
		} = {};

		// Check if this is an Instagram URL - use fast path for immediate response
		const isInstagram = url && (url.includes('instagram.com/p/') || url.includes('instagram.com/reel/') || url.includes('instagram.com/tv/'));

		// Extract Instagram shortcode early (needed for background processing)
		let instagramShortcode: string | undefined;
		if (isInstagram && url) {
			const shortcodeMatch = url.match(/\/(p|reel|tv)\/([A-Za-z0-9_-]+)/);
			instagramShortcode = shortcodeMatch?.[2];
		}

		if (url && isInstagram) {
			// INSTAGRAM ULTRA-FAST PATH: Return immediately with minimal data
			// Full extraction happens in background - NO Playwright in critical path
			console.log('[Save] Instagram detected - using ultra-fast path (no Playwright)');

			preview = {
				title: 'Instagram Post',
				imageUrl: undefined, // Will be filled by background extraction
				content: '',
				description: '',
				images: undefined,
				isCarousel: true, // Assume carousel, background will verify
				shortcode: instagramShortcode,
			};

			console.log(`[Save] Instagram ultra-fast: shortcode=${instagramShortcode}`);
		} else if (url) {
			// Standard path for non-Instagram URLs
			const scraped = await scrapeUrl(url);

			// Fallback to self-hosted Playwright screenshot if no image found in metadata
			// Uses Playwright (content-focused, zero cost) with fallback to Microlink
			let fallbackImage: string | undefined;
			if (!scraped.imageUrl) {
				try {
					const result = await captureWithPlaywright(url);
					if (result.success && result.buffer.length > 0) {
						// Upload to Supabase Storage
						const uploadedUrl = await uploadScreenshotToStorage(result.buffer, url);
						fallbackImage = uploadedUrl ?? undefined;
					}

					// If Playwright failed or storage upload failed, fallback to Microlink
					if (!fallbackImage) {
						console.warn('[Save] Playwright screenshot failed or upload failed, falling back to Microlink');
						fallbackImage = getMicrolinkFallback(url);
					}
				} catch (error) {
					console.warn('[Save] Screenshot capture failed:', error);
					// Final fallback to Microlink
					fallbackImage = getMicrolinkFallback(url);
				}
			}

			preview = {
				title: scraped.title,
				imageUrl: scraped.imageUrl ?? fallbackImage,
				content: scraped.content,
				description: scraped.description,
				images: scraped.images,
				authorName: scraped.authorName,
				authorHandle: scraped.authorHandle,
				authorAvatar: scraped.authorAvatar,
			};
		}

		// Upload image if base64
		let finalImageUrl = imageUrl;
		if (imageUrl && imageUrl.startsWith('data:image')) {
			const uploaded = await uploadImageToStorage(imageUrl, userId);
			if (uploaded) finalImageUrl = uploaded;
		}

		// STEP 2: Insert card immediately with basic data
		// Use scraped content if user didn't provide any
		const finalContent = content ?? preview.content ?? preview.description ?? null;

		const cardData: Partial<CardRow> = {
			user_id: userId,
			type: type ?? quickMeta.type,
			title: title ?? preview.title ?? quickMeta.title,
			content: finalContent,
			url: url ?? null,
			image_url: finalImageUrl ?? preview.imageUrl ?? null,
			metadata: {
				processing: !tags, // Flag as processing if we need AI
				platform: quickMeta.platform !== 'unknown' ? quickMeta.platform : undefined, // Store detected platform
				images: preview.images, // Store carousel images
				isCarousel: preview.isCarousel, // Track if this is a carousel
				carouselPending: !!(preview.isCarousel && preview.shortcode), // Background extraction pending
				// Author info extracted from social platforms
				authorName: preview.authorName,
				authorHandle: preview.authorHandle,
				authorAvatar: preview.authorAvatar,
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

		// INSTAGRAM BACKGROUND EXTRACTION: Always trigger for Instagram URLs
		// This runs in the background - we don't wait for it
		if (isInstagram && instagramShortcode) {
			console.log(`[Save] Triggering background extraction for Instagram shortcode: ${instagramShortcode}`);
			// Fire and forget - don't await
			extractInstagramCarouselBackground(insertedRow.id, instagramShortcode).catch(err => {
				console.error('[Save] Background carousel extraction failed:', err);
			});
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
			archivedAt: insertedRow.archived_at ?? null,
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
