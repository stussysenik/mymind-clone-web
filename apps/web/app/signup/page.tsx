/**
 * MyMind Clone - Signup Page
 * 
 * Registration page with email/password.
 * 
 * @fileoverview Signup page
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase-browser';

export default function SignupPage() {
        const [email, setEmail] = useState('');
        const [password, setPassword] = useState('');
        const [confirmPassword, setConfirmPassword] = useState('');
        const [loading, setLoading] = useState(false);
        const [error, setError] = useState<string | null>(null);
        const [message, setMessage] = useState<string | null>(null);
        const router = useRouter();
        const supabase = createClient();

        const handleSignup = async (e: React.FormEvent) => {
                e.preventDefault();
                setLoading(true);
                setError(null);

                if (password !== confirmPassword) {
                        setError('Passwords do not match');
                        setLoading(false);
                        return;
                }

                if (password.length < 6) {
                        setError('Password must be at least 6 characters');
                        setLoading(false);
                        return;
                }

                const { error } = await supabase.auth.signUp({
                        email,
                        password,
                        options: {
                                emailRedirectTo: `${window.location.origin}/auth/callback`,
                        },
                });

                if (error) {
                        setError(error.message);
                        setLoading(false);
                } else {
                        setMessage('Check your email to confirm your account!');
                        setLoading(false);
                }
        };

        return (
                <div className="min-h-screen bg-[var(--background)] flex items-center justify-center px-4">
                        <div className="w-full max-w-md">
                                {/* Header */}
                                <div className="text-center mb-8">
                                        <h1 className="font-serif text-3xl font-bold text-[var(--foreground)] mb-2">
                                                Create your mind
                                        </h1>
                                        <p className="text-[var(--foreground-muted)]">
                                                Start saving and organizing your ideas
                                        </p>
                                </div>

                                {/* Form */}
                                <form onSubmit={handleSignup} className="space-y-4">
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

                                        <div>
                                                <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                                                        Confirm Password
                                                </label>
                                                <input
                                                        type="password"
                                                        value={confirmPassword}
                                                        onChange={(e) => setConfirmPassword(e.target.value)}
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
                                                {loading ? 'Creating account...' : 'Create account'}
                                        </button>
                                </form>

                                {/* Footer */}
                                <p className="text-center text-sm text-[var(--foreground-muted)] mt-6">
                                        Already have an account?{' '}
                                        <Link href="/login" className="text-[var(--accent-primary)] hover:underline">
                                                Sign in
                                        </Link>
                                </p>
                        </div>
                </div>
        );
}
