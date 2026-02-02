#!/usr/bin/env node
/**
 * Migration script to backfill metadata.platform for existing cards
 *
 * This script:
 * 1. Queries all cards that have a URL but no metadata.platform set
 * 2. Detects the platform from the URL
 * 3. Updates the metadata.platform field
 *
 * Run with: node scripts/migrate-platforms.mjs
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://quxaamiuzdzpzrccohbu.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1eGFhbWl1emR6cHpyY2NvaGJ1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Nzk5MDE2MCwiZXhwIjoyMDgzNTY2MTYwfQ.tgATHXHklEapDtkBUrkvjbEkhZxob4-RaksWPGXXtxY';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

/**
 * Detects the platform from a URL (same logic as lib/platforms.ts)
 */
function detectPlatform(url) {
  if (!url) return 'unknown';

  const urlLower = url.toLowerCase();

  if (urlLower.includes('twitter.com') || urlLower.includes('x.com')) return 'twitter';
  if (urlLower.includes('mastodon') || urlLower.includes('mathstodon') ||
      urlLower.includes('fosstodon') || urlLower.includes('hachyderm.io') ||
      urlLower.includes('mas.to') || urlLower.includes('mstdn.social') ||
      urlLower.includes('mstdn.jp') || urlLower.includes('infosec.exchange') ||
      urlLower.includes('sigmoid.social')) return 'mastodon';
  if (urlLower.includes('instagram.com')) return 'instagram';
  if (urlLower.includes('youtube.com') || urlLower.includes('youtu.be')) return 'youtube';
  if (urlLower.includes('reddit.com')) return 'reddit';
  if (urlLower.includes('letterboxd.com')) return 'letterboxd';
  if (urlLower.includes('imdb.com')) return 'imdb';
  if (urlLower.includes('spotify.com') || urlLower.includes('open.spotify.com')) return 'spotify';
  if (urlLower.includes('github.com')) return 'github';
  if (urlLower.includes('tiktok.com')) return 'tiktok';
  if (urlLower.includes('linkedin.com')) return 'linkedin';
  if (urlLower.includes('pinterest.com') || urlLower.includes('pin.it')) return 'pinterest';
  if (urlLower.includes('medium.com')) return 'medium';
  if (urlLower.includes('substack.com')) return 'substack';
  if (urlLower.includes('goodreads.com')) return 'goodreads';
  if (urlLower.includes('amazon.com') || urlLower.includes('amazon.co') || urlLower.includes('amzn.')) return 'amazon';
  if (urlLower.includes('thestorygraph.com') || urlLower.includes('storygraph.com')) return 'storygraph';

  return 'unknown';
}

/**
 * Maps platforms to their correct card types (same as PLATFORM_TYPE_MAP in save/route.ts)
 */
const PLATFORM_TYPE_MAP = {
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

async function migrate() {
  console.log('🚀 Starting platform metadata migration...\n');

  // Fetch all cards with URLs
  const { data: cards, error: fetchError } = await supabase
    .from('cards')
    .select('id, url, metadata, type')
    .not('url', 'is', null);

  if (fetchError) {
    console.error('❌ Error fetching cards:', fetchError.message);
    process.exit(1);
  }

  console.log(`📊 Found ${cards.length} cards with URLs\n`);

  // Group cards by needed updates
  const platformUpdates = [];
  const typeUpdates = [];
  const platformCounts = {};
  let alreadyHasPlatform = 0;

  for (const card of cards) {
    const metadata = card.metadata || {};

    // Skip if platform is already set
    if (metadata.platform) {
      alreadyHasPlatform++;
      continue;
    }

    const detectedPlatform = detectPlatform(card.url);

    // Track platform counts for logging
    platformCounts[detectedPlatform] = (platformCounts[detectedPlatform] || 0) + 1;

    // Add to platform update batch
    if (detectedPlatform !== 'unknown') {
      platformUpdates.push({
        id: card.id,
        platform: detectedPlatform,
        metadata: { ...metadata, platform: detectedPlatform }
      });
    }

    // Check if type also needs updating
    const correctType = PLATFORM_TYPE_MAP[detectedPlatform];
    if (card.type !== correctType && detectedPlatform !== 'unknown') {
      typeUpdates.push({
        id: card.id,
        oldType: card.type,
        newType: correctType,
        platform: detectedPlatform
      });
    }
  }

  console.log(`⏭️  ${alreadyHasPlatform} cards already have platform metadata\n`);

  // Show platform distribution
  console.log('📈 Platform detection results:');
  Object.entries(platformCounts)
    .sort((a, b) => b[1] - a[1])
    .forEach(([platform, count]) => {
      console.log(`   ${platform}: ${count}`);
    });
  console.log();

  // Update platform metadata
  if (platformUpdates.length > 0) {
    console.log(`\n🔄 Updating platform metadata for ${platformUpdates.length} cards...`);

    let updated = 0;
    let errors = 0;

    // Process in batches of 50
    for (let i = 0; i < platformUpdates.length; i += 50) {
      const batch = platformUpdates.slice(i, i + 50);

      for (const { id, metadata } of batch) {
        const { error } = await supabase
          .from('cards')
          .update({ metadata })
          .eq('id', id);

        if (error) {
          errors++;
          console.error(`   ❌ Error updating card ${id}:`, error.message);
        } else {
          updated++;
        }
      }

      // Progress indicator
      process.stdout.write(`   Progress: ${Math.min(i + 50, platformUpdates.length)}/${platformUpdates.length}\r`);
    }

    console.log(`\n   ✅ Updated metadata for ${updated} cards (${errors} errors)`);
  }

  // Report type fixes needed
  if (typeUpdates.length > 0) {
    console.log(`\n⚠️  ${typeUpdates.length} cards have incorrect types that should be fixed:`);

    // Group by type transition
    const typeTransitions = {};
    for (const { oldType, newType, platform } of typeUpdates) {
      const key = `${oldType} → ${newType} (${platform})`;
      typeTransitions[key] = (typeTransitions[key] || 0) + 1;
    }

    Object.entries(typeTransitions)
      .sort((a, b) => b[1] - a[1])
      .forEach(([transition, count]) => {
        console.log(`   ${transition}: ${count}`);
      });

    console.log('\n   Run with --fix-types to also update card types');

    // Check if --fix-types flag is present
    if (process.argv.includes('--fix-types')) {
      console.log('\n🔄 Fixing card types...');

      let fixed = 0;
      for (const { id, newType } of typeUpdates) {
        const { error } = await supabase
          .from('cards')
          .update({ type: newType })
          .eq('id', id);

        if (!error) fixed++;
      }

      console.log(`   ✅ Fixed types for ${fixed} cards`);
    }
  }

  console.log('\n✅ Migration complete!');
}

migrate().catch(console.error);
