
import { test, expect } from '@playwright/test';

test.describe('Bug Reproduction', () => {
        test.beforeEach(async ({ page }) => {
                await page.goto('/');
                await page.waitForSelector('[data-testid="card"]', { timeout: 10000 });
        });

        test('AI Summary editing should not be interrupted by background updates', async ({ page }) => {
                // Open the first card
                await page.locator('[data-testid="card"]').first().click();
                await page.waitForSelector('[role="dialog"]');

                // Locate summary textarea
                // Assuming it has a placeholder or specific class. We might need to add a test id if not present.
                // Based on CardDetailModal, it's likely the one with "AI Generated Summary" label or similar.
                const summaryArea = page.locator('textarea').filter({ hasText: '' }).last(); // Heuristic, might need refinement
                // Better: look for the label "AI SUMMARY" and find the textarea near it.
                const aiSummarySection = page.locator('text=AI SUMMARY').locator('..');

                // We need to confirm the selector. Let's assume there is one or we'll debug it.
                // Looking at previous file views, we didn't inspect the full render.
                // But let's try to target the functional aspect.

                // Type into summary
                await summaryArea.click();

                const initialText = await summaryArea.inputValue();
                const textToType = ' - Insight'; // Short text

                // Type slowly to trigger multiple effect runs if bug exists
                await summaryArea.type(textToType, { delay: 100 });

                // Check immediately. If the bug exists, the text might have already been reverted or glitching.
                // But specifically for the "stuck cursor" / "wouldn't delete" issue, it means the value is being forced back.

                await page.waitForTimeout(500);
                const finalText = await summaryArea.inputValue();

                // If bug exists, `finalText` will often be just `initialText` or missing the last chars
                expect(finalText).toBe(initialText + textToType);
        });
});
