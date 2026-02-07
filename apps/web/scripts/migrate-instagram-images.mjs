#!/usr/bin/env node
/**
 * Migrate Instagram Images to Supabase Storage
 *
 * Finds Instagram cards with expired CDN URLs (scontent.cdninstagram.com,
 * instagram.fprg5-1.fna.fbcdn.net) and re-persists them to Supabase Storage.
 *
 * Unlike reextract-instagram-carousels.mjs, this script:
 * - Does NOT require the dev server to be running
 * - Directly downloads images and uploads to Supabase
 * - Fixes both image_url and metadata.images fields
 *
 * Run with: node scripts/migrate-instagram-images.mjs
 *
 * Options:
 *   --dry-run     Show what would be migrated without making changes
 *   --limit N     Only process N cards (default: all)
 *   --verbose     Show detailed progress for each card
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

// =============================================================================
// CONFIG
// =============================================================================

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, '../.env.local');

const STORAGE_BUCKET = 'images';
const STORAGE_PREFIX = 'instagram';
const DOWNLOAD_TIMEOUT_MS = 10000;
const MAX_DOWNLOAD_RETRIES = 2;
const DELAY_BETWEEN_CARDS_MS = 500;

const MOBILE_USER_AGENT =
	'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';

// CDN patterns that indicate an unpersisted (potentially expired) URL
const CDN_PATTERNS = [
	'cdninstagram.com',
	'fbcdn.net',
	'scontent.',
	'instagram.f',
];

// =============================================================================
// ENV LOADING
// =============================================================================

function loadEnvFile(path) {
	try {
		const content = readFileSync(path, 'utf-8');
		const vars = {};
		for (const line of content.split('\n')) {
			const trimmed = line.trim();
			if (trimmed && !trimmed.startsWith('#')) {
				const eqIndex = trimmed.indexOf('=');
				if (eqIndex > 0) {
					vars[trimmed.slice(0, eqIndex)] = trimmed.slice(eqIndex + 1);
				}
			}
		}
		return vars;
	} catch {
		return {};
	}
}

const envVars = loadEnvFile(envPath);
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || envVars.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || envVars.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
	console.error('❌ Missing Supabase credentials.');
	console.error('   Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables,');
	console.error('   or ensure apps/web/.env.local exists with these values.');
	process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// =============================================================================
// CLI ARGS
// =============================================================================

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const VERBOSE = args.includes('--verbose');
const limitIndex = args.indexOf('--limit');
const LIMIT = limitIndex !== -1 ? parseInt(args[limitIndex + 1], 10) : null;

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function isExpiredCdnUrl(url) {
	if (!url) return false;
	if (url.includes('supabase.co/storage') || url.includes('supabase.in/storage')) return false;
	return CDN_PATTERNS.some(p => url.includes(p));
}

function extractShortcode(url) {
	const match = url?.match(/\/(p|reel)\/([A-Za-z0-9_-]+)/);
	return match ? match[2] : null;
}

async function downloadImage(url) {
	for (let attempt = 0; attempt <= MAX_DOWNLOAD_RETRIES; attempt++) {
		try {
			const controller = new AbortController();
			const timeout = setTimeout(() => controller.abort(), DOWNLOAD_TIMEOUT_MS);

			const response = await fetch(url, {
				headers: {
					'User-Agent': MOBILE_USER_AGENT,
					'Accept': 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
					'Referer': 'https://www.instagram.com/',
				},
				signal: controller.signal,
			});

			clearTimeout(timeout);

			if (!response.ok) {
				if (VERBOSE) console.log(`    Download failed (${response.status}): ${url.slice(0, 60)}...`);
				if (attempt < MAX_DOWNLOAD_RETRIES) {
					await delay(500 * (attempt + 1));
					continue;
				}
				return null;
			}

			const arrayBuffer = await response.arrayBuffer();
			return Buffer.from(arrayBuffer);
		} catch (error) {
			if (attempt < MAX_DOWNLOAD_RETRIES) {
				await delay(500 * (attempt + 1));
				continue;
			}
			return null;
		}
	}
	return null;
}

async function uploadToStorage(buffer, userId, shortcode, index) {
	const fileName = `${STORAGE_PREFIX}/${userId}/${shortcode}/${index}.jpg`;

	const { error: uploadError } = await supabase.storage
		.from(STORAGE_BUCKET)
		.upload(fileName, buffer, {
			contentType: 'image/jpeg',
			upsert: true,
		});

	if (uploadError) {
		if (VERBOSE) console.log(`    Upload error: ${uploadError.message}`);
		return null;
	}

	const { data: urlData } = supabase.storage
		.from(STORAGE_BUCKET)
		.getPublicUrl(fileName);

	return urlData.publicUrl;
}

/**
 * Fetch fresh image URL via InstaFix oEmbed (no auth, works from any IP)
 */
