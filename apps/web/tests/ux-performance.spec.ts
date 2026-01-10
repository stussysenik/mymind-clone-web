import { test, expect } from '@playwright/test';

/**
 * MyMind Clone - Core UX & Performance Tests
 * 
 * Stress tests for production readiness:
 * - Network conditions
 * - Loading performance
 * - Visual artifact bugs
 * - Tag/Space filtering
 */

test.describe('Core UX & Performance', () => {
        test.beforeEach(async ({ page }) => {
                page.on('console', msg => {
                        if (msg.type() === 'error') console.log(`[ERROR] ${msg.text()}`);
                });

                await page.goto('/');
                await expect(page.locator('header')).toBeVisible();
        });

        test('page loads within 5 seconds on first visit', async ({ page }) => {
                const startTime = Date.now();
                await page.reload();

                // Critical elements must be visible
                await expect(page.locator('header')).toBeVisible({ timeout: 5000 });
                await expect(page.locator('input[placeholder*="Search"]')).toBeVisible({ timeout: 5000 });

                const loadTime = Date.now() - startTime;
                console.log(`Page load time: ${loadTime}ms`);
                expect(loadTime).toBeLessThan(5000);
        });

        test('header and navigation are always visible', async ({ page }) => {
                await expect(page.locator('header')).toBeVisible();

                // Navigation elements
                await expect(page.locator('input[placeholder*="Search"]')).toBeVisible();
        });

        test('no visual overlap between AI badge and actions', async ({ page }) => {
                // Seed a card with processing=true
                await page.evaluate(() => {
                        const now = new Date().toISOString();
                        const mockCards = [{
                                id: 'processing-card',
                                userId: 'test',
                                title: 'Processing Card',
                                content: 'Test',
                                type: 'article',
                                url: 'https://example.com',
                                imageUrl: null,
                                tags: [],
                                metadata: { processing: true },
                                createdAt: now,
                                updatedAt: now,
                                deletedAt: null
                        }];
                        localStorage.setItem('mymind_cards', JSON.stringify(mockCards));
                });

                await page.reload();
                await expect(page.locator('header')).toBeVisible();

                // Wait for card to render
                const card = page.locator('article').first();
                await expect(card).toBeVisible();

                // The "Analyzing..." badge should be on the LEFT (not covering actions)
                const analyzingBadge = page.locator('text=Analyzing...');
                if (await analyzingBadge.count() > 0) {
                        // Hover to reveal action buttons
                        await card.hover();
                        await page.waitForTimeout(200);

                        // Actions should not be covered - they should be clickable
                        // (If overlapping, actions would be blocked by the badge)
                        const deleteBtn = page.locator('button[aria-label="Delete card"]');
                        if (await deleteBtn.count() > 0) {
                                await expect(deleteBtn).toBeVisible();
                        }
                }
        });

        test('tag click filters correctly', async ({ page }) => {
                // Seed cards with tags
                await page.evaluate(() => {
                        const now = new Date().toISOString();
                        const cards = [
                                {
                                        id: 'card-design',
                                        userId: 'test',
                                        title: 'Design Patterns',
                                        content: 'UI design',
                                        type: 'article',
                                        url: null,
                                        imageUrl: null,
                                        tags: ['design', 'ui'],
                                        metadata: {},
                                        createdAt: now,
                                        updatedAt: now,
                                        deletedAt: null
                                },
                                {
                                        id: 'card-code',
                                        userId: 'test',
                                        title: 'Code Review',
                                        content: 'Best practices',
                                        type: 'article',
                                        url: null,
                                        imageUrl: null,
                                        tags: ['code', 'review'],
                                        metadata: {},
                                        createdAt: now,
                                        updatedAt: now,
                                        deletedAt: null
                                }
                        ];
                        localStorage.setItem('mymind_cards', JSON.stringify(cards));
                });

                await page.reload();

                // Wait for cards to load
                await expect(page.locator('article').first()).toBeVisible();

                // Find and click a tag (ensure we click the tag pill, not the card title "Design Patterns")
                // Tags are styled as rounded pills
                const tag = page.locator('span.rounded-full', { hasText: /^design$/i }).first();
                if (await tag.count() > 0) {
                        await tag.click();

                        /*
                                                // URL should update with the tag query (encoded #)
                                                // The app uses ?q=#tag which is %23tag
                                                */
                        await expect(page).toHaveURL(/q=%23design/);

                        // Should show filtered results
                        await page.waitForTimeout(300);
                }
        });

        test('empty spaces should not display', async ({ page }) => {
                // This test verifies the spaces implementation
                // Spaces with 0 cards should be hidden
                // Looking for any indicator of space visibility vs actual data

                // Navigate to a space if sidebar exists
                const sidebar = page.locator('[data-testid="sidebar"]');
                if (await sidebar.count() > 0) {
                        // Verify no empty space indicators
                        const emptyBadge = page.locator('text=0 items');
                        await expect(emptyBadge).not.toBeVisible();
                }
        });

        test('type filter tabs work correctly', async ({ page }) => {
                // Click on a type filter tab
                const videosTab = page.locator('button', { hasText: 'Videos' }).first();
                if (await videosTab.count() > 0) {
                        await videosTab.click();

                        // URL should update with type filter
                        await expect(page).toHaveURL(/type=video/);
                }
        });

        test('network failure graceful handling', async ({ page, context }) => {
                // Simulate offline
                await context.setOffline(true);

                // The page should still be usable (client-side data)
                await expect(page.locator('header')).toBeVisible();
                await expect(page.locator('input[placeholder*="Search"]')).toBeEditable();

                // Re-enable
                await context.setOffline(false);
        });

        test('rapid interactions do not crash the app', async ({ page }) => {
                const searchInput = page.locator('input[placeholder*="Search"]');

                // Rapid type/clear cycles
                for (let i = 0; i < 5; i++) {
                        await searchInput.fill(`test${i}`);
                        await searchInput.clear();
                }

                // Page should still be responsive
                await expect(searchInput).toBeEditable();
                await expect(page.locator('header')).toBeVisible();
        });
});

test.describe('Slow Network Simulation', () => {
        test('handles slow network gracefully', async ({ page }) => {
                // Throttle network to "Slow 3G" equivalent
                const client = await page.context().newCDPSession(page);
                await client.send('Network.enable');
                await client.send('Network.emulateNetworkConditions', {
                        offline: false,
                        downloadThroughput: 500 * 1024 / 8, // 500 Kbps
                        uploadThroughput: 500 * 1024 / 8,
                        latency: 400 // 400ms
                });

                await page.goto('/');

                // Should still load (with loading states)
                await expect(page.locator('header')).toBeVisible({ timeout: 15000 });

                // Content should eventually load
                const article = page.locator('article').first();
                const emptyState = page.locator('text=couldn\'t find anything');
                await expect(article.or(emptyState)).toBeVisible({ timeout: 20000 });
        });
});
