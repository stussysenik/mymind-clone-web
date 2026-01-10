/**
 * MyMind Clone - Spaces Page
 * 
 * Displays "Spaces" which are smart collections of cards based on tags.
 * 
 * @fileoverview Users' spaces/tags collection view
 */

import { Suspense } from 'react';
import Link from 'next/link';
import { Header, AddButton } from '@/components';
import { getUser } from '@/lib/supabase-server';
import { getUniqueTags } from '@/lib/supabase';
import { CreateSpace } from '@/components/CreateSpace';
import { Hash, PackageOpen } from 'lucide-react';

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

                                <Suspense fallback={<SpacesSkeleton />}>
                                        {spaces.length === 0 ? (
                                                <div className="flex flex-col items-center justify-center py-20 text-center">
                                                        <div className="bg-gray-100 p-4 rounded-full mb-4">
                                                                <PackageOpen className="w-8 h-8 text-gray-400" />
                                                        </div>
                                                        <h3 className="text-lg font-medium text-[var(--foreground)]">No spaces yet</h3>
                                                        <p className="text-[var(--foreground-muted)] max-w-sm mt-1">
                                                                Save some cards with tags to see them appear here as Spaces.
                                                        </p>
                                                </div>
                                        ) : (
                                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                                                        {spaces.map(({ tag, count }) => (
                                                                <Link
                                                                        key={tag}
                                                                        href={`/?q=${encodeURIComponent(tag)}`}
                                                                        className="group relative aspect-square bg-white rounded-xl shadow-sm border border-[var(--border)] hover:card-shadow-hover transition-all p-6 flex flex-col justify-between"
                                                                >
                                                                        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-indigo-50 to-blue-50 flex items-center justify-center group-hover:scale-110 transition-transform">
                                                                                <Hash className="w-6 h-6 text-[var(--accent-primary)]" />
                                                                        </div>

                                                                        <div>
                                                                                <h3 className="text-lg font-medium text-[var(--foreground)] capitalize group-hover:text-[var(--accent-primary)] transition-colors">
                                                                                        {tag}
                                                                                </h3>
                                                                                <p className="text-sm text-[var(--foreground-muted)]">
                                                                                        {count} {count === 1 ? 'item' : 'items'}
                                                                                </p>
                                                                        </div>
                                                                </Link>
                                                        ))}
                                                </div>
                                        )}
                                </Suspense>
                        </main>

                        <AddButton />
                </div>
        );
}

function SpacesSkeleton() {
        return (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                        {Array.from({ length: 8 }).map((_, i) => (
                                <div key={i} className="aspect-square bg-white rounded-xl border border-[var(--border)] p-6 space-y-4">
                                        <div className="w-12 h-12 rounded-lg bg-gray-100 animate-pulse" />
                                        <div className="space-y-2 pt-8">
                                                <div className="h-5 w-24 bg-gray-100 animate-pulse rounded" />
                                                <div className="h-3 w-12 bg-gray-100 animate-pulse rounded" />
                                        </div>
                                </div>
                        ))}
                </div>
        );
}
