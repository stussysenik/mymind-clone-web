import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(__dirname, '.env.local') });

/**
 * MyMind Clone - Playwright Configuration
 * Spec-driven testing with test account authentication
 */
export default defineConfig({
        testDir: './tests',
        fullyParallel: true,
        forbidOnly: !!process.env.CI,
        retries: process.env.CI ? 2 : 0,
        workers: process.env.CI ? 1 : undefined,
        reporter: [
                ['html'],
                ['json', { outputFile: 'test-results/results.json' }],
        ],

        // Global setup authenticates test user
        globalSetup: require.resolve('./tests/global-setup'),

        use: {
                baseURL: 'http://localhost:3000',
                trace: 'on-first-retry',
                // Use stored auth state from global setup
                storageState: 'tests/.auth/user.json',
        },

        projects: [
                // Setup project - runs first to authenticate
                {
                        name: 'setup',
                        testMatch: /global-setup\.ts/,
                },
                {
                        name: 'chromium',
                        use: {
                                ...devices['Desktop Chrome'],
                                // Use auth state for all tests
                                storageState: 'tests/.auth/user.json',
                        },
                        dependencies: ['setup'],
                },
        ],

        webServer: {
                command: 'bun run dev',
                url: 'http://localhost:3000',
                reuseExistingServer: true,
        },
});
