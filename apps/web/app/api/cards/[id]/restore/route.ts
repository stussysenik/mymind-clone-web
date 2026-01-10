/**
 * MyMind Clone - Restore Card API
 * 
 * Restore a soft-deleted card.
 * 
 * @fileoverview POST /api/cards/[id]/restore endpoint
 */

import { NextRequest, NextResponse } from 'next/server';
import { restoreCard, isSupabaseConfigured } from '@/lib/supabase';

interface RouteParams {
        params: Promise<{ id: string }>;
}

export async function POST(
        request: NextRequest,
        { params }: RouteParams
): Promise<NextResponse> {
        try {
                const { id } = await params;

                if (!id) {
                        return NextResponse.json(
                                { success: false, error: 'Card ID is required' },
                                { status: 400 }
                        );
                }

                if (!isSupabaseConfigured()) {
                        return NextResponse.json(
                                { success: false, error: 'Database not configured' },
                                { status: 500 }
                        );
                }

                const success = await restoreCard(id);

                if (!success) {
                        return NextResponse.json(
                                { success: false, error: 'Failed to restore card' },
                                { status: 500 }
                        );
                }

                return NextResponse.json({ success: true });
        } catch (error) {
                console.error('[API] Restore error:', error);
                return NextResponse.json(
                        {
                                success: false,
                                error: error instanceof Error ? error.message : 'Restore failed',
                        },
                        { status: 500 }
                );
        }
}
