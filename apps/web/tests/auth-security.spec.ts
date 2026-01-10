import { test, expect } from '@playwright/test';

/**
 * MyMind Clone - Auth Security Tests
 * 
 * Verifies authentication requirements and access control.
 */

test.describe('Authentication & Security', () => {
        // Use a fresh context without auth for these tests
        test.use({ storageState: { cookies: [], origins: [] } });

        test('unauthenticated users are redirected to login', async ({ page }) => {
                // Try to access protected route
                await page.goto('/');

                // Should redirect to /login
                await expect(page).toHaveURL(/\/login/);
        });

        test('spaces page requires authentication', async ({ page }) => {
                await page.goto('/spaces');
                await expect(page).toHaveURL(/\/login/);
        });

        test('serendipity page requires authentication', async ({ page }) => {
                await page.goto('/serendipity');
                await expect(page).toHaveURL(/\/login/);
        });

        test('trash page requires authentication', async ({ page }) => {
                await page.goto('/trash');
                await expect(page).toHaveURL(/\/login/);
        });

        test('login page is accessible', async ({ page }) => {
                await page.goto('/login');

                // Should NOT redirect (login is public)
                await expect(page).toHaveURL(/\/login/);

                // Should have a form or submit button
                const form = page.locator('form, button[type="submit"]');
                await expect(form.first()).toBeVisible({ timeout: 10000 });
        });
});
