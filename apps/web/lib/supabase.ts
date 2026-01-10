/**
 * MyMind Clone - Supabase Client Configuration
 * 
 * This file provides configured Supabase clients for both server and client usage.
 * In demo mode (no env vars), we return null and the app falls back to demo data.
 * 
 * @fileoverview Supabase database client setup with environment variable handling
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { CardRow } from './types';

// =============================================================================
// ENVIRONMENT CONFIGURATION
// =============================================================================

/**
 * Supabase project URL from environment variables.
 * In demo mode, this will be undefined.
 */
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

/**
 * Supabase anonymous key for client-side operations.
 * Has row-level security (RLS) applied.
 */
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/**
 * Supabase service role key for server-side operations.
 * Bypasses RLS - use only in server contexts.
 */
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// =============================================================================
// CLIENT INSTANCES
// =============================================================================

/**
 * Browser-safe Supabase client using the anonymous key.
 * Returns null if Supabase is not configured (demo mode).
 * 
 * Use this client for:
 * - Client Components
 * - Client-side data fetching
 * - Real-time subscriptions
 */
export const supabaseBrowser: SupabaseClient | null =
        supabaseUrl && supabaseAnonKey
                ? createClient(supabaseUrl, supabaseAnonKey)
                : null;

/**
 * Server-side Supabase client using the service role key.
 * Returns null if Supabase is not configured (demo mode).
 * 
 * Use this client for:
 * - Server Components
 * - API Routes
 * - Batch operations that need to bypass RLS
 * 
 * ⚠️ Never expose this client to the browser!
 */
export const supabaseAdmin: SupabaseClient | null =
        supabaseUrl && supabaseServiceKey
                ? createClient(supabaseUrl, supabaseServiceKey, {
                        auth: {
                                autoRefreshToken: false,
                                persistSession: false,
                        },
                })
                : null;

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Checks if Supabase is properly configured.
 * When false, the app runs in demo mode with mock data.
 */
export function isSupabaseConfigured(): boolean {
        return supabaseUrl !== undefined && supabaseAnonKey !== undefined;
}

/**
 * Gets the appropriate Supabase client based on context.
 * Returns null if not configured (triggers demo mode).
 * 
 * @param isServer - Whether the code is running on the server
 */
export function getSupabaseClient(isServer: boolean = false): SupabaseClient | null {
        if (!isSupabaseConfigured()) {
                return null;
        }
        return isServer && supabaseServiceKey ? supabaseAdmin : supabaseBrowser;
}

// =============================================================================
// DATABASE OPERATIONS
// =============================================================================

/**
 * Fetches all cards for a user from the database.
 * Returns null if Supabase is not configured.
 * 
 * @param userId - The user ID to fetch cards for (optional in demo)
 * @param limit - Maximum number of cards to return
 */
export async function fetchCards(
        userId?: string,
        limit: number = 100
): Promise<CardRow[] | null> {
        const client = getSupabaseClient(true);
        if (!client) return null;

        let query = client
                .from('cards')
                .select('*')
                .is('deleted_at', null)
                .order('created_at', { ascending: false })
                .limit(limit);

        if (userId) {
                query = query.eq('user_id', userId);
        }

        const { data, error } = await query;

        // Fallback for missing migration (missing deleted_at column)
        if (error && error.message?.includes('deleted_at')) {
                console.warn('[Supabase] Migration missing (deleted_at). Falling back to basic query.');
                // Retry without soft-delete filter
                const retryQuery = client
                        .from('cards')
                        .select('*')
                        .order('created_at', { ascending: false })
                        .limit(limit);

                if (userId) retryQuery.eq('user_id', userId);

                const { data: retryData, error: retryError } = await retryQuery;
                if (retryError) {
                        console.error('[Supabase] Retry failed:', retryError.message);
                        return null;
                }
                return retryData as CardRow[];
        }

        if (error) {
                console.error('[Supabase] Error fetching cards:', error.message);
                return null;
        }

        return data as CardRow[];
}

/**
 * Searches cards by query string using full-text search.
 * Searches across title, content, and tags.
 * 
 * @param query - Search term
 * @param userId - Filter by user ID (optional)
 * @param limit - Maximum results
 */
export async function searchCards(
        query: string | string[],
        userId?: string,
        limit: number = 50
): Promise<CardRow[] | null> {
        const client = getSupabaseClient(true);
        if (!client) return null;

        const terms = Array.isArray(query) ? query : [query];

        // Build OR filter for all terms across title, content, and tags (if array column support improved, otherwise just text/title)
        // Note: For tags (array), we need 'cs' (contains) or text search. ilike works on text representation of json/array sometimes but explicit text search is better.
        // For simplicity, we stick to title/content ilike for now, enabling partial matches.

        const filters = terms.map(term => {
                const pattern = `%${term}%`;
                return `title.ilike.${pattern},content.ilike.${pattern}`;
        }).join(',');

        let dbQuery = client
                .from('cards')
                .select('*')
                .or(filters)
                .is('deleted_at', null)
                .order('created_at', { ascending: false })
                .limit(limit);

        if (userId) {
                dbQuery = dbQuery.eq('user_id', userId);
        }

        const { data, error } = await dbQuery;

        // Fallback for missing migration
        if (error && error.message?.includes('deleted_at')) {
                const retryQuery = client
                        .from('cards')
                        .select('*')
                        .or(filters)
                        .order('created_at', { ascending: false })
                        .limit(limit);

                if (userId) retryQuery.eq('user_id', userId);

                const { data: retryData, error: retryError } = await retryQuery;
                if (retryError) return null;
                return retryData as CardRow[];
        }

        if (error) {
                console.error('[Supabase] Error searching cards:', error.message);
                return null;
        }

        return data as CardRow[];
}

