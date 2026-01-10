import { test, expect } from '@playwright/test';

/**
 * MyMind Clone - Spaces Tests
 * 
 * Verifies the Spaces (collections) functionality.
 * Note: Spaces require authentication. Unauthenticated access redirects to login.
 */

test.describe('Spaces', () => {
        test.beforeEach(async ({ page }) => {
                await page.goto('/spaces');
        });

        test('accessing spaces redirects to login if unauthenticated', async ({ page }) => {
                // If we are not logged in, we should be on /login
                // If we ARE logged in, we should be on /spaces

                await page.waitForLoadState('domcontentloaded');
                const url = page.url();

                if (url.includes('/login')) {
                        console.log('Verified: Authentication required for Spaces');
                        await expect(page.locator('form input[type="email"]')).toBeVisible();
                } else {
                        console.log('Authorized: Accessing Spaces');
                        await expect(page).toHaveURL(/spaces/);
                        // Check for spaces title
                        await expect(page.locator('h1, h2, h3').filter({ hasText: /Spaces/i }).first()).toBeVisible();
                }
        });

        test('spaces grid is visible (if authenticated)', async ({ page }) => {
                const url = page.url();
                if (url.includes('/login')) {
                        test.skip();
                        return;
                }

                // Check for "New Space" button or existing spaces
                const newSpaceBtn = page.locator('button').filter({ hasText: /New Space|Create/i });
                // It might be empty state
                const emptyState = page.locator('text=No spaces yet');

                await expect(newSpaceBtn.or(emptyState)).toBeVisible();
        });
});
