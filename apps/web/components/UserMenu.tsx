/**
 * MyMind Clone - User Menu Component
 * 
 * Displays user email and sign out button.
 * 
 * @fileoverview User menu dropdown
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { User, LogOut, LogIn, Settings } from 'lucide-react';
import { createClient } from '@/lib/supabase-browser';
import type { User as SupabaseUser } from '@supabase/supabase-js';

export function UserMenu() {
        const [user, setUser] = useState<SupabaseUser | null>(null);
        const [loading, setLoading] = useState(true);
        const [showMenu, setShowMenu] = useState(false);
        const router = useRouter();
        const supabase = createClient();

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
                await supabase.auth.signOut();
                router.push('/login');
                router.refresh();
        };

        if (loading) {
                return (
                        <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse" />
                );
        }

        if (!user) {
                return (
                        <button
                                onClick={() => router.push('/login')}
                                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium text-[var(--foreground)] hover:bg-gray-100 transition-colors"
                        >
                                <LogIn className="h-4 w-4" />
                                Sign in
                        </button>
                );
        }

        return (
                <div className="relative">
                        <button
                                onClick={() => setShowMenu(!showMenu)}
                                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium text-[var(--foreground)] hover:bg-gray-100 transition-colors"
                        >
                                <div className="w-6 h-6 rounded-full bg-[var(--accent-primary)] flex items-center justify-center text-white text-xs">
                                        {user.email?.charAt(0).toUpperCase()}
                                </div>
                                <span className="hidden sm:inline max-w-[120px] truncate">
                                        {user.email}
                                </span>
                        </button>

                        {showMenu && (
                                <>
                                        {/* Backdrop */}
                                        <div
                                                className="fixed inset-0 z-40"
                                                onClick={() => setShowMenu(false)}
                                        />

                                        {/* Menu */}
                                        <div className="absolute right-0 top-full mt-2 w-48 rounded-lg bg-white border border-[var(--border)] shadow-lg z-50 py-1">
                                                <div className="px-3 py-2 border-b border-[var(--border)]">
                                                        <p className="text-xs text-[var(--foreground-muted)]">Signed in as</p>
                                                        <p className="text-sm font-medium text-[var(--foreground)] truncate">
                                                                {user.email}
                                                        </p>
                                                </div>
                                                <button
                                                        onClick={() => {
                                                                router.push('/settings');
                                                                setShowMenu(false);
                                                        }}
                                                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[var(--foreground)] hover:bg-gray-100 transition-colors"
                                                >
                                                        <Settings className="h-4 w-4" />
                                                        Settings
                                                </button>
                                                <button
                                                        onClick={handleSignOut}
                                                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
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
