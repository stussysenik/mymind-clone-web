/**
 * MyMind Clone - Auth Token Sync Component
 *
 * Syncs Supabase auth tokens to iOS Keychain for Share Extension access.
 * This is a client-side component that listens for auth state changes.
 *
 * @fileoverview Auth token synchronization for iOS Share Extension
 */

'use client';

import { useEffect } from 'react';
import { createClient } from '@/lib/supabase-browser';
import {
	syncAuthTokenOnLogin,
	clearAuthTokenOnLogout,
	isIOSNative,
} from '@/lib/capacitor/keychain';

/**
 * AuthTokenSync - Invisible component that syncs auth tokens to iOS Keychain.
 *
 * Usage: Add this component once at the app root level.
 * It will automatically:
 * - Store token in Keychain when user signs in
 * - Clear token from Keychain when user signs out
 * - Refresh token in Keychain when session is refreshed
 */
export function AuthTokenSync() {
	useEffect(() => {
		// Skip if not on iOS native
		if (!isIOSNative()) {
			return;
		}

		const supabase = createClient();

		// Initial sync - check if there's an existing session
		const syncInitialToken = async () => {
			try {
				const {
					data: { session },
				} = await supabase.auth.getSession();
				if (session?.access_token) {
					await syncAuthTokenOnLogin(session.access_token);
					console.log('[AuthTokenSync] Initial token synced');
				}
			} catch (error) {
				console.error('[AuthTokenSync] Failed to sync initial token:', error);
			}
		};

		syncInitialToken();

		// Listen for auth state changes
		const {
			data: { subscription },
		} = supabase.auth.onAuthStateChange(async (event, session) => {
			console.log('[AuthTokenSync] Auth state changed:', event);

			try {
				switch (event) {
					case 'SIGNED_IN':
					case 'TOKEN_REFRESHED':
						if (session?.access_token) {
							await syncAuthTokenOnLogin(session.access_token);
							console.log('[AuthTokenSync] Token synced after', event);
						}
						break;

					case 'SIGNED_OUT':
						await clearAuthTokenOnLogout();
						console.log('[AuthTokenSync] Token cleared after sign out');
						break;

					default:
						// Handle other events if needed
						break;
				}
			} catch (error) {
				console.error('[AuthTokenSync] Error handling auth event:', error);
			}
		});

		// Cleanup subscription on unmount
		return () => {
			subscription.unsubscribe();
		};
	}, []);

	// This component renders nothing - it's purely for side effects
	return null;
}

export default AuthTokenSync;
