/**
 * MyMind Clone - Auth Callback
 * 
 * Handles OAuth and magic link callbacks.
 * 
 * @fileoverview Auth callback route
 */

import { createClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
        const requestUrl = new URL(request.url);
        const code = requestUrl.searchParams.get('code');

        if (code) {
                const supabase = await createClient();
                await supabase.auth.exchangeCodeForSession(code);
        }

        // Redirect to home after successful auth
        return NextResponse.redirect(new URL('/', request.url));
}
