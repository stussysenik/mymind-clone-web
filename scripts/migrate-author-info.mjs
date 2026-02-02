#!/usr/bin/env node
/**
 * Migration Script: Populate Author Information for Existing Social Cards
 *
 * This script retrospectively updates existing social media cards with
 * author information (authorName, authorHandle, authorAvatar) by re-fetching
 * data from the original URLs using platform APIs.
 *
 * Usage:
 *   node scripts/migrate-author-info.mjs [--dry-run] [--limit=N] [--platform=twitter|youtube|reddit|tiktok|instagram]
 *
 * Options:
 *   --dry-run     Show what would be updated without making changes
 *   --limit=N     Process only N cards (default: all)
 *   --platform=X  Only process cards from specified platform
 *
 * @fileoverview Migration script for author info extraction
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../apps/web/.env.local') });

// =============================================================================
// CONFIGURATION
// =============================================================================

const RATE_LIMIT_MS = 500; // 500ms between API requests
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Parse CLI arguments
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const limitArg = args.find(arg => arg.startsWith('--limit='));
const limit = limitArg ? parseInt(limitArg.split('=')[1], 10) : null;
const platformArg = args.find(arg => arg.startsWith('--platform='));
const platformFilter = platformArg ? platformArg.split('=')[1] : null;

// =============================================================================
// PLATFORM SCRAPERS
// =============================================================================

/**
 * Extract author info from Twitter/X using syndication API
 */
async function extractTwitterAuthor(url) {
	try {
		const tweetIdMatch = url.match(/status\/(\d+)/);
		if (!tweetIdMatch) return null;

		const tweetId = tweetIdMatch[1];
		const syndicationUrl = `https://cdn.syndication.twimg.com/tweet-result?id=${tweetId}&token=0`;

		const response = await fetch(syndicationUrl, {
			headers: {
				'Accept': 'application/json',
				'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1)',
			},
		});

		if (!response.ok) return null;

		const data = await response.json();
		const authorName = data.user?.name || '';
		const authorHandle = data.user?.screen_name || '';
		let authorAvatar = data.user?.profile_image_url_https || '';

		// Upgrade avatar to higher resolution
		if (authorAvatar) {
			authorAvatar = authorAvatar.replace('_normal', '_400x400');
		}

		return { authorName, authorHandle, authorAvatar };
	} catch (error) {
		console.error(`[Twitter] Error extracting author from ${url}:`, error.message);
		return null;
	}
}

/**
 * Extract author info from YouTube using oEmbed API
 */
async function extractYouTubeAuthor(url) {
	try {
		const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;

		const response = await fetch(oembedUrl, {
			headers: {
				'Accept': 'application/json',
				'Accept-Language': 'en-US,en;q=0.9',
			},
		});

		if (!response.ok) return null;

		const data = await response.json();
		const authorName = data.author_name || '';

		// Parse handle from author_url (e.g., https://www.youtube.com/@handle)
		let authorHandle = '';
		if (data.author_url) {
			const handleMatch = data.author_url.match(/@([^\/\?]+)/);
			authorHandle = handleMatch ? handleMatch[1] : '';
		}

		return { authorName, authorHandle, authorAvatar: '' };
	} catch (error) {
		console.error(`[YouTube] Error extracting author from ${url}:`, error.message);
		return null;
	}
}

/**
 * Extract author info from Reddit using JSON API
 */
async function extractRedditAuthor(url) {
	try {
		const jsonUrl = url.replace(/\/?$/, '') + '.json';

		const response = await fetch(jsonUrl, {
			headers: {
				'User-Agent': 'MyMind/1.0 (Content Archiver)',
				'Accept': 'application/json',
			},
		});

		if (!response.ok) return null;

		const data = await response.json();
		const postData = data[0]?.data?.children?.[0]?.data;

		if (!postData) return null;

		const authorHandle = postData.author || '';
		const authorName = authorHandle; // Reddit doesn't expose display names

		return { authorName, authorHandle, authorAvatar: '' };
	} catch (error) {
		console.error(`[Reddit] Error extracting author from ${url}:`, error.message);
		return null;
	}
}

/**
 * Extract author info from TikTok using oEmbed API
 */
async function extractTikTokAuthor(url) {
	try {
		const oembedUrl = `https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`;

		const response = await fetch(oembedUrl, {
			headers: {
				'Accept': 'application/json',
				'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1)',
			},
		});

		if (!response.ok) return null;

		const data = await response.json();
		const authorName = data.author_name || '';
		const authorHandle = data.author_unique_id || '';

		return { authorName, authorHandle, authorAvatar: '' };
	} catch (error) {
		console.error(`[TikTok] Error extracting author from ${url}:`, error.message);
		return null;
	}
}

/**
 * Extract author info from Instagram (limited - embed endpoint)
 * Note: Instagram API access is restricted, using embed as fallback
 */
