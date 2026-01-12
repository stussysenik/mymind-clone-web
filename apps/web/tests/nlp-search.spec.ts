/**
 * NLP Search Feature Tests
 * 
 * Verifies the Smart Search toggle and functionality.
 */

import { test, expect } from '@playwright/test';

test.describe('NLP Search Feature', () => {
        test.beforeEach(async ({ page }) => {
                await page.goto('/');
                await page.waitForLoadState('networkidle');
        });

        test('smart search toggle switches modes', async ({ page }) => {
                // Check if Exact/Smart toggle exists (we'll look for "Smart" button)
                const smartBtn = page.locator('button[title="Enable Smart Search"]');
                const exactBtn = page.locator('button[title="Enable Exact Search"]');

                // Initially should be in exact mode (or default)
                // We'll assume the UI shows "Exact" or the toggle is off

                // Let's implement a toggle that shows text "Exact" or "Smart" or an icon
                // For test, we look for the button.

                // This is TDD, so failure is expected initially.
                try {
                        const toggleBtn = page.locator('button[aria-label="Toggle Search Mode"]');
                        await expect(toggleBtn).toBeVisible();

                        // Click it
                        await toggleBtn.click();

                        // Should update URL to mode=smart
                        await expect(page).toHaveURL(/mode=smart/);

                        // Wait for button to reflect state (purple)
                        await expect(toggleBtn).toHaveClass(/bg-purple-100/);

                        // Click again
                        await toggleBtn.click();

                        // Should update URL to remove mode=smart (back to exact)
                        // Should update URL to remove mode=smart (back to exact)
                        await expect(page).not.toHaveURL(/mode=smart/);

                } catch (e) {
                        console.log('Test failed as expected (feature not implemented yet)');
                        throw e;
                }
        });

        test('smart search functionality', async ({ page }) => {
                // Enable smart mode
                const toggleBtn = page.locator('button[aria-label="Toggle Search Mode"]');
                await toggleBtn.click();

                // Wait for mode to activate (check for active class/style)
                // The button becomes purple when active
                await expect(toggleBtn).toHaveClass(/bg-purple-100/);

                // Search for something abstract
                const searchInput = page.locator('input[type="text"][placeholder*="Search"]');
                await searchInput.fill('atmospheric mood');
                await searchInput.press('Enter');

                // URL should have q=...&mode=smart
                await expect(page).toHaveURL(/q=atmospheric\+mood/);
                await expect(page).toHaveURL(/mode=smart/);

                // Should show "Smart Results" banner or indicator
                await expect(page.locator('text=Smart Results')).toBeVisible();
        });
});
