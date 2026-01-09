/**
 * MyMind Clone - Delete Card API
 * 
 * Delete a card by ID from Supabase or localStorage.
 * 
 * @fileoverview DELETE /api/cards/[id] endpoint
 */

import { NextRequest, NextResponse } from 'next/server';
import { deleteCard, isSupabaseConfigured } from '@/lib/supabase';

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

                const success = await deleteCard(id);

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
