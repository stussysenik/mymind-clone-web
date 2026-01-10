/**
 * MyMind Clone - Header Component
 * 
 * Top navigation matching mymind.com with:
 * - Brand logo on left
 * - Navigation tabs in center: Everything | Spaces | Serendipity
 * - User menu on right
 * 
 * @fileoverview Application header with navigation tabs
 */

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Sparkles, LayoutGrid, Shuffle, Archive } from 'lucide-react';
import { UserMenu } from './UserMenu';

// =============================================================================
// TYPES
// =============================================================================

type Tab = 'everything' | 'spaces' | 'serendipity';

interface HeaderProps {
        activeTab?: Tab;
}

// =============================================================================
// COMPONENT
// =============================================================================

export function Header() {
        const pathname = usePathname();

        const tabs: { id: Tab; label: string; icon: React.ReactNode; href: string }[] = [
                { id: 'everything', label: 'Everything', icon: <LayoutGrid className="h-4 w-4" />, href: '/' },
                { id: 'spaces', label: 'Spaces', icon: <Sparkles className="h-4 w-4" />, href: '/spaces' },
                { id: 'serendipity', label: 'Serendipity', icon: <Shuffle className="h-4 w-4" />, href: '/serendipity' },
        ];

        return (
                <header className="sticky top-0 z-50 w-full bg-[var(--background)] border-b border-[var(--border)]">
                        <div className="flex h-14 items-center px-4">
                                {/* Left: Brand */}
                                <div className="flex items-center min-w-[120px]">
                                        <Link href="/" className="flex items-center gap-2 group">
                                                <div className="w-8 h-8 rounded-lg bg-[var(--accent-primary)] flex items-center justify-center text-white">
                                                        <Sparkles className="h-5 w-5 fill-white/20" />
                                                </div>
                                                <span className="font-serif text-xl font-bold text-[var(--foreground)] tracking-tight group-hover:text-[var(--accent-primary)] transition-colors hidden sm:inline">
                                                        Creative Brain
                                                </span>
                                        </Link>
                                </div>

                                {/* Center: Navigation Tabs */}
                                <nav className="flex-1 flex items-center justify-center gap-1">
                                        {tabs.map((tab) => {
                                                const isActive = tab.href === '/' ? pathname === '/' : pathname.startsWith(tab.href);

                                                return (
                                                        <Link
                                                                key={tab.id}
                                                                href={tab.href}
                                                                className={`
                                                                        relative px-4 py-2 rounded-lg text-sm font-medium transition-all
                                                                        flex items-center gap-2
                                                                        ${isActive
                                                                                ? 'text-[var(--foreground)] bg-black/5'
                                                                                : 'text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-black/[0.02]'
                                                                        }
                                                                `}
                                                        >
                                                                {tab.icon}
                                                                <span className="hidden sm:inline">{tab.label}</span>
                                                        </Link>
                                                );
                                        })}
                                </nav>

                                {/* Right: User Menu & Trash */}
                                <div className="flex items-center min-w-[120px] justify-end gap-2">
                                        <Link
                                                href="/trash"
                                                className={`
                                                        p-2 rounded-lg text-[var(--foreground-muted)] 
                                                        hover:text-[var(--foreground)] hover:bg-gray-100 transition-colors
                                                        ${pathname === '/trash' ? 'text-[var(--foreground)] bg-gray-100' : ''}
                                                `}
                                                title="Archive / Recently Deleted"
                                        >
                                                <Archive className="h-5 w-5" />
                                        </Link>
                                        <UserMenu />
                                </div>
                        </div>
                </header>
        );
}

export default Header;
