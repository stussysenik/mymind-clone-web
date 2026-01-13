import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
        appId: 'com.mymind.app',
        appName: 'MyMind',
        webDir: 'out',
        // Server configuration for development
        server: {
                // For development: connect to local dev server
                // Comment this out for production builds
                url: process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : undefined,
                cleartext: true,
        },
        ios: {
                // Allow Share Extension to access auth token
                // Share Extension and main app use same App Group for Keychain sharing
                scheme: 'MyMind',
                contentInset: 'automatic',
        },
        plugins: {
                // Preferences plugin for secure token storage
                // Tokens stored here are accessible to Share Extension via shared Keychain
                Preferences: {
                        // Use App Group for sharing between app and extension
                        // This will be configured in Xcode project settings
                },
        },
};

export default config;
