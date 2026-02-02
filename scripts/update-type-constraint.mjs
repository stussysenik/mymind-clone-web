#!/usr/bin/env node
/**
 * Update the cards_type_check constraint to allow new types
 * Run with: node scripts/update-type-constraint.mjs
 */

const SUPABASE_URL = 'https://quxaamiuzdzpzrccohbu.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1eGFhbWl1emR6cHpyY2NvaGJ1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Nzk5MDE2MCwiZXhwIjoyMDgzNTY2MTYwfQ.tgATHXHklEapDtkBUrkvjbEkhZxob4-RaksWPGXXtxY';

async function updateConstraint() {
  console.log('🔧 Updating type constraint to allow social and movie types...\n');

  // Use the Supabase SQL endpoint
  const sql = `
    -- Drop the existing constraint
    ALTER TABLE cards DROP CONSTRAINT IF EXISTS cards_type_check;

    -- Add the new constraint with social and movie types
    ALTER TABLE cards ADD CONSTRAINT cards_type_check
    CHECK (type IN ('article', 'image', 'note', 'product', 'book', 'video', 'audio', 'social', 'movie', 'website'));
  `;

  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_SERVICE_KEY,
      'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
    },
    body: JSON.stringify({ query: sql }),
  });

  if (!response.ok) {
    // The RPC function might not exist, let's try a different approach
    console.log('RPC method not available. Please run this SQL manually in the Supabase SQL Editor:\n');
    console.log('-------------------------------------------');
    console.log(sql);
    console.log('-------------------------------------------');
    console.log('\nThen run: node scripts/migrate-content-types.mjs');
  } else {
    console.log('✅ Constraint updated successfully!');
  }
}

updateConstraint().catch(console.error);
