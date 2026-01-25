/**
 * MyMind Clone - User Menu Component
 *
 * Displays user email and sign out button.
 * Enhanced with:
 * - Touch target compliance (44px minimum on mobile)
 * - Atomic weight system for email visibility
 * - Physics-based animations
 * - Settings always accessible via menu
 *
 * @fileoverview User menu dropdown
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { User, LogOut, LogIn, Settings } from 'lucide-react';
import { createClient } from '@/lib/supabase-browser';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { clearAuthTokenOnLogout } from '@/lib/capacitor/keychain';
import { useAtomicWeight, useBreakpoint } from '@/hooks/useMediaQuery';

export function UserMenu() {
	const [user, setUser] = useState<SupabaseUser | null>(null);
	const [loading, setLoading] = useState(true);
	const [showMenu, setShowMenu] = useState(false);
	const router = useRouter();
	const supabase = createClient();
	const { showExtended } = useAtomicWeight();
	const { isMd } = useBreakpoint();

	useEffect(() => {
		const getUser = async () => {
			const { data: { user } } = await supabase.auth.getUser();
			setUser(user);
			setLoading(false);
		};
		getUser();

		// Listen for auth changes
		const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
			setUser(session?.user ?? null);
		});

		return () => subscription.unsubscribe();
	}, [supabase.auth]);

	const handleSignOut = async () => {
		// Clear iOS Keychain token before signing out
		await clearAuthTokenOnLogout();
		await supabase.auth.signOut();
		router.push('/login');
		router.refresh();
	};

	if (loading) {
		return (
			<div className="w-10 h-10 md:w-8 md:h-8 rounded-full bg-gray-200 physics-pulse" />
		);
	}

	if (!user) {
		return (
			<button
				onClick={() => router.push('/login')}
				className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium
				           text-[var(--foreground)] hover:bg-gray-100
				           physics-press touch-target transition-colors"
			>
				<LogIn className="h-4 w-4" />
				<span className="hidden sm:inline">Sign in</span>
			</button>
		);
	}

	return (
		<div className="relative">
			{/* Avatar Button - Weight 9: Primary, always visible, touch target compliant */}
			<button
				onClick={() => setShowMenu(!showMenu)}
				className="flex items-center gap-2 px-2 md:px-3 py-1.5 rounded-lg text-sm font-medium
				           text-[var(--foreground)] hover:bg-gray-100
				           physics-press touch-target transition-colors"
			>
				{/* Avatar - Weight 9: Always visible, touch target on mobile */}
				<div className="w-8 h-8 rounded-full bg-[var(--accent-primary)] flex items-center justify-center text-white text-xs font-medium">
					{user.email?.charAt(0).toUpperCase()}
				</div>
				{/* Email - Weight 2: Extended, visible xl+ only */}
				{showExtended && (
					<span className="max-w-[120px] truncate text-[var(--foreground-muted)]">
						{user.email}
					</span>
				)}
			</button>

			{showMenu && (
				<>
					{/* Backdrop */}
					<div
						className="fixed inset-0 z-40"
						onClick={() => setShowMenu(false)}
					/>

					{/* Menu - Animate scale in */}
					<div className="absolute right-0 top-full mt-2 w-56 rounded-xl bg-[var(--card-bg)] border border-[var(--border)] shadow-lg z-50 py-1 animate-scale-in">
						{/* User info section */}
						<div className="px-4 py-3 border-b border-[var(--border)]">
							<p className="text-xs text-[var(--foreground-muted)]">Signed in as</p>
							<p className="text-sm font-medium text-[var(--foreground)] truncate">
								{user.email}
							</p>
						</div>

						{/* Settings - Always visible in menu for accessibility */}
						<button
							onClick={() => {
								router.push('/settings');
								setShowMenu(false);
							}}
							className="w-full flex items-center gap-3 px-4 py-3 text-sm text-[var(--foreground)]
							           hover:bg-black/5 transition-colors physics-press"
						>
							<Settings className="h-4 w-4" />
							Settings
						</button>

						{/* Divider */}
						<div className="h-px bg-[var(--border)] my-1" />

						{/* Sign out */}
						<button
							onClick={handleSignOut}
							className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-600
							           hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors physics-press"
						>
							<LogOut className="h-4 w-4" />
							Sign out
						</button>
					</div>
				</>
			)}
		</div>
	);
}

export default UserMenu;
