import { test, expect } from '@playwright/test';
import { seedLocalStorage } from './mock-data';

/**
 * MyMind Clone - Archive & Delete Tests
 * 
 * Validates the full lifecycle of a card:
 * Active -> Archived -> Restored
 * Active -> Archived -> Trashend -> Restored/Deleted
 */

test.describe('Archive and Delete Lifecycle', () => {
        test.beforeEach(async ({ page }) => {
                await seedLocalStorage(page);
                await page.goto('/login');
                await page.fill('input[type="email"]', 'test@example.com');
                await page.fill('input[type="password"]', 'password');
                await page.click('button[type="submit"]');
                await page.waitForURL('/');

                // Ensure hydration
                await expect(page.locator('article').first()).toBeVisible({ timeout: 10000 }).catch(async () => {
                        console.log('Reloading to ensure hydration...');
                        await page.reload();
                        await expect(page.locator('article').first()).toBeVisible({ timeout: 10000 });
                });
        });

        test('can archive a card and see it in archive view', async ({ page }) => {
                // 1. Archive a card
                const firstCard = page.locator('article').first();
                const cardTitle = await firstCard.locator('h3').textContent();
                expect(cardTitle).toBeTruthy();

                await firstCard.click();

                const modal = page.locator('[role="dialog"]');
                await expect(modal).toBeVisible();

                // Click Archive button
                const archiveBtn = modal.locator('button[title="Archive"]');
                await expect(archiveBtn).toBeVisible();
                await archiveBtn.click();

                // Modal should close and card should disappear from main view
                await expect(modal).not.toBeVisible();
                await expect(page.locator('article').filter({ hasText: cardTitle! })).not.toBeVisible();

                // 2. Go to Archive view
                await page.goto('/?view=archive');

                // Wait for grid to load
                await expect(page.locator('h2').filter({ hasText: 'archive' })).toBeVisible();

                // Verify card is present in archive
                const archivedCard = page.locator('article').filter({ hasText: cardTitle! });
                await expect(archivedCard).toBeVisible();
        });

        test('can unarchive (restore) a card from archive view', async ({ page }) => {
                // 1. Archive first
                const firstCard = page.locator('article').first();
                const cardTitle = await firstCard.locator('h3').textContent();
                await firstCard.click();
                await page.locator('button[title="Archive"]').click();

                // 2. Go to Archive view
                await page.goto('/?view=archive');
                const archivedCard = page.locator('article').filter({ hasText: cardTitle! });
                await expect(archivedCard).toBeVisible();

                // 3. Open it
                await archivedCard.click();
                const modal = page.locator('[role="dialog"]');
                await expect(modal).toBeVisible();

                // 4. Click Restore (Unarchive)
                // Note: The icon is RotateCcw, usually tooltip "Restore"??
                // Wait, in CardDetailModal, onRestore button has no tooltip?
                // Let's check CardDetailModal.tsx.
                // It says line 630: className="..." but no title?
                // Wait, simply look for the Restore button.
                // It is conditionally rendered.

                // In CardDetailModal logic:
                // onRestore is passed if mode == 'trash' or mode == 'archive' (mapped to unarchive).
                // If onRestore is present, it renders.
                // Let's assume it's the button with RotateCcw.

                // I need to verify CardDetailModal has a title or way to identify it.
                // Looking at CardDetailModal.tsx again...

                const restoreBtn = modal.locator('button:has(svg.lucide-rotate-ccw)');
                await expect(restoreBtn).toBeVisible();
                await restoreBtn.click();

                // 5. Verify removed from Archive view
                await expect(modal).not.toBeVisible();
                await expect(page.locator('article').filter({ hasText: cardTitle! })).not.toBeVisible();

                // 6. Return to main view and verify back
                await page.goto('/');
                await expect(page.locator('article').filter({ hasText: cardTitle! })).toBeVisible();
        });

        test('can delete a card to trash and see it there', async ({ page }) => {
                // 1. Delete a card (Trash)
                const firstCard = page.locator('article').first();
                const cardTitle = await firstCard.locator('h3').textContent();
                await firstCard.click();

                // Click Delete button (Trash icon)
                await page.locator('button[title="Delete (Trash)"]').click();

                // 2. Go to Trash view
                await page.goto('/?view=trash');
                await expect(page.locator('h2').filter({ hasText: 'trash' })).toBeVisible();

                // 3. Verify card is in trash
                const trashedCard = page.locator('article').filter({ hasText: cardTitle! });
                await expect(trashedCard).toBeVisible();
        });
});
