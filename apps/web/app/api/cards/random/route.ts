/**
 * MyMind Clone - Random Cards API
 *
 * Returns random cards for Serendipity feature.
 * Supports client-side shuffling without full page reload.
 *
 * @fileoverview Random cards API endpoint
 */

import { NextRequest, NextResponse } from 'next/server';
import { fetchRandomCards } from '@/lib/supabase';
import { getUser } from '@/lib/supabase-server';
import { rowToCard } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
	try {
		const limit = parseInt(request.nextUrl.searchParams.get('limit') || '20', 10);
		const clampedLimit = Math.min(Math.max(limit, 1), 50); // Clamp between 1 and 50

		const user = await getUser();
		const userId = user?.id;

		const rows = await fetchRandomCards(userId, clampedLimit);
		const cards = rows?.map(rowToCard) ?? [];

		return NextResponse.json(cards);
	} catch (error) {
		console.error('[API/cards/random] Error:', error);
		return NextResponse.json(
			{ error: 'Failed to fetch random cards' },
			{ status: 500 }
		);
	}
}
