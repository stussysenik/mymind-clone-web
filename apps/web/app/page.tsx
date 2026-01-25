/**
 * MyMind Clone - Home Page
 * 
 * Main application page matching mymind.com layout.
 * Features search bar, tag scroller, and masonry grid.
 * 
 * @fileoverview Main page with mymind-inspired layout
 */

import { Suspense } from 'react';
import { AddButton, Header, CardGrid, SearchBar } from '@/components';

export const revalidate = 0; // Disable caching for realtime updates

// =============================================================================
// PAGE PROPS
// =============================================================================

interface HomePageProps {
  searchParams: Promise<{ q?: string; type?: string; view?: string }>;
}

// =============================================================================
// LOADING SKELETON
// =============================================================================

function CardGridSkeleton() {
  return (
    <div className="columns-1 gap-4 sm:columns-2 lg:columns-3 xl:columns-4 2xl:columns-5">
      {Array.from({ length: 12 }).map((_, i) => (
        <div
          key={i}
          className="mb-4 break-inside-avoid rounded-lg bg-white card-shadow overflow-hidden"
        >
          <div className="aspect-[4/3] w-full animate-shimmer" />
          <div className="p-3 space-y-2">
            <div className="h-4 w-3/4 animate-shimmer rounded" />
            <div className="h-3 w-1/2 animate-shimmer rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const params = await searchParams;
  const searchQuery = params.q ?? '';
  const typeFilter = params.type ?? '';
  const mode = (params.view === 'archive' || params.view === 'trash') ? params.view : 'default';

  return (
    <div className="min-h-screen bg-[var(--background)] flex flex-col">
      {/* Header */}
      <Header />

      {/* Main Content - flex-1 to push footer down */}
      <main className="mx-auto max-w-[1800px] px-4 sm:px-6 lg:px-8 flex-1 w-full">
        {/* Search Section */}
        <section className="py-6">
          <SearchBar />
        </section>

        {/* View Title */}
        {mode !== 'default' && (
          <section className="pb-4">
            <h2 className="text-2xl font-serif capitalize text-gray-800">{mode}</h2>
          </section>
        )}

        {/* Card Grid */}
        <section className="pb-12">
          <Suspense fallback={<CardGridSkeleton />}>
            <CardGrid searchQuery={searchQuery} typeFilter={typeFilter} mode={mode} />
          </Suspense>
        </section>
      </main>

      {/* Footer - mt-auto ensures it sticks to bottom when content is short */}
      <footer className="border-t border-[var(--border)] py-6 text-center text-sm text-[var(--foreground-muted)] mt-auto">
        <p>
          Built as a portfolio project •{' '}
          <a
            href="https://github.com"
            className="text-[var(--accent-primary)] hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            View Source
          </a>
        </p>
      </footer>

      {/* Add Button (FAB) */}
      <AddButton />
    </div>
  );
}
