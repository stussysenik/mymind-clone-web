/**
 * MyMind Clone - Cards API Route
 *
 * GET /api/cards - Fetch paginated cards
 *
 * @fileoverview Paginated cards endpoint
 */

import { NextRequest, NextResponse } from 'next/server';
import { fetchCardsPaginated } from '@/lib/supabase';
import { rowToCard } from '@/lib/types';
import { getUser } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
	const { searchParams } = new URL(request.url);
	const page = parseInt(searchParams.get('page') || '1', 10);
	const pageSize = parseInt(searchParams.get('pageSize') || '20', 10);

	// Validate params
	if (page < 1 || pageSize < 1 || pageSize > 100) {
		return NextResponse.json(
			{ error: 'Invalid pagination parameters' },
			{ status: 400 }
		);
	}

	try {
		const user = await getUser();
		const userId = user?.id;

		const result = await fetchCardsPaginated(userId, pageSize, page);

		if (!result) {
			return NextResponse.json(
				{ error: 'Failed to fetch cards' },
				{ status: 500 }
			);
		}

		return NextResponse.json({
			cards: result.data.map(rowToCard),
			total: result.total,
			page: result.page,
			pageSize: result.pageSize,
			hasMore: result.hasMore
		});
	} catch (error) {
		console.error('[API] Error fetching cards:', error);
		return NextResponse.json(
			{ error: 'Internal server error' },
			{ status: 500 }
		);
	}
}
