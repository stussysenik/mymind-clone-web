/**
 * MyMind Clone - Playwright Global Setup
 * 
 * Authenticates a test user before running E2E tests.
 * Stores auth state to be reused by all tests.
 * 
 * Test credentials should be stored in .env.local:
 * - TEST_USER_EMAIL
 * - TEST_USER_PASSWORD
 */

import { chromium, FullConfig } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const TEST_EMAIL = process.env.TEST_USER_EMAIL || 'test@example.com';
const TEST_PASSWORD = process.env.TEST_USER_PASSWORD || 'testpassword123';

async function globalSetup(config: FullConfig) {
        const { baseURL, storageState } = config.projects[0].use;

        if (!storageState) {
                console.log('No storageState path configured, skipping auth setup');
                return;
        }

        const browser = await chromium.launch();
        const page = await browser.newPage();

        try {
                // Navigate to signup first to ensure user exists
                await page.goto(`${baseURL}/signup`);

                // Fill in credentials
                const emailInput = page.locator('input[type="email"], input[name="email"]');
                const passwordInput = page.locator('input[type="password"], input[name="password"]');

                if (await emailInput.isVisible()) {
                        await emailInput.fill(TEST_EMAIL);
                        // Use placeholder to disambiguate or use first matching password input
                        // Assuming the first password input is "Password" and second is "Confirm Password"
                        await passwordInput.first().fill(TEST_PASSWORD);

                        // If there is a confirm password field (common in signup), fill it too if visible
                        if (await passwordInput.count() > 1) {
                                await passwordInput.nth(1).fill(TEST_PASSWORD);
                        }

                        // Submit signup form
                        const submitButton = page.locator('button[type="submit"]');
                        await submitButton.click();

                        // Check for "User already exists" error or redirect
                        try {
                                // If we get redirected to home, signup worked
                                await page.waitForURL(`${baseURL}/`, { timeout: 5000 });
                                console.log('✓ Signed up & authenticated successfully as test user');
                        } catch {
                                // If timeout, check if we are still on signup (likely error) or need to login
                                const errorText = await page.getByText(/already registered|already exists/i).isVisible().catch(() => false);

                                if (errorText || page.url().includes('/signup')) {
                                        console.log('User already exists, switching to login...');
                                        await page.goto(`${baseURL}/login`);
                                        await emailInput.fill(TEST_EMAIL);
                                        await passwordInput.fill(TEST_PASSWORD);
                                        await submitButton.click();
                                        await page.waitForURL(`${baseURL}/`, { timeout: 10000 });
                                        console.log('✓ Logged in successfully as test user');
                                }
                        }
                } else {
                        console.log('Signup form not found, attempting to continue without auth');
                }

                // Save storage state (cookies + local storage)
                await page.context().storageState({ path: storageState as string });
        } catch (error) {
                console.error('Auth setup failed:', error);
                console.log('Tests will run without authentication - some may redirect to /login');

                // Write empty state to prevent file not found errors
                if (storageState) {
                        const dir = path.dirname(storageState as string);
                        if (!fs.existsSync(dir)) {
                                fs.mkdirSync(dir, { recursive: true });
                        }
                        fs.writeFileSync(storageState as string, JSON.stringify({ cookies: [], origins: [] }, null, 2));
                }
        } finally {
                await browser.close();
        }
}

export default globalSetup;
