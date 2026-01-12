/**
 * Delete Space API
 * 
 * Permanently deletes all cards that contain a specific tag.
 * This is a destructive operation and should be confirmed by the user.
 * 
 * @fileoverview API endpoint for deleting spaces (and all their cards)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase';
import { deleteLocalCard, getLocalCards } from '@/lib/local-storage';

export async function POST(request: NextRequest) {
        try {
                const { tag } = await request.json();

                if (!tag || typeof tag !== 'string') {
                        return NextResponse.json({ error: 'Tag is required' }, { status: 400 });
                }

                const normalizedTag = tag.trim().toLowerCase();

                // Try Supabase first
                const client = getSupabaseClient(true);
                let supabaseDeleted = 0;

                if (client) {
                        // Delete all cards that contain this tag
                        const { data: deletedCards, error } = await client
                                .from('cards')
                                .delete()
                                .contains('tags', [normalizedTag])
                                .select('id');

                        if (error) {
                                console.error('[DeleteSpace] Supabase error:', error.message);
                                return NextResponse.json({ error: error.message }, { status: 500 });
                        }

                        supabaseDeleted = deletedCards?.length || 0;
                        console.log(`[DeleteSpace] Deleted ${supabaseDeleted} cards from Supabase for tag: ${normalizedTag}`);
                }

                // Also handle localStorage cards (for demo mode)
                let localDeleted = 0;
                if (typeof window !== 'undefined' || process.env.NODE_ENV === 'development') {
                        // Note: This runs on server, localStorage is client-side
                        // The client will need to handle local storage deletion separately
                }

                return NextResponse.json({
                        success: true,
                        deleted: supabaseDeleted,
                        tag: normalizedTag
                });
        } catch (err) {
                console.error('[DeleteSpace] Error:', err);
                return NextResponse.json({
                        error: err instanceof Error ? err.message : 'Failed to delete space'
                }, { status: 500 });
        }
}
