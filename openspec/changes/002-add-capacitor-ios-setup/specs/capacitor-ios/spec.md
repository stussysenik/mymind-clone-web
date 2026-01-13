## ADDED Requirements

### Requirement: Capacitor Configuration
The project SHALL include a valid Capacitor configuration file that defines the iOS app settings for native container deployment.

#### Scenario: Configuration file exists
- **WHEN** the developer examines the project structure
- **THEN** `apps/web/capacitor.config.ts` exists
- **AND** it exports a valid CapacitorConfig object
- **AND** it specifies appId as "com.mymind.app"
- **AND** it specifies appName as "MyMind"

#### Scenario: WebDir configuration for Next.js
- **WHEN** Capacitor syncs the web assets
- **THEN** it reads from the `out` directory (Next.js static export)
- **AND** the web app loads correctly in the native WebView

### Requirement: iOS Project Structure
The project SHALL include a properly initialized iOS project directory that can be opened in Xcode.

#### Scenario: iOS project initialized
- **WHEN** `npx cap sync ios` is executed
- **THEN** the command completes without errors
- **AND** the `ios/App/App.xcodeproj` file exists
- **AND** the project can be opened in Xcode

#### Scenario: Development server configuration
- **WHEN** running in development mode
- **THEN** the iOS app connects to the local Next.js dev server
- **AND** hot reload works for web changes

### Requirement: Capacitor Scripts
The package.json SHALL include npm scripts for common Capacitor operations to streamline development.

#### Scenario: Sync script available
- **WHEN** developer runs `npm run cap:sync`
- **THEN** Capacitor syncs web assets to native platforms

#### Scenario: Open iOS script available
- **WHEN** developer runs `npm run cap:open:ios`
- **THEN** Xcode opens with the iOS project loaded

### Requirement: Preferences Plugin for Keychain
The project SHALL include the Capacitor Preferences plugin to enable secure token storage in iOS Keychain for Share Extension authentication.

#### Scenario: Preferences plugin installed
- **WHEN** examining package.json dependencies
- **THEN** @capacitor/preferences is listed
- **AND** it can be imported in TypeScript code
