/**
 * MyMind Clone - Delete Card API
 * 
 * Delete a card by ID from Supabase or localStorage.
 * 
 * @fileoverview DELETE /api/cards/[id] endpoint
 */

import { NextRequest, NextResponse } from 'next/server';
import { deleteCard, permanentDeleteCard, isSupabaseConfigured, updateCard, getSupabaseClient } from '@/lib/supabase';
import { getUser } from '@/lib/supabase-server';

// =============================================================================
// TYPES
// =============================================================================

interface DeleteResponse {
        success: boolean;
        error?: string;
}

interface RouteParams {
        params: Promise<{ id: string }>;
}

// =============================================================================
// HANDLER
// =============================================================================

export async function DELETE(
        request: NextRequest,
        { params }: RouteParams
): Promise<NextResponse<DeleteResponse>> {
        try {
                const { id } = await params;

                if (!id) {
                        return NextResponse.json(
                                { success: false, error: 'Card ID is required' },
                                { status: 400 }
                        );
                }

                // Local cards (starting with 'local-' or 'mock-') are handled client-side
                if (id.startsWith('local-') || id.startsWith('mock-')) {
                        return NextResponse.json({
                                success: true,
                                // Client should handle localStorage deletion
                        });
                }

                if (!isSupabaseConfigured()) {
                        return NextResponse.json(
                                { success: false, error: 'Database not configured' },
                                { status: 500 }
                        );
                }

                const { searchParams } = new URL(request.url);
                const permanent = searchParams.get('permanent') === 'true';

                const success = permanent
                        ? await permanentDeleteCard(id)
                        : await deleteCard(id);

                if (!success) {
                        return NextResponse.json(
                                { success: false, error: 'Failed to delete card' },
                                { status: 500 }
                        );
                }

                return NextResponse.json({ success: true });
        } catch (error) {
                console.error('[API] Delete error:', error);
                return NextResponse.json(
                        {
                                success: false,
                                error: error instanceof Error ? error.message : 'Delete failed',
                        },
                        { status: 500 }
                );
        }
}

export async function PATCH(
        request: NextRequest,
        { params }: RouteParams
): Promise<NextResponse> {
        try {
                const user = await getUser();
                if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

                const { id } = await params;
                const body = await request.json();

                // Check ownership
                const client = getSupabaseClient(true);
                if (!client) return NextResponse.json({ success: false, error: 'DB config error' }, { status: 500 });

                const { data: existing } = await client
                        .from('cards')
                        .select('user_id')
                        .eq('id', id)
                        .single();

                if (!existing || existing.user_id !== user.id) {
                        return NextResponse.json({ success: false, error: 'Not found or forbidden' }, { status: 404 });
                }

                const updated = await updateCard(id, body);
                return NextResponse.json({ success: true, card: updated });
        } catch (error) {
                console.error('[API] Update error:', error);
                return NextResponse.json({ success: false, error: 'Update failed' }, { status: 500 });
        }
}
