/**
 * Stub keychain module for web platform
 *
 * The native iOS app now handles keychain operations directly in Swift.
 * These functions are no-ops on the web platform.
 *
 * @see apps/ios/ for the native iOS implementation
 */

/**
 * Check if running on iOS native (always false for web)
 */
export function isIOSNative(): boolean {
  return false;
}

/**
 * Sync auth token to keychain (no-op on web)
 */
export async function syncAuthTokenOnLogin(_token: string): Promise<void> {
  // No-op on web - native iOS handles this in Swift
}

/**
 * Clear auth token from keychain (no-op on web)
 */
export async function clearAuthTokenOnLogout(): Promise<void> {
  // No-op on web - native iOS handles this in Swift
}
