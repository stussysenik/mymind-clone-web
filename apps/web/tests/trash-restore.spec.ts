/**
 * Trash Restore Tests
 * 
 * Verifies that cards in trash have a restore button and can be restored.
 */

import { test, expect } from '@playwright/test';

test.describe('Trash Restore Functionality', () => {
        test.beforeEach(async ({ page }) => {
                // Navigate to trash page
                await page.goto('/trash');
                await page.waitForLoadState('networkidle');
        });

        test('restore button appears on card hover in trash', async ({ page }) => {
                // Check if there are cards in trash
                const cards = page.locator('article');
                const cardCount = await cards.count();

                if (cardCount === 0) {
                        test.skip();
                        return;
                }

                // Hover over the first card
                const firstCard = cards.first();
                await firstCard.hover();

                // Look for restore button (RotateCcw icon)
                const restoreButton = firstCard.locator('button[aria-label="Restore card"]');
                await expect(restoreButton).toBeVisible();
        });

        test('clicking restore button removes card from trash', async ({ page }) => {
                const cards = page.locator('article');
                const initialCount = await cards.count();

                if (initialCount === 0) {
                        test.skip();
                        return;
                }

                // Hover and click restore on first card
                const firstCard = cards.first();
                await firstCard.hover();

                const restoreButton = firstCard.locator('button[aria-label="Restore card"]');
                await restoreButton.click();

                // Wait for animation/removal
                await page.waitForTimeout(500);

                // Card count should decrease
                const newCount = await cards.count();
                expect(newCount).toBeLessThan(initialCount);
        });
});
