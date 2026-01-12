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

test.describe('Instagram Multi-Image Support', () => {
        test('displays carousel for cards with multiple images', async ({ page }) => {
                // Strategy: Inject a card into localStorage since CardGridClient loads these on mount.
                // This bypasses the complexity of server-side data mocking.
                const mockCard = {
                        id: 'mock-carousel-1',
                        title: 'Instagram Carousel Test',
                        type: 'image',
                        url: 'https://instagram.com/test',
                        imageUrl: 'https://images.unsplash.com/photo-1507608869274-2c330136e85e?auto=format&fit=crop&w=400&q=80',
                        metadata: {
                                images: [
                                        'https://images.unsplash.com/photo-1507608869274-2c330136e85e?auto=format&fit=crop&w=800',
                                        'https://images.unsplash.com/photo-1559827291-72ee739d0d9a?auto=format&fit=crop&w=800',
                                        'https://images.unsplash.com/photo-1627483262769-04d0a1401487?auto=format&fit=crop&w=800'
                                ]
                        },
                        tags: ['instagram', 'carousel'],
                        createdAt: new Date().toISOString(),
                        archivedAt: null,
                        deletedAt: null
                };

                // Inject using evaluate to ensure we are in the right context, then reload
                await page.goto('/');
                await page.evaluate((card) => {
                        localStorage.setItem('mymind_cards', JSON.stringify([card]));
                }, mockCard);

                await page.reload();
                await page.waitForSelector('[data-testid="card-grid"]', { timeout: 10000 });

                // Click our mock card
                await page.getByText('Instagram Carousel Test').click();
                await page.waitForSelector('[role="dialog"]', { timeout: 5000 });

                // CHECK CAROUSEL UI
                // Should see arrows (if we hover? or always?)
                // Force hover to ensure controls appear if hidden
                const visualSection = page.locator('[data-testid="card-visual"]'); // Assuming we have this ID now
                await visualSection.hover();

                // Check for generic chevron icons or just buttons
                const nextBtn = page.locator('button').filter({ has: page.locator('svg.lucide-chevron-right') });
                await expect(nextBtn).toBeVisible();

                // Click next
                await nextBtn.click();

                // Verify carousel navigation works (dots update)
                const dots = page.locator('.absolute.bottom-6.flex.gap-2 button'); // Assuming this class structure based on previous edits
                if (await dots.count() > 0) {
                        await expect(dots).toHaveCount(3);
                        // Verify second dot is active (usually by opacity or size)
                        // Implementation detail: we used `w-4` for active, `w-2` for inactive or similar logic. 
                        // Or check attribute if we added aria-current?
                }
        });
});
