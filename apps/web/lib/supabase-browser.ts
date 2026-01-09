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
 */
export function createClient() {
        return createBrowserClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );
}
