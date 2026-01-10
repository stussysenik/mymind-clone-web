/**
 * MyMind Clone - Spaces Page
 * 
 * Displays "Spaces" which are smart collections of cards based on tags.
 * Now with support for hiding/deleting spaces (non-destructive).
 * 
 * @fileoverview Users' spaces/tags collection view
 */

import { Header, AddButton } from '@/components';
import { getUser } from '@/lib/supabase-server';
import { getUniqueTags } from '@/lib/supabase';
import { CreateSpace } from '@/components/CreateSpace';
import { SpacesGridClient } from '@/components/SpacesGridClient';

// =============================================================================
// COMPONENT
// =============================================================================

export default async function SpacesPage() {
        const user = await getUser();
        const userId = user?.id;
        const tags = await getUniqueTags(userId);

        // Mock spaces if no data
        const spaces = tags && tags.length > 0 ? tags : (userId ? [] : [
                { tag: 'design', count: 12 },
                { tag: 'inspiration', count: 8 },
                { tag: 'tech', count: 5 },
                { tag: 'reading-list', count: 3 }
        ]);

        return (
                <div className="min-h-screen bg-[var(--background)]">
                        <Header />

                        <main className="mx-auto max-w-[1800px] px-4 sm:px-6 lg:px-8 py-8">
                                <div className="mb-8">
                                        <h1 className="text-2xl font-serif font-bold text-[var(--foreground)] mb-2">
                                                Your Spaces
                                        </h1>
                                        <p className="text-[var(--foreground-muted)]">
                                                Smart collections based on your tags details
                                        </p>
                                        <div className="mt-4">
                                                <CreateSpace />
                                        </div>
                                </div>

                                <SpacesGridClient spaces={spaces} />
                        </main>

                        <AddButton />
                </div>
        );
}
