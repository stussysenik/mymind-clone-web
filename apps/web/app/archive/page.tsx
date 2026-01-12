/**
 * MyMind Clone - Archive Page
 * 
 * Displays archived cards - items saved for later that haven't been deleted.
 * Archive is an intermediary state between active and trash.
 * 
 * @fileoverview /archive page component
 */

import { getUser } from '@/lib/supabase-server';
import { fetchArchivedCards } from '@/lib/supabase';
import { rowToCard } from '@/lib/types';
import { Header, CardGridClient, AddButton } from '@/components';
import { Archive } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function ArchivePage() {
        const user = await getUser();
        const userId = user?.id;

        // Fetch archived cards
        const archivedRows = await fetchArchivedCards(userId);
        const cards = archivedRows?.map(rowToCard) ?? [];

        return (
                <div className="min-h-screen bg-[var(--background)]">
                        <Header />

                        <main className="mx-auto max-w-[1800px] px-4 sm:px-6 lg:px-8 py-8">
                                <div className="flex flex-col mb-8">
                                        <div className="flex items-center gap-3 mb-2">
                                                <div className="p-2 bg-amber-100 rounded-lg text-amber-600">
                                                        <Archive className="h-6 w-6" />
                                                </div>
                                                <h1 className="text-2xl font-bold text-[var(--foreground)]">Archive</h1>
                                        </div>
                                        <p className="text-[var(--foreground-muted)] ml-12">
                                                Items you&apos;ve saved for later.
                                        </p>
                                </div>

                                {cards.length > 0 ? (
                                        <CardGridClient serverCards={cards} mode="archive" />
                                ) : (
                                        <div className="flex flex-col items-center justify-center py-24 text-center">
                                                <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mb-4">
                                                        <Archive className="w-8 h-8 text-amber-400" />
                                                </div>
                                                <h3 className="text-xl font-medium text-[var(--foreground)] mb-2">Archive is empty</h3>
                                                <p className="text-[var(--foreground-muted)] max-w-sm">
                                                        Items you archive will appear here.
                                                </p>
                                        </div>
                                )}
                        </main>

                        <AddButton />
                </div>
        );
}
