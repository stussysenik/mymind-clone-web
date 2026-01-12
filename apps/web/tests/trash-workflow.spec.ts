import { test, expect } from '@playwright/test';

test.describe('Trash Workflow', () => {
        test('user can move items to trash and then empty the trash permanently', async ({ page }) => {
                // 1. Setup: Ensure we have at least one valid card to delete
                await page.goto('/');
                await page.waitForSelector('[data-testid="card-grid"]');

                // Get count of cards initially
                const initialCards = await page.locator('[data-testid="card"]').count();
                if (initialCards === 0) {
                        // Create a dummy note if needed, but assuming demo data exists
                        console.log('No cards found, test might fail if empty');
                }

                // 2. Initial state: Trash might be empty or not. Let's assume we want to "add" something to trash first.
                // Hover over a card and click trash/delete button
                await page.locator('[data-testid="card"]').first().hover();
                // Wait specifically for the delete button to be visible
                const deleteBtn = page.locator('button[aria-label="Delete"]').first();
                await deleteBtn.waitFor({ state: 'visible', timeout: 5000 });
                await deleteBtn.click();

                // Validating it disappeared from main view is good, but let's go straight to Trash page
                await page.goto('/trash');
                await page.waitForSelector('[data-testid="card-grid"]');

                // Verify we have items in trash
                const trashItems = await page.locator('[data-testid="card"]');
                await expect(trashItems.first()).toBeVisible();

                // 3. The "Empty Trash" Action
                // User requested "Take out trash" functionality.
                // We expect a button, maybe in the header or persistent bar.
                const emptyTrashBtn = page.getByText('Empty Trash');
                await expect(emptyTrashBtn).toBeVisible();

                // Handle confirmation dialog if it exists
                await emptyTrashBtn.click();

                // Expect a confirmation modal/dialog
                const confirmBtn = page.getByRole('button', { name: 'Delete Forever' });
                if (await confirmBtn.isVisible()) {
                        await confirmBtn.click();
                }

                // 4. Verification
                // Trash should now be empty
                await expect(page.getByText('Trash is empty')).toBeVisible();
                await expect(trashItems).toHaveCount(0);
        });
});
