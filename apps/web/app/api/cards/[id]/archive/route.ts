import { NextRequest, NextResponse } from 'next/server';
import { archiveCard, isSupabaseConfigured } from '@/lib/supabase';

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
                        return NextResponse.json({ success: false, error: 'ID required' }, { status: 400 });
                }

                // Local cards handled by client, but API might receive requests if logic is mixed
                if (id.startsWith('local-') || id.startsWith('mock-')) {
                        return NextResponse.json({ success: true });
                }

                if (!isSupabaseConfigured()) {
                        return NextResponse.json({ success: false, error: 'DB not configured' }, { status: 500 });
                }

                const success = await archiveCard(id);

                if (!success) {
                        return NextResponse.json({ success: false, error: 'Failed to archive' }, { status: 500 });
                }

                return NextResponse.json({ success: true });
        } catch (error) {
                console.error('[API] Archive error:', error);
                return NextResponse.json({ success: false, error: 'Internal Error' }, { status: 500 });
        }
}
