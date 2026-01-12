/**
 * MyMind Clone - Trash Page
 * 
 * Displays soft-deleted cards with options to restore or permanently delete them.
 * Includes bulk operations: Empty Trash and Restore All.
 * 
 * @fileoverview /trash page component
 */

import { getUser } from '@/lib/supabase-server';
import { fetchDeletedCards } from '@/lib/supabase';
import { rowToCard } from '@/lib/types';
import { Header, CardGridClient, AddButton } from '@/components';
import { Trash2 } from 'lucide-react';
import { TrashBulkActions } from '@/components/TrashBulkActions';

export const dynamic = 'force-dynamic';

export default async function TrashPage() {
        const user = await getUser();
        const userId = user?.id;

        // Fetch deleted cards
        const deletedRows = await fetchDeletedCards(userId);
        const cards = deletedRows?.map(rowToCard) ?? [];

        return (
                <div className="min-h-screen bg-[var(--background)]">
                        <Header />

                        <main className="mx-auto max-w-[1800px] px-4 sm:px-6 lg:px-8 py-8">
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4">
                                        <div className="flex flex-col">
                                                <div className="flex items-center gap-3 mb-2">
                                                        <div className="p-2 bg-red-100 rounded-lg text-red-600">
                                                                <Trash2 className="h-6 w-6" />
                                                        </div>
                                                        <h1 className="text-2xl font-bold text-[var(--foreground)]">Trash</h1>
                                                </div>
                                                <p className="text-[var(--foreground-muted)] ml-12">
                                                        Review items before they are gone forever.
                                                </p>
                                        </div>

                                        {/* Bulk Actions */}
                                        {cards.length > 0 && (
                                                <TrashBulkActions itemCount={cards.length} />
                                        )}
                                </div>

                                {cards.length > 0 ? (
                                        <CardGridClient serverCards={cards} mode="trash" />
                                ) : (
                                        <div className="flex flex-col items-center justify-center py-24 text-center">
                                                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                                                        <Trash2 className="w-8 h-8 text-gray-400" />
                                                </div>
                                                <h3 className="text-xl font-medium text-[var(--foreground)] mb-2">Trash is empty</h3>
                                                <p className="text-[var(--foreground-muted)] max-w-sm">
                                                        Items you delete will end up here.
                                                </p>
                                        </div>
                                )}
                        </main>

                        <AddButton />
                </div>
        );
}
