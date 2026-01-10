/**
 * MyMind Clone - Settings Page
 * 
 * Placeholder settings page with account info and preferences.
 * 
 * @fileoverview /settings page component
 */

import { getUser } from '@/lib/supabase-server';
import { Header, AddButton } from '@/components';
import { Settings, User, Download, Shield, Bell } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
        const user = await getUser();

        return (
                <div className="min-h-screen bg-[var(--background)]">
                        <Header />

                        <main className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-8">
                                <div className="flex items-center gap-3 mb-8">
                                        <div className="p-2 bg-gray-100 rounded-lg">
                                                <Settings className="h-6 w-6 text-gray-600" />
                                        </div>
                                        <h1 className="text-2xl font-serif font-bold text-[var(--foreground)]">Settings</h1>
                                </div>

                                {/* Account Section */}
                                <section className="bg-white rounded-xl border border-[var(--border)] p-6 mb-6">
                                        <div className="flex items-center gap-3 mb-4">
                                                <User className="h-5 w-5 text-gray-500" />
                                                <h2 className="text-lg font-medium text-[var(--foreground)]">Account</h2>
                                        </div>
                                        <div className="space-y-4">
                                                <div>
                                                        <label className="block text-sm text-[var(--foreground-muted)] mb-1">Email</label>
                                                        <p className="text-[var(--foreground)] font-medium">
                                                                {user?.email || 'demo@example.com'}
                                                        </p>
                                                </div>
                                                <div>
                                                        <label className="block text-sm text-[var(--foreground-muted)] mb-1">Member since</label>
                                                        <p className="text-[var(--foreground)]">
                                                                {user?.created_at
                                                                        ? new Date(user.created_at).toLocaleDateString(undefined, {
                                                                                year: 'numeric',
                                                                                month: 'long',
                                                                                day: 'numeric'
                                                                        })
                                                                        : 'Demo Mode'
                                                                }
                                                        </p>
                                                </div>
                                        </div>
                                </section>

                                {/* Preferences Section */}
                                <section className="bg-white rounded-xl border border-[var(--border)] p-6 mb-6">
                                        <div className="flex items-center gap-3 mb-4">
                                                <Bell className="h-5 w-5 text-gray-500" />
                                                <h2 className="text-lg font-medium text-[var(--foreground)]">Preferences</h2>
                                        </div>
                                        <div className="space-y-4">
                                                <div className="flex items-center justify-between py-2">
                                                        <div>
                                                                <p className="text-[var(--foreground)] font-medium">AI Auto-tagging</p>
                                                                <p className="text-sm text-[var(--foreground-muted)]">
                                                                        Automatically generate tags when saving items
                                                                </p>
                                                        </div>
                                                        <div className="w-12 h-6 bg-[var(--accent-primary)] rounded-full relative cursor-not-allowed opacity-75">
                                                                <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow" />
                                                        </div>
                                                </div>
                                                <div className="flex items-center justify-between py-2">
                                                        <div>
                                                                <p className="text-[var(--foreground)] font-medium">Serendipity Mode</p>
                                                                <p className="text-sm text-[var(--foreground-muted)]">
                                                                        Surface forgotten items periodically
                                                                </p>
                                                        </div>
                                                        <div className="w-12 h-6 bg-gray-200 rounded-full relative cursor-not-allowed opacity-75">
                                                                <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full shadow" />
                                                        </div>
                                                </div>
                                        </div>
                                        <p className="text-xs text-[var(--foreground-muted)] mt-4 italic">
                                                Preferences are coming soon.
                                        </p>
                                </section>

                                {/* Data Export Section */}
                                <section className="bg-white rounded-xl border border-[var(--border)] p-6 mb-6">
                                        <div className="flex items-center gap-3 mb-4">
                                                <Download className="h-5 w-5 text-gray-500" />
                                                <h2 className="text-lg font-medium text-[var(--foreground)]">Data Export</h2>
                                        </div>
                                        <p className="text-[var(--foreground-muted)] mb-4">
                                                Download all your saved items, notes, and metadata.
                                        </p>
                                        <button
                                                className="px-4 py-2 bg-gray-100 text-gray-500 rounded-lg text-sm font-medium cursor-not-allowed opacity-75"
                                                disabled
                                        >
                                                Export All Data (Coming Soon)
                                        </button>
                                </section>

                                {/* Danger Zone */}
                                <section className="bg-white rounded-xl border border-red-200 p-6">
                                        <div className="flex items-center gap-3 mb-4">
                                                <Shield className="h-5 w-5 text-red-500" />
                                                <h2 className="text-lg font-medium text-red-600">Danger Zone</h2>
                                        </div>
                                        <p className="text-[var(--foreground-muted)] mb-4">
                                                Permanently delete your account and all associated data.
                                        </p>
                                        <button
                                                className="px-4 py-2 bg-red-50 text-red-500 border border-red-200 rounded-lg text-sm font-medium cursor-not-allowed opacity-75"
                                                disabled
                                        >
                                                Delete Account (Coming Soon)
                                        </button>
                                </section>
                        </main>

                        <AddButton />
                </div>
        );
}
