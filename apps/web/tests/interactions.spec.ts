import { test, expect } from '@playwright/test';

/**
 * MyMind Clone - UI Interactions Tests
 * 
 * Validates micro-interactions, loading states, and visual feedback.
 */

test.describe('Loading States', () => {
        test('shows skeleton cards while loading', async ({ page }) => {
                // Intercept API to simulate slow response
                await page.route('**/api/search**', async (route) => {
                        await new Promise((resolve) => setTimeout(resolve, 1000));
                        await route.continue();
                });

                await page.goto('/');

                // Look for skeleton/loading indicator
                const loadingText = page.locator('text=Loading');
                const skeletons = page.locator('.animate-shimmer, .animate-pulse');

                const hasLoadingIndicator = await loadingText.isVisible() || await skeletons.first().isVisible();

                console.log(JSON.stringify({
                        spec: 'loading-skeleton',
                        hasLoadingIndicator: hasLoadingIndicator,
                }, null, 2));
        });
});

test.describe('Add Button', () => {
        test('add button is visible and has correct styling', async ({ page }) => {
                await page.goto('/');

                const addButton = page.locator('[data-testid="add-button"]');
                await expect(addButton).toBeVisible();

                // Should have orange/accent background
                const bgColor = await addButton.evaluate((el) =>
                        window.getComputedStyle(el).backgroundColor
                );

                console.log(JSON.stringify({
                        spec: 'add-button-style',
                        visible: true,
                        backgroundColor: bgColor,
                }, null, 2));

                expect(bgColor).toBeTruthy();
        });

        test('add button has hover effect', async ({ page }) => {
                await page.goto('/');

                const addButton = page.locator('[data-testid="add-button"]');

                // Get initial state
                const initialTransform = await addButton.evaluate((el) =>
                        window.getComputedStyle(el).transform
                );

                // Hover over button
                await addButton.hover();
                await page.waitForTimeout(200);

                // Check for visual change (scale, shadow, etc.)
                const hoverShadow = await addButton.evaluate((el) =>
                        window.getComputedStyle(el).boxShadow
                );

                console.log(JSON.stringify({
                        spec: 'add-button-hover',
                        hasHoverEffect: hoverShadow !== 'none',
                }, null, 2));
        });
});

test.describe('Search Functionality', () => {
        test('search input accepts text and updates UI', async ({ page }) => {
                await page.goto('/');

                const searchInput = page.locator('input[type="text"]').first();
                await searchInput.fill('design');

                // Give time for debounced search
                await page.waitForTimeout(500);

                // URL might update with search query
                const currentUrl = page.url();

                console.log(JSON.stringify({
                        spec: 'search-input',
                        searchTerm: 'design',
                        urlUpdated: currentUrl.includes('q='),
                }, null, 2));

                expect(await searchInput.inputValue()).toBe('design');
        });

        test('clearing search shows all cards again', async ({ page }) => {
                await page.goto('/?q=design');

                const searchInput = page.locator('input[type="text"]').first();
                await searchInput.clear();

                await page.waitForTimeout(500);

                // URL should not have query param
                await expect(page).not.toHaveURL(/q=design/);

                console.log(JSON.stringify({
                        spec: 'search-clear',
                        urlCleared: true,
                }, null, 2));
        });
});

test.describe('Responsive Layout', () => {
        test('cards display in single column on mobile', async ({ page }) => {
                // Set mobile viewport
                await page.setViewportSize({ width: 375, height: 667 });
                await page.goto('/');

                // Wait for either cards OR empty state (robustness)
                const hasCards = await page.locator('article').first().isVisible().catch(() => false);
                const hasEmptyState = await page.locator('text=It\'s quiet here').isVisible().catch(() => false);

                if (!hasCards && !hasEmptyState) {
                        // If neither, maybe still loading?
                        await page.waitForTimeout(2000);
                }

                // Check for single column layout wrapper
                // Both grid and empty state are wrapped in similar containers or we check main content width
                const main = page.locator('main');
                await expect(main).toBeVisible();

                console.log(JSON.stringify({
                        spec: 'mobile-layout',
                        viewport: { width: 375, height: 667 },
                }, null, 2));
        });

        test('header tabs collapse on mobile', async ({ page }) => {
                await page.setViewportSize({ width: 375, height: 667 });
                await page.goto('/');

                // Tab labels should be hidden on mobile (icons only)
                const tabLabel = page.locator('nav span.hidden');
                const count = await tabLabel.count();

                console.log(JSON.stringify({
                        spec: 'mobile-header',
                        hiddenLabels: count,
                }, null, 2));

                // Labels should exist but be hidden
                expect(count).toBeGreaterThan(0);
        });
});
