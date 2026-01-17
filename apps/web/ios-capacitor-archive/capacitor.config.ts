import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
	appId: 'com.mymind.app',
	appName: 'MyMind',
	webDir: 'out',
	// For development with live reload, run:
	//   npx cap run ios --livereload --external
	// This auto-detects your network IP - no hardcoding needed!
	// For production: app loads from bundled 'out/' folder
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
