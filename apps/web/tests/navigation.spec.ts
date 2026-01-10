import { test, expect } from '@playwright/test';

/**
 * MyMind Clone - Navigation Tests
 * 
 * Validates header navigation, tab routing, and brand interactions.
 */

test.describe('Navigation & Header', () => {
        test.beforeEach(async ({ page }) => {
                await page.goto('/');
        });

        test('header is visible with all elements', async ({ page }) => {
                // Brand logo
                const brand = page.locator('text=Creative Brain');
                await expect(brand).toBeVisible();

                // Navigation tabs
                const everythingTab = page.locator('a').filter({ hasText: 'Everything' });
                const spacesTab = page.locator('a').filter({ hasText: 'Spaces' });
                const serendipityTab = page.locator('a').filter({ hasText: 'Serendipity' });

                await expect(everythingTab).toBeVisible();
                await expect(spacesTab).toBeVisible();
                await expect(serendipityTab).toBeVisible();

                console.log(JSON.stringify({
                        spec: 'header-elements',
                        hasBrand: true,
                        hasTabs: true,
                }, null, 2));
        });

        test('Everything tab is active on home page', async ({ page }) => {
                const everythingTab = page.locator('a[href="/"]').filter({ hasText: 'Everything' });

                // Should have active styling (bg-black/5)
                await expect(everythingTab).toHaveClass(/bg-black/);

                console.log(JSON.stringify({
                        spec: 'active-tab',
                        tab: 'everything',
                        isActive: true,
                }, null, 2));
        });

        test('clicking Spaces tab navigates to /spaces', async ({ page }) => {
                const spacesTab = page.locator('a').filter({ hasText: 'Spaces' });
                await spacesTab.click();

                await expect(page).toHaveURL('/spaces');

                console.log(JSON.stringify({
                        spec: 'spaces-navigation',
                        navigatedTo: '/spaces',
                }, null, 2));
        });

        test('clicking Serendipity tab navigates to /serendipity', async ({ page }) => {
                const serendipityTab = page.locator('a').filter({ hasText: 'Serendipity' });
                await serendipityTab.click();

                await expect(page).toHaveURL('/serendipity');

                console.log(JSON.stringify({
                        spec: 'serendipity-navigation',
                        navigatedTo: '/serendipity',
                }, null, 2));
        });

        test('clicking brand logo returns to home', async ({ page }) => {
                // First navigate away
                await page.goto('/spaces');
                await expect(page).toHaveURL('/spaces');

                // Click brand logo
                const brand = page.locator('a').filter({ hasText: 'Creative Brain' });
                await brand.click();

                await expect(page).toHaveURL('/');

                console.log(JSON.stringify({
                        spec: 'brand-home',
                        navigatedTo: '/',
                }, null, 2));
        });

        test('trash/archive link is visible and navigates', async ({ page }) => {
                const trashLink = page.locator('a[href="/trash"]');
                await expect(trashLink).toBeVisible();

                await trashLink.click();
                await expect(page).toHaveURL('/trash');

                console.log(JSON.stringify({
                        spec: 'trash-navigation',
                        navigatedTo: '/trash',
                }, null, 2));
        });

        test('tab navigation updates active state', async ({ page }) => {
                // Navigate to Spaces
                await page.locator('a').filter({ hasText: 'Spaces' }).click();
                await expect(page).toHaveURL('/spaces');

                // Spaces should now be active
                const spacesTab = page.locator('a[href="/spaces"]');
                await expect(spacesTab).toHaveClass(/bg-black/);

                // Everything should not be active
                const everythingTab = page.locator('a[href="/"]').filter({ hasText: 'Everything' });
                await expect(everythingTab).not.toHaveClass(/bg-black\/5/);

                console.log(JSON.stringify({
                        spec: 'tab-active-state',
                        activeTab: 'spaces',
                }, null, 2));
        });
});
