import { test, expect } from '@playwright/test';

/**
 * MyMind Clone - Category Filter Tests
 * 
 * Validates TagScroller filter functionality and URL state.
 */

test.describe('Category Filters (TagScroller)', () => {
        test.beforeEach(async ({ page }) => {
                await page.goto('/');
                await page.waitForLoadState('domcontentloaded');
        });

        test('filter buttons are visible', async ({ page }) => {
                // Wait for filter container to be present
                const allButton = page.locator('button').filter({ hasText: /^All$/ });
                await expect(allButton).toBeVisible({ timeout: 5000 });

                const webPagesButton = page.locator('button').filter({ hasText: 'Web Pages' });
                await expect(webPagesButton).toBeVisible();

                const videosButton = page.locator('button').filter({ hasText: 'Videos' });
                await expect(videosButton).toBeVisible();

                console.log(JSON.stringify({
                        spec: 'filter-visibility',
                        filtersVisible: true,
                }, null, 2));
        });

        test('clicking Web Pages filter updates URL with article type', async ({ page }) => {
                const webPagesButton = page.locator('button').filter({ hasText: 'Web Pages' });
                await expect(webPagesButton).toBeVisible({ timeout: 5000 });

                await webPagesButton.click();

                // Expect URL to update (retries automatically)
                await expect(page).toHaveURL(/type=article/);

                console.log(JSON.stringify({
                        spec: 'webpages-filter',
                        urlUpdated: true,
                }, null, 2));
        });

        test('clicking Videos filter updates URL', async ({ page }) => {
                const videosButton = page.locator('button').filter({ hasText: 'Videos' });
                await expect(videosButton).toBeVisible({ timeout: 5000 });

                // Click video filter
                await videosButton.click();
                await expect(page).toHaveURL(/type=video/);

                console.log(JSON.stringify({
                        spec: 'videos-filter',
                        urlUpdated: true,
                }, null, 2));
        });

        test('clicking All clears type filter from URL', async ({ page }) => {
                // First apply a filter
                const videosButton = page.locator('button').filter({ hasText: 'Videos' });
                await videosButton.click();
                await page.waitForURL(/type=video/, { timeout: 5000 });

                // Now click All to clear
                const allButton = page.locator('button').filter({ hasText: /^All$/ });
                await allButton.click();

                // URL should not have type param
                await expect(page).not.toHaveURL(/type=/);
        });

        test('clicking selected filter toggles it off', async ({ page }) => {
                const articlesButton = page.locator('button').filter({ hasText: 'Articles' });
                await expect(articlesButton).toBeVisible({ timeout: 5000 });

                // Click to select
                await articlesButton.click();
                await expect(page).toHaveURL(/type=article/);

                // Click again to deselect
                await articlesButton.click();

                await expect(page).not.toHaveURL(/type=/);

                expect(page.url()).not.toContain('type=');

                console.log(JSON.stringify({
                        spec: 'filter-toggle',
                        toggleWorks: true,
                }, null, 2));
        });
});
