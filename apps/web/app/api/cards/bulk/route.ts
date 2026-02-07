/**
 * Bulk Card Operations API
 * 
 * @fileoverview POST /api/cards/bulk - Handle bulk operations like empty trash, restore all
 */

import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/supabase-server';
import { getSupabaseClient } from '@/lib/supabase';

export async function POST(request: NextRequest) {
        try {
                const user = await getUser();
                if (!user) {
                        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
                }

                const { action } = await request.json();
                const client = getSupabaseClient(true);

                if (!client) {
                        return NextResponse.json({ success: false, error: 'Database not configured' }, { status: 500 });
                }

                let affectedCount = 0;

                switch (action) {
                        case 'empty-trash': {
                                // Permanently delete all trashed cards for this user
                                const { data, error } = await client
                                        .from('cards')
                                        .delete()
                                        .eq('user_id', user.id)
                                        .not('deleted_at', 'is', null)
                                        .select('id');

                                if (error) throw error;
                                affectedCount = data?.length || 0;
                                console.log(`[Bulk] Empty trash: deleted ${affectedCount} cards for user ${user.id}`);
                                break;
                        }

                        case 'restore-all': {
                                // Restore all trashed cards for this user
                                const { data, error } = await client
                                        .from('cards')
                                        .update({ deleted_at: null })
                                        .eq('user_id', user.id)
                                        .not('deleted_at', 'is', null)
                                        .select('id');

                                if (error) throw error;
                                affectedCount = data?.length || 0;
                                console.log(`[Bulk] Restore all: restored ${affectedCount} cards for user ${user.id}`);
                                break;
                        }

                        case 'archive-all': {
                                // Archive all active cards for this user
                                const { data, error } = await client
                                        .from('cards')
                                        .update({ archived_at: new Date().toISOString() })
                                        .eq('user_id', user.id)
                                        .is('deleted_at', null)
                                        .is('archived_at', null)
                                        .select('id');

                                if (error) throw error;
                                affectedCount = data?.length || 0;
                                console.log(`[Bulk] Archive all: archived ${affectedCount} cards for user ${user.id}`);
                                break;
                        }

                        default:
                                return NextResponse.json(
                                        { success: false, error: `Unknown action: ${action}` },
                                        { status: 400 }
                                );
                }

                return NextResponse.json({ success: true, affectedCount });
        } catch (error) {
                console.error('[Bulk] Error:', error);
                return NextResponse.json(
                        { success: false, error: error instanceof Error ? error.message : 'Bulk operation failed' },
                        { status: 500 }
                );
        }
}