async function getFreshImageUrl(shortcode) {
	try {
		const oembedUrl = `https://www.ddinstagram.com/oembed?url=https://www.instagram.com/p/${shortcode}/`;
		const response = await fetch(oembedUrl, {
			headers: { 'User-Agent': MOBILE_USER_AGENT },
			signal: AbortSignal.timeout(8000),
		});

		if (!response.ok) return null;

		const contentType = response.headers.get('content-type') || '';
		if (!contentType.includes('json')) return null;

		const data = await response.json();
		return data.thumbnail_url || null;
	} catch {
		return null;
	}
}

function delay(ms) {
	return new Promise(resolve => setTimeout(resolve, ms));
}

// =============================================================================
// MAIN
// =============================================================================

async function findAffectedCards() {
	console.log('🔍 Finding Instagram cards with expired CDN URLs...\n');

	const { data: cards, error } = await supabase
		.from('cards')
		.select('id, user_id, title, url, image_url, metadata, created_at')
		.or('url.ilike.%instagram.com/p/%,url.ilike.%instagram.com/reel/%,url.ilike.%instagram.com/share/%')
		.order('created_at', { ascending: false });

	if (error) {
		console.error('❌ Error querying cards:', error.message);
		return [];
	}

	if (!cards || cards.length === 0) {
		console.log('✅ No Instagram cards found.');
		return [];
	}

	console.log(`📋 Found ${cards.length} Instagram cards total`);

	// Filter to cards with expired CDN URLs
	const affected = cards.filter(card => {
		// Check image_url
		if (isExpiredCdnUrl(card.image_url)) return true;

		// Check metadata.images array
		const images = card.metadata?.images || [];
		if (images.some(url => isExpiredCdnUrl(url))) return true;

		return false;
	});

	// Exclude cards already migrated
	const needsMigration = affected.filter(card => !card.metadata?.migratedAt);

	console.log(`🚨 ${needsMigration.length} cards need migration (${affected.length - needsMigration.length} already migrated)\n`);

	return needsMigration;
}

