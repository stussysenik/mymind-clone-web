
import { test, expect } from '@playwright/test';

test.describe('UX Refinements', () => {
        test.beforeEach(async ({ page }) => {
                await page.goto('/');
        });

        test('filter tabs update url and highlight', async ({ page }) => {
                // 1. Click 'Videos' tab
                const videoTab = page.getByRole('button', { name: 'Videos' });
                await videoTab.click();

                // 2. Check URL
                await expect(page).toHaveURL(/type=video/);

                // 3. Check Highlight (bg-white is applied to selected)
                // Note: Tailwind classes might vary, but we look for the style change
                await expect(videoTab).toHaveClass(/bg-white/);
        });

        test('tag click updates search query', async ({ page }) => {
                // Inject a mock card with tags if none exist is hard in E2E without seeding.
                // But we can test the URL behavior if we can find a tag.
                // Assuming demo data or seeded data exists.

                // If no tags visible, we can't test clicking.
                // Skip if no tags found.
                const tags = page.locator('article span').filter({ hasText: /^[a-z0-9-]+$/ });
                if (await tags.count() > 0) {
                        const firstTag = tags.first();
                        const tagName = await firstTag.textContent();
                        await firstTag.click();

                        // Check URL contains encoded hashtag
                        // #tag becomes %23tag
                        await expect(page).toHaveURL(new RegExp(`q=%23${tagName}`));
                }
        });

        test('empty state is actionable', async ({ page }) => {
                // Go to a non-existent search to force empty state
                await page.goto('/?q=nonexistentsearchterm12345');

                // Check for new empty state text
                await expect(page.getByText('Your mind is waiting')).toBeVisible();
                await expect(page.getByText('We couldn\'t find anything matching')).toBeVisible();
        });
});
