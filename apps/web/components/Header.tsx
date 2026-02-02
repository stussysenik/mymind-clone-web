/**
 * MyMind Clone - Header Component
 *
 * Top navigation matching mymind.com with:
 * - Brand logo on left
 * - Navigation tabs in center: Everything | Spaces | Serendipity
 * - User menu on right with Archive and Trash links
 *
 * Enhanced with:
 * - Atomic weight system for responsive visibility
 * - Physics-based animations
 * - Touch target compliance (44px minimum on mobile)
 *
 * @fileoverview Application header with navigation tabs
 */

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Sparkles, LayoutGrid, Shuffle, Archive, Trash2, MoreHorizontal, Settings } from 'lucide-react';
import { UserMenu } from './UserMenu';
import { ThemeToggle } from './ThemeToggle';
import { SettingsModal } from './SettingsModal';
import { useState, useRef, useEffect } from 'react';
import { useBreakpoint, useAtomicWeight } from '@/hooks/useMediaQuery';

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
	const [showOverflowMenu, setShowOverflowMenu] = useState(false);
	const [showSettings, setShowSettings] = useState(false);
	const overflowMenuRef = useRef<HTMLDivElement>(null);
	const { isSm, isMd, isLg } = useBreakpoint();
	const { showDecorative, showTertiary, showContentOptional } = useAtomicWeight();

	// Close overflow menu when clicking outside
	useEffect(() => {
		const handleClickOutside = (e: MouseEvent) => {
			if (showOverflowMenu && overflowMenuRef.current && !overflowMenuRef.current.contains(e.target as Node)) {
				setShowOverflowMenu(false);
			}
		};
		document.addEventListener('click', handleClickOutside);
		return () => document.removeEventListener('click', handleClickOutside);
	}, [showOverflowMenu]);

	const tabs: TabDef[] = [
		{ id: 'everything', label: 'Everything', icon: <LayoutGrid className="h-4 w-4" />, href: '/' },
		{ id: 'spaces', label: 'Spaces', icon: <Sparkles className="h-4 w-4" />, href: '/spaces' },
		{ id: 'serendipity', label: 'Serendipity', icon: <Shuffle className="h-4 w-4" />, href: '/serendipity' },
	];

	return (
		<header className="sticky top-0 z-50 w-full bg-[var(--background)] border-b border-[var(--border)]">
			<div className="flex h-14 items-center px-4">
				{/* Left: Brand - Logo icon is weight 10 (always visible), brand text is weight 3 */}
				<div className="flex items-center min-w-[44px] md:min-w-[120px]">
					<Link
						href="/"
						className="flex items-center gap-2 group physics-press touch-target"
					>
						{/* Logo icon - Weight 10: Always visible */}
						<div className="w-8 h-8 rounded-lg bg-[var(--accent-primary)] flex items-center justify-center text-white
						               group-hover:shadow-lg group-hover:shadow-[var(--accent-primary)]/25
						               transition-shadow duration-200">
							<Sparkles className="h-5 w-5 fill-white/20 group-hover:scale-110 transition-transform duration-200" />
						</div>
						{/* Brand text - Weight 3: Decorative, visible xl+ only (1024px+)
						    Using CSS instead of JS to prevent hydration flash */}
						<span className="hidden xl:block font-serif text-xl font-bold text-[var(--foreground)] tracking-tight
						               whitespace-nowrap group-hover:text-[var(--accent-primary)] transition-colors">
							digital consumption experiment.
						</span>
					</Link>
				</div>

				{/* Center: Navigation Tabs - Icons weight 8, labels weight 5 */}
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
								onTouchStart={() => setPressedTab(tab.id)}
								onTouchEnd={() => setPressedTab(null)}
								className={`
									relative px-3 md:px-4 py-2 rounded-lg text-sm font-medium
									flex items-center justify-center gap-2 select-none
									physics-press touch-target
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
										: 'var(--ease-snappy)'
								}}
							>
								{/* Active indicator with smooth animation */}
								{isActive && (
									<span
										className="absolute inset-0 bg-black/5 rounded-lg animate-scale-in"
										aria-hidden="true"
									/>
								)}

								{/* Icon - Weight 8: Primary Nav, always visible */}
								<span className={`
									relative z-10 transition-transform duration-200
									${isActive ? 'text-[var(--accent-primary)]' : ''}
									group-hover:scale-110
								`}>
									{tab.icon}
								</span>

								{/* Label - Weight 5: Content Optional, visible md+
								    Using CSS instead of JS to prevent hydration flash */}
								<span className="hidden md:inline relative z-10">{tab.label}</span>
							</Link>
						);
					})}
				</nav>

				{/* Right: Theme Toggle, Settings, Archive, Trash & User Menu */}
				<div className="flex items-center justify-end gap-1 shrink-0">
					{/* Theme Toggle - Weight 8: Always visible */}
					<ThemeToggle />

					{/* Settings Button (Desktop) - Weight 4 */}
					{showTertiary && (
						<button
							onClick={() => setShowSettings(true)}
							className="p-2.5 rounded-lg text-[var(--foreground-muted)] physics-press touch-target hover:text-[var(--accent-primary)] hover:bg-[var(--accent-light)]"
							aria-label="Settings"
							title="Settings - Customize theme, colors & typography"
						>
							<Settings className="h-5 w-5" />
						</button>
					)}

					{/* Desktop: Show Archive and Trash links directly - Weight 4 */}
					{showTertiary && (
						<>
							{/* Archive Link */}
							<Link
								href="/archive"
								className={`
									p-2.5 rounded-lg text-[var(--foreground-muted)]
									physics-press touch-target
									hover:text-amber-600 hover:bg-amber-50
									dark:hover:bg-amber-900/20
									${pathname === '/archive' ? 'text-amber-600 bg-amber-50 dark:bg-amber-900/20' : ''}
								`}
								title="Archive - Saved for later"
							>
								<Archive className="h-5 w-5" />
							</Link>

							{/* Trash Link */}
							<Link
								href="/trash"
								className={`
									p-2.5 rounded-lg text-[var(--foreground-muted)]
									physics-press touch-target
									hover:text-red-500 hover:bg-red-50
									dark:hover:bg-red-900/20
									${pathname === '/trash' ? 'text-red-500 bg-red-50 dark:bg-red-900/20' : ''}
								`}
								title="Trash - Items to be deleted"
							>
								<Trash2 className="h-5 w-5" />
							</Link>
						</>
					)}

					{/* Mobile: Overflow Menu for Archive, Trash, and Settings */}
					{!showTertiary && (
						<div className="relative" ref={overflowMenuRef}>
							<button
								onClick={(e) => {
									e.stopPropagation();
									setShowOverflowMenu(!showOverflowMenu);
								}}
								className={`
									p-2.5 rounded-lg text-[var(--foreground-muted)]
									physics-press touch-target
									hover:text-[var(--foreground)] hover:bg-black/5
									${showOverflowMenu ? 'bg-black/5 text-[var(--foreground)]' : ''}
								`}
								aria-label="More options"
								aria-expanded={showOverflowMenu}
							>
								<MoreHorizontal className="h-5 w-5" />
							</button>

							{/* Overflow Dropdown Menu */}
							{showOverflowMenu && (
								<div
									className="absolute right-0 top-full mt-1 bg-[var(--background)] rounded-xl shadow-lg border border-[var(--border)] py-1 min-w-[180px] z-50 animate-scale-in"
								>
									{/* Settings Option - Opens modal instead of page */}
									<button
										onClick={() => {
											setShowOverflowMenu(false);
											setShowSettings(true);
										}}
										className="w-full px-3 py-3 text-left text-sm flex items-center gap-3 hover:bg-black/5 text-[var(--foreground)]"
									>
										<Settings className="h-4 w-4" />
										<span>Settings</span>
									</button>

									{/* Divider */}
									<div className="h-px bg-[var(--border)] my-1" />

									{/* Archive Option */}
									<Link
										href="/archive"
										onClick={() => setShowOverflowMenu(false)}
										className={`
											w-full px-3 py-3 text-left text-sm flex items-center gap-3
											hover:bg-amber-50 dark:hover:bg-amber-900/20
											${pathname === '/archive'
												? 'text-amber-600 bg-amber-50 dark:bg-amber-900/20'
												: 'text-[var(--foreground-muted)] hover:text-amber-600'
											}
										`}
									>
										<Archive className="h-4 w-4" />
										<span>Archive</span>
									</Link>

									{/* Trash Option */}
									<Link
										href="/trash"
										onClick={() => setShowOverflowMenu(false)}
										className={`
											w-full px-3 py-3 text-left text-sm flex items-center gap-3
											hover:bg-red-50 dark:hover:bg-red-900/20
											${pathname === '/trash'
												? 'text-red-500 bg-red-50 dark:bg-red-900/20'
												: 'text-[var(--foreground-muted)] hover:text-red-500'
											}
										`}
									>
										<Trash2 className="h-4 w-4" />
										<span>Trash</span>
									</Link>
								</div>
							)}
						</div>
					)}

					<UserMenu />
				</div>
			</div>

			{/* Settings Modal */}
			<SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} />
		</header>
	);
}

export default Header;
