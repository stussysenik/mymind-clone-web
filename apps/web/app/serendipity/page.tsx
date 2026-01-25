/**
 * MyMind Clone - Serendipity Page
 *
 * "Serendipity" mode - interactive focused discovery experience.
 * Features single-card focus view with swipe/keyboard navigation
 * for rediscovering forgotten gems in your mind.
 *
 * @fileoverview Interactive random card discovery view
 */

import { Header, AddButton, SerendipityClient } from '@/components';
import { fetchRandomCards } from '@/lib/supabase';
import { getUser } from '@/lib/supabase-server';
import { Sparkles } from 'lucide-react';
import { rowToCard } from '@/lib/types';

export const dynamic = 'force-dynamic'; // Prevent caching so it's always random

// =============================================================================
// COMPONENT
// =============================================================================

export default async function SerendipityPage() {
	const user = await getUser();
	const userId = user?.id;

	// Fetch 20 random cards
	const randomRows = await fetchRandomCards(userId, 20);
	const cards = randomRows?.map(rowToCard) ?? [];

	return (
		<div className="min-h-screen bg-[var(--background)]">
			<Header />

			<main className="mx-auto max-w-[1800px] px-4 sm:px-6 lg:px-8 py-8">
				{/* Header Section */}
				<section className="mb-8 text-center">
					<div className="inline-flex items-center justify-center p-3 bg-fuchsia-50 rounded-full mb-4 ring-1 ring-fuchsia-100">
						<Sparkles className="w-6 h-6 text-fuchsia-500" />
					</div>
					<h1 className="text-3xl font-serif font-bold text-[var(--foreground)] mb-2">
						Serendipity
					</h1>
					<p className="text-[var(--foreground-muted)] max-w-md mx-auto">
						Rediscover forgotten gems. Navigate with arrows or swipe.
					</p>
				</section>

				{/* Interactive Serendipity Experience */}
				<SerendipityClient initialCards={cards} />
			</main>

			<AddButton />
		</div>
	);
}
