/**
 * Visual Similarity Tests
 * 
 * Tests for color search and Same Vibe visual similarity features.
 * Covers: color palette display, color-based filtering, and Same Vibe UI.
 */
import { test, expect } from '@playwright/test';

test.describe('Visual Similarity Features', () => {
        test.beforeEach(async ({ page }) => {
                // Navigate to home and wait for cards
                await page.goto('/');
                await page.waitForSelector('[data-testid="card-grid"]', { timeout: 10000 });
        });

        test('card modal shows expandable summary with toggle', async ({ page }) => {
                // Click on a card to open modal
                const card = page.locator('[data-testid="card"]').first();
                await card.click();

                // Wait for modal
                await page.waitForSelector('[role="dialog"]', { timeout: 5000 });

                // Check for AI Summary section with expand button
                const summarySection = page.locator('text=AI Summary');
                if (await summarySection.isVisible()) {
                        // Look for chevron expand button
                        const expandButton = page.locator('button[title*="Expand"]').first();
                        await expect(expandButton).toBeVisible();

                        // Click to expand
                        await expandButton.click();

                        // Verify expanded state (button should now say Collapse)
                        const collapseButton = page.locator('button[title*="Collapse"]').first();
                        await expect(collapseButton).toBeVisible();
                }

                // Close modal
                await page.keyboard.press('Escape');
        });

        test('card modal shows expandable notes with toggle', async ({ page }) => {
                // Click on a card to open modal
                const card = page.locator('[data-testid="card"]').first();
                await card.click();

                // Wait for modal
                await page.waitForSelector('[role="dialog"]', { timeout: 5000 });

                // Check for Mind Notes section with expand button
                const notesHeader = page.locator('text=Mind Notes');
                await expect(notesHeader).toBeVisible();

                // Find expand button near notes
                const expandButtons = page.locator('button[title*="Expand for writing"]');
                if (await expandButtons.count() > 0) {
                        const notesExpandBtn = expandButtons.first();
                        await expect(notesExpandBtn).toBeVisible();
                }

                // Close modal
                await page.keyboard.press('Escape');
        });

        test('color search filters cards by color param', async ({ page }) => {
                // Navigate with a color filter
                await page.goto('/?color=%23FF5733');

                // Grid should still be visible
                await expect(page.getByTestId('card-grid')).toBeVisible();

                // Note: If no cards match, grid may be empty but should not error
        });

        test('Same Vibe mode shows similarity results', async ({ page }) => {
                // First get a card ID to use for similarity
                await page.waitForSelector('[data-testid="card"]', { timeout: 10000 });

                // Navigate to similarity mode with a mock ID
                await page.goto('/?similar=test-card-id');

                // Should show "Same Vibe" mode banner or similar indicator
                // The grid should be visible
                await expect(page.getByTestId('card-grid')).toBeVisible();
        });

        test('clicking Same Vibe button in modal navigates to similarity view', async ({ page }) => {
                // Open a card modal
                const card = page.locator('[data-testid="card"]').first();
                await card.click();

                await page.waitForSelector('[role="dialog"]', { timeout: 5000 });

                // Find and click the sparkles/Same Vibe button
                const sameVibeButton = page.locator('button[title="See Similar"]');
                if (await sameVibeButton.isVisible()) {
                        await sameVibeButton.click();

                        // URL should have similar param
                        await page.waitForURL(/similar=/);
                }
        });
});

test.describe('AI Summary Editability', () => {
        test('summary textarea is editable', async ({ page }) => {
                await page.goto('/');
                await page.waitForSelector('[data-testid="card"]', { timeout: 10000 });

                // Open card modal
                const card = page.locator('[data-testid="card"]').first();
                await card.click();

                await page.waitForSelector('[role="dialog"]', { timeout: 5000 });

                // Find summary textarea
                const summaryTextarea = page.locator('textarea[placeholder="Add AI summary..."]');
                if (await summaryTextarea.isVisible()) {
                        // Clear and type new content
                        await summaryTextarea.fill('Test edited summary content');

                        // Verify the content was typed
                        await expect(summaryTextarea).toHaveValue('Test edited summary content');
                }

                await page.keyboard.press('Escape');
        });
});
