/**
 * MyMind Clone - Supabase Auth Server Client
 * 
 * Server-side Supabase client for Next.js App Router.
 * Uses cookies for session management.
 * 
 * @fileoverview Server-side auth client
 */

import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * Create a Supabase client for server-side operations.
 */
export async function createClient() {
        const cookieStore = await cookies();

        return createServerClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
                {
                        cookies: {
                                getAll() {
                                        return cookieStore.getAll();
                                },
                                setAll(cookiesToSet) {
                                        try {
                                                cookiesToSet.forEach(({ name, value, options }) =>
                                                        cookieStore.set(name, value, options)
                                                );
                                        } catch {
                                                // Ignore errors in Server Components (cookies are read-only)
                                        }
                                },
                        },
                }
        );
}

/**
 * Get the current user session.
 */
export async function getUser() {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        return user;
}

/**
 * Get the current session.
 */
export async function getSession() {
        const supabase = await createClient();
        const { data: { session } } = await supabase.auth.getSession();
        return session;
}
