/**
 * MyMind Clone - Serendipity Page
 * 
 * "Serendipity" mode - random rediscovery of old cards.
 * 
 * @fileoverview Placeholder for Serendipity feature
 */

import { Header } from '@/components';
import { Shuffle } from 'lucide-react';
import Link from 'next/link';

export default function SerendipityPage() {
        return (
                <div className="min-h-screen bg-[var(--background)]">
                        <Header />

                        <main className="flex flex-col items-center justify-center min-h-[80vh] px-4 text-center">
                                <div className="bg-purple-100 p-6 rounded-full mb-6">
                                        <Shuffle className="w-12 h-12 text-purple-600" />
                                </div>
                                <h1 className="text-3xl font-serif font-bold text-[var(--foreground)] mb-4">
                                        Serendipity
                                </h1>
                                <p className="text-[var(--foreground-muted)] max-w-md mb-8">
                                        Rediscover your saved memories. This feature will shuffle your standard cards to help you find inspiration from the past.
                                </p>
                                <Link
                                        href="/"
                                        className="px-6 py-3 bg-[var(--accent-primary)] text-white rounded-lg font-medium hover:bg-[var(--accent-hover)] transition-colors"
                                >
                                        Go Back Home
                                </Link>
                        </main>
                </div>
        );
}