/**
 * Inserts a new card into the database.
 * 
 * @param card - Partial card row to insert
 */
export async function insertCard(card: Partial<CardRow>): Promise<CardRow | null> {
        const client = getSupabaseClient(true);
        if (!client) return null;

        const { data, error } = await client
                .from('cards')
                .insert(card)
                .select()
                .single();

        if (error) {
                console.error('[Supabase] Error inserting card:', error.message);
                throw new Error(error.message); // Throw matching error
        }

        return data as CardRow;
}

/**
 * Updates an existing card.
 * 
 * @param id - Card ID to update
 * @param updates - Partial card data to update
 */
export async function updateCard(
        id: string,
        updates: Partial<CardRow>
): Promise<CardRow | null> {
        const client = getSupabaseClient(true);
        if (!client) return null;

        const { data, error } = await client
                .from('cards')
                .update({ ...updates, updated_at: new Date().toISOString() })
                .eq('id', id)
                .select()
                .single();

        if (error) {
                console.error('[Supabase] Error updating card:', error.message);
                return null;
        }

        return data as CardRow;
}

/**
 * Deletes a card by ID.
 * 
 * @param id - Card ID to delete
 */
/**
 * Soft deletes a card by ID.
 */
export async function deleteCard(id: string): Promise<boolean> {
        const client = getSupabaseClient(true);
        if (!client) return false;

        const { error } = await client
                .from('cards')
                .update({ deleted_at: new Date().toISOString() })
                .eq('id', id);

        if (error) {
                console.error('[Supabase] Error soft-deleting card:', error.message);
                return false;
        }

        return true;
}

/**
 * Restores a soft-deleted card.
 */
export async function restoreCard(id: string): Promise<boolean> {
        const client = getSupabaseClient(true);
        if (!client) return false;

        const { error } = await client
                .from('cards')
                .update({ deleted_at: null })
                .eq('id', id);

        if (error) {
                console.error('[Supabase] Error restoring card:', error.message);
                return false;
        }

        return true;
}

/**
 * Permanently deletes a card.
 */
export async function permanentDeleteCard(id: string): Promise<boolean> {
        const client = getSupabaseClient(true);
        if (!client) return false;

        const { error } = await client
                .from('cards')
                .delete()
                .eq('id', id);

        if (error) {
                console.error('[Supabase] Error permanently deleting card:', error.message);
                return false;
        }

        return true;
}

/**
 * Fetches deleted cards (Trash).
 */
export async function fetchDeletedCards(userId?: string): Promise<CardRow[] | null> {
        const client = getSupabaseClient(true);
        if (!client) return null;

        let query = client
                .from('cards')
                .select('*')
                // .not('deleted_at', 'is', null) // Syntax might vary, 'neq' null is better?
                // Supabase JS: .not('deleted_at', 'is', null) is correct for IS NOT NULL
                .not('deleted_at', 'is', null)
                .order('deleted_at', { ascending: false });

        if (userId) {
                query = query.eq('user_id', userId);
        }

        const { data, error } = await query;

        // Fallback for missing migration
        if (error && error.message?.includes('deleted_at')) {
                console.warn('[Supabase] Migration missing (deleted_at). Returning empty trash.');
                return [];
        }

        if (error) {
                console.error('[Supabase] Error fetching deleted cards:', error.message);
                return null;
        }

        return data as CardRow[];
}

/**
 * Gets unique tags for a user.
 * 
 * @param userId - The user ID
 */
export async function getUniqueTags(userId?: string): Promise<{ tag: string; count: number }[] | null> {
        const client = getSupabaseClient(true);
        if (!client) return null;

        let query = client.from('cards').select('tags');

        if (userId) {
                query = query.eq('user_id', userId);
        }

        const { data, error } = await query;

        if (error) {
                console.error('[Supabase] Error fetching tags:', error.message);
                return null;
        }

        // Aggregate tags
        const tagCounts: Record<string, number> = {};
        data.forEach((row: { tags: string[] | null }) => {
                if (row.tags) {
                        row.tags.forEach(tag => {
                                tagCounts[tag] = (tagCounts[tag] || 0) + 1;
                        });
                }
        });

        // Convert to array and sort by count
        return Object.entries(tagCounts)
                .map(([tag, count]) => ({ tag, count }))
                .sort((a, b) => b.count - a.count);
}

/**
 * Fetches random cards for serendipity.
 * Strategy: Fetch IDs, pick random ones, fetch content.
 */
export async function fetchRandomCards(userId?: string, limit: number = 5): Promise<CardRow[] | null> {
        const client = getSupabaseClient(true);
        if (!client) return null;

        // 1. Fetch all IDs (lightweight)
        let query = client.from('cards').select('id').is('deleted_at', null); // Exclude deleted
        if (userId) query = query.eq('user_id', userId);

        const { data: allIds, error } = await query;

        if (error || !allIds || allIds.length === 0) return [];

        // 2. Pick random IDs
        const randomIds = allIds
                .sort(() => 0.5 - Math.random())
                .slice(0, limit)
                .map(row => row.id);

        // 3. Fetch full cards
        const { data: cards, error: fetchError } = await client
                .from('cards')
                .select('*')
                .in('id', randomIds);

        if (fetchError) {
                console.error('[Supabase] Error fetching random cards:', fetchError.message);
                return null;
        }

        return cards as CardRow[];
}

