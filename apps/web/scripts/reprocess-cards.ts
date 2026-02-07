#!/usr/bin/env bun
/**
 * Re-process Cards Script
 *
 * Finds cards with bad screenshots or missing media and re-processes them
 * through the enrichment pipeline.
 *
 * Usage:
 *   bun run scripts/reprocess-cards.ts --platform=twitter
 *   bun run scripts/reprocess-cards.ts --platform=instagram
 *   bun run scripts/reprocess-cards.ts --all
 *   bun run scripts/reprocess-cards.ts --dry-run
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Load environment variables
config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
	console.error('Missing Supabase credentials. Make sure .env.local is configured.');
	process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Parse arguments
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const platform = args.find(a => a.startsWith('--platform='))?.split('=')[1];
const processAll = args.includes('--all');
const limit = parseInt(args.find(a => a.startsWith('--limit='))?.split('=')[1] || '50');

interface Card {
	id: string;
	url: string;
	image_url: string | null;
	metadata: any;
	created_at: string;
}

async function findBadTwitterCards(): Promise<Card[]> {
	console.log('\n📱 Finding Twitter/X cards with bad screenshots...');

	// Find Twitter cards with Microlink fallback URLs or no images
	const { data, error } = await supabase
		.from('cards')
		.select('id, url, image_url, metadata, created_at')
		.or('url.ilike.%twitter.com%,url.ilike.%x.com%')
		.order('created_at', { ascending: false })
		.limit(limit);

	if (error) {
		console.error('Error fetching Twitter cards:', error);
		return [];
	}

	// Filter to cards with bad images
	const badCards = (data || []).filter(card => {
		const imageUrl = card.image_url || '';
		// Bad if: using Microlink, no image, or has the old screenshot issues
		return (
			imageUrl.includes('api.microlink.io') ||
			!imageUrl ||
			imageUrl.includes('supabase') // Old screenshots stored in Supabase might be bad
		);
	});

	console.log(`  Found ${badCards.length} Twitter cards needing re-processing`);
	return badCards;
}

async function findBadInstagramCards(): Promise<Card[]> {
	console.log('\n📸 Finding Instagram cards with missing/expired media...');

	const { data, error } = await supabase
		.from('cards')
		.select('id, url, image_url, metadata, created_at')
		.ilike('url', '%instagram.com%')
		.order('created_at', { ascending: false })
		.limit(limit);

	if (error) {
		console.error('Error fetching Instagram cards:', error);
		return [];
	}

	// Filter to cards that need re-processing
	const badCards = (data || []).filter(card => {
		const imageUrl = card.image_url || '';
		const metadata = card.metadata || {};

		// Bad if: not persisted, using CDN URLs that expire, or no image
		return (
			!metadata.mediaPersisted ||
			imageUrl.includes('cdninstagram.com') ||
			imageUrl.includes('scontent') ||
			!imageUrl
		);
	});

	console.log(`  Found ${badCards.length} Instagram cards needing re-processing`);
	return badCards;
}

async function reprocessCard(card: Card): Promise<boolean> {
	if (dryRun) {
		console.log(`  [DRY RUN] Would reprocess: ${card.url}`);
		return true;
	}

	try {
		// Clear the bad image and mark for re-processing
		const { error: updateError } = await supabase
			.from('cards')
			.update({
				image_url: null,
				metadata: {
					...card.metadata,
					processing: true,
					reprocessed: true,
					reprocessedAt: new Date().toISOString(),
				},
			})
			.eq('id', card.id);

		if (updateError) {
			console.error(`  Error updating card ${card.id}:`, updateError);
			return false;
		}

		// Trigger enrichment
		const enrichUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3737'}/api/enrich`;
		const response = await fetch(enrichUrl, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ cardId: card.id }),
		});

		if (!response.ok) {
			console.error(`  Enrichment failed for ${card.id}: ${response.status}`);
			return false;
		}

		console.log(`  ✓ Triggered re-processing for: ${card.url.slice(0, 60)}...`);
		return true;
	} catch (error) {
		console.error(`  Error reprocessing card ${card.id}:`, error);
		return false;
	}
}

async function main() {
	console.log('🔄 Card Re-processing Script');
	console.log('=============================');

	if (dryRun) {
		console.log('🏃 DRY RUN MODE - No changes will be made\n');
	}

	let cardsToProcess: Card[] = [];

	if (processAll || platform === 'twitter') {
		const twitterCards = await findBadTwitterCards();
		cardsToProcess = [...cardsToProcess, ...twitterCards];
	}

	if (processAll || platform === 'instagram') {
		const instagramCards = await findBadInstagramCards();
		cardsToProcess = [...cardsToProcess, ...instagramCards];
	}

	if (cardsToProcess.length === 0) {
		console.log('\n✅ No cards need re-processing!');
		return;
	}

	console.log(`\n📋 Total cards to re-process: ${cardsToProcess.length}`);

	if (!dryRun) {
		console.log('\n⏳ Starting re-processing (with 2s delay between cards)...\n');
	}

	let successCount = 0;
	let failCount = 0;

	for (const card of cardsToProcess) {
		const success = await reprocessCard(card);
		if (success) {
			successCount++;
		} else {
			failCount++;
		}

		// Rate limit to avoid overwhelming the server
		if (!dryRun) {
			await new Promise(resolve => setTimeout(resolve, 2000));
		}
	}

	console.log('\n=============================');
	console.log(`✅ Successfully processed: ${successCount}`);
	if (failCount > 0) {
		console.log(`❌ Failed: ${failCount}`);
	}
}

main().catch(console.error);
