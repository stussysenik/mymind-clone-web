/**
 * MyMind Clone - Supabase Auth Browser Client
 *
 * Client-side Supabase client for auth in React components.
 *
 * @fileoverview Browser-side auth client
 */

import { createBrowserClient } from '@supabase/ssr';

/**
 * Create a Supabase client for browser-side operations.
 * Returns a mock client during build time if env vars are missing.
 */
export function createClient() {
        const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

        // During build/SSR without env vars, return a placeholder
        // This prevents build failures while the actual client will work at runtime
        if (!url || !anonKey) {
                // Return a mock client that will be replaced at runtime
                return createBrowserClient(
                        'https://placeholder.supabase.co',
                        'placeholder-anon-key'
                );
        }

        return createBrowserClient(url, anonKey);
}
