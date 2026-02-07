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

import { NextRequest, NextResponse, after } from 'next/server';
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
	'perplexity': 'article',
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
import { extractInstagramPost, isInstagramShareUrl, resolveInstagramShareUrl } from '@/lib/instagram-extractor';
import { extractInstagramImages } from '@/lib/instagram-scraper';
import { persistInstagramMedia, isPersistedUrl } from '@/lib/instagram-storage';
import type { InstagramMediaItem } from '@/lib/instagram-scraper';

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
		// No fallback - raw Microlink URLs should never be stored in the database
		// They're redirect URLs that produce broken screenshots for social media sites
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

/**
 * Background carousel extraction for Instagram
 * Runs AFTER initial card is saved, updates card with all images
 *
 * ENHANCED: Now persists media to Supabase Storage to avoid CDN URL expiration
 * Also detects video content and tracks media types
 */
async function extractInstagramCarouselBackground(cardId: string, shortcode: string): Promise<void> {
	try {
		console.log(`[Save] Background: Starting carousel extraction for ${shortcode}`);

		// Fetch current card to get user_id and merge metadata properly
		const client = getSupabaseClient(true);
		if (!client) {
			console.error('[Save] Background: No Supabase client');
			return;
		}

		const { data: currentCard } = await client
			.from('cards')
			.select('user_id, metadata, title, content')
			.eq('id', cardId)
			.single();

		if (!currentCard) {
			console.error('[Save] Background: Card not found:', cardId);
			return;
		}

		const userId = currentCard.user_id;
		const currentMetadata = currentCard.metadata || {};

		// Try O(1) API-first extractor, fall back to Playwright if it fails
		const url = `https://www.instagram.com/p/${shortcode}/`;
		let images: string[] = [];
		let mediaItems: InstagramMediaItem[] = [];
		let caption = '';
		let author = '';
		let slideCount = 0;
		let extractionSource = 'none';

		// Strategy 1: O(1) API-first (fast, no browser)
		try {
			const apiResult = await extractInstagramPost(url);
			if (apiResult && apiResult.images.length > 0) {
				images = apiResult.images;
				mediaItems = apiResult.images.map((imgUrl, i) => ({
					url: imgUrl,
					type: (apiResult.isVideo && i === 0 ? 'video' : 'image') as 'image' | 'video',
				}));
				caption = apiResult.caption;
				author = apiResult.authorHandle;
				slideCount = apiResult.slideCount;
				extractionSource = `api:${apiResult.source}`;
				console.log(`[Save] Background: API extracted ${images.length} images via ${apiResult.source}`);
			}
		} catch (apiErr) {
			console.warn('[Save] Background: API extraction failed:', apiErr);
		}

		// Strategy 2: Playwright fallback (slow but reliable)
		if (images.length === 0) {
			console.log('[Save] Background: API returned no images, falling back to Playwright');
			try {
				const playwrightResult = await extractInstagramImages(url);
				if (playwrightResult && playwrightResult.images.length > 0) {
					images = playwrightResult.images;
					mediaItems = playwrightResult.media;
					caption = playwrightResult.caption;
					author = playwrightResult.author;
					slideCount = playwrightResult.slideCount;
					extractionSource = 'playwright';
					console.log(`[Save] Background: Playwright extracted ${images.length} images`);
				}
			} catch (pwErr) {
				console.warn('[Save] Background: Playwright extraction also failed:', pwErr);
			}
		}

		if (images.length > 0) {
			console.log(`[Save] Background: ${extractionSource} got ${images.length} images, caption: "${caption?.slice(0, 50)}..."`);

			// PERSIST MEDIA TO SUPABASE STORAGE
			let persistedUrls: string[] = images;
			let mediaTypes: ('image' | 'video')[] = mediaItems.map(m => m.type);
			let videoPositions: number[] = mediaItems.reduce<number[]>((acc, m, i) => m.type === 'video' ? [...acc, i] : acc, []);
			let originalCdnUrls: string[] = images;
			let mediaPersisted = false;

			try {
				console.log(`[Save] Background: Persisting ${mediaItems.length} media items to storage`);
				const persistResult = await persistInstagramMedia(mediaItems, userId, shortcode);

				if (persistResult.urls.length > 0) {
					persistedUrls = persistResult.urls;
					mediaTypes = persistResult.mediaTypes;
					videoPositions = persistResult.videoPositions;
					originalCdnUrls = persistResult.originalCdnUrls;
					mediaPersisted = persistResult.success;

					console.log(`[Save] Background: Persisted ${persistedUrls.length} media items`);
				}
			} catch (persistError) {
				console.warn('[Save] Background: Media persistence failed, using CDN URLs:', persistError);
			}

			// Generate title from caption (max 80 chars)
			const generatedTitle = caption
				? caption.slice(0, 80).trim() || 'Instagram Post'
				: 'Instagram Post';

			// Update card with all carousel images and metadata
			await updateCard(cardId, {
				image_url: persistedUrls[0], // Primary image (now permanent!)
				// Only update title if it's still the placeholder
				...(currentCard.title === 'Instagram Post' || !currentCard.title
					? { title: generatedTitle }
					: {}),
				// Only update content if empty
				...((!currentCard.content || currentCard.content === '')
					? { content: caption }
					: {}),
				metadata: {
					...currentMetadata,
					images: persistedUrls,
					author,
					platform: 'instagram',
					slideCount,
					isCarousel: images.length > 1,
					carouselExtracted: true,
					carouselPending: false,
					carouselExtractedAt: new Date().toISOString(),
					extractionSource,
					// Media persistence fields
					mediaTypes,
					videoPositions: videoPositions.length > 0 ? videoPositions : undefined,
					mediaPersisted,
					originalCdnUrls: mediaPersisted ? originalCdnUrls : undefined,
				}
			});

			console.log(`[Save] Background: Card ${cardId} updated with ${persistedUrls.length} images (persisted: ${mediaPersisted})`);
		} else {
			console.warn(`[Save] Background: No images extracted for ${shortcode} (API + Playwright both failed)`);

			// Mark as failed so we don't keep retrying
			await updateCard(cardId, {
				metadata: {
					...currentMetadata,
					carouselPending: false,
					carouselExtractionFailed: true,
					carouselExtractionError: 'No images extracted',
				}
			});
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

// =============================================================================
// INTERNAL API HELPERS
// =============================================================================

/**
 * Get the base URL for internal API calls.
 * Works on Vercel (VERCEL_URL), custom domains (NEXT_PUBLIC_SITE_URL), and localhost.
 */
function getBaseUrl(): string {
	if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
	if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
	return 'http://localhost:3737';
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
			engagement?: { likes?: number; retweets?: number; replies?: number; views?: number };
		} = {};

		// Check if this is an Instagram URL - use fast path for immediate response
		const isInstagramShare = url ? isInstagramShareUrl(url) : false;
		const isInstagram = url && (
			url.includes('instagram.com/p/') || url.includes('instagram.com/reel/') ||
			url.includes('instagram.com/tv/') || isInstagramShare
		);

		// Resolve share URLs to canonical URLs before shortcode extraction
		let resolvedInstagramUrl = url;
		if (isInstagramShare && url) {
			resolvedInstagramUrl = await resolveInstagramShareUrl(url);
		}

		// Extract Instagram shortcode early (needed for background processing)
		let instagramShortcode: string | undefined;
		if (isInstagram && resolvedInstagramUrl) {
			const shortcodeMatch = resolvedInstagramUrl.match(/\/(p|reel|tv)\/([A-Za-z0-9_-]+)/);
			instagramShortcode = shortcodeMatch?.[2];
		}

		if (url && isInstagram) {
			// INSTAGRAM FAST PATH: Use O(1) API-first extractor (no Playwright)
			console.log('[Save] Instagram detected - using API-first extraction');

			try {
				const igPost = await extractInstagramPost(resolvedInstagramUrl || url);

				if (igPost && igPost.images.length > 0) {
					console.log(`[Save] Instagram: ${igPost.source} extracted ${igPost.images.length} images in O(1)`);

					// Persist first image to Supabase Storage immediately
					let persistedImageUrl: string | undefined;
					try {
						const imgRes = await fetch(igPost.images[0], {
							signal: AbortSignal.timeout(8000),
							headers: {
								'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)',
								'Referer': 'https://www.instagram.com/',
							},
						});
						if (imgRes.ok) {
							const buffer = Buffer.from(await imgRes.arrayBuffer());
							const uploadedUrl = await uploadScreenshotToStorage(buffer, url);
							if (uploadedUrl) {
								persistedImageUrl = uploadedUrl;
								console.log('[Save] Instagram: Primary image persisted to storage');
							}
						}
					} catch (e) {
						console.warn('[Save] Instagram: Image persistence failed, using CDN URL:', e);
					}

					// Replace CDN URL in images[0] with persisted Supabase URL
					// so metadata.images doesn't store expiring CDN URLs
					if (persistedImageUrl && igPost.images.length > 0) {
						igPost.images[0] = persistedImageUrl;
					}

					preview = {
						title: igPost.caption.slice(0, 80).trim() || 'Instagram Post',
						imageUrl: persistedImageUrl || igPost.images[0],
						content: igPost.caption,
						description: igPost.caption,
						images: igPost.images,
						isCarousel: igPost.isCarousel,
						shortcode: instagramShortcode,
						authorName: igPost.authorName,
						authorHandle: igPost.authorHandle,
						authorAvatar: igPost.authorAvatar,
					};
				} else {
					console.warn('[Save] Instagram: API extraction returned no images');
					preview = {
						title: 'Instagram Post',
						imageUrl: undefined,
						content: '',
						description: '',
						images: undefined,
						isCarousel: true,
						shortcode: instagramShortcode,
					};
				}
			} catch (e) {
				console.warn('[Save] Instagram: Extraction failed:', e);
				preview = {
					title: 'Instagram Post',
					imageUrl: undefined,
					content: '',
					description: '',
					images: undefined,
					isCarousel: true,
					shortcode: instagramShortcode,
				};
			}

			console.log(`[Save] Instagram: shortcode=${instagramShortcode}, hasImage=${!!preview.imageUrl}, images=${preview.images?.length || 0}`);
		} else if (url) {
			// Standard path for non-Instagram URLs
			const scraped = await scrapeUrl(url);

			const isTwitter = url.includes('twitter.com') || url.includes('x.com');

			// For Twitter: persist API-extracted images to Supabase Storage
			// This avoids Playwright entirely (X.com blocks headless browsers)
			let persistedImageUrl: string | undefined;
			if (isTwitter && scraped.imageUrl) {
				try {
					console.log('[Save] Twitter: Persisting API image to storage');
					const imgRes = await fetch(scraped.imageUrl, { signal: AbortSignal.timeout(10000) });
					if (imgRes.ok) {
						const buffer = Buffer.from(await imgRes.arrayBuffer());
						const uploadedUrl = await uploadScreenshotToStorage(buffer, url);
						if (uploadedUrl) {
							persistedImageUrl = uploadedUrl;
							console.log('[Save] Twitter: Image persisted to storage');
						}
					}
				} catch (err) {
					console.warn('[Save] Twitter: Image persistence failed, using direct URL:', err);
				}
			}

			// Fallback to Playwright screenshot only for non-Twitter URLs with no image
			let fallbackImage: string | undefined;
			if (!scraped.imageUrl && !isTwitter) {
				try {
					const result = await captureWithPlaywright(url);
					if (result.success && result.buffer.length > 0) {
						const uploadedUrl = await uploadScreenshotToStorage(result.buffer, url);
						fallbackImage = uploadedUrl ?? undefined;
					}

					if (!fallbackImage) {
						console.warn('[Save] Playwright screenshot failed or upload failed, falling back to Microlink');
						fallbackImage = getMicrolinkFallback(url);
					}
				} catch (error) {
					console.warn('[Save] Screenshot capture failed:', error);
					fallbackImage = getMicrolinkFallback(url);
				}
			} else if (!scraped.imageUrl && isTwitter) {
				// Twitter with no images from API - NO fallback screenshot
				// Microlink screenshots of x.com show login walls, which is useless
				fallbackImage = undefined;
			}

			preview = {
				title: scraped.title,
				imageUrl: persistedImageUrl ?? scraped.imageUrl ?? fallbackImage,
				content: scraped.content,
				description: scraped.description,
				images: scraped.images,
				authorName: scraped.authorName,
				authorHandle: scraped.authorHandle,
				authorAvatar: scraped.authorAvatar,
				engagement: scraped.engagement,
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
			url: (isInstagram ? resolvedInstagramUrl : url) ?? null,
			image_url: finalImageUrl ?? preview.imageUrl ?? null,
			metadata: {
				processing: false, // Let the enrich route claim this atomically
				needsEnrichment: !tags, // Signal that AI enrichment is needed
				platform: quickMeta.platform !== 'unknown' ? quickMeta.platform : undefined, // Store detected platform
				images: preview.images, // Store carousel/multi images
				isCarousel: preview.isCarousel, // Track if this is a carousel
				carouselPending: !!(preview.isCarousel && preview.shortcode), // Background extraction pending
				// Author info extracted from social platforms
				authorName: preview.authorName,
				authorHandle: preview.authorHandle,
				authorAvatar: preview.authorAvatar,
				// Engagement metrics (Twitter, etc.)
				engagement: preview.engagement,
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

		// STEP 3: Schedule background work via after() for fault-tolerance
		// after() keeps the serverless function alive after the response is sent,
		// ensuring background tasks complete even if the user navigates away.
		// Without after(), Vercel kills fire-and-forget promises after response.
		const cardId = insertedRow.id;
		const needsEnrichment = !tags;

		after(async () => {
			// 3a. Instagram carousel extraction (await - needs to complete first)
			if (isInstagram && instagramShortcode) {
				console.log(`[Save:after] Starting Instagram extraction for ${instagramShortcode}`);
				try {
					await extractInstagramCarouselBackground(cardId, instagramShortcode);
					console.log(`[Save:after] Instagram extraction complete for ${instagramShortcode}`);
				} catch (err) {
					console.error('[Save:after] Instagram extraction failed:', err);
				}
			}

			// 3b. Auto-trigger enrichment server-side (separate function invocation)
			// This ensures enrichment runs even if the user closes the browser.
			if (needsEnrichment) {
				const baseUrl = getBaseUrl();
				console.log(`[Save:after] Triggering enrichment for card ${cardId}`);
				try {
					const enrichRes = await fetch(`${baseUrl}/api/enrich`, {
						method: 'POST',
						headers: {
							'Content-Type': 'application/json',
							'x-service-key': process.env.SUPABASE_SERVICE_ROLE_KEY || '',
						},
						body: JSON.stringify({ cardId }),
						signal: AbortSignal.timeout(55000),
					});
					if (!enrichRes.ok) {
						const errBody = await enrichRes.text().catch(() => 'unknown');
						console.error(`[Save:after] Enrichment returned ${enrichRes.status}: ${errBody}`);
					} else {
						console.log(`[Save:after] Enrichment completed for card ${cardId}`);
					}
				} catch (err) {
					console.error('[Save:after] Enrichment trigger failed:', err);
				}
			}
		});

		// STEP 4: Return immediately to client (< 200ms)
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
