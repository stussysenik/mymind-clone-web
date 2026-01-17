/**
 * MyMind - Capacitor Keychain Integration
 *
 * Handles auth token storage for iOS Share Extension access.
 * Uses native KeychainBridge plugin on iOS for proper Keychain access with App Group.
 * Falls back to localStorage on web.
 *
 * Storage architecture:
 * - iOS: Uses native Keychain with App Group (group.com.mymind.app)
 *        Service: com.mymind.app.auth, Account: supabase_token
 * - Web: Uses localStorage
 */

import { Capacitor, registerPlugin } from '@capacitor/core';

const AUTH_TOKEN_KEY = 'supabase_auth_token';

// Define the interface for the native KeychainBridge plugin
interface KeychainBridgePlugin {
	setToken(options: { token: string }): Promise<{ success: boolean }>;
	getToken(): Promise<{ token: string | null }>;
	clearToken(): Promise<{ success: boolean }>;
}

// Register the native plugin (only active on iOS)
const KeychainBridge = registerPlugin<KeychainBridgePlugin>('KeychainBridge');

/**
 * Check if running on iOS native platform.
 */
export function isIOSNative(): boolean {
	return Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'ios';
}

/**
 * Store auth token for Share Extension access.
 * On iOS, this stores to native Keychain with App Group access.
 * On web, falls back to localStorage.
 */
export async function storeAuthToken(token: string): Promise<void> {
	if (isIOSNative()) {
		try {
			await KeychainBridge.setToken({ token });
			console.log('[Keychain] Token stored in iOS Keychain');
		} catch (error) {
			console.error('[Keychain] Failed to store token in iOS Keychain:', error);
			throw error;
		}
		return;
	}

	// Web fallback: use localStorage
	if (typeof localStorage !== 'undefined') {
		localStorage.setItem(AUTH_TOKEN_KEY, token);
	}
}

/**
 * Retrieve stored auth token.
 * On iOS, reads from native Keychain.
 * On web, reads from localStorage.
 */
export async function getAuthToken(): Promise<string | null> {
	if (isIOSNative()) {
		try {
			const result = await KeychainBridge.getToken();
			return result.token;
		} catch (error) {
			console.error('[Keychain] Failed to get token from iOS Keychain:', error);
			return null;
		}
	}

	// Web fallback
	if (typeof localStorage !== 'undefined') {
		return localStorage.getItem(AUTH_TOKEN_KEY);
	}
	return null;
}

/**
 * Clear stored auth token (on logout).
 * On iOS, removes from native Keychain.
 * On web, removes from localStorage.
 */
export async function clearAuthToken(): Promise<void> {
	if (isIOSNative()) {
		try {
			await KeychainBridge.clearToken();
			console.log('[Keychain] Token cleared from iOS Keychain');
		} catch (error) {
			console.error('[Keychain] Failed to clear token from iOS Keychain:', error);
			throw error;
		}
		return;
	}

	// Web fallback
	if (typeof localStorage !== 'undefined') {
		localStorage.removeItem(AUTH_TOKEN_KEY);
	}
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
