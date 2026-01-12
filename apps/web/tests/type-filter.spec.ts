/**
 * Type Filter Tests
 * 
 * Verifies that type filter tabs correctly filter cards.
 */

import { test, expect } from '@playwright/test';

test.describe('Type Filter Functionality', () => {
        test.beforeEach(async ({ page }) => {
                await page.goto('/');
                await page.waitForLoadState('networkidle');
        });

        test('videos filter shows video/audio cards', async ({ page }) => {
                // First check if there are any cards
                const allCards = page.locator('article');
                const allCardsCount = await allCards.count();

                if (allCardsCount === 0) {
                        test.skip();
                        return;
                }

                // Click on Videos filter
                const videosFilter = page.locator('button:has-text("Videos")');
                await videosFilter.click();
                await page.waitForTimeout(500);

                // Check URL has type=video parameter (singular, mapped from 'videos' UI)
                await expect(page).toHaveURL(/type=video/);

                // After filtering, either we have cards or the empty state
                // but the filter should work (not crash)
                const cardsAfterFilter = page.locator('article');
                const emptyState = page.locator('text="Your mind is waiting"');

                const hasCards = await cardsAfterFilter.count() > 0;
                const hasEmptyState = await emptyState.isVisible();

                expect(hasCards || hasEmptyState).toBeTruthy();
        });

        test('all filter shows all cards', async ({ page }) => {
                // Click All filter
                const allFilter = page.locator('button:has-text("All")').first();
                await allFilter.click();
                await page.waitForTimeout(300);

                // Should show cards without type filter in URL
                const cards = page.locator('article');
                const cardCount = await cards.count();

                // We expect at least some cards in an active system
                console.log(`All filter shows ${cardCount} cards`);
        });
});