async function extractInstagramAuthor(url) {
	try {
		// Extract shortcode from URL
		const shortcodeMatch = url.match(/\/(p|reel|tv)\/([A-Za-z0-9_-]+)/);
		const shortcode = shortcodeMatch?.[2];

		if (!shortcode) return null;

		const embedUrl = `https://www.instagram.com/p/${shortcode}/embed/captioned/`;
		const response = await fetch(embedUrl, {
			headers: {
				'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
				'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
			},
		});

		if (!response.ok) return null;

		const html = await response.text();

		// Extract author from UsernameText or og:title
		const usernameMatch = html.match(/<span class="UsernameText">([^<]+)<\/span>/);
		const ogTitleMatch = html.match(/<meta property="og:title" content="([^"]+)"/);

		let authorHandle = '';
		if (usernameMatch) {
			authorHandle = usernameMatch[1].replace('@', '');
		} else if (ogTitleMatch) {
			const titleAuthor = ogTitleMatch[1].split(' on Instagram')[0];
			authorHandle = titleAuthor;
		}

		return { authorName: authorHandle, authorHandle, authorAvatar: '' };
	} catch (error) {
		console.error(`[Instagram] Error extracting author from ${url}:`, error.message);
		return null;
	}
}

// =============================================================================
// PLATFORM DETECTION
// =============================================================================

/**
 * Detect platform from URL and return appropriate extractor
 */
function detectPlatform(url) {
	if (!url) return null;

	const domain = new URL(url).hostname.replace('www.', '');

	if (domain.includes('twitter.com') || domain.includes('x.com')) {
		return { platform: 'twitter', extractor: extractTwitterAuthor };
	}
	if (domain.includes('youtube.com') || domain.includes('youtu.be')) {
		return { platform: 'youtube', extractor: extractYouTubeAuthor };
	}
	if (domain.includes('reddit.com')) {
		return { platform: 'reddit', extractor: extractRedditAuthor };
	}
	if (domain.includes('tiktok.com')) {
		return { platform: 'tiktok', extractor: extractTikTokAuthor };
	}
	if (domain.includes('instagram.com')) {
		return { platform: 'instagram', extractor: extractInstagramAuthor };
	}

	return null;
}

// =============================================================================
// MAIN MIGRATION
// =============================================================================

async function main() {
	console.log('='.repeat(60));
	console.log('Author Info Migration Script');
	console.log('='.repeat(60));
	console.log(`Mode: ${dryRun ? 'DRY RUN' : 'LIVE'}`);
	console.log(`Limit: ${limit || 'All cards'}`);
	console.log(`Platform filter: ${platformFilter || 'All platforms'}`);
	console.log('');

	// Validate environment
	if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
		console.error('Error: Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
		console.error('Make sure apps/web/.env.local is configured correctly');
		process.exit(1);
	}

	// Create Supabase client with service role key for full access
	const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

	// Build query for social cards without author info
	let query = supabase
		.from('cards')
		.select('id, url, metadata, type')
		.eq('type', 'social')
		.is('deleted_at', null);

	// Only get cards that don't have authorName set
	// Note: JSONB null check in Supabase
	query = query.or('metadata->authorName.is.null,metadata->>authorName.eq.');

	if (limit) {
		query = query.limit(limit);
	}

	const { data: cards, error: fetchError } = await query;

	if (fetchError) {
		console.error('Error fetching cards:', fetchError);
		process.exit(1);
	}

	console.log(`Found ${cards.length} social cards without author info`);
	console.log('');

	// Filter by platform if specified
	const filteredCards = platformFilter
		? cards.filter(card => {
				const detected = detectPlatform(card.url);
				return detected?.platform === platformFilter;
			})
		: cards;

	if (platformFilter) {
		console.log(`Filtered to ${filteredCards.length} ${platformFilter} cards`);
		console.log('');
	}

	// Process each card
	let successCount = 0;
	let errorCount = 0;
	let skippedCount = 0;

	for (let i = 0; i < filteredCards.length; i++) {
		const card = filteredCards[i];
		const progress = `[${i + 1}/${filteredCards.length}]`;

		// Detect platform
		const detected = detectPlatform(card.url);
		if (!detected) {
			console.log(`${progress} Skipped (unknown platform): ${card.url?.substring(0, 50)}...`);
			skippedCount++;
			continue;
		}

		const { platform, extractor } = detected;

		// Rate limiting
		if (i > 0) {
			await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_MS));
		}

		// Extract author info
		console.log(`${progress} Processing ${platform}: ${card.url?.substring(0, 50)}...`);
		const authorInfo = await extractor(card.url);

		if (!authorInfo || (!authorInfo.authorName && !authorInfo.authorHandle)) {
			console.log(`  -> Failed to extract author info`);
			errorCount++;
			continue;
		}

		console.log(`  -> Found: ${authorInfo.authorName || authorInfo.authorHandle}${authorInfo.authorAvatar ? ' (with avatar)' : ''}`);

		// Update card metadata
		if (!dryRun) {
			const updatedMetadata = {
				...card.metadata,
				authorName: authorInfo.authorName,
				authorHandle: authorInfo.authorHandle,
				authorAvatar: authorInfo.authorAvatar || undefined,
			};

			const { error: updateError } = await supabase
				.from('cards')
				.update({
					metadata: updatedMetadata,
					updated_at: new Date().toISOString(),
				})
				.eq('id', card.id);

			if (updateError) {
				console.log(`  -> Update failed: ${updateError.message}`);
				errorCount++;
				continue;
			}
		}

		successCount++;
	}

	// Summary
	console.log('');
	console.log('='.repeat(60));
	console.log('Migration Complete');
	console.log('='.repeat(60));
	console.log(`Total processed: ${filteredCards.length}`);
	console.log(`Success: ${successCount}`);
	console.log(`Errors: ${errorCount}`);
	console.log(`Skipped: ${skippedCount}`);

	if (dryRun) {
		console.log('');
		console.log('This was a DRY RUN. No changes were made.');
		console.log('Run without --dry-run to apply changes.');
	}
}

main().catch(console.error);
