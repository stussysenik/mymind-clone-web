/**
 * MyMind Clone - Header Component
 * 
 * Top navigation matching mymind.com with:
 * - Brand logo on left
 * - Navigation tabs in center: Everything | Spaces | Serendipity
 * - User menu on right with Archive and Trash links
 * 
 * Enhanced with tactile micro-interactions (Don Norman's design principles)
 * 
 * @fileoverview Application header with navigation tabs
 */

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Sparkles, LayoutGrid, Shuffle, Archive, Trash2 } from 'lucide-react';
import { UserMenu } from './UserMenu';
import { useState } from 'react';

// =============================================================================
// TYPES
// =============================================================================

type Tab = 'everything' | 'spaces' | 'serendipity';

interface TabDef {
        id: Tab;
        label: string;
        icon: React.ReactNode;
        href: string;
}

// =============================================================================
// COMPONENT
// =============================================================================

export function Header() {
        const pathname = usePathname();
        const [pressedTab, setPressedTab] = useState<string | null>(null);

        const tabs: TabDef[] = [
                { id: 'everything', label: 'Everything', icon: <LayoutGrid className="h-4 w-4" />, href: '/' },
                { id: 'spaces', label: 'Spaces', icon: <Sparkles className="h-4 w-4" />, href: '/spaces' },
                { id: 'serendipity', label: 'Serendipity', icon: <Shuffle className="h-4 w-4" />, href: '/serendipity' },
        ];

        return (
                <header className="sticky top-0 z-50 w-full bg-[var(--background)] border-b border-[var(--border)]">
                        <div className="flex h-14 items-center px-4">
                                {/* Left: Brand */}
                                <div className="flex items-center min-w-[120px]">
                                        <Link
                                                href="/"
                                                className="flex items-center gap-2 group tactile-btn"
                                        >
                                                <div className="w-8 h-8 rounded-lg bg-[var(--accent-primary)] flex items-center justify-center text-white
                                                               group-hover:shadow-lg group-hover:shadow-[var(--accent-primary)]/25
                                                               transition-shadow duration-200">
                                                        <Sparkles className="h-5 w-5 fill-white/20 group-hover:scale-110 transition-transform duration-200" />
                                                </div>
                                                <span className="font-serif text-xl font-bold text-[var(--foreground)] tracking-tight 
                                                               group-hover:text-[var(--accent-primary)] transition-colors hidden sm:inline">
                                                        digital consumption experiment.
                                                </span>
                                        </Link>
                                </div>

                                {/* Center: Navigation Tabs */}
                                <nav className="flex-1 flex items-center justify-center gap-1">
                                        {tabs.map((tab) => {
                                                const isActive = tab.href === '/' ? pathname === '/' : pathname.startsWith(tab.href);
                                                const isPressed = pressedTab === tab.id;

                                                return (
                                                        <Link
                                                                key={tab.id}
                                                                href={tab.href}
                                                                onMouseDown={() => setPressedTab(tab.id)}
                                                                onMouseUp={() => setPressedTab(null)}
                                                                onMouseLeave={() => setPressedTab(null)}
                                                                className={`
                                                                        relative px-4 py-2 rounded-lg text-sm font-medium
                                                                        flex items-center gap-2 select-none
                                                                        transition-all duration-150
                                                                        ${isPressed
                                                                                ? 'scale-[0.97]'
                                                                                : 'hover:-translate-y-0.5'
                                                                        }
                                                                        ${isActive
                                                                                ? 'text-[var(--foreground)] bg-black/5'
                                                                                : 'text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-black/[0.03]'
                                                                        }
                                                                `}
                                                                style={{
                                                                        transitionTimingFunction: isPressed
                                                                                ? 'cubic-bezier(0.4, 0, 0.2, 1)'
                                                                                : 'cubic-bezier(0.34, 1.56, 0.64, 1)'
                                                                }}
                                                        >
                                                                {/* Active indicator with smooth animation */}
                                                                {isActive && (
                                                                        <span
                                                                                className="absolute inset-0 bg-black/5 rounded-lg animate-bounce-in"
                                                                                aria-hidden="true"
                                                                        />
                                                                )}

                                                                {/* Icon with hover animation */}
                                                                <span className={`
                                                                        relative z-10 transition-transform duration-200
                                                                        ${isActive ? 'text-[var(--accent-primary)]' : ''}
                                                                        group-hover:scale-110
                                                                `}>
                                                                        {tab.icon}
                                                                </span>

                                                                <span className="relative z-10 hidden sm:inline">{tab.label}</span>
                                                        </Link>
                                                );
                                        })}
                                </nav>

                                {/* Right: Archive, Trash & User Menu */}
                                <div className="flex items-center justify-end gap-1 shrink-0">
                                        {/* Archive Link */}
                                        <Link
                                                href="/archive"
                                                className={`
                                                        p-2 rounded-lg text-[var(--foreground-muted)] 
                                                        tactile-btn
                                                        hover:text-amber-600 hover:bg-amber-50
                                                        ${pathname === '/archive' ? 'text-amber-600 bg-amber-50' : ''}
                                                `}
                                                title="Archive - Saved for later"
                                        >
                                                <Archive className="h-5 w-5" />
                                        </Link>

                                        {/* Trash Link */}
                                        <Link
                                                href="/trash"
                                                className={`
                                                        p-2 rounded-lg text-[var(--foreground-muted)] 
                                                        tactile-btn
                                                        hover:text-red-500 hover:bg-red-50
                                                        ${pathname === '/trash' ? 'text-red-500 bg-red-50' : ''}
                                                `}
                                                title="Trash - Items to be deleted"
                                        >
                                                <Trash2 className="h-5 w-5" />
                                        </Link>

                                        <UserMenu />
                                </div>
                        </div>
                </header>
        );
}

export default Header;

