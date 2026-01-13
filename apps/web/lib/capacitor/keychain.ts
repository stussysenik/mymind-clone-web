/**
 * MyMind - Capacitor Keychain Integration
 *
 * Handles auth token storage for iOS Share Extension access.
 * Uses Capacitor Preferences plugin with App Group for sharing.
 *
 * NOTE: For full Keychain App Group sharing, native Swift code
 * is required. This module provides the TypeScript interface
 * and will work with Capacitor's Preferences for basic storage.
 *
 * For production, implement native KeychainBridge plugin.
 */

import { Preferences } from '@capacitor/preferences';
import { Capacitor } from '@capacitor/core';

const AUTH_TOKEN_KEY = 'supabase_auth_token';

/**
 * Store auth token for Share Extension access.
 * On iOS, this stores to shared preferences accessible by extension.
 */
export async function storeAuthToken(token: string): Promise<void> {
        if (!Capacitor.isNativePlatform()) {
                // Web fallback: use localStorage
                if (typeof localStorage !== 'undefined') {
                        localStorage.setItem(AUTH_TOKEN_KEY, token);
                }
                return;
        }

        await Preferences.set({
                key: AUTH_TOKEN_KEY,
                value: token,
        });
}

/**
 * Retrieve stored auth token.
 */
export async function getAuthToken(): Promise<string | null> {
        if (!Capacitor.isNativePlatform()) {
                // Web fallback
                if (typeof localStorage !== 'undefined') {
                        return localStorage.getItem(AUTH_TOKEN_KEY);
                }
                return null;
        }

        const { value } = await Preferences.get({ key: AUTH_TOKEN_KEY });
        return value;
}

/**
 * Clear stored auth token (on logout).
 */
export async function clearAuthToken(): Promise<void> {
        if (!Capacitor.isNativePlatform()) {
                if (typeof localStorage !== 'undefined') {
                        localStorage.removeItem(AUTH_TOKEN_KEY);
                }
                return;
        }

        await Preferences.remove({ key: AUTH_TOKEN_KEY });
}

/**
 * Check if running on iOS native platform.
 */
export function isIOSNative(): boolean {
        return Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'ios';
}

/**
 * Sync auth token when user logs in.
 * Call this after successful Supabase authentication.
 */
export async function syncAuthTokenOnLogin(accessToken: string): Promise<void> {
        if (isIOSNative()) {
                await storeAuthToken(accessToken);
                console.log('[Keychain] Auth token synced for Share Extension');
        }
}

/**
 * Clear auth token when user logs out.
 * Call this on Supabase signOut.
 */
export async function clearAuthTokenOnLogout(): Promise<void> {
        if (isIOSNative()) {
                await clearAuthToken();
                console.log('[Keychain] Auth token cleared');
        }
}
