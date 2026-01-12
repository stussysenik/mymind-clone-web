/**
 * Filter Tab Tests
 * 
 * Verifies that content type filter tabs work correctly.
 */
import { test, expect } from '@playwright/test';

test.describe('Filter Tabs', () => {
        test.beforeEach(async ({ page }) => {
                await page.goto('/');
                await page.waitForSelector('[data-testid="card-grid"]', { timeout: 10000 });
        });

        test('clicking Videos tab filters to video cards', async ({ page }) => {
                // Click the Videos filter tab
                const videoTab = page.getByRole('button', { name: /videos/i });
                await videoTab.click();

                // URL should now have ?type=video
                await expect(page).toHaveURL(/\?type=video/);

                // Wait for cards to update
                await page.waitForTimeout(500);

                // All visible cards should be video type (have YouTube markers or video elements)
                const cards = page.locator('[data-testid="card"]');
                const cardCount = await cards.count();

                // Should have at least 1 video card in demo data
                expect(cardCount).toBeGreaterThan(0);

                // Optional: verify the cards contain YouTube-related content
                const firstCard = cards.first();
                const hasYouTubeMarker = await firstCard.locator('text=/YouTube|Video|Stereo|Brain/i').count() > 0;
                expect(hasYouTubeMarker).toBe(true);
        });

        test('All tab shows all cards', async ({ page }) => {
                // First set a filter
                await page.goto('/?type=video');
                await page.waitForSelector('[data-testid="card"]', { timeout: 10000 });

                const filteredCount = await page.locator('[data-testid="card"]').count();

                // Click All tab
                const allTab = page.getByRole('button', { name: 'All' });
                await allTab.click();

                await expect(page).toHaveURL('/');

                await page.waitForTimeout(500);
                const allCount = await page.locator('[data-testid="card"]').count();

                // All cards should be more than filtered
                expect(allCount).toBeGreaterThanOrEqual(filteredCount);
        });

        test('filter tabs have proper styling', async ({ page }) => {
                const videoTab = page.getByRole('button', { name: /videos/i });

                // Should have rounded styling
                await expect(videoTab).toHaveClass(/rounded-full/);

                // Click to select and verify active state
                await videoTab.click();
                await expect(videoTab).toHaveClass(/bg-white/);
        });
});

test.describe('Card Detail Modal - Title and Dates', () => {
        test.beforeEach(async ({ page }) => {
                await page.goto('/');
                await page.waitForSelector('[data-testid="card"]', { timeout: 10000 });
        });

        test('modal shows added date', async ({ page }) => {
                const card = page.locator('[data-testid="card"]').first();
                await card.click();

                await page.waitForSelector('[role="dialog"]', { timeout: 5000 });

                // Should show "Added" label with date
                await expect(page.getByText('Added')).toBeVisible();
        });

        test('title input has truncation class', async ({ page }) => {
                const card = page.locator('[data-testid="card"]').first();
                await card.click();

                await page.waitForSelector('[role="dialog"]', { timeout: 5000 });

                const titleInput = page.locator('input[placeholder="Untitled"]');
                await expect(titleInput).toHaveClass(/truncate/);
        });
});
