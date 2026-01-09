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
                .order('created_at', { ascending: false })
                .limit(limit);

        if (userId) {
                query = query.eq('user_id', userId);
        }

        const { data, error } = await query;

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
        query: string,
        userId?: string,
        limit: number = 50
): Promise<CardRow[] | null> {
        const client = getSupabaseClient(true);
        if (!client) return null;

        const searchPattern = `%${query}%`;

        let dbQuery = client
                .from('cards')
                .select('*')
                .or(`title.ilike.${searchPattern},content.ilike.${searchPattern}`)
                .order('created_at', { ascending: false })
                .limit(limit);

        if (userId) {
                dbQuery = dbQuery.eq('user_id', userId);
        }

        const { data, error } = await dbQuery;

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
                return null;
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
export async function deleteCard(id: string): Promise<boolean> {
        const client = getSupabaseClient(true);
        if (!client) return false;

        const { error } = await client
                .from('cards')
                .delete()
                .eq('id', id);

        if (error) {
                console.error('[Supabase] Error deleting card:', error.message);
                return false;
        }

        return true;
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
