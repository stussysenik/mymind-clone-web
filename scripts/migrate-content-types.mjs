#!/usr/bin/env node
/**
 * Migration script to reclassify content types
 * Run with: node scripts/migrate-content-types.mjs
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://quxaamiuzdzpzrccohbu.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1eGFhbWl1emR6cHpyY2NvaGJ1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Nzk5MDE2MCwiZXhwIjoyMDgzNTY2MTYwfQ.tgATHXHklEapDtkBUrkvjbEkhZxob4-RaksWPGXXtxY';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function migrate() {
  console.log('🚀 Starting content type migration...\n');

  // Migration rules: [url pattern, old type, new type, description]
  const migrations = [
    { pattern: '%twitter.com%', oldType: 'article', newType: 'social', desc: 'Twitter' },
    { pattern: '%x.com%', oldType: 'article', newType: 'social', desc: 'X (Twitter)' },
    { pattern: '%instagram.com%', oldType: 'article', newType: 'social', desc: 'Instagram' },
    { pattern: '%reddit.com%', oldType: 'article', newType: 'social', desc: 'Reddit' },
    { pattern: '%linkedin.com%', oldType: 'article', newType: 'social', desc: 'LinkedIn' },
    { pattern: '%bsky.app%', oldType: 'article', newType: 'social', desc: 'Bluesky' },
    { pattern: '%mastodon%', oldType: 'article', newType: 'social', desc: 'Mastodon' },
    { pattern: '%imdb.com%', oldType: 'article', newType: 'movie', desc: 'IMDB' },
    { pattern: '%letterboxd.com%', oldType: 'article', newType: 'movie', desc: 'Letterboxd' },
    { pattern: '%thestorygraph.com%', oldType: 'article', newType: 'book', desc: 'StoryGraph' },
    { pattern: '%goodreads.com%', oldType: 'article', newType: 'book', desc: 'Goodreads' },
  ];

  let totalMigrated = 0;

  for (const { pattern, oldType, newType, desc } of migrations) {
    // Find matching cards
    const { data: cards, error: findError } = await supabase
      .from('cards')
      .select('id')
      .eq('type', oldType)
      .ilike('url', pattern);

    if (findError) {
      console.error(`❌ Error finding ${desc} cards:`, findError.message);
      continue;
    }

    if (!cards || cards.length === 0) {
      console.log(`⏭️  ${desc}: No cards to migrate`);
      continue;
    }

    // Update the cards
    const ids = cards.map(c => c.id);
    const { error: updateError } = await supabase
      .from('cards')
      .update({ type: newType })
      .in('id', ids);

    if (updateError) {
      console.error(`❌ Error migrating ${desc} cards:`, updateError.message);
    } else {
      console.log(`✅ ${desc}: Migrated ${cards.length} cards from '${oldType}' → '${newType}'`);
      totalMigrated += cards.length;
    }
  }

  // Also migrate legacy 'twitter' and 'reddit' typed cards
  const { data: legacyTwitter } = await supabase
    .from('cards')
    .select('id')
    .eq('type', 'twitter');

  if (legacyTwitter && legacyTwitter.length > 0) {
    await supabase
      .from('cards')
      .update({ type: 'social' })
      .in('id', legacyTwitter.map(c => c.id));
    console.log(`✅ Legacy twitter: Migrated ${legacyTwitter.length} cards → 'social'`);
    totalMigrated += legacyTwitter.length;
  }

  const { data: legacyReddit } = await supabase
    .from('cards')
    .select('id')
    .eq('type', 'reddit');

  if (legacyReddit && legacyReddit.length > 0) {
    await supabase
      .from('cards')
      .update({ type: 'social' })
      .in('id', legacyReddit.map(c => c.id));
    console.log(`✅ Legacy reddit: Migrated ${legacyReddit.length} cards → 'social'`);
    totalMigrated += legacyReddit.length;
  }

  // Print summary
  console.log('\n📊 Migration complete!');
  console.log(`   Total cards migrated: ${totalMigrated}`);

  // Show current type distribution
  const { data: typeCounts } = await supabase
    .from('cards')
    .select('type');

  if (typeCounts) {
    const counts = {};
    typeCounts.forEach(c => {
      counts[c.type] = (counts[c.type] || 0) + 1;
    });
    console.log('\n📈 Current type distribution:');
    Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .forEach(([type, count]) => {
        console.log(`   ${type}: ${count}`);
      });
  }
}

migrate().catch(console.error);