async function migrateCard(card) {
	const shortcode = extractShortcode(card.url);
	if (!shortcode) {
		return { success: false, reason: 'No shortcode found in URL' };
	}

	const userId = card.user_id;
	const metadata = card.metadata || {};
	let newImageUrl = card.image_url;
	let newImages = [...(metadata.images || [])];
	let repairedCount = 0;

	// Step 1: Try to get a fresh image URL via InstaFix
	let freshUrl = null;
	if (isExpiredCdnUrl(card.image_url)) {
		freshUrl = await getFreshImageUrl(shortcode);
	}

	// Step 2: Migrate the primary image_url
	if (isExpiredCdnUrl(card.image_url)) {
		const sourceUrl = freshUrl || card.image_url;
		const buffer = await downloadImage(sourceUrl);

		if (buffer) {
			const uploadedUrl = await uploadToStorage(buffer, userId, shortcode, 0);
			if (uploadedUrl) {
				newImageUrl = uploadedUrl;
				repairedCount++;
			}
		} else if (freshUrl) {
			// Download failed, but we have a fresh URL — store it directly
			// (better than the old expired one)
			newImageUrl = freshUrl;
			repairedCount++;
		}
	}

	// Step 3: Migrate carousel images in metadata.images
	for (let i = 0; i < newImages.length; i++) {
		if (isExpiredCdnUrl(newImages[i])) {
			// For carousel items beyond the first, we'd need full extraction
			// For now, try to download the existing CDN URL (may still work for recent posts)
			const buffer = await downloadImage(newImages[i]);
			if (buffer) {
				const uploadedUrl = await uploadToStorage(buffer, userId, shortcode, i);
				if (uploadedUrl) {
					newImages[i] = uploadedUrl;
					repairedCount++;
				}
			}
		}
	}

	if (repairedCount === 0) {
		return { success: false, reason: 'Could not download any images (all expired/blocked)' };
	}

	// Step 4: Update the card in Supabase
	const { error: updateError } = await supabase
		.from('cards')
		.update({
			image_url: newImageUrl,
			metadata: {
				...metadata,
				images: newImages.length > 0 ? newImages : metadata.images,
				mediaPersisted: true,
				migratedAt: new Date().toISOString(),
				originalCdnUrls: metadata.originalCdnUrls || [card.image_url],
			},
		})
		.eq('id', card.id);

	if (updateError) {
		return { success: false, reason: `DB update failed: ${updateError.message}` };
	}

	return { success: true, repairedCount };
}

async function main() {
	console.log('🖼️  Instagram CDN → Supabase Migration\n');
	console.log('═'.repeat(60));

	if (DRY_RUN) console.log('🔵 DRY RUN MODE — No changes will be made\n');
	if (LIMIT) console.log(`📊 Limit: ${LIMIT} cards\n`);

	const cards = await findAffectedCards();

	if (cards.length === 0) {
		console.log('✅ Nothing to migrate!');
		return;
	}

	const toProcess = LIMIT ? cards.slice(0, LIMIT) : cards;

	console.log('Cards to migrate:');
	console.log('─'.repeat(60));

	for (const card of toProcess) {
		const shortcode = extractShortcode(card.url) || '???';
		const title = (card.title || 'Untitled').slice(0, 40);
		const images = card.metadata?.images || [];
		const cdnImageCount = images.filter(isExpiredCdnUrl).length;
		const mainExpired = isExpiredCdnUrl(card.image_url);

		console.log(`  • ${title}`);
		console.log(`    shortcode: ${shortcode} | main_url: ${mainExpired ? '❌ expired' : '✅ ok'} | carousel: ${cdnImageCount}/${images.length} expired`);
	}
	console.log('─'.repeat(60));

	if (DRY_RUN) {
		console.log(`\n🔵 DRY RUN — Would migrate ${toProcess.length} cards`);
		console.log('   Run without --dry-run to execute migration');
		return;
	}

	// Execute migration
	console.log(`\n🔄 Migrating ${toProcess.length} cards...\n`);

	let successCount = 0;
	let failCount = 0;
	let totalRepaired = 0;

	for (const card of toProcess) {
		const title = (card.title || card.url || 'Untitled').slice(0, 40);

		try {
			const result = await migrateCard(card);
			if (result.success) {
				console.log(`  ✅ ${title} — ${result.repairedCount} images repaired`);
				successCount++;
				totalRepaired += result.repairedCount;
			} else {
				console.log(`  ⚠️  ${title} — ${result.reason}`);
				failCount++;
			}
		} catch (err) {
			console.error(`  ❌ ${title} — ${err.message}`);
			failCount++;
		}

		await delay(DELAY_BETWEEN_CARDS_MS);
	}

	console.log('\n' + '═'.repeat(60));
	console.log('📊 Migration Summary:');
	console.log(`   • Total affected: ${cards.length}`);
	console.log(`   • Processed: ${toProcess.length}`);
	console.log(`   • Succeeded: ${successCount}`);
	console.log(`   • Failed: ${failCount}`);
	console.log(`   • Images repaired: ${totalRepaired}`);
	console.log('═'.repeat(60));
}

main().catch(console.error);
