#!/usr/bin/env node
/**
 * Re-extract Instagram carousels that failed previously
 *
 * This script finds all Instagram cards where:
 * - URL matches instagram.com/p/ or /reel/
 * - metadata.carouselImages is empty/missing OR only has 1 image
 * - Card is not currently processing
 *
 * And triggers re-extraction by calling the /api/enrich endpoint.
 *
 * Run with: node scripts/reextract-instagram-carousels.mjs
 *
 * Options:
 *   --dry-run     Show what would be re-extracted without making changes
 *   --limit N     Only process N cards (default: all)
 *   --force       Re-extract even cards with multiple images
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

// Load environment variables from .env.local (relative to this script in apps/web/scripts)
const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, '../.env.local');

function loadEnvFile(path) {
  try {
    const content = readFileSync(path, 'utf-8');
    const vars = {};
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const eqIndex = trimmed.indexOf('=');
        if (eqIndex > 0) {
          const key = trimmed.slice(0, eqIndex);
          const value = trimmed.slice(eqIndex + 1);
          vars[key] = value;
        }
      }
    }
    return vars;
  } catch (e) {
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

// Parse command line args
const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const FORCE = args.includes('--force');
const limitIndex = args.indexOf('--limit');
const LIMIT = limitIndex !== -1 ? parseInt(args[limitIndex + 1], 10) : null;

// API endpoint for re-enrichment (default port 3737 matches bun run dev)
const ENRICH_API_URL = process.env.ENRICH_API_URL || 'http://localhost:3737/api/enrich';

async function findFailedInstagramCards() {
  console.log('🔍 Finding Instagram cards that need re-extraction...\n');

  // Find all Instagram cards
  const { data: instagramCards, error: findError } = await supabase
    .from('cards')
    .select('id, title, url, image_url, metadata, created_at')
    .or('url.ilike.%instagram.com/p/%,url.ilike.%instagram.com/reel/%')
    .neq('metadata->>processing', 'true')
    .order('created_at', { ascending: false });

  if (findError) {
    console.error('❌ Error finding cards:', findError.message);
    return [];
  }

  if (!instagramCards || instagramCards.length === 0) {
    console.log('✅ No Instagram cards found.');
    return [];
  }

  console.log(`📋 Found ${instagramCards.length} Instagram cards total\n`);

  // Filter to cards that need re-extraction
  const failedCards = instagramCards.filter(card => {
    const metadata = card.metadata || {};
    // Fix: API stores images in metadata.images, not metadata.carouselImages
    const carouselImages = metadata.images || metadata.carouselImages || [];

    // Force flag: re-extract all cards
    if (FORCE) return true;

    // Check if extraction failed or only got 1 image (likely incomplete carousel)
    const hasNoImages = carouselImages.length === 0;
    const hasSingleImage = carouselImages.length === 1;
    const hasExtractionError = metadata.carouselExtractionFailed === true;
    const hasEnrichmentError = !!metadata.enrichmentError;

    // Also check if the main image_url looks like a low-quality placeholder
    const hasLowQualityImage = card.image_url && (
      card.image_url.includes('150x150') ||
      card.image_url.includes('_t.jpg') ||
      card.image_url.includes('_s.jpg') ||
      card.image_url.includes('profile_pic')
    );

    return hasNoImages || hasSingleImage || hasExtractionError || hasEnrichmentError || hasLowQualityImage;
  });

  return failedCards;
}

async function triggerReExtraction(card) {
  // Mark the card for re-processing
  const { error: updateError } = await supabase
    .from('cards')
    .update({
      metadata: {
        ...card.metadata,
        processing: true,
        reextractionRequested: true,
        reextractionRequestedAt: new Date().toISOString(),
        // Clear previous errors
        enrichmentError: null,
        carouselExtractionFailed: null,
      }
    })
    .eq('id', card.id);

  if (updateError) {
    throw new Error(`Failed to mark card for re-processing: ${updateError.message}`);
  }

  // Call the enrich API endpoint
  try {
    const response = await fetch(ENRICH_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-service-key': SUPABASE_SERVICE_KEY,
      },
      body: JSON.stringify({
        cardId: card.id,
        url: card.url,
        forceReextract: true,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      console.warn(`    ⚠️  API returned ${response.status}: ${text.slice(0, 100)}`);
      // Don't throw - the card is marked for processing and will be picked up later
    }
  } catch (fetchError) {
    console.warn(`    ⚠️  Could not reach API: ${fetchError.message}`);
    // Don't throw - the card is marked and can be processed when API is available
  }
}

async function reextractInstagramCarousels() {
  console.log('🖼️  Instagram Carousel Re-extraction Script\n');
  console.log('═'.repeat(60));

  if (DRY_RUN) {
    console.log('🔵 DRY RUN MODE - No changes will be made\n');
  }

  if (FORCE) {
    console.log('🔴 FORCE MODE - Re-extracting ALL Instagram cards\n');
  }

  const failedCards = await findFailedInstagramCards();

  if (failedCards.length === 0) {
    console.log('✅ No cards need re-extraction!');
    return;
  }

  // Apply limit if specified
  const cardsToProcess = LIMIT ? failedCards.slice(0, LIMIT) : failedCards;

  console.log(`\n🚨 Found ${failedCards.length} cards that need re-extraction`);
  if (LIMIT && failedCards.length > LIMIT) {
    console.log(`   (Processing only first ${LIMIT} due to --limit flag)`);
  }
  console.log('\nCards to re-extract:');
  console.log('─'.repeat(60));

  for (const card of cardsToProcess) {
    const metadata = card.metadata || {};
    // Fix: API stores images in metadata.images, not metadata.carouselImages
    const carouselImages = metadata.images || metadata.carouselImages || [];
    const title = card.title || 'Untitled';
    const shortcode = card.url.match(/\/(p|reel)\/([A-Za-z0-9_-]+)/)?.[2] || 'unknown';

    console.log(`  • ${title.slice(0, 35)}...`);
    console.log(`    URL: instagram.com/p/${shortcode}`);
    console.log(`    Current images: ${carouselImages.length}`);
    if (metadata.enrichmentError) {
      console.log(`    Previous error: ${metadata.enrichmentError.slice(0, 50)}...`);
    }
    console.log('');
  }
  console.log('─'.repeat(60));

  if (DRY_RUN) {
    console.log('\n🔵 DRY RUN - Would have re-extracted the above cards');
    console.log('   Run without --dry-run to actually re-extract');
    return;
  }

  // Process cards
  console.log('\n🔄 Starting re-extraction...\n');

  let successCount = 0;
  let errorCount = 0;

  for (const card of cardsToProcess) {
    const title = (card.title || card.url || 'Untitled').slice(0, 40);

    try {
      await triggerReExtraction(card);
      console.log(`  ✅ Queued: ${title}...`);
      successCount++;

      // Small delay between requests to avoid overwhelming the API
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (err) {
      console.error(`  ❌ Failed: ${title}... - ${err.message}`);
      errorCount++;
    }
  }

  console.log('\n' + '═'.repeat(60));
  console.log('📊 Re-extraction Summary:');
  console.log(`   • Total cards found needing re-extraction: ${failedCards.length}`);
  console.log(`   • Cards processed: ${cardsToProcess.length}`);
  console.log(`   • Successfully queued: ${successCount}`);
  console.log(`   • Errors: ${errorCount}`);
  console.log('═'.repeat(60));
  console.log('\n💡 Note: Cards are queued for background extraction.');
  console.log('   Check the app or logs to monitor progress.');
}

reextractInstagramCarousels().catch(console.error);
