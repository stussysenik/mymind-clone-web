import { test, expect } from '@playwright/test';

/**
 * MyMind Clone - Search Tests
 * 
 * Verifies search bar functionality and results.
 * Tests use Enter key to trigger immediate URL updates (bypassing debounce).
 */

test.describe('Search Functionality', () => {
        test.beforeEach(async ({ page }) => {
                page.on('console', msg => console.log(`[BROWSER] ${msg.text()}`));

                await page.goto('/');

                // Seed localStorage with COMPLETE test data matching Card type
                await page.evaluate(() => {
                        const now = new Date().toISOString();
                        const mockCards = [
                                {
                                        id: 'mock-1',
                                        userId: 'test-user',
                                        title: 'Playwright Test Card',
                                        content: 'This card is seeded via localStorage for UI testing.',
                                        type: 'article',
                                        url: 'https://playwright.dev',
                                        imageUrl: null,
                                        tags: ['testing', 'automation'],
                                        metadata: {},
                                        createdAt: now,
                                        updatedAt: now,
                                        deletedAt: null
                                },
                                {
                                        id: 'mock-2',
                                        userId: 'test-user',
                                        title: 'Video Test',
                                        content: 'A video card for testing',
                                        type: 'video',
                                        url: 'https://youtube.com',
                                        imageUrl: null,
                                        tags: ['video'],
                                        metadata: {},
                                        createdAt: now,
                                        updatedAt: now,
                                        deletedAt: null
                                }
                        ];
                        localStorage.setItem('mymind_cards', JSON.stringify(mockCards));
                });

                await page.reload();
                await expect(page.locator('header')).toBeVisible();
        });

        test('initial content loads within 5 seconds', async ({ page }) => {
                const startTime = Date.now();
                const card = page.locator('article').first();
                const emptyState = page.locator('text=couldn\'t find anything');
                await expect(card.or(emptyState)).toBeVisible({ timeout: 5000 });
                console.log(`Content load time: ${Date.now() - startTime}ms`);
        });

        test('search input is visible and editable', async ({ page }) => {
                const searchInput = page.locator('input[placeholder*="Search"]');
                await expect(searchInput).toBeVisible();
                await expect(searchInput).toBeEditable();
        });

        test('search with Enter key updates URL immediately', async ({ page }) => {
                const searchInput = page.locator('input[placeholder*="Search"]');

                // Type and press Enter for immediate URL update
                await searchInput.fill('Playwright');
                await searchInput.press('Enter');

                // URL should update immediately (Enter bypasses debounce)
                await expect(page).toHaveURL(/q=Playwright/, { timeout: 10000 });

                // Wait for client hydration and filtering
                await page.waitForTimeout(500);

                // Verify page shows content (articles OR empty state)
                const articles = page.locator('article');
                const emptyState = page.locator('text=couldn\'t find anything');
                await expect(articles.first().or(emptyState)).toBeVisible();
        });

        test('empty search shows empty state', async ({ page }) => {
                const searchInput = page.locator('input[placeholder*="Search"]');

                await searchInput.fill('NonExistentThing12345');
                await searchInput.press('Enter');

                await expect(page).toHaveURL(/q=NonExistentThing/);

                const emptyState = page.locator('text=couldn\'t find anything');
                await expect(emptyState).toBeVisible();
        });

        test('clearing search removes query from URL', async ({ page }) => {
                const searchInput = page.locator('input[placeholder*="Search"]');

                // Search first
                await searchInput.fill('Video');
                await searchInput.press('Enter');
                await expect(page).toHaveURL(/q=Video/);

                // Clear and submit
                await searchInput.clear();
                await searchInput.press('Enter');

                // URL should no longer have q=Video
                await expect(page).not.toHaveURL(/q=Video/);
        });

        test('stress test: rapid typing is stable', async ({ page }) => {
                const searchInput = page.locator('input[placeholder*="Search"]');

                // Rapid typing simulation
                const terms = ['Design', 'Code', 'Art', 'AI'];
                for (const term of terms) {
                        await searchInput.fill(term);
                        await page.waitForTimeout(50);
                }

                // Final search with Enter
                await searchInput.fill('FinalSearch');
                await searchInput.press('Enter');

                await expect(page).toHaveURL(/q=FinalSearch/);

                // App should still be responsive
                await expect(searchInput).toBeEditable();
        });
});
