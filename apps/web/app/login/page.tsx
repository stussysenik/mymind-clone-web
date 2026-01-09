/**
 * MyMind Clone - Login Page
 * 
 * Login page with email/password and magic link options.
 * 
 * @fileoverview Login page
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase-browser';

export default function LoginPage() {
        const [email, setEmail] = useState('');
        const [password, setPassword] = useState('');
        const [loading, setLoading] = useState(false);
        const [error, setError] = useState<string | null>(null);
        const [message, setMessage] = useState<string | null>(null);
        const router = useRouter();
        const supabase = createClient();

        const handleLogin = async (e: React.FormEvent) => {
                e.preventDefault();
                setLoading(true);
                setError(null);

                const { error } = await supabase.auth.signInWithPassword({
                        email,
                        password,
                });

                if (error) {
                        setError(error.message);
                        setLoading(false);
                } else {
                        router.push('/');
                        router.refresh();
                }
        };

        const handleMagicLink = async () => {
                if (!email) {
                        setError('Please enter your email');
                        return;
                }

                setLoading(true);
                setError(null);

                const { error } = await supabase.auth.signInWithOtp({
                        email,
                        options: {
                                emailRedirectTo: `${window.location.origin}/auth/callback`,
                        },
                });

                if (error) {
                        setError(error.message);
                } else {
                        setMessage('Check your email for the magic link!');
                }
                setLoading(false);
        };

        return (
                <div className="min-h-screen bg-[var(--background)] flex items-center justify-center px-4">
                        <div className="w-full max-w-md">
                                {/* Header */}
                                <div className="text-center mb-8">
                                        <h1 className="font-serif text-3xl font-bold text-[var(--foreground)] mb-2">
                                                Welcome back
                                        </h1>
                                        <p className="text-[var(--foreground-muted)]">
                                                Sign in to your mind
                                        </p>
                                </div>

                                {/* Form */}
                                <form onSubmit={handleLogin} className="space-y-4">
                                        <div>
                                                <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                                                        Email
                                                </label>
                                                <input
                                                        type="email"
                                                        value={email}
                                                        onChange={(e) => setEmail(e.target.value)}
                                                        className="w-full px-4 py-3 rounded-lg border border-[var(--border)] bg-white text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]"
                                                        placeholder="you@example.com"
                                                        required
                                                />
                                        </div>

                                        <div>
                                                <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                                                        Password
                                                </label>
                                                <input
                                                        type="password"
                                                        value={password}
                                                        onChange={(e) => setPassword(e.target.value)}
                                                        className="w-full px-4 py-3 rounded-lg border border-[var(--border)] bg-white text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]"
                                                        placeholder="••••••••"
                                                        required
                                                />
                                        </div>

                                        {error && (
                                                <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm">
                                                        {error}
                                                </div>
                                        )}

                                        {message && (
                                                <div className="p-3 rounded-lg bg-green-50 border border-green-200 text-green-600 text-sm">
                                                        {message}
                                                </div>
                                        )}

                                        <button
                                                type="submit"
                                                disabled={loading}
                                                className="w-full py-3 rounded-lg bg-[var(--accent-primary)] text-white font-medium hover:bg-[var(--accent-hover)] transition-colors disabled:opacity-50"
                                        >
                                                {loading ? 'Signing in...' : 'Sign in'}
                                        </button>

                                        <button
                                                type="button"
                                                onClick={handleMagicLink}
                                                disabled={loading}
                                                className="w-full py-3 rounded-lg border border-[var(--border)] text-[var(--foreground)] font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
                                        >
                                                Send magic link
                                        </button>
                                </form>

                                {/* Footer */}
                                <p className="text-center text-sm text-[var(--foreground-muted)] mt-6">
                                        Don&apos;t have an account?{' '}
                                        <Link href="/signup" className="text-[var(--accent-primary)] hover:underline">
                                                Sign up
                                        </Link>
                                </p>
                        </div>
                </div>
        );
}
