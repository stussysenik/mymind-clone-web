/**
 * Instagram Media Storage Module
 *
 * Handles downloading Instagram media and persisting to Supabase Storage
 * to avoid CDN URL expiration issues.
 *
 * Storage structure: instagram/{userId}/{shortcode}/{index}.jpg
 * For videos: instagram/{userId}/{shortcode}/{index}-thumb.jpg
 */

import { getSupabaseClient } from './supabase';
import type { InstagramMediaItem } from './instagram-scraper';

// =============================================================================
// CONFIGURATION
// =============================================================================

// Use existing 'images' bucket with 'instagram/' prefix path
const STORAGE_BUCKET = 'images';
const STORAGE_PREFIX = 'instagram';
const DOWNLOAD_DELAY_MS = 100; // Delay between downloads to avoid rate limiting
const MAX_RETRIES = 2;
const DOWNLOAD_TIMEOUT_MS = 10000;

// Mobile user agent for better CDN compatibility
const DOWNLOAD_USER_AGENT =
	'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';

// =============================================================================
// TYPES
// =============================================================================

export interface PersistMediaResult {
	urls: string[];
	mediaTypes: ('image' | 'video')[];
	videoPositions: number[];
	originalCdnUrls: string[];
	success: boolean;
	errors?: string[];
}

// =============================================================================
// DOWNLOAD FUNCTIONS
// =============================================================================

/**
 * Downloads media from Instagram CDN
 * Uses mobile user agent and proper headers for better compatibility
 */
export async function downloadMedia(url: string): Promise<Buffer | null> {
	for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
		try {
			const controller = new AbortController();
			const timeout = setTimeout(() => controller.abort(), DOWNLOAD_TIMEOUT_MS);

			const response = await fetch(url, {
				headers: {
					'User-Agent': DOWNLOAD_USER_AGENT,
					'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
					'Accept-Language': 'en-US,en;q=0.9',
					'Referer': 'https://www.instagram.com/',
					'Sec-Fetch-Dest': 'image',
					'Sec-Fetch-Mode': 'no-cors',
					'Sec-Fetch-Site': 'cross-site',
				},
				signal: controller.signal,
			});

			clearTimeout(timeout);

			if (!response.ok) {
				console.warn(`[InstagramStorage] Download failed (${response.status}): ${url.slice(0, 60)}...`);
				if (attempt < MAX_RETRIES) {
					await delay(500 * (attempt + 1)); // Exponential backoff
					continue;
				}
				return null;
			}

			const arrayBuffer = await response.arrayBuffer();
			const buffer = Buffer.from(arrayBuffer);

			console.log(`[InstagramStorage] Downloaded ${buffer.length} bytes from ${url.slice(0, 60)}...`);
			return buffer;
		} catch (error) {
			console.warn(`[InstagramStorage] Download error (attempt ${attempt + 1}):`, error);
			if (attempt < MAX_RETRIES) {
				await delay(500 * (attempt + 1));
				continue;
			}
			return null;
		}
	}
	return null;
}

// =============================================================================
// UPLOAD FUNCTIONS
// =============================================================================

/**
 * Uploads media to Supabase Storage
 * Returns the public URL or null on failure
 */
export async function uploadInstagramMedia(
	buffer: Buffer,
	userId: string,
	shortcode: string,
	index: number,
	isVideoThumb: boolean = false
): Promise<string | null> {
	const client = getSupabaseClient(true);
	if (!client) {
		console.error('[InstagramStorage] No Supabase client available');
		return null;
	}

	const suffix = isVideoThumb ? '-thumb' : '';
	const fileName = `${STORAGE_PREFIX}/${userId}/${shortcode}/${index}${suffix}.jpg`;

	try {
		// Upload to storage
		const { error: uploadError } = await client.storage
			.from(STORAGE_BUCKET)
			.upload(fileName, buffer, {
				contentType: 'image/jpeg',
				upsert: true, // Overwrite if exists (for re-extraction)
			});

		if (uploadError) {
			// Check if bucket doesn't exist
			if (uploadError.message?.includes('Bucket not found')) {
				console.error(`[InstagramStorage] Bucket '${STORAGE_BUCKET}' does not exist. Please create it in Supabase dashboard.`);
			} else {
				console.error('[InstagramStorage] Upload error:', uploadError);
			}
			return null;
		}

		// Get public URL
		const { data: urlData } = client.storage
			.from(STORAGE_BUCKET)
			.getPublicUrl(fileName);

		console.log(`[InstagramStorage] Uploaded: ${fileName}`);
		return urlData.publicUrl;
	} catch (error) {
		console.error('[InstagramStorage] Upload exception:', error);
		return null;
	}
}

// =============================================================================
// MAIN PERSISTENCE FUNCTION
// =============================================================================

/**
 * Main entry point - downloads and persists all carousel media
 * Returns permanent Supabase URLs and media type information
 */
export async function persistInstagramMedia(
	media: InstagramMediaItem[],
	userId: string,
	shortcode: string
): Promise<PersistMediaResult> {
	const urls: string[] = [];
	const mediaTypes: ('image' | 'video')[] = [];
	const videoPositions: number[] = [];
	const originalCdnUrls: string[] = [];
	const errors: string[] = [];

	console.log(`[InstagramStorage] Persisting ${media.length} media items for ${shortcode}`);

	for (let i = 0; i < media.length; i++) {
		const item = media[i];
		originalCdnUrls.push(item.url);
		mediaTypes.push(item.type);

		if (item.type === 'video') {
			videoPositions.push(i);
		}

		// Download the image (or thumbnail for videos)
		const urlToDownload = item.type === 'video' && item.thumbnailUrl ? item.thumbnailUrl : item.url;
		const buffer = await downloadMedia(urlToDownload);

		if (!buffer) {
			// Failed to download - keep original CDN URL as fallback
			console.warn(`[InstagramStorage] Failed to download media ${i}, using CDN URL`);
			urls.push(urlToDownload);
			errors.push(`Failed to download media at position ${i}`);
		} else {
			// Upload to Supabase
			const uploadedUrl = await uploadInstagramMedia(
				buffer,
				userId,
				shortcode,
				i,
				item.type === 'video'
			);

			if (uploadedUrl) {
				urls.push(uploadedUrl);
			} else {
				// Upload failed - keep original CDN URL as fallback
				console.warn(`[InstagramStorage] Failed to upload media ${i}, using CDN URL`);
				urls.push(urlToDownload);
				errors.push(`Failed to upload media at position ${i}`);
			}
		}

		// Rate limiting delay between downloads
		if (i < media.length - 1) {
			await delay(DOWNLOAD_DELAY_MS);
		}
	}

	const success = errors.length === 0;
	console.log(`[InstagramStorage] Persistence complete: ${urls.length} URLs, ${errors.length} errors`);

	return {
		urls,
		mediaTypes,
		videoPositions,
		originalCdnUrls,
		success,
		errors: errors.length > 0 ? errors : undefined,
	};
}

// =============================================================================
// HELPERS
// =============================================================================

function delay(ms: number): Promise<void> {
	return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Check if a URL is already a Supabase Storage URL
 * Used to avoid re-downloading already persisted media
 */
export function isPersistedUrl(url: string): boolean {
	return url.includes('supabase.co/storage') || url.includes('supabase.in/storage');
}
