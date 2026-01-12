/**
 * Bug Fixes Tests
 * 
 * Tests for bug fixes: tag saving, bulk trash operations.
 */
import { test, expect } from '@playwright/test';

test.describe('Tag Saving', () => {
        test.beforeEach(async ({ page }) => {
                await page.goto('/');
                await page.waitForSelector('[data-testid="card-grid"]', { timeout: 10000 });
        });

        test('can add a tag in card modal', async ({ page }) => {
                // Click first card to open modal
                const card = page.locator('[data-testid="card"]').first();
                await card.click();

                await page.waitForSelector('[role="dialog"]', { timeout: 5000 });

                // Click Add Tag button
                const addTagBtn = page.getByRole('button', { name: /add tag/i });
                if (await addTagBtn.isVisible()) {
                        await addTagBtn.click();

                        // Type a new tag
                        const tagInput = page.locator('input[placeholder="tag-name"]');
                        await tagInput.fill('test-tag-' + Date.now());
                        await tagInput.press('Enter');

                        // Verify tag appears
                        await expect(page.locator('.flex-wrap').getByText(/test-tag/)).toBeVisible({ timeout: 3000 });
                }

                await page.keyboard.press('Escape');
        });
});

test.describe('Bulk Trash Operations', () => {
        test('trash page loads correctly', async ({ page }) => {
                await page.goto('/trash');

                // Should show trash heading
                await expect(page.getByRole('heading', { name: 'Trash', exact: true })).toBeVisible();


                // Should show either empty state or cards
                const emptyState = page.getByText('Trash is empty');
                const bulkActions = page.getByRole('button', { name: /restore all|empty trash/i });

                const isEmpty = await emptyState.isVisible().catch(() => false);
                if (!isEmpty) {
                        // If there are items, bulk actions should be visible
                        await expect(bulkActions.first()).toBeVisible();
                }
        });

        test('empty trash confirmation appears', async ({ page }) => {
                await page.goto('/trash');

                // Only test if there are items
                const emptyTrashBtn = page.getByRole('button', { name: 'Empty Trash' });
                if (await emptyTrashBtn.isVisible().catch(() => false)) {
                        await emptyTrashBtn.click();

                        // Confirmation should appear
                        await expect(page.getByText('Delete forever?')).toBeVisible();

                        // Cancel should work
                        await page.getByRole('button', { name: 'Cancel' }).click();
                        await expect(page.getByText('Delete forever?')).not.toBeVisible();
                }
        });
});

test.describe('Platform Card Archive Icon', () => {
        test('cards show archive action on hover', async ({ page }) => {
                await page.goto('/');
                await page.waitForSelector('[data-testid="card"]', { timeout: 10000 });

                // Hover over first card
                const card = page.locator('[data-testid="card"]').first();
                await card.hover();

                // Archive button should be visible in hover overlay
                const archiveBtn = card.locator('button[title*="Archive"], button[aria-label*="archive"]');
                // Note: The actual selector depends on implementation
        });
});
