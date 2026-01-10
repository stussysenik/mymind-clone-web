/**
 * MyMind Clone - Serendipity Page
 * 
 * "Serendipity" mode - random rediscovery of old cards.
 * Fetches completely random cards from the database to inspire rediscovery.
 * 
 * @fileoverview Random card shuffle view
 */

import { Suspense } from 'react';
import Link from 'next/link';
import { Header, CardGridClient, AddButton } from '@/components';
import { fetchRandomCards } from '@/lib/supabase';
import { getUser } from '@/lib/supabase-server';
import { Sparkles, Shuffle } from 'lucide-react';
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
                                <section className="mb-10 text-center">
                                        <div className="inline-flex items-center justify-center p-3 bg-fuchsia-50 rounded-full mb-4 ring-1 ring-fuchsia-100">
                                                <Sparkles className="w-6 h-6 text-fuchsia-500" />
                                        </div>
                                        <h1 className="text-3xl font-serif font-bold text-[var(--foreground)] mb-2">
                                                Serendipity
                                        </h1>
                                        <p className="text-[var(--foreground-muted)] max-w-md mx-auto">
                                                Rediscover forgotten gems. A random selection from your mind.
                                        </p>
                                        <div className="mt-6">
                                                <Link
                                                        href="/serendipity"
                                                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-[var(--border)] rounded-full text-sm font-medium hover:bg-gray-50 transition-colors shadow-sm"
                                                >
                                                        <Shuffle className="w-4 h-4 text-gray-400" />
                                                        Shuffle Again
                                                </Link>
                                        </div>
                                </section>

                                {cards.length > 0 ? (
                                        <CardGridClient serverCards={cards} />
                                ) : (
                                        <div className="flex flex-col items-center justify-center py-20 text-center text-[var(--foreground-muted)]">
                                                <p>No cards found to shuffle.</p>
                                                <p className="text-sm mt-1">Add some items to start rediscovering them.</p>
                                        </div>
                                )}
                        </main>

                        <AddButton />
                </div>
        );
}
