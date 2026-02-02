#!/usr/bin/env node
/**
 * Cleanup script for stuck "Analyzing" cards
 *
 * This script finds all cards where:
 * - metadata.processing = true
 * - enrichmentTiming.startedAt is older than 5 minutes
 *
 * And clears the processing flag so they display normally.
 *
 * Run with: node scripts/cleanup-stuck-cards.mjs
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://quxaamiuzdzpzrccohbu.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1eGFhbWl1emR6cHpyY2NvaGJ1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Nzk5MDE2MCwiZXhwIjoyMDgzNTY2MTYwfQ.tgATHXHklEapDtkBUrkvjbEkhZxob4-RaksWPGXXtxY';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// 5 minutes in milliseconds
const STUCK_TIMEOUT_MS = 5 * 60 * 1000;

async function cleanupStuckCards() {
  console.log('🔍 Finding stuck "Analyzing" cards...\n');

  // Find all cards with processing = true
  const { data: processingCards, error: findError } = await supabase
    .from('cards')
    .select('id, title, url, metadata, created_at')
    .eq('metadata->>processing', 'true');

  if (findError) {
    console.error('❌ Error finding cards:', findError.message);
    return;
  }

  if (!processingCards || processingCards.length === 0) {
    console.log('✅ No cards with processing=true found. All good!');
    return;
  }

  console.log(`📋 Found ${processingCards.length} cards with processing=true\n`);

  const now = Date.now();
  const stuckCards = [];
  const activeCards = [];

  for (const card of processingCards) {
    const startedAt = card.metadata?.enrichmentTiming?.startedAt;
    const createdAt = new Date(card.created_at).getTime();

    // Use startedAt if available, otherwise fall back to created_at
    const processingStart = startedAt || createdAt;
    const elapsedMs = now - processingStart;
    const elapsedMinutes = Math.round(elapsedMs / 1000 / 60);

    if (elapsedMs > STUCK_TIMEOUT_MS) {
      stuckCards.push({ ...card, elapsedMinutes });
    } else {
      activeCards.push({ ...card, elapsedMinutes });
    }
  }

  console.log(`⏱️  Active (< 5 min): ${activeCards.length} cards`);
  console.log(`🚨 Stuck (> 5 min): ${stuckCards.length} cards\n`);

  if (stuckCards.length === 0) {
    console.log('✅ No stuck cards to clean up!');
    return;
  }

  // Show stuck cards
  console.log('Stuck cards to clean up:');
  console.log('─'.repeat(60));
  for (const card of stuckCards) {
    const title = card.title || card.url || 'Untitled';
    console.log(`  • ${title.slice(0, 50)}... (${card.elapsedMinutes} min ago)`);
  }
  console.log('─'.repeat(60));
  console.log('');

  // Clean up stuck cards
  console.log('🧹 Cleaning up stuck cards...\n');

  let cleanedCount = 0;
  let errorCount = 0;

  for (const card of stuckCards) {
    try {
      // Update metadata to clear processing flag
      const updatedMetadata = {
        ...card.metadata,
        processing: false,
        enrichmentError: 'Enrichment timed out after 5 minutes',
        enrichmentFailedAt: new Date().toISOString(),
      };

      const { error: updateError } = await supabase
        .from('cards')
        .update({ metadata: updatedMetadata })
        .eq('id', card.id);

      if (updateError) {
        console.error(`  ❌ Failed to update ${card.id}: ${updateError.message}`);
        errorCount++;
      } else {
        console.log(`  ✅ Cleaned: ${(card.title || card.url || 'Untitled').slice(0, 40)}...`);
        cleanedCount++;
      }
    } catch (err) {
      console.error(`  ❌ Error updating ${card.id}:`, err);
      errorCount++;
    }
  }

  console.log('\n' + '═'.repeat(60));
  console.log(`📊 Cleanup Summary:`);
  console.log(`   • Total stuck cards found: ${stuckCards.length}`);
  console.log(`   • Successfully cleaned: ${cleanedCount}`);
  console.log(`   • Errors: ${errorCount}`);
  console.log('═'.repeat(60));
}

cleanupStuckCards().catch(console.error);
